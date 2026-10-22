/**
 * Utility for handling browser push and system notifications for CutiSG.
 * Enables delivering celebration wishes (weekends, public holidays, anniversaries)
 * directly to the user's operating system notification center even when app is backgrounded.
 */

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Sends a system push notification for a celebration wish.
 * Deduplicates automatically via localStorage so the same wish tag is never delivered twice.
 */
export async function sendCelebrationPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const dedupKey = `cutisg_notif_sent_${payload.tag || payload.title}`;
  try {
    const alreadySent = localStorage.getItem(dedupKey);
    if (alreadySent) {
      return false; // Already notified
    }
  } catch {}

  const notificationOptions: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/icon.svg',
    tag: payload.tag || 'cutisg-celebration',
    data: payload.data || { url: '/' }
  };

  try {
    // 1. Try sending via active Service Worker registration (supported in PWAs & background tabs)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(payload.title, notificationOptions);
        try {
          localStorage.setItem(dedupKey, new Date().toISOString());
        } catch {}
        return true;
      }
    }

    // 2. Fallback to standard window Notification API
    new Notification(payload.title, notificationOptions);
    try {
      localStorage.setItem(dedupKey, new Date().toISOString());
    } catch {}
    return true;
  } catch (err) {
    console.warn('Error displaying system notification:', err);
    return false;
  }
}
