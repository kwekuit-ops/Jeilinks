import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";
import { BroadcastForm } from "./BroadcastForm";

export default async function BroadcastPage() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        redirect("/login");
    }

    return (
        <div className="space-y-8 animate-in">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <Megaphone className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold font-outfit">Broadcast Notifications</h1>
                    <p className="text-muted-foreground">Send a push message to all platform users instantly.</p>
                </div>
            </div>

            <BroadcastForm />
        </div>
    );
}
