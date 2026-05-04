import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import StoreManagementClient from "./StoreManagementClient";

export const dynamic = "force-dynamic";

export default async function StoreManagementPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || ((session.user as any).role !== "AGENT" && (session.user as any).role !== "ADMIN")) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  const [bundles, customPrices, user] = await Promise.all([
    prisma.bundle.findMany({
      where: { isActive: true },
      orderBy: [
        { network: 'asc' },
        { userPrice: 'asc' }
      ]
    }),
    prisma.agentBundlePrice.findMany({
      where: { agentId: userId }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { storeSlug: true }
    })
  ]);

  return (
    <StoreManagementClient 
        bundles={JSON.parse(JSON.stringify(bundles))} 
        initialCustomPrices={JSON.parse(JSON.stringify(customPrices))}
        storeSlug={user?.storeSlug || null}
    />
  );
}
