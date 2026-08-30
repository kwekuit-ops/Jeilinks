import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-bridge-secret");
    if (secret !== process.env.JELBOOST_BRIDGE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();

    // Call Moolre acting as Jeilinks
    const moolreRes = await fetch("https://api.moolre.com/v1/checkout/initialize", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.MOOLRE_API_KEY || "",
        "X-APP-ID": process.env.MOOLRE_APP_ID || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        currency: "GHS",
        // Moolre will redirect the user back to this Jeilinks callback
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/bridge/moolre/callback`,
        // Moolre will send success webhooks to this Jeilinks webhook
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/bridge/moolre/webhook`,
      }),
    });

    const data = await moolreRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
