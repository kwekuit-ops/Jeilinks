import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, email, externalRef, currency = "GHS", metadata, redirectUrl } = body;

    if (!amount || !email || !externalRef) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get credentials from DB
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ["NEXT_PUBLIC_MOOLRE_USERNAME", "NEXT_PUBLIC_MOOLRE_PUBLIC_KEY", "NEXT_PUBLIC_MOOLRE_ACCOUNT_NUMBER", "MOOLRE_SANDBOX_MODE"] } }
    });
    const map: Record<string, string> = {};
    settings.forEach(s => map[s.key] = s.value);

    const username = map["NEXT_PUBLIC_MOOLRE_USERNAME"] || process.env.NEXT_PUBLIC_MOOLRE_USERNAME || "";
    const publicKey = map["NEXT_PUBLIC_MOOLRE_PUBLIC_KEY"] || process.env.NEXT_PUBLIC_MOOLRE_PUBLIC_KEY || "";
    const accountNumber = map["NEXT_PUBLIC_MOOLRE_ACCOUNT_NUMBER"] || process.env.NEXT_PUBLIC_MOOLRE_ACCOUNT_NUMBER || "";
    const sandboxMode = map["MOOLRE_SANDBOX_MODE"] === "true" || process.env.MOOLRE_SANDBOX_MODE === "true";

    if (!username || !accountNumber) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    // Sandbox: no public key required. Live: requires X-API-PUBKEY
    const apiBase = sandboxMode ? "https://sandbox.moolre.com" : "https://api.moolre.com";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-API-USER": username,
    };
    if (!sandboxMode && publicKey) {
      headers["X-API-PUBKEY"] = publicKey;
    }

    console.log(`[Moolre] Using ${sandboxMode ? "SANDBOX" : "LIVE"} mode`);

    const res = await fetch(`${apiBase}/embed/link`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: 1,
        accountnumber: accountNumber,
        amount,
        currency,
        email,
        description: "",
        metadata: metadata || {},
        externalref: externalRef,
        redirect: redirectUrl,
        mode: "payment",
        reusable: false,
      }),
    });

    const data = await res.json();
    console.log("[Moolre] API response:", JSON.stringify(data));

    // status=0 means error from Moolre even with HTTP 200
    if (data?.status === 0) {
      return NextResponse.json({ error: data?.message || "Moolre error" }, { status: 400 });
    }

    const paymentUrl =
      data?.data?.authorization_url ||
      data?.data?.paymentUrl ||
      data?.authorization_url ||
      data?.paymentUrl;

    if (!paymentUrl) {
      console.error("[Moolre] No payment URL in response:", data);
      return NextResponse.json({ error: "No payment URL returned by Moolre", raw: data }, { status: 500 });
    }

    return NextResponse.json({ paymentUrl });
  } catch (error: any) {
    console.error("[Moolre] Create link error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
