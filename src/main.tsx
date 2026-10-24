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

// Pull-to-refresh is suppressed by CSS overscroll-behavior. A global
// touchmove cancellation would also block scrolling back up inside dialogs.
createRoot(document.getElementById('root')!).render(<App />);
