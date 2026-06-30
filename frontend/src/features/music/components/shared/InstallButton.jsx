// InstallButton.jsx — Shows a styled "Install App" button when the PWA can be installed
import { Download } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt.js';

export default function InstallButton({ className = '' }) {
  const { canInstall, promptInstall } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <button
      onClick={promptInstall}
      className={`install-pwa-btn ${className}`.trim()}
      title="Install RJ Music as an app"
      aria-label="Install App"
    >
      <Download size={14} />
      <span>Install App</span>
    </button>
  );
}
