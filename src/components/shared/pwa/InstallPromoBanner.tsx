import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export const InstallPromoBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  useEffect(() => {
    // Nu arăta dacă e deja instalat sau nu e installable
    if (isInstalled || !isInstallable) return;

    // Verifică dacă user-ul a închis banner-ul înainte
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) return;

    // Arată după 10 secunde
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled]);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  const handleInstall = async () => {
    await installApp();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="bg-gradient-to-r from-primary to-accent p-3 md:p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between gap-2 md:gap-3">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <span className="text-xl md:text-2xl flex-shrink-0">💡</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-semibold text-white truncate">
                Instalează pentru offline!
              </p>
              <p className="text-[10px] md:text-xs text-white/80 truncate">
                Acces rapid și funcționalitate completă fără internet
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleInstall}
              className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
            >
              <Download className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Instalează</span>
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 h-8 md:h-9 w-8 md:w-9 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};