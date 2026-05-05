import { getSystemSettings } from "@/app/admin/settings/actions";

export async function sendPushNotification({
  userId,
  title,
  message,
  url,
}: {
  userId: string;
  title: string;
  message: string;
  url?: string;
}) {
  try {
    const settings = await getSystemSettings();
    const appId = settings["NEXT_PUBLIC_ONESIGNAL_APP_ID"];
    const apiKey = settings["ONESIGNAL_REST_API_KEY"];

    if (!appId || !apiKey) {
      console.warn("OneSignal not configured correctly. Skipping notification.");
      return;
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_external_user_ids: [userId],
        contents: { en: message },
        headings: { en: title },
        url: url,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

export async function broadcastPushNotification({
    title,
    message,
    url,
  }: {
    title: string;
    message: string;
    url?: string;
  }) {
    try {
      const settings = await getSystemSettings();
      const appId = settings["NEXT_PUBLIC_ONESIGNAL_APP_ID"];
      const apiKey = settings["ONESIGNAL_REST_API_KEY"];
  
      if (!appId || !apiKey) {
        console.warn("OneSignal not configured correctly. Skipping broadcast.");
        return { success: false, error: "OneSignal not configured" };
      }
  
      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Basic ${apiKey}`,
        },
        body: JSON.stringify({
          app_id: appId,
          included_segments: ["Total Subscriptions"], // OneSignal default for "All Users"
          contents: { en: message },
          headings: { en: title },
          url: url,
        }),
      });
  
      const data = await response.json();
      if (data.id) return { success: true, id: data.id };
      return { success: false, error: data.errors?.[0] || "Unknown error" };
    } catch (error) {
      console.error("Error broadcasting push notification:", error);
      return { success: false, error: "Internal server error" };
    }
  }
