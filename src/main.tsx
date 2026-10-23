import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA installability, offline support, and background push notifications
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  // Purge any stale caches that don't match the current active cache
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key !== 'cutisg-cache-v1.3.2') {
          caches.delete(key);
        }
      });
    }).catch(() => {});
  }

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js?v=1.3.2', { updateViaCache: 'none' });

      // Check for updates immediately
      try {
        await reg.update();
      } catch {}

      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Request periodic sync if supported (Android Chromium PWA)
      if ('periodicSync' in reg) {
        try {
          const status = await (navigator as any).permissions.query({ name: 'periodic-background-sync' });
          if (status.state === 'granted') {
            await (reg as any).periodicSync.register('check-holiday-alerts', {
              minInterval: 12 * 60 * 60 * 1000 // Every 12 hours
            });
          }
        } catch {
          // Periodic sync permission not granted or unsupported
        }
      }
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  });
}

// Suppress browser pull-to-refresh while preserving smooth internal content scrolling
if (typeof window !== 'undefined') {
  let touchStartY = 0;
  window.addEventListener(
    'touchstart',
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touchCurrentY = e.touches[0].clientY;
        const diffY = touchCurrentY - touchStartY;
        // If user is at top of document and pulling downwards, cancel browser refresh gesture
        if (window.scrollY <= 0 && diffY > 0 && e.cancelable) {
          e.preventDefault();
        }
      }
    },
    { passive: false }
  );
}

createRoot(document.getElementById('root')!).render(<App />);
