import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReportClient } from "./ReportClient";

export default async function OrderReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id: id },
      include: {
        bundle: true,
      },
    }),
    prisma.systemSetting.findMany(),
  ]);

  if (!order) {
    notFound();
  }

  // Ensure the user is authorized (either they placed the order, are the agent, or are an admin)
  const isOwner = order.userId === (session.user as any).id;
  const isAgent = order.agentId === (session.user as any).id;
  const isAdmin = (session.user as any).role === "ADMIN";

  if (!isOwner && !isAgent && !isAdmin) {
    notFound();
  }

  const map: Record<string, string> = {};
  settings.forEach(s => (map[s.key] = s.value));
  const adminWhatsApp = map["SUPPORT_WHATSAPP"] || "";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <ReportClient order={order as any} adminWhatsApp={adminWhatsApp} />
    </div>
  );
}
