import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wifi, 
  WifiOff, 
  Download, 
  HardDrive, 
  MapPin, 
  FileText, 
  Image, 
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface CacheItem {
  id: string;
  type: "map" | "document" | "image" | "itinerary";
  name: string;
  size: number; // in bytes
  cachedAt: string;
  status: "cached" | "pending" | "error" | "expired";
  priority: "high" | "medium" | "low";
  tripId?: string;
  tripName?: string;
}

export const OfflineManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheItems, setCacheItems] = useState<CacheItem[]>([]);
  const [totalCacheSize, setTotalCacheSize] = useState(0);
  const [availableSpace, setAvailableSpace] = useState(1000000000); // 1GB mock
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Mock data
  const mockCacheItems: CacheItem[] = [
    {
      id: "1",
      type: "map",
      name: "Harta Paris - Centru",
      size: 15000000, // 15MB
      cachedAt: "2024-03-15 10:30",
      status: "cached",
      priority: "high",
      tripId: "trip1",
      tripName: "Paris - City of Light"
    },
    {
      id: "2",
      type: "itinerary",
      name: "Itinerariu Ziua 3",
      size: 2500000, // 2.5MB
      cachedAt: "2024-03-15 08:15",
      status: "cached",
      priority: "high",
      tripId: "trip1",
      tripName: "Paris - City of Light"
    },
    {
      id: "3",
      type: "document",
      name: "Bilete Luvru",
      size: 500000, // 500KB
      cachedAt: "2024-03-14 16:20",
      status: "expired",
      priority: "medium",
      tripId: "trip1",
      tripName: "Paris - City of Light"
    },
    {
      id: "4",
      type: "image",
      name: "Fotografii locații",
      size: 25000000, // 25MB
      cachedAt: "2024-03-14 12:00",
      status: "pending",
      priority: "low",
      tripId: "trip1",
      tripName: "Paris - City of Light"
    }
  ];

  useEffect(() => {
    setCacheItems(mockCacheItems);
    const total = mockCacheItems.reduce((sum, item) => sum + item.size, 0);
    setTotalCacheSize(total);

    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "map": return MapPin;
      case "document": return FileText;
      case "image": return Image;
      case "itinerary": return MapPin;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cached": return "bg-success text-success-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      case "error": return "bg-destructive text-destructive-foreground";
      case "expired": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "cached": return "Sincronizat";
      case "pending": return "În așteptare";
      case "error": return "Eroare";
      case "expired": return "Expirat";
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive";
      case "medium": return "text-warning";
      case "low": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    
    // Simulate sync process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setSyncProgress(i);
    }
    
    setIsSyncing(false);
    // Update cache items status
    setCacheItems(items => items.map(item => ({ ...item, status: "cached" as const })));
  };

  const handleDeleteItem = (id: string) => {
    setCacheItems(items => items.filter(item => item.id !== id));
    const deletedItem = cacheItems.find(item => item.id === id);
    if (deletedItem) {
      setTotalCacheSize(prev => prev - deletedItem.size);
    }
  };

  const cacheUsagePercentage = (totalCacheSize / availableSpace) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manager Offline</h1>
        <div className="flex items-center gap-3">
          <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? "Online" : "Offline"}
          </Badge>
          <Button 
            onClick={handleSyncAll} 
            disabled={!isOnline || isSyncing}
            className="bg-primary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? "Sincronizează..." : "Sincronizează Tot"}
          </Button>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Spațiu Utilizat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalCacheSize)}</div>
            <div className="mt-2">
              <Progress value={cacheUsagePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {cacheUsagePercentage.toFixed(1)}% din {formatFileSize(availableSpace)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Elemente Cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {cacheItems.filter(item => item.status === "cached").length} sincronizate
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Download className="w-4 h-4" />
              Status Sincronizare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isSyncing ? `${syncProgress}%` : "Gata"}
            </div>
            {isSyncing && (
              <Progress value={syncProgress} className="h-2 mt-2" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cache Items List */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            Elemente Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cacheItems.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <div key={item.id} className="border rounded-lg p-4 hover:shadow-soft transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TypeIcon className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{formatFileSize(item.size)}</span>
                          <span>•</span>
                          <span>{item.tripName}</span>
                          <span>•</span>
                          <span>Cache: {item.cachedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Badge>
                        <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority === "high" ? "Prioritate Mare" : 
                           item.priority === "medium" ? "Prioritate Medie" : "Prioritate Mică"}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {item.status === "pending" && (
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        )}
                        {item.status === "expired" && (
                          <Button size="sm" variant="outline">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Reîmprospătează
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {item.status === "error" && (
                    <div className="mt-3 flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Eroare la sincronizare. Încercați din nou.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};