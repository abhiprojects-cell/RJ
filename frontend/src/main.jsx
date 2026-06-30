import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update.
// When a new version is available it updates silently in the background.
registerSW({
  onNeedRefresh() {
    // New content available — reload to activate the new SW immediately
    // (autoUpdate: true in vite.config.js handles this automatically,
    //  but this callback fires as a safety net)
    console.log('[SW] New content available, will update on next reload.');
  },
  onOfflineReady() {
    console.log('[SW] App is ready to work offline (static assets cached).');
  },
  onRegistered(swRegistration) {
    if (swRegistration) {
      // Periodically check for updates every 60 minutes
      setInterval(() => swRegistration.update(), 60 * 60 * 1000);
    }
  },
});

createRoot(document.getElementById('root')).render(<App />);
