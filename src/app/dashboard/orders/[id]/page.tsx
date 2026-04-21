import prisma from "@/lib/prisma";
import { formatCurrency, cn } from "@/lib/utils";
import { ChevronLeft, Receipt, Phone, Hash, Calendar, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      bundle: true,
      user: true,
    }
  });

  if (!order || (order.userId !== (session.user as any).id && (session.user as any).role !== "ADMIN")) {
    notFound();
  }

  const statusIcons: Record<string, any> = {
    PENDING: { color: "text-yellow-500", bg: "bg-yellow-100", icon: Clock, desc: "Order received and awaiting confirmation." },
    PROCESSING: { color: "text-blue-500", bg: "bg-blue-100", icon: Clock, desc: "Order has been sent to the network supplier." },
    COMPLETED: { color: "text-green-500", bg: "bg-green-100", icon: CheckCircle2, desc: "Data has been successfully delivered to the recipient." },
    FAILED: { color: "text-red-500", bg: "bg-red-100", icon: AlertCircle, desc: "Payment or delivery failed. Please contact support." },
  };

  const status = statusIcons[order.status];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-in">
      <Link href="/dashboard" className="inline-flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="glass rounded-3xl overflow-hidden border border-border/50 shadow-xl">
        <div className={cn("p-8 text-center border-b", status.bg)}>
            <div className={cn("inline-flex p-3 rounded-full mb-4 bg-white shadow-sm", status.color)}>
                <status.icon className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black font-outfit uppercase tracking-tight">{order.status}</h1>
            <p className="text-sm font-medium opacity-70 mt-1">{status.desc}</p>
        </div>

        <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Order Details</h2>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <Receipt className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Order ID</p>
                                <p className="font-mono text-sm">{order.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Phone className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Recipient</p>
                                <p className="font-bold">{order.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Date</p>
                                <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Payment Summary</h2>
                    <div className="bg-muted px-6 py-4 rounded-2xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">{order.bundle.network} {order.bundle.size}</span>
                            <span className="font-bold">{formatCurrency(order.amount.toString())}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Payment Reference</span>
                            <span className="font-mono">{order.paystackRef ? order.paystackRef.substring(0, 12) + "..." : "N/A"}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-dashed flex justify-between items-center">
                            <span className="font-bold">Total Paid</span>
                            <span className="text-xl font-black text-primary font-outfit">{formatCurrency(order.amount.toString())}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="pt-8 flex flex-col items-center space-y-4">
                <p className="text-sm text-muted-foreground">Need help with this order?</p>
                <a href="#" className="w-full text-center py-3 rounded-2xl border border-primary text-primary font-bold hover:bg-primary/5 transition-colors">
                    Contact Support
                </a>
            </div>
        </div>
      </div>
    </div>
  );
}
