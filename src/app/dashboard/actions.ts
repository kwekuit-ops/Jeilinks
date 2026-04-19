"use server";

import prisma from "@/lib/prisma";
import { getActiveSupplier } from "@/lib/suppliers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function changePassword(formData: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    const { currentPassword, newPassword } = formData;

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id }
    });

    if (!user) return { success: false, error: "User not found" };

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return { success: false, error: "Current password is incorrect." };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
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
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return { success: false, error: "Order not found." };
    }

    if (order.status === "COMPLETED" || order.status === "FAILED") {
       return { success: true, status: order.status, message: `Order is already ${order.status.toLowerCase()}.` };
    }

    if (!order.supplierOrderId) {
      // If it doesn't have a supplier ID, it might have failed to send initially. 
      // We could try to send it again here, but for now, let's just indicate it's stuck.
      return { success: false, error: "Supplier has not acknowledged this order yet. Please contact support if it persists." };
    }

    const supplier = await getActiveSupplier();
    const result = await supplier.trackOrder(order.supplierOrderId);

    if (result.success && result.status) {
      const newStatus = result.status.toUpperCase();
      
      if (newStatus !== order.status) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: newStatus }
        });
        revalidatePath("/dashboard");
        revalidatePath("/admin/orders");
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
