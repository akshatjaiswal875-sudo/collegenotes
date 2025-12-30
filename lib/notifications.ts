import { prisma } from "./prisma";

export type NotificationType = "NEW_NOTE" | "NOTE_APPROVED" | "ANNOUNCEMENT";

interface NotifyAllUsersParams {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  excludeUserId?: string; // Optionally exclude a user (e.g., the admin who created it)
}

interface NotifySingleUserParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Send a notification to all users
 */
export async function notifyAllUsers({
  type,
  title,
  message,
  data,
  excludeUserId,
}: NotifyAllUsersParams) {
  try {
    // Get all users except the excluded one
    const users = await prisma.user.findMany({
      where: excludeUserId
        ? { id: { not: excludeUserId } }
        : undefined,
      select: { id: true },
    });

    if (users.length === 0) return;

    // Create notifications for all users in bulk
    await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        read: false,
      })),
    });

    console.log(`Notifications sent to ${users.length} users`);
  } catch (error) {
    // Don't throw - notifications should not break the main flow
    console.error("Failed to create notifications:", error);
  }
}

/**
 * Send a notification to a single user
 */
export async function notifyUser({
  userId,
  type,
  title,
  message,
  data,
}: NotifySingleUserParams) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        read: false,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
      data: { read: true },
    });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: { userId, read: false },
    });
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return 0;
  }
}
