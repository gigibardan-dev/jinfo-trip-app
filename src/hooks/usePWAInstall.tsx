import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check dacă e deja instalat
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const installed = isStandalone || isIOSStandalone;
      setIsInstalled(installed);
      console.log('[usePWAInstall] Is installed:', installed);
    };
    checkInstalled();

    // Listener pentru custom event de la setupInstallPrompt
    const handleInstallable = () => {
      const prompt = (window as any).deferredPrompt;
      if (prompt) {
        console.log('[usePWAInstall] Detected window.deferredPrompt from setupInstallPrompt');
        setDeferredPrompt(prompt);
        setIsInstallable(true);
      }
    };
    
    window.addEventListener('pwa-installable', handleInstallable);
    
    // Check dacă deja există (pentru cazul când hook-ul se montează după event)
    if ((window as any).deferredPrompt) {
      console.log('[usePWAInstall] Found existing window.deferredPrompt on mount');
      handleInstallable();
    }

    // Cleanup
    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      console.log('[usePWAInstall] No deferred prompt available');
      return;
    }

    try {
      console.log('[usePWAInstall] Showing install prompt');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('[usePWAInstall] User choice:', outcome);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      
      // Clear window reference
      (window as any).deferredPrompt = null;
    } catch (error) {
      console.error('[usePWAInstall] Install failed:', error);
    }
  };

  return {
    isInstallable,
    isInstalled,
    deferredPrompt,
    installApp
  };
};