import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import StoreManager from "./StoreManager";

export default async function AdminStorePage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/");

  const admin = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { id: true, name: true, storeSlug: true }
  });

  const bundles = await prisma.bundle.findMany({
    orderBy: [{ network: "asc" }, { userPrice: "asc" }]
  });

  const storeOrderCount = admin?.storeSlug
    ? await prisma.order.count({ where: { agentId: admin.id } })
    : 0;

  return (
    <StoreManager
      initialSlug={admin?.storeSlug || null}
      adminName={admin?.name || "Admin"}
      bundles={JSON.parse(JSON.stringify(bundles))}
      storeOrderCount={storeOrderCount}
    />
  );
}
