import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed recently
    const dismissedAt = localStorage.getItem('kore-install-dismissed');
    if (dismissedAt) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt) < sevenDays) {
        setDismissed(true);
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('kore-install-dismissed', Date.now().toString());
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="bg-kore-brass text-white px-lg py-md-sm flex items-center justify-between gap-md">
      <div className="flex items-center gap-md-sm flex-1 min-w-0">
        <Download size={18} className="shrink-0" />
        <span className="text-small truncate">
          KORE App installieren
        </span>
      </div>
      <div className="flex items-center gap-sm shrink-0">
        <button
          onClick={handleInstall}
          className="text-caption uppercase tracking-widest font-medium bg-white/20 px-md-sm py-xs hover:bg-white/30 transition-colors touch-manipulation"
        >
          Installieren
        </button>
        <button
          onClick={handleDismiss}
          className="w-8 h-8 flex items-center justify-center hover:bg-white/20 transition-colors touch-manipulation"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
