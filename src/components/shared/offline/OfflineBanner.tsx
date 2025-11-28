import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff } from "lucide-react";
import { useNetworkSync } from "@/hooks/useNetworkSync";

export const OfflineBanner = () => {
  const { isOnline } = useNetworkSync();

  if (isOnline) return null;

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-yellow-500/10 border-yellow-500/50">
      <WifiOff className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertDescription className="text-yellow-600 dark:text-yellow-500">
        <strong>Mod Offline:</strong> Funcționalitatea este limitată. 
        Documentele salvate offline sunt disponibile.
      </AlertDescription>
    </Alert>
  );
};
