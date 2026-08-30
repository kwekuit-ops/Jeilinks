import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveSupplier } from "@/lib/suppliers";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const supplier = await getActiveSupplier();
    const balance = await supplier.fetchBalance();
    return NextResponse.json({ success: true, balance });
  } catch (_error) {
    return NextResponse.json({ success: false, balance: 0 }, { status: 500 });
  }
}
