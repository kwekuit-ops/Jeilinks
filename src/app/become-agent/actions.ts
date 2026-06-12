"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function upgradeToAgent(paystackRef: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const userId = (session.user as any).id;

    // Helper: fetch WhatsApp group URL from settings
    const getCommunityUrl = async () => {
      const communitySettings = await prisma.systemSetting.findMany({
        where: { key: { in: ["WHATSAPP_CHANNEL_URL"] } }
      });
      return communitySettings.find(s => s.key === "WHATSAPP_CHANNEL_URL")?.value || "";
    };

    // 1. Get Paystack Secret Key from Settings
    const setting = await prisma.systemSetting.findUnique({ where: { key: "PAYSTACK_SECRET_KEY" } });
    const paystackSecret = setting?.value || process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
        throw new Error("Payment gateway not configured");
    }

    // 2. Verify Paystack Payment
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${paystackRef}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || verifyData.data?.status !== "success" || (verifyData.data?.amount || 0) < 1000) {
      return { success: false, error: "Payment verification failed or insufficient amount" };
    }

    // 3. Check if the webhook already processed this payment and upgraded the user
    const existingTx = await prisma.walletTransaction.findUnique({
      where: { reference: paystackRef }
    });

    if (existingTx) {
      // Webhook already ran — user should already be AGENT. Just return the group link.
      const whatsappGroupUrl = await getCommunityUrl();
      revalidatePath("/dashboard");
      revalidatePath("/");
      return { success: true, whatsappGroupUrl, alreadyProcessed: true };
    }

    // 4. Fetch user from DB
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "User not found" };

    // Handle race condition: webhook may have already set role to AGENT
    if (user.role === "AGENT") {
      const whatsappGroupUrl = await getCommunityUrl();
      revalidatePath("/dashboard");
      return { success: true, whatsappGroupUrl };
    }

    // 5. Set expiry to 14 days from now (stack on existing if not expired)
    let newExpiry = new Date();
    if (user.agentExpiry && new Date(user.agentExpiry) > new Date()) {
        newExpiry = new Date(user.agentExpiry);
    }
    newExpiry.setDate(newExpiry.getDate() + 14);

    // 6. Generate a clean unique slug (LOW-4: collision check)
    let storeSlug = user.storeSlug;
    if (!storeSlug) {
        const baseName = (user.name || "agent").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
        for (let i = 0; i < 5; i++) {
          const candidate = `${baseName}-${Math.floor(1000 + Math.random() * 9000)}`;
          const taken = await prisma.user.findUnique({ where: { storeSlug: candidate } });
          if (!taken) { storeSlug = candidate; break; }
        }
        if (!storeSlug) storeSlug = `${baseName}-${Date.now()}`;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          role: "AGENT",
          storeSlug: storeSlug,
          agentExpiry: newExpiry
        },
      }),
      prisma.walletTransaction.create({
        data: {
          userId,
          amount: verifyData.data.amount / 100,
          type: "CREDIT",
          reference: paystackRef,
          description: "Agent Upgrade Fee"
        }
      })
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");
    revalidatePath("/admin/users");
    revalidatePath("/");

    const whatsappGroupUrl = await getCommunityUrl();
    return { success: true, whatsappGroupUrl };

  } catch (error: any) {
    console.error("Upgrade error:", error);
    return { success: false, error: error.message || "An internal error occurred" };
  }
}
