"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function upgradeToAgent(paystackRef: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. Verify Paystack Payment
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${paystackRef}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || verifyData.data.status !== "success" || verifyData.data.amount < 1000) {
      return { success: false, error: "Payment verification failed" };
    }

    // 2. Upgrade the user
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    });

    if (!user) return { success: false, error: "User not found" };

    // Set expiry to 14 days from now (or stack on existing if not expired)
    let newExpiry = new Date();
    if (user.agentExpiry && new Date(user.agentExpiry) > new Date()) {
        newExpiry = new Date(user.agentExpiry);
    }
    newExpiry.setDate(newExpiry.getDate() + 14);

    const baseName = user.name || "agent";
    const storeSlug = baseName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "AGENT",
        storeSlug: user.storeSlug || storeSlug,
        agentExpiry: newExpiry
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");
    revalidatePath("/admin/users");
    revalidatePath("/");
    
    return { success: true };

  } catch (error) {
    console.error("Upgrade error:", error);
    return { success: false, error: "An internal error occurred" };
  }
}
