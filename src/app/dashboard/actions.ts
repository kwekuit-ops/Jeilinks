"use server";

import prisma from "@/lib/prisma";
import { trackOrderOnSupplier } from "@/lib/supplierBridge";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeOrderStatus } from "@/lib/utils";
import { processOrderCommission } from "@/lib/commissions";
import { processOrderRefund } from "@/lib/orderUtils";


export async function changePassword(formData: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    const { currentPassword, newPassword } = formData;

    // MED-7: Validate new password strength before doing any DB work
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters." };
    }
    if (newPassword === currentPassword) {
      return { success: false, error: "New password must be different from your current password." };
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id }
    });

    if (!user) return { success: false, error: "User not found" };
    
    if (!user.password) {
      return { success: false, error: "This account uses social login. Password change is not available." };
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return { success: false, error: "Current password is incorrect." };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    return { success: true };
  } catch (error) {
    console.error("Password update error:", error);
    return { success: false, error: "An error occurred while updating your password." };
  }
}

export async function refreshOrderStatus(orderId: string) {
  try {
    // HIGH-6: Authenticate FIRST before any DB queries to prevent IDOR probing
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized to refresh this order." };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return { success: false, error: "Order not found." };
    }

    if (order.userId !== (session.user as any).id &&
        order.agentId !== (session.user as any).id &&
        (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized to refresh this order." };
    }

    if (order.status === "COMPLETED" || order.status === "FAILED") {
       return { success: true, status: order.status, message: `Order is already ${order.status.toLowerCase()}.` };
    }

    if (!order.supplierOrderId) {
      // If it doesn't have a supplier ID, it might have failed to send initially. 
      // We could try to send it again here, but for now, let's just indicate it's stuck.
      return { success: false, error: "Supplier has not acknowledged this order yet. Please contact support if it persists." };
    }

    let supplierType = order.supplierType;
    if (!supplierType) {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "SUPPLIER_TYPE" }
      });
      supplierType = setting?.value || process.env.SUPPLIER_TYPE || "FUZESERVE";
    }

    const result = await trackOrderOnSupplier(order.supplierOrderId, supplierType);

    if (result.success && result.status) {
      const rawStatus = result.status || "";
      const newStatus = normalizeOrderStatus(rawStatus);
      
      if (newStatus !== order.status || rawStatus !== (order as any).supplierStatus) {
        if (newStatus === "FAILED") {
          await processOrderRefund(order.id, result.error || "Supplier failed the order");
        } else {
          await prisma.order.update({
            where: { id: order.id },
            data: { 
              status: newStatus,
              supplierStatus: rawStatus,
              failureReason: result.error || null
            }
          });

          if (newStatus === "COMPLETED" || newStatus === "PROCESSING") {
            await processOrderCommission(order.id);
          }
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/orders");
        revalidatePath("/admin/orders");
        revalidatePath("/");
        return { success: true, status: newStatus };
      }
      
      return { success: true, status: order.status, message: "Status is already up to date." };
    }

    return { success: false, error: "Supplier API did not return a status." };
  } catch (error: any) {
    console.error("Refresh error:", error);
    return { success: false, error: error.message || "Failed to refresh order status." };
  }
}
