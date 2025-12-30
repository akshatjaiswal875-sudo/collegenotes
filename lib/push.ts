import webPush from "web-push";
import { prisma } from "./prisma";

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    `mailto:${process.env.SMTP_EMAIL || "admin@example.com"}`,
    vapidPublicKey,
    vapidPrivateKey
  );
}

interface PushNotificationPayload {
  title: string;
  message: string;
  url?: string;
}

/**
 * Send push notification to a single user
 */
export async function sendPushToUser(userId: string, payload: PushNotificationPayload) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload)
        )
      )
    );

    // Clean up invalid subscriptions
    const invalidEndpoints: string[] = [];
    results.forEach((result, index) => {
      if (result.status === "rejected" && (result.reason as any)?.statusCode === 410) {
        invalidEndpoints.push(subscriptions[index].endpoint);
      }
    });

    if (invalidEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: invalidEndpoints } },
      });
    }

    return { sent: results.filter((r) => r.status === "fulfilled").length };
  } catch (error) {
    console.error("Failed to send push to user:", error);
    return { sent: 0 };
  }
}

/**
 * Send push notification to all users (or filtered users)
 */
export async function sendPushToAll(
  payload: PushNotificationPayload,
  excludeUserId?: string
) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: excludeUserId ? { userId: { not: excludeUserId } } : undefined,
    });

    if (subscriptions.length === 0) {
      console.log("No push subscriptions found");
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const invalidEndpoints: string[] = [];

    // Send in batches to avoid overwhelming the server
    const batchSize = 100;
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const batch = subscriptions.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map((sub) =>
          webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify(payload)
          )
        )
      );

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          sent++;
        } else {
          failed++;
          // 410 Gone means subscription is no longer valid
          if ((result.reason as any)?.statusCode === 410) {
            invalidEndpoints.push(batch[index].endpoint);
          }
        }
      });
    }

    // Clean up invalid subscriptions
    if (invalidEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: invalidEndpoints } },
      });
      console.log(`Cleaned up ${invalidEndpoints.length} invalid subscriptions`);
    }

    console.log(`Push notifications: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  } catch (error) {
    console.error("Failed to send push notifications:", error);
    return { sent: 0, failed: 0 };
  }
}
