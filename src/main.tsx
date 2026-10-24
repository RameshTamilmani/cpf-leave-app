import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource-variable/material-symbols-outlined';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register only a built production worker; dev modules are not offline releases.
import { registerAppWorker } from './pwa';
if (import.meta.env.PROD) void registerAppWorker().catch(error => {
  console.warn('Offline setup failed; reconnect and reopen the app to retry.', error);
});

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
