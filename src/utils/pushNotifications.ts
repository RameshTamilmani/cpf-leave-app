/**
 * Utility for handling native operating system and background push notifications for CutiSG.
 * Enables delivering celebration wishes (weekends, public holidays, anniversaries)
 * directly to the mobile device notification center even when app is closed or running in background.
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
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      // Register Periodic Background Sync if supported (Chromium PWA)
      try {
        const reg = await navigator.serviceWorker.ready;
        if ('periodicSync' in reg) {
          const status = await (navigator as any).permissions.query({ name: 'periodic-background-sync' });
          if (status.state === 'granted') {
            await (reg as any).periodicSync.register('check-holiday-alerts', {
              minInterval: 12 * 60 * 60 * 1000 // Every 12 hours
            });
          }
        }
      } catch {}
    }
    return permission;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Sends a celebration notification via Service Worker registration.
 * Deduplicates automatically via localStorage so the same wish tag is never delivered twice.
 */
export async function sendCelebrationPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const dedupKey = `cutisg_notif_sent_${payload.tag || payload.title}`;
  try {
    const alreadySent = localStorage.getItem(dedupKey);
    if (alreadySent) {
      return false; // Already notified today
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

    // Fallback to standard window Notification
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

/**
 * Dispatches a test notification through the Service Worker after a short delay
 * so the user can minimize the app or lock the screen to test background notification delivery.
 */
export async function scheduleBackgroundTestNotification(delaySeconds: number = 4): Promise<boolean> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') return false;

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg.active) {
        reg.active.postMessage({
          type: 'SCHEDULE_TEST_NOTIFICATION',
          delayMs: delaySeconds * 1000,
          title: 'CutiSG Celebration Wish 🎉',
          body: 'This is how holiday and weekend wishes appear on your mobile lock screen & notification panel!'
        });
        return true;
      }
    } catch (err) {
      console.warn('Service worker background schedule failed:', err);
    }
  }

  // Fallback timeout with direct window notification
  setTimeout(() => {
    sendCelebrationPushNotification({
      title: 'CutiSG Celebration Wish 🎉',
      body: 'This is how holiday and weekend wishes appear on your mobile lock screen & notification panel!',
      tag: 'test-preview-' + Date.now()
    });
  }, delaySeconds * 1000);

  return true;
}
