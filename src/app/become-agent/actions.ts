"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function upgradeToAgent(paymentRef: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const _userId = (session.user as any).id;

    // Helper: fetch WhatsApp group URL from settings
    const getCommunityUrl = async () => {
      const communitySettings = await prisma.systemSetting.findMany({
        where: { key: { in: ["WHATSAPP_CHANNEL_URL"] } }
      });
      return communitySettings.find(s => s.key === "WHATSAPP_CHANNEL_URL")?.value || "";
    };

    // 1. Check if the webhook already processed this payment and upgraded the user
    // We poll briefly in case the webhook fired almost immediately
    let attempts = 0;
    let existingTx = null;

    while (attempts < 3) {
      existingTx = await prisma.walletTransaction.findUnique({
        where: { reference: paymentRef }
      });

      if (existingTx) break;
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      attempts++;
    }

    if (existingTx) {
      // Webhook already ran — user should already be AGENT. Just return the group link.
      const whatsappGroupUrl = await getCommunityUrl();
      revalidatePath("/dashboard");
      revalidatePath("/");
      return { success: true, whatsappGroupUrl, alreadyProcessed: true };
    }

    // If webhook hasn't processed it yet, we just assume success on the client 
    // and let the webhook upgrade the user asynchronously
    const whatsappGroupUrl = await getCommunityUrl();
    return { success: true, whatsappGroupUrl };

    // Everything else was moved to the webhook or above polling logic

  } catch (error: any) {
    console.error("Upgrade error:", error);
    return { success: false, error: error.message || "An internal error occurred" };
  }
}
