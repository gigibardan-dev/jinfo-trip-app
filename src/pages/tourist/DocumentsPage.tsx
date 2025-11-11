import Navigation from "@/components/Navigation";
import TouristDocuments from "@/components/TouristDocuments";
import { useNetworkSync } from "@/hooks/useNetworkSync";
import { useOfflineDocuments } from "@/hooks/useOfflineDocuments";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi } from "lucide-react";
import { OfflineSavedDocuments } from "@/components/offline/OfflineSavedDocuments";

const DocumentsPage = () => {
  const { isOnline, isSyncing } = useNetworkSync();
  const { refreshOfflineDocuments } = useOfflineDocuments();

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="tourist" />
      <div className="pt-14 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-4 flex justify-end">
            {!isOnline ? (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                <WifiOff className="w-3 h-3 mr-1" />
                Mod Offline
              </Badge>
            ) : isSyncing ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <Wifi className="w-3 h-3 mr-1 animate-pulse" />
                Sincronizare...
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </Badge>
            )}
          </div>

          <div className="mb-6">
            <OfflineSavedDocuments />
          </div>

          <TouristDocuments onOfflineSaved={refreshOfflineDocuments} />
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
