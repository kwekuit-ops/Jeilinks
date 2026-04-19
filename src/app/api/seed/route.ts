import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // 1. Create initial bundles if none exist
    const bundleCount = await prisma.bundle.count();
    
    if (bundleCount === 0) {
      const initialBundles = [
        { network: "MTN", size: "1GB", userPrice: 12, agentPrice: 10 },
        { network: "MTN", size: "2GB", userPrice: 20, agentPrice: 17 },
        { network: "MTN", size: "5GB", userPrice: 45, agentPrice: 40 },
        { network: "Telecel", size: "1GB", userPrice: 10, agentPrice: 8 },
        { network: "Telecel", size: "2GB", userPrice: 18, agentPrice: 15 },
        { network: "AirtelTigo", size: "1GB", userPrice: 9, agentPrice: 7 },
      ];

      await prisma.bundle.createMany({
        data: initialBundles,
      });
    }

    // 2. Create an admin user if none exists
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount === 0) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await prisma.user.create({
            data: {
                name: "System Admin",
                email: "admin@jeilinks.com",
                password: hashedPassword,
                role: "ADMIN",
            }
        });
    }

    return NextResponse.json({ message: "Seeding successful" });
  } catch (error: any) {
    return NextResponse.json({ message: "Seeding failed", error: error.message }, { status: 500 });
  }
}
