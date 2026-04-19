import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const bundles = await prisma.bundle.findMany({
      where: { isActive: true },
    });
    return NextResponse.json(bundles);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching bundles" }, { status: 500 });
  }
}
