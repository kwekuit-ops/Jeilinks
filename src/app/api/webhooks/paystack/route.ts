import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPushNotification } from "@/lib/notifications";
import { sendAgentWelcomeEmail } from "@/lib/email";
import { placeOrderOnSupplier, getSupplierForBundle } from "@/lib/supplierBridge";
import { normalizeOrderStatus } from "@/lib/utils";
import { processOrderCommission } from "@/lib/commissions";
import { processOrderRefund } from "@/lib/orderUtils";

export async function POST(req: Request) {
  try {
    const body = await req.text();

    // 1. Get Paystack Secret Key
    const setting = await prisma.systemSetting.findUnique({ where: { key: "PAYSTACK_SECRET_KEY" } });
    const paystackSecret = setting?.value || process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
      console.error("❌ Webhook Error: PAYSTACK_SECRET_KEY not configured");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // 2. Verify Paystack Signature
    const signature = req.headers.get("x-paystack-signature");
    const hash = crypto.createHmac("sha512", paystackSecret).update(body).digest("hex");

    if (hash !== signature) {
      console.warn("⚠️ Webhook Warning: Invalid Paystack signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log(`[Paystack Webhook] Event: ${event.event}`);

    // 3. Handle charge success
    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const amountGHS = data.amount / 100; // Paystack sends in pesewas
      const customerEmail = data.customer?.email || "guest@jeilinks.com";
      const metadata = data.metadata;

      console.log(`✅ Webhook: Received successful payment ${reference} for ${customerEmail}`);

      // Idempotency check
      const existingTx = await prisma.walletTransaction.findUnique({ where: { reference } });
      if (existingTx) {
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }

      // --- TOPUP ---
      if (metadata?.type === "TOPUP") {
        const userId = metadata.userId;
        let user = userId
          ? await prisma.user.findUnique({ where: { id: userId } })
          : null;

        if (!user) {
          user = await prisma.user.findUnique({ where: { email: customerEmail.toLowerCase() } });
        }

        if (!user) {
          console.warn(`⚠️ No user found for email ${customerEmail}`);
          await prisma.failedTopup.upsert({
            where: { reference },
            create: { reference, amount: amountGHS, email: customerEmail, reason: `No user found for: ${customerEmail}` },
            update: {}
          });
        } else {
          try {
            await prisma.$transaction([
              prisma.user.update({ where: { id: user.id }, data: { balance: { increment: amountGHS } } }),
              prisma.walletTransaction.create({
                data: { userId: user.id, amount: amountGHS, type: "TOPUP", reference, description: "Wallet top-up via Paystack (Webhook)" }
              })
            ]);

            await sendPushNotification({
              userId: user.id,
              title: "Top-up Confirmed! 💰",
              message: `Your wallet has been credited with GHS ${amountGHS.toFixed(2)}.`,
              url: "/dashboard"
            });
            console.log(`💰 Credited GHS ${amountGHS} to ${customerEmail}`);
          } catch (err: any) {
            console.error(`❌ Failed to credit ${customerEmail}:`, err);
            await prisma.failedTopup.upsert({
              where: { reference },
              create: { reference, amount: amountGHS, email: customerEmail, userId: user.id, reason: err?.message },
              update: {}
            });
          }
        }

      // --- UPGRADE ---
      } else if (metadata?.type === "UPGRADE") {
        const userId = metadata.userId;
        if (userId) {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            let newExpiry = new Date();
            if (user.agentExpiry && new Date(user.agentExpiry) > new Date()) {
              newExpiry = new Date(user.agentExpiry);
            }
            newExpiry.setDate(newExpiry.getDate() + 14);

            let storeSlug = user.storeSlug;
            if (!storeSlug) {
              const baseName = (user.name || "agent").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
              storeSlug = `${baseName}-${Math.floor(1000 + Math.random() * 9000)}`;
            }

            await prisma.$transaction([
              prisma.user.update({ where: { id: userId }, data: { role: "AGENT", storeSlug, agentExpiry: newExpiry } }),
              prisma.walletTransaction.create({
                data: { userId, amount: amountGHS, type: "CREDIT", reference, description: "Agent Upgrade (Paystack Webhook)" }
              })
            ]);

            try {
              const communitySettings = await prisma.systemSetting.findMany({ where: { key: { in: ["WHATSAPP_CHANNEL_URL"] } } });
              const whatsappGroupUrl = communitySettings.find(s => s.key === "WHATSAPP_CHANNEL_URL")?.value || "";
              await sendAgentWelcomeEmail({ to: user.email!, name: user.name || "Agent", storeSlug, whatsappGroupUrl });
            } catch (emailErr) {
              console.warn("⚠️ Failed to send welcome email:", emailErr);
            }

            console.log(`🎖️ Upgraded ${customerEmail} to AGENT`);
          }
        }

      // --- BUNDLE PURCHASE ---
      } else if (metadata?.type === "BUNDLE_PURCHASE") {
        const existingOrder = await prisma.order.findUnique({ where: { paymentRef: reference } });

        if (!existingOrder) {
          const { bundleId, phone, agentId, userId } = metadata;

          if (bundleId && phone) {
            const bundle = await prisma.bundle.findUnique({ where: { id: bundleId } });

            if (bundle) {
              const sanitizedPhone = phone.replace(/\D/g, "");
              const ghPhoneRegex = /^(02|05)\d{8}$/;

              if (!ghPhoneRegex.test(sanitizedPhone)) {
                console.error(`⚠️ Invalid phone ${sanitizedPhone} for ref ${reference}`);
                return NextResponse.json({ received: true }, { status: 200 });
              }

              const order = await prisma.order.create({
                data: {
                  userId: userId || null,
                  bundleId,
                  phone: sanitizedPhone,
                  amount: amountGHS,
                  paymentRef: reference,
                  paymentMethod: "PAYSTACK",
                  agentId: agentId || null,
                  status: "PENDING",
                },
                include: { bundle: true }
              });

              if (order.userId) {
                await sendPushNotification({
                  userId: order.userId,
                  title: "Order Placed 🚀",
                  message: `Your order for ${bundle.size} ${bundle.network} data to ${sanitizedPhone} has been received.`,
                  url: "/dashboard/orders"
                });
              }

              const { supplierProductId: resolvedProductId, supplierType } = await getSupplierForBundle(bundleId);
              const effectiveProductId = resolvedProductId || bundle.supplierProductId;

              if (effectiveProductId) {
                const supplierRes = await placeOrderOnSupplier({
                  bundleId,
                  supplierProductId: effectiveProductId,
                  phone: sanitizedPhone,
                  reference: order.id,
                });

                if (supplierRes.success) {
                  const res = supplierRes as any;
                  const supplierOrderId = res.supplierOrderId || res.supplier_order_id;
                  if (supplierOrderId) {
                    const rawStatus = res.status || "PROCESSING";
                    const normalizedStatus = normalizeOrderStatus(rawStatus);
                    await prisma.order.update({
                      where: { id: order.id },
                      data: { status: normalizedStatus, supplierStatus: rawStatus, supplierOrderId, supplierType }
                    });
                    if (normalizedStatus === "COMPLETED") {
                      await processOrderCommission(order.id);
                    }
                  }
                } else {
                  await prisma.order.update({ where: { id: order.id }, data: { supplierType } });
                  await processOrderRefund(order.id, supplierRes.error || "Supplier rejection");
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Paystack Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
