import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import WithdrawalsClient from "./WithdrawalsClient";

export const dynamic = "force-dynamic";

export default async function WithdrawalsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/");

  return (
    <div className="max-w-7xl mx-auto">
      <WithdrawalsClient />
    </div>
  );
}
