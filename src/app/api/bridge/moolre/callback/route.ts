import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  // When Moolre is done, bounce the user back to their Jelboost wallet
  return NextResponse.redirect("https://jelboostgh.com/dashboard/wallet?success=true");
}
