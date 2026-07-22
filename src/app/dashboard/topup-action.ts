"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/notifications";

export async function topUpWallet(paymentRef: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Moolre processes the actual credit via Webhook securely.
    // We poll the DB briefly to see if the webhook already fired, 
    // to give the user immediate feedback if possible.
    
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
      return { success: true, amount: Number(existingTx.amount), alreadyProcessed: true };
    }

    // If webhook hasn't fired yet, still return success to the client
    // so it can show a pending message or simply wait.

    revalidatePath("/dashboard");
    return { success: true, amount: 0 };

  } catch (error) {
    console.error("Topup error:", error);
    return { success: false, error: "Internal error during top-up" };
  }
}
