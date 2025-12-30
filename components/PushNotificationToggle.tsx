"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { usePushNotifications } from "@/lib/usePushNotifications";
import toast from "react-hot-toast";

export default function PushNotificationToggle() {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } =
    usePushNotifications();

  if (!isSupported) {
    return null; // Don't show anything if not supported
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success("Push notifications disabled");
      } else {
        toast.error("Failed to disable notifications");
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success("Push notifications enabled! 🔔");
      } else if (permission === "denied") {
        toast.error("Please enable notifications in your browser settings");
      } else {
        toast.error("Failed to enable notifications");
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
        isSubscribed
          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
      title={isSubscribed ? "Disable push notifications" : "Enable push notifications"}
    >
      {isLoading ? (
        <div className="w-[18px] h-[18px] border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isSubscribed ? (
        <BellRing size={18} />
      ) : (
        <BellOff size={18} />
      )}
      <span className="hidden sm:inline">
        {isSubscribed ? "Notifications On" : "Enable Notifications"}
      </span>
    </button>
  );
}
