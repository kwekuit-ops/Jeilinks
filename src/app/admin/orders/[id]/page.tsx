import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, 
  Hash, User, Package, Phone, Calendar, 
  CreditCard, Activity, HelpCircle, 
  RefreshCcw, ShieldCheck, ExternalLink 
} from "lucide-react";
import Link from "next/link";
import { RefreshOrderButton } from "@/components/RefreshOrderButton";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      bundle: true,
    },
  });

  if (!order) {
    notFound();
  }

  const statusIcons: Record<string, any> = {
    PENDING: { color: "text-yellow-600 bg-yellow-100", icon: Clock, label: "Awaiting Confirmation" },
    PROCESSING: { color: "text-blue-600 bg-blue-100", icon: Activity, label: "Sending to Network" },
    COMPLETED: { color: "text-green-600 bg-green-100", icon: CheckCircle, label: "Successfully Delivered" },
    FAILED: { color: "text-red-600 bg-red-100", icon: XCircle, label: "Delivery Failed" },
  };

  const status = statusIcons[order.status] || statusIcons.PENDING;

  return (
    <div className="space-y-8 animate-in pb-20">
      <div className="flex items-center space-x-4">
        <Link 
          href="/admin/orders" 
          className="p-2 hover:bg-muted rounded-xl transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-outfit">Order Details</h1>
          <p className="text-muted-foreground flex items-center space-x-2">
            <Hash className="h-3 w-3" />
            <span className="font-mono text-xs">{order.id}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Primary Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Status Card */}
          <div className={cn(
            "p-8 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden relative",
            status.color.replace('bg-', 'border-').replace('text-', 'bg-').split(' ')[0] + "/10"
          )}>
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <status.icon className="h-32 w-32" />
            </div>
            <div className="flex items-center space-x-6 relative z-10">
              <div className={cn("p-4 rounded-2xl", status.color)}>
                <status.icon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest opacity-70">Current Status</p>
                <h2 className={cn("text-2xl font-black font-outfit", status.color.split(' ')[0])}>
                  {order.supplierStatus || order.status}
                </h2>
                <p className="text-sm text-muted-foreground font-medium">{status.label}</p>
              </div>
            </div>
            
            {(order.status === "PROCESSING" || order.status === "PENDING") && (
                <div className="flex items-center space-x-4 relative z-10">
                    <RefreshOrderButton orderId={order.id} />
                </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="glass p-6 rounded-3xl border border-border/50 space-y-6">
                <h3 className="font-black text-xs uppercase tracking-widest flex items-center space-x-2">
                    <User className="h-4 w-4 text-primary" />
                    <span>Customer Information</span>
                </h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Name</p>
                        <p className="font-bold">{order.user?.name || "Guest User"}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Email / Contact</p>
                        <p className="font-bold text-sm">{order.user?.email || "No Email Provided"}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Recipient Number</p>
                        <p className="font-mono font-black text-primary text-xl tracking-tighter">{order.phone}</p>
                    </div>
                </div>
             </div>

             <div className="glass p-6 rounded-3xl border border-border/50 space-y-6">
                <h3 className="font-black text-xs uppercase tracking-widest flex items-center space-x-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span>Bundle & Pricing</span>
                </h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Package</p>
                        <p className="font-bold">{order.bundle.network} {order.bundle.size}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Amount Charged</p>
                        <p className="font-black text-2xl text-primary font-outfit">{formatCurrency(order.amount.toString())}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Commission Earned</p>
                        <p className="font-bold text-green-600">{formatCurrency(order.commissionEarned.toString())}</p>
                    </div>
                </div>
             </div>
          </div>

          {/* Failure Info */}
          {order.status === "FAILED" && (
            <div className="bg-red-50 border border-red-100 p-8 rounded-3xl space-y-4">
                <div className="flex items-center space-x-3 text-red-600">
                    <HelpCircle className="h-6 w-6" />
                    <h3 className="font-black font-outfit text-xl">Failure Breakdown</h3>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-red-200">
                    <p className="text-sm font-medium text-red-800 italic">"{order.failureReason || "No specific failure reason provided by the network provider."}"</p>
                </div>
                <p className="text-xs text-muted-foreground">If this error persists, please check your supplier wallet balance or contact support.</p>
            </div>
          )}
        </div>

        {/* Right Column: Technical Details */}
        <div className="space-y-6">
            <div className="glass p-8 rounded-3xl border border-border/50 space-y-6">
                <h3 className="font-black text-xs uppercase tracking-widest">Transaction Records</h3>
                
                <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                        <div className="p-2 bg-muted rounded-lg">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Order Placed</p>
                            <p className="text-xs font-bold">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4">
                        <div className="p-2 bg-muted rounded-lg">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Payment Reference</p>
                            <p className="text-xs font-mono break-all">{order.paystackRef || "DIRECT_DEBIT"}</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4">
                        <div className="p-2 bg-muted rounded-lg">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Payment Method</p>
                            <p className="text-xs font-bold uppercase tracking-widest">{order.paymentMethod}</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-4">Supplier Tracking</p>
                        <div className="bg-muted/50 p-4 rounded-2xl space-y-2">
                             <div className="flex justify-between text-[10px]">
                                <span className="text-muted-foreground">External ID</span>
                                <span className="font-mono font-bold">{order.supplierOrderId || "N/A"}</span>
                             </div>
                             <div className="flex justify-between text-[10px]">
                                <span className="text-muted-foreground">Status</span>
                                <span className="font-bold text-primary">{order.supplierStatus || "N/A"}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <Link 
                href="/admin/orders"
                className="flex items-center justify-center space-x-2 w-full py-4 bg-muted hover:bg-muted/80 rounded-2xl font-bold transition-all"
            >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to All Orders</span>
            </Link>
        </div>
      </div>
    </div>
  );
}
