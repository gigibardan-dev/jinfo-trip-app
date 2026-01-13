import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";

export const InstallPWAButton = () => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall(); // ✅ installApp nu handleInstallClick

  const onInstallClick = async () => {
    await installApp(); // ✅ Folosește installApp
    // Toast-ul e deja în hook, nu mai trebuie aici
  };

  if (isInstalled) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Check className="w-4 h-4" />
        Aplicație Instalată
      </Button>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <Button 
      variant="default" 
      size="sm" 
      onClick={onInstallClick}
      className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
    >
      <Download className="w-4 h-4" />
      Instalează Aplicația
    </Button>
  );
};