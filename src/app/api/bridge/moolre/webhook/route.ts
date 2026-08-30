import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();

    // 1. Verify Moolre Signature (to make sure it's really Moolre)
    const signature = req.headers.get("x-moolre-signature") || req.headers.get("x-signature") || "";
    if (process.env.MOOLRE_API_KEY && signature) {
      const expected = crypto
        .createHmac("sha256", process.env.MOOLRE_API_KEY)
        .update(bodyText)
        .digest("hex");
      if (expected !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // 2. Forward exactly as-is to Jelboost, using the Bridge Secret
    await fetch("https://jelboostgh.com/api/webhooks/moolre", {
      method: "POST",
      headers: {
        "x-bridge-secret": process.env.JELBOOST_BRIDGE_SECRET || "",
        "Content-Type": "application/json",
      },
      body: bodyText,
    });

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: "Bridge Webhook Error" }, { status: 500 });
  }
}
