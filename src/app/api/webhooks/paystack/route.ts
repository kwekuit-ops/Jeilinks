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
    
    // 1. Get Paystack Secret Key from Settings
    const setting = await prisma.systemSetting.findUnique({ where: { key: "PAYSTACK_SECRET_KEY" } });
    const paystackSecret = setting?.value || process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
      console.error("❌ Webhook Error: PAYSTACK_SECRET_KEY not configured");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // 2. Verify Signature
    const signature = req.headers.get("x-paystack-signature");
    const hash = crypto
      .createHmac("sha512", paystackSecret)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.warn("⚠️ Webhook Warning: Invalid Paystack signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // 3. Handle Charge Success
    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const amountGHS = data.amount / 100;
      const customerEmail = data.customer.email;
      const metadata = data.metadata;

      console.log(`✅ Webhook: Received successful payment ${reference} for ${customerEmail}`);

      // Check if reference has already been processed (idempotency)
      const existingTx = await prisma.walletTransaction.findUnique({
        where: { reference }
      });

      if (existingTx) {
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }

      // Handle based on type
      if (metadata?.type === "TOPUP") {
        const userId = metadata.userId;
        let user = null;

        if (userId) {
          user = await prisma.user.findUnique({
            where: { id: userId }
          });
        }

        if (!user) {
          user = await prisma.user.findUnique({
            where: { email: customerEmail.toLowerCase() }
          });
        }

        if (!user) {
          // User not found — log for admin manual review
          console.warn(`⚠️ Webhook: No user found for email ${customerEmail} (userId: ${userId}). Logging as failed top-up.`);
          await prisma.failedTopup.upsert({
            where: { reference },
            create: {
              reference,
              amount: amountGHS,
              email: customerEmail,
              reason: `No user account found for email: ${customerEmail} (userId: ${userId || 'N/A'})`
            },
            update: {} // already exists, don't overwrite
          });
        } else {
          try {
            await prisma.$transaction([
              prisma.user.update({
                where: { id: user.id },
                data: { balance: { increment: amountGHS } }
              }),
              prisma.walletTransaction.create({
                data: {
                  userId: user.id,
                  amount: amountGHS,
                  type: "TOPUP",
                  reference: reference,
                  description: `Wallet top-up via Paystack (Webhook)`
                }
              })
            ]);

            await sendPushNotification({
              userId: user.id,
              title: "Top-up Confirmed! 💰",
              message: `Your wallet has been credited with GHS ${amountGHS.toFixed(2)}.`,
              url: "/dashboard"
            });

            console.log(`💰 Webhook: Credited GHS ${amountGHS} to ${customerEmail}`);
          } catch (creditError: any) {
            // Credit transaction failed — log for admin manual review
            console.error(`❌ Webhook: Failed to credit ${customerEmail} for ref ${reference}:`, creditError);
            await prisma.failedTopup.upsert({
              where: { reference },
              create: {
                reference,
                amount: amountGHS,
                email: customerEmail,
                userId: user.id,
                reason: `DB transaction failed: ${creditError?.message || String(creditError)}`
              },
              update: {}
            });
          }
        }
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
                const baseName = (user.name || "agent").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, '-');
                storeSlug = `${baseName}-${Math.floor(1000 + Math.random() * 9000)}`;
            }

            await prisma.$transaction([
              prisma.user.update({
                where: { id: userId },
                data: {
                  role: "AGENT",
                  storeSlug: storeSlug,
                  agentExpiry: newExpiry
                }
              }),
              prisma.walletTransaction.create({
                data: {
                  userId: userId,
                  amount: amountGHS,
                  type: "CREDIT",
                  reference: reference,
                  description: "Agent Upgrade (Webhook)"
                }
              })
            ]);

            // Send welcome email with WhatsApp group link
            try {
              const communitySettings = await prisma.systemSetting.findMany({
                where: { key: { in: ["WHATSAPP_CHANNEL_URL"] } }
              });
              const whatsappGroupUrl = communitySettings.find(s => s.key === "WHATSAPP_CHANNEL_URL")?.value || "";

              await sendAgentWelcomeEmail({
                to: user.email!,
                name: user.name || "Agent",
                storeSlug: storeSlug,
                whatsappGroupUrl,
              });
            } catch (emailErr) {
              console.warn("⚠️ Webhook: Failed to send agent welcome email:", emailErr);
            }
            
            console.log(`🎖️ Webhook: Upgraded user ${customerEmail} to AGENT`);
          }
        }
      } else if (metadata?.type === "BUNDLE_PURCHASE") {
          // Check if order already exists for this reference
          const existingOrder = await prisma.order.findUnique({
              where: { paystackRef: reference }
          });

          if (!existingOrder) {
              console.log(`📦 Webhook: Order for ${reference} not found in DB. Creating via webhook fallback.`);
              
              const bundleId = metadata.bundleId;
              const phone = metadata.phone;
              const agentId = metadata.agentId;
              const userId = metadata.userId;

              if (bundleId && phone) {
                const bundle = await prisma.bundle.findUnique({
                  where: { id: bundleId }
                });

                if (bundle) {
                  const sanitizedPhone = phone.replace(/\D/g, "");
                  
                  // Create the order in PENDING status
                  const order = await prisma.order.create({
                    data: {
                      userId: userId || null,
                      bundleId: bundleId,
                      phone: sanitizedPhone,
                      amount: amountGHS,
                      paystackRef: reference,
                      paymentMethod: "PAYSTACK",
                      agentId: agentId || null,
                      status: "PENDING",
                    },
                    include: {
                      bundle: true
                    }
                  });

                  if (order.userId) {
                    await sendPushNotification({
                      userId: order.userId,
                      title: "Order Placed 🚀",
                      message: `Your order for ${bundle.size} ${bundle.network} data to ${sanitizedPhone} has been received.`,
                      url: "/dashboard/orders"
                    });
                  }

                  // Resolve which supplier handles this bundle (multi-supplier routing)
                  const { supplierProductId: resolvedProductId, supplierType } = await getSupplierForBundle(bundleId);
                  const effectiveProductId = resolvedProductId || bundle.supplierProductId;

                  if (effectiveProductId) {
                    const supplierRes = await placeOrderOnSupplier({
                      bundleId: bundleId,
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
                          data: { 
                            status: normalizedStatus,
                            supplierStatus: rawStatus,
                            supplierOrderId: supplierOrderId,
                            supplierType: supplierType,
                          },
                        });

                        if (normalizedStatus === "COMPLETED" || normalizedStatus === "PROCESSING") {
                          await processOrderCommission(order.id);
                        }
                      }
                    } else {
                      // Save the supplierType on the order first
                      await prisma.order.update({
                        where: { id: order.id },
                        data: { supplierType }
                      });

                      // Refund registered users' wallets if payment fails
                      await processOrderRefund(
                        order.id, 
                        supplierRes.error || "Supplier rejection"
                      );
                    }
                  } else {
                    console.error(`Order error: Bundle ${bundleId} missing supplierProductId`);
                  }
                }
              }
          }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
