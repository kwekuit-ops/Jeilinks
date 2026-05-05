"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { broadcastPushNotification } from "@/lib/notifications";

export async function sendBroadcast(formData: { title: string, message: string, url: string }) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    if (!formData.title || !formData.message) {
        return { success: false, error: "Title and message are required" };
    }

    return await broadcastPushNotification({
        title: formData.title,
        message: formData.message,
        url: formData.url || undefined
    });
}
