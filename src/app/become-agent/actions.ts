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

    // Check for success and minimum amount (e.g. 10 GHS = 1000 pesewas)
    // We can also make the upgrade price a setting in the future
    if (!verifyRes.ok || verifyData.data?.status !== "success" || (verifyData.data?.amount || 0) < 1000) {
      return { success: false, error: "Payment verification failed or insufficient amount" };
    }

    // 3. Upgrade the user
    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return { success: false, error: "User not found" };

    // Set expiry to 14 days from now (or stack on existing if not expired)
    let newExpiry = new Date();
    if (user.agentExpiry && new Date(user.agentExpiry) > new Date()) {
        newExpiry = new Date(user.agentExpiry);
    }
    newExpiry.setDate(newExpiry.getDate() + 14);

    // Generate a clean slug if they don't have one
    let storeSlug = user.storeSlug;
    if (!storeSlug) {
        const baseName = (user.name || "agent").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, '-');
        storeSlug = `${baseName}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: "AGENT",
        storeSlug: storeSlug,
        agentExpiry: newExpiry
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");
    revalidatePath("/admin/users");
    revalidatePath("/");
    
    const communitySettings = await prisma.systemSetting.findMany({
      where: { key: { in: ["WHATSAPP_CHANNEL_URL", "SUPPORT_WHATSAPP"] } }
    });
    
    const whatsappGroupUrl = communitySettings.find(s => s.key === "WHATSAPP_CHANNEL_URL")?.value || "";

    return { 
      success: true, 
      whatsappGroupUrl
    };

  } catch (error: any) {
    console.error("Upgrade error:", error);
    return { success: false, error: error.message || "An internal error occurred" };
  }
}

