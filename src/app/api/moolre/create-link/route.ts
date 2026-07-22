import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, email, externalRef, currency = "GHS", metadata } = body;

    if (!amount || !email || !externalRef) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get credentials from DB
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ["NEXT_PUBLIC_MOOLRE_USERNAME", "NEXT_PUBLIC_MOOLRE_PUBLIC_KEY", "NEXT_PUBLIC_MOOLRE_ACCOUNT_NUMBER"] } }
    });
    const map: Record<string, string> = {};
    settings.forEach(s => map[s.key] = s.value);

    const username = map["NEXT_PUBLIC_MOOLRE_USERNAME"] || process.env.NEXT_PUBLIC_MOOLRE_USERNAME || "";
    const publicKey = map["NEXT_PUBLIC_MOOLRE_PUBLIC_KEY"] || process.env.NEXT_PUBLIC_MOOLRE_PUBLIC_KEY || "";
    const accountNumber = map["NEXT_PUBLIC_MOOLRE_ACCOUNT_NUMBER"] || process.env.NEXT_PUBLIC_MOOLRE_ACCOUNT_NUMBER || "";

    if (!username || !publicKey || !accountNumber) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    // Create the payment link server-side to avoid CORS issues
    const res = await fetch("https://api.moolre.com/embed/link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-USER": username,
        "X-Api-Pubkey": publicKey,
      },
      body: JSON.stringify({
        amount,
        email,
        externalRef,
        currency,
        accountNumber,
        metadata,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Moolre] Create link failed:", data);
      return NextResponse.json({ error: data?.message || "Failed to create payment link" }, { status: res.status });
    }

    // Return the payment URL to the client
    // Moolre returns: json.data.authorization_url OR json.data.paymentUrl OR json.authorization_url
    const paymentUrl = 
      data?.data?.authorization_url || 
      data?.data?.paymentUrl || 
      data?.authorization_url || 
      data?.paymentUrl || 
      data?.url || 
      data?.link;

    console.log("[Moolre] Full API response:", JSON.stringify(data));

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
