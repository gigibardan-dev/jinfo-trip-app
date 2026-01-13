import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export const InstallPWAButton = () => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  const onInstallClick = async () => {
    await installApp();
  };

  if (isInstalled) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1 md:gap-2">
        <Check className="w-4 h-4" />
        <span className="hidden sm:inline text-xs md:text-sm">Instalată</span>
      </Button>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onInstallClick}
      className="gap-1 md:gap-2"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline text-xs md:text-sm">Instalează</span>
    </Button>
  );
};