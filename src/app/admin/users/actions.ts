"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getSupplierForBundle, placeOrderOnSupplier } from "@/lib/supplierBridge";
import { normalizeOrderStatus } from "@/lib/utils";
import { processOrderCommission } from "@/lib/commissions";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    await ensureAdmin();
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const data: any = { role: newRole };

    // If becoming an agent and has no slug, generate one with collision check
    if (newRole === "AGENT" && !user.storeSlug) {
      const baseName = (user.name || "agent").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      let slug = "";
      for (let i = 0; i < 5; i++) {
        const candidate = `${baseName}-${Math.floor(10000 + Math.random() * 90000)}`;
        const taken = await prisma.user.findUnique({ where: { storeSlug: candidate } });
        if (!taken) { slug = candidate; break; }
      }
      data.storeSlug = slug || `${baseName}-${Date.now()}`;
      
      // Also set a default expiry if not set
      if (!user.agentExpiry) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        data.agentExpiry = expiry;
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/wallet");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update role" };
  }
}

export async function deleteUser(userId: string) {
  try {
    await ensureAdmin();

    // Check if user has orders - we might want to delete orders or prevent deletion
    // For now, let's just delete the user (Prisma will fail if there are FK constraints unless set to cascade)
    // In schema.prisma, Order has fields [userId] references [id]. Default is restrict.
    
    // Better: just delete the user and let the DB handle it if cascading is on, 
    // or manually delete/disconnect if needed.
    // Let's assume we want to keep orders but remove the user? No, usually delete everything.
    
    await prisma.user.delete({
      where: { id: userId }
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/wallet");
    return { success: true };
  } catch (error: any) {
    console.error("Delete user error:", error);
    return { success: false, error: "Failed to delete user. They might have existing orders." };
  }
}

export async function updateUserBalance(userId: string, amount: number) {
  try {
    await ensureAdmin();

    const type = amount >= 0 ? "CREDIT" : "DEBIT";
    const ref = `ADMIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } }
      }),
      prisma.walletTransaction.create({
        data: {
          userId,
          amount: Math.abs(amount),
          type,
          reference: ref,
          description: `Admin manual ${type.toLowerCase()}`
        }
      })
    ]);

    revalidatePath("/admin/users");
    revalidatePath("/admin/wallet");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Update balance error:", error);
    return { success: false, error: "Failed to update balance" };
  }
}


export async function createStore(data: { name: string, email: string, phone: string, password?: string }) {
  try {
    await ensureAdmin();

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    // MED-3: Never default to a weak password — require one or generate a secure random one
    const rawPassword = data.password && data.password.length >= 8
      ? data.password
      : crypto.randomBytes(10).toString("hex"); // 20-char random if not supplied

    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    // LOW-4: Generate unique slug with collision check
    const baseName = data.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    let storeSlug = "";
    for (let i = 0; i < 5; i++) {
      const candidate = `${baseName}-${Math.floor(10000 + Math.random() * 90000)}`;
      const taken = await prisma.user.findUnique({ where: { storeSlug: candidate } });
      if (!taken) { storeSlug = candidate; break; }
    }
    if (!storeSlug) storeSlug = `${baseName}-${Date.now()}`;

    // Default expiry: 30 days for admin-created stores
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        password: hashedPassword,
        role: "AGENT",
        storeSlug: storeSlug,
        agentExpiry: expiry,
      }
    });

    revalidatePath("/admin/users");
    // Return the raw password so admin can communicate it to the agent
    return { success: true, generatedPassword: !data.password ? rawPassword : undefined };
  } catch (error: any) {
    console.error("Create store error:", error);
    return { success: false, error: error.message || "Failed to create store" };
  }
}

// ─────────────────────────────────────────────────────────────
// Failed Top-up Actions
// ─────────────────────────────────────────────────────────────

export async function getFailedTopups() {
  try {
    await ensureAdmin();
    const items = await prisma.failedTopup.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch" };
  }
}

export async function approveFailedTopup(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }
    const adminId = (session.user as any).id;

    const record = await prisma.failedTopup.findUnique({ where: { id } });
    if (!record) return { success: false, error: "Record not found" };
    if (record.status !== "PENDING") return { success: false, error: "Already resolved" };

    // Find the user — prefer the stored userId, fall back to email lookup
    const user = record.userId
      ? await prisma.user.findUnique({ where: { id: record.userId } })
      : await prisma.user.findUnique({ where: { email: record.email } });

    if (!user) return { success: false, error: "No matching user account found. Resolve manually." };

    const ref = `TOPUP-MANUAL-${record.reference}`;
    const amount = Number(record.amount);

    // Check if this reference was already credited (idempotency guard)
    const alreadyCredited = await prisma.walletTransaction.findFirst({
      where: { reference: ref }
    });
    if (alreadyCredited) {
      // Mark resolved and bail out
      await prisma.failedTopup.update({
        where: { id },
        data: { status: "APPROVED", resolvedAt: new Date(), resolvedBy: adminId }
      });
      revalidatePath("/admin/wallet");
      return { success: true };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: { increment: amount } }
      }),
      prisma.walletTransaction.create({
        data: {
          userId: user.id,
          amount,
          type: "TOPUP",
          reference: ref,
          description: `Manual top-up approval by admin (ref: ${record.reference})`
        }
      }),
      prisma.failedTopup.update({
        where: { id },
        data: { status: "APPROVED", resolvedAt: new Date(), resolvedBy: adminId, userId: user.id }
      })
    ]);

    revalidatePath("/admin/wallet");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Approve failed topup error:", error);
    return { success: false, error: error.message || "Failed to approve top-up" };
  }
}

export async function rejectFailedTopup(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }
    const adminId = (session.user as any).id;

    const record = await prisma.failedTopup.findUnique({ where: { id } });
    if (!record) return { success: false, error: "Record not found" };
    if (record.status !== "PENDING") return { success: false, error: "Already resolved" };

    await prisma.failedTopup.update({
      where: { id },
      data: { status: "REJECTED", resolvedAt: new Date(), resolvedBy: adminId }
    });

    revalidatePath("/admin/wallet");
    return { success: true };
  } catch (error: any) {
    console.error("Reject failed topup error:", error);
    return { success: false, error: error.message || "Failed to reject top-up" };
  }
}

export async function retryOrder(orderId: string, debitOption: "CUSTOMER" | "ADMIN" | "NONE") {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }
    const adminId = (session.user as any).id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { bundle: true }
    });

    if (!order) return { success: false, error: "Order not found" };
    if (order.status !== "FAILED") {
      return { success: false, error: "Only failed orders can be retried" };
    }

    const orderAmount = Number(order.amount);

    if (debitOption === "ADMIN") {
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { balance: true }
      });
      const adminBal = Number(admin?.balance ?? 0);
      if (!admin || adminBal < orderAmount) {
        return {
          success: false,
          error: `Insufficient admin wallet balance. You need GHS ${orderAmount.toFixed(2)} but have GHS ${adminBal.toFixed(2)} to replace this order.`
        };
      }
    } else if (debitOption === "CUSTOMER") {
      if (!order.userId) {
        return { success: false, error: "Cannot debit customer for guest checkout order" };
      }
      const customer = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { balance: true }
      });
      const customerBal = Number(customer?.balance ?? 0);
      if (!customer || customerBal < orderAmount) {
        return {
          success: false,
          error: `Insufficient customer wallet balance. Customer needs GHS ${orderAmount.toFixed(2)} but has GHS ${customerBal.toFixed(2)}.`
        };
      }
    }

    // Run order status update and wallet deduction in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "PROCESSING",
          failureReason: null,
          supplierStatus: "RETRYING"
        }
      });

      if (debitOption === "ADMIN") {
        await tx.user.update({
          where: { id: adminId },
          data: { balance: { decrement: order.amount } }
        });

        await tx.walletTransaction.create({
          data: {
            userId: adminId,
            amount: order.amount,
            type: "DEBIT",
            reference: `RETRY-DEBIT-${order.id}`,
            description: `Replace/retry failed order #${order.id.substring(0, 8)} (Admin funded)`
          }
        });
      } else if (debitOption === "CUSTOMER" && order.userId) {
        await tx.user.update({
          where: { id: order.userId },
          data: { balance: { decrement: order.amount } }
        });

        await tx.walletTransaction.create({
          data: {
            userId: order.userId,
            amount: order.amount,
            type: "DEBIT",
            reference: `RETRY-DEBIT-${order.id}`,
            description: `Re-debit for replaced order #${order.id.substring(0, 8)} after retry`
          }
        });
      }
    });

    const { supplierProductId: resolvedProductId, supplierType } = await getSupplierForBundle(order.bundleId);
    const effectiveProductId = resolvedProductId || order.bundle.supplierProductId;

    if (!effectiveProductId) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "FAILED",
          failureReason: "No supplier product ID configured for retry"
        }
      });
      return { success: false, error: "Bundle missing supplier product ID configuration" };
    }

    const supplierRes = await placeOrderOnSupplier({
      bundleId: order.bundleId,
      supplierProductId: effectiveProductId,
      phone: order.phone,
      reference: order.id
    });

    if (supplierRes.success) {
      const res = supplierRes as any;
      const supplierOrderId = res.supplierOrderId || res.supplier_order_id;
      const rawStatus = res.status || "PROCESSING";
      const normalizedStatus = normalizeOrderStatus(rawStatus);

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: normalizedStatus,
          supplierStatus: rawStatus,
          supplierOrderId: supplierOrderId,
          supplierType: supplierType
        }
      });

      if (normalizedStatus === "COMPLETED") {
        await processOrderCommission(orderId);
      }

      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
      revalidatePath("/dashboard/orders");
      return { success: true, message: `Order replaced successfully! Supplier ID: ${supplierOrderId}` };
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "FAILED",
          failureReason: supplierRes.error || "Retry failed at supplier"
        }
      });
      return { success: false, error: supplierRes.error || "Supplier rejected the retry request" };
    }
  } catch (error: any) {
    console.error("Retry order error:", error);
    return { success: false, error: error.message || "Failed to retry order" };
  }
}

