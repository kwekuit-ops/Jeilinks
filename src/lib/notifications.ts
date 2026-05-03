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
