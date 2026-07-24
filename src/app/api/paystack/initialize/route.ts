import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, email, externalRef, currency = "GHS", metadata, redirectUrl } = body;

    if (!amount || !email || !externalRef) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get Paystack secret key from DB or env
    const setting = await prisma.systemSetting.findUnique({ where: { key: "PAYSTACK_SECRET_KEY" } });
    const secretKey = setting?.value || process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    // Paystack amounts are in kobo/pesewas (smallest unit × 100)
    const amountInPesewas = Math.round(amount * 100);

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        email,
        amount: amountInPesewas,
        currency,
        reference: externalRef,
        callback_url: redirectUrl || "https://jeilinks.site",
        metadata: metadata || {},
      }),
    });

    const data = await paystackRes.json();
    console.log("[Paystack] Initialize response:", JSON.stringify(data));

    if (!data.status || !data.data?.authorization_url) {
      console.error("[Paystack] Failed to initialize:", data);
      return NextResponse.json({ error: data.message || "Paystack initialization failed" }, { status: 400 });
    }

    return NextResponse.json({ paymentUrl: data.data.authorization_url, reference: data.data.reference });
  } catch (error: any) {
    console.error("[Paystack] Initialize error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
