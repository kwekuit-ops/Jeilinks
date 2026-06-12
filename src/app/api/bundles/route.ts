import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const isPrivileged = userRole === "AGENT" || userRole === "ADMIN";

    const bundles = await prisma.bundle.findMany({
      where: { isActive: true },
      // HIGH-8: Only return internal pricing fields to privileged users
      select: {
        id: true,
        network: true,
        size: true,
        userPrice: true,
        isActive: true,
        // Agent/admin-only fields
        ...(isPrivileged && {
          agentPrice: true,
          supplierProductId: true,
        }),
      },
    });
    return NextResponse.json(bundles);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching bundles" }, { status: 500 });
  }
}
