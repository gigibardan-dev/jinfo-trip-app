import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Database,
  Download,
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CacheStats {
  totalUsers: number;
  totalDocuments: number;
  totalSize: number;
  lastUpdated: string;
}

interface UserCache {
  user_id: string;
  user_name: string;
  user_email: string;
  total_documents: number;
  total_size: number;
  last_cached: string;
}

interface DocumentCache {
  resource_id: string;
  document_name: string;
  user_count: number;
  total_size: number;
  is_expired: boolean;
  expiry_date: string | null;
}

interface TripCache {
  trip_id: string;
  trip_name: string;
  user_count: number;
  document_count: number;
  total_size: number;
}

const OfflineCacheManager = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalUsers: 0,
    totalDocuments: 0,
    totalSize: 0,
    lastUpdated: new Date().toISOString()
  });
  const [userCaches, setUserCaches] = useState<UserCache[]>([]);
  const [documentCaches, setDocumentCaches] = useState<DocumentCache[]>([]);
  const [tripCaches, setTripCaches] = useState<TripCache[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<string>("all");
  const [trips, setTrips] = useState<Array<{ id: string; nume: string }>>([]);

  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchTrips();
      fetchCacheData();
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedTrip) {
      fetchCacheData();
    }
  }, [selectedTrip]);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('id, nume')
        .order('nume');

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const fetchCacheData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverallStats(),
        fetchUserCaches(),
        fetchDocumentCaches(),
        fetchTripCaches()
      ]);
    } catch (error) {
      console.error('Error fetching cache data:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca datele cache.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOverallStats = async () => {
    try {
      let query = supabase
        .from('offline_cache_status')
        .select('user_id, cache_size, cached_at');

      if (selectedTrip !== "all") {
        query = query.eq('trip_id', selectedTrip);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const uniqueUsers = new Set(data.map(item => item.user_id)).size;
        const totalSize = data.reduce((sum, item) => sum + item.cache_size, 0);
        const lastUpdated = data.length > 0 
          ? data.reduce((latest, item) => 
              new Date(item.cached_at) > new Date(latest) ? item.cached_at : latest, 
              data[0].cached_at
            )
          : new Date().toISOString();

        setCacheStats({
          totalUsers: uniqueUsers,
          totalDocuments: data.length,
          totalSize,
          lastUpdated
        });
      }
    } catch (error) {
      console.error('Error fetching overall stats:', error);
    }
  };

  const fetchUserCaches = async () => {
    try {
      let query = supabase
        .from('offline_cache_status')
        .select(`
          user_id,
          cache_size,
          cached_at,
          profiles!inner(nume, prenume, email)
        `);

      if (selectedTrip !== "all") {
        query = query.eq('trip_id', selectedTrip);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const userMap = new Map<string, UserCache>();

        data.forEach((item: any) => {
          const userId = item.user_id;
          if (!userMap.has(userId)) {
            userMap.set(userId, {
              user_id: userId,
              user_name: `${item.profiles.nume} ${item.profiles.prenume}`,
              user_email: item.profiles.email,
              total_documents: 0,
              total_size: 0,
              last_cached: item.cached_at
            });
          }

          const userCache = userMap.get(userId)!;
          userCache.total_documents++;
          userCache.total_size += item.cache_size;
          
          if (new Date(item.cached_at) > new Date(userCache.last_cached)) {
            userCache.last_cached = item.cached_at;
          }
        });

        setUserCaches(Array.from(userMap.values()));
      }
    } catch (error) {
      console.error('Error fetching user caches:', error);
    }
  };

  const fetchDocumentCaches = async () => {
    try {
      let cacheQuery = supabase
        .from('offline_cache_status')
        .select(`
          resource_id,
          user_id,
          cache_size
        `)
        .eq('resource_type', 'documents');

      if (selectedTrip !== "all") {
        cacheQuery = cacheQuery.eq('trip_id', selectedTrip);
      }

      const { data: cacheData, error: cacheError } = await cacheQuery;

      if (cacheError) throw cacheError;

      if (cacheData) {
        const docMap = new Map<string, DocumentCache>();

        cacheData.forEach((item: any) => {
          const docId = item.resource_id;
          if (!docMap.has(docId)) {
            docMap.set(docId, {
              resource_id: docId,
              document_name: 'Loading...',
              user_count: 0,
              total_size: 0,
              is_expired: false,
              expiry_date: null
            });
          }

          const docCache = docMap.get(docId)!;
          docCache.user_count++;
          docCache.total_size += item.cache_size;
        });

        // Fetch document details
        const docIds = Array.from(docMap.keys());
        if (docIds.length > 0) {
          const { data: docsData, error: docsError } = await supabase
            .from('documents')
            .select('id, nume, expiry_date')
            .in('id', docIds);

          if (!docsError && docsData) {
            docsData.forEach(doc => {
              const docCache = docMap.get(doc.id);
              if (docCache) {
                docCache.document_name = doc.nume;
                docCache.expiry_date = doc.expiry_date;
                docCache.is_expired = doc.expiry_date 
                  ? new Date(doc.expiry_date) < new Date()
                  : false;
              }
            });
          }
        }

        setDocumentCaches(Array.from(docMap.values()));
      }
    } catch (error) {
      console.error('Error fetching document caches:', error);
    }
  };

  const fetchTripCaches = async () => {
    try {
      let query = supabase
        .from('offline_cache_status')
        .select(`
          trip_id,
          user_id,
          resource_id,
          cache_size,
          trips!inner(nume)
        `);

      if (selectedTrip !== "all") {
        query = query.eq('trip_id', selectedTrip);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const tripMap = new Map<string, TripCache>();

        data.forEach((item: any) => {
          const tripId = item.trip_id;
          if (!tripMap.has(tripId)) {
            tripMap.set(tripId, {
              trip_id: tripId,
              trip_name: item.trips.nume,
              user_count: 0,
              document_count: 0,
              total_size: 0
            });
          }

          const tripCache = tripMap.get(tripId)!;
          tripCache.document_count++;
          tripCache.total_size += item.cache_size;
        });

        // Count unique users per trip
        const tripUsers = new Map<string, Set<string>>();
        data.forEach((item: any) => {
          if (!tripUsers.has(item.trip_id)) {
            tripUsers.set(item.trip_id, new Set());
          }
          tripUsers.get(item.trip_id)!.add(item.user_id);
        });

        tripUsers.forEach((userSet, tripId) => {
          const tripCache = tripMap.get(tripId);
          if (tripCache) {
            tripCache.user_count = userSet.size;
          }
        });

        setTripCaches(Array.from(tripMap.values()));
      }
    } catch (error) {
      console.error('Error fetching trip caches:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleClearUserCache = async (userId: string) => {
    try {
      let query = supabase
        .from('offline_cache_status')
        .delete()
        .eq('user_id', userId);

      if (selectedTrip !== "all") {
        query = query.eq('trip_id', selectedTrip);
      }

      const { error } = await query;

      if (error) throw error;

      toast({
        title: "✅ Succes",
        description: "Cache-ul utilizatorului a fost șters."
      });

      fetchCacheData();
    } catch (error) {
      console.error('Error clearing user cache:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge cache-ul.",
        variant: "destructive"
      });
    }
  };

  const handleClearExpiredDocuments = async () => {
    try {
      // Get expired documents
      const { data: expiredDocs, error: fetchError } = await supabase
        .from('documents')
        .select('id')
        .not('expiry_date', 'is', null)
        .lt('expiry_date', new Date().toISOString());

      if (fetchError) throw fetchError;

      if (expiredDocs && expiredDocs.length > 0) {
        const expiredIds = expiredDocs.map(doc => doc.id);

        let query = supabase
          .from('offline_cache_status')
          .delete()
          .in('resource_id', expiredIds);

        if (selectedTrip !== "all") {
          query = query.eq('trip_id', selectedTrip);
        }

        const { error: deleteError } = await query;

        if (deleteError) throw deleteError;

        toast({
          title: "✅ Succes",
          description: `${expiredIds.length} documente expirate au fost curățate.`
        });

        fetchCacheData();
      } else {
        toast({
          title: "Info",
          description: "Nu există documente expirate în cache."
        });
      }
    } catch (error) {
      console.error('Error clearing expired documents:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut șterge documentele expirate.",
        variant: "destructive"
      });
    }
  };

  const handleClearDocumentCache = async (documentId: string) => {
    try {
      let query = supabase
        .from('offline_cache_status')
        .delete()
        .eq('resource_id', documentId);

      if (selectedTrip !== "all") {
        query = query.eq('trip_id', selectedTrip);
      }

      const { error } = await query;

      if (error) throw error;

      toast({
        title: "✅ Succes",
        description: "Cache-ul documentului a fost șters pentru toți utilizatorii."
      });

      fetchCacheData();
    } catch (error) {
      console.error('Error clearing document cache:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge cache-ul documentului.",
        variant: "destructive"
      });
    }
  };

  const handleClearTripCache = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from('offline_cache_status')
        .delete()
        .eq('trip_id', tripId);

      if (error) throw error;

      toast({
        title: "✅ Succes",
        description: "Cache-ul călătoriei a fost șters."
      });

      fetchCacheData();
    } catch (error) {
      console.error('Error clearing trip cache:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge cache-ul călătoriei.",
        variant: "destructive"
      });
    }
  };

  const handleClearAllCache = async () => {
    try {
      let query = supabase
        .from('offline_cache_status')
        .delete()
        .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (selectedTrip !== "all") {
        query = query.eq('trip_id', selectedTrip);
      }

      const { error } = await query;

      if (error) throw error;

      toast({
        title: "✅ Succes",
        description: "Tot cache-ul offline a fost șters."
      });

      fetchCacheData();
    } catch (error) {
      console.error('Error clearing all cache:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge cache-ul.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă datele cache...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive className="w-6 h-6" />
            Management Cache Offline
          </h2>
          <p className="text-muted-foreground">
            Monitorizează și gestionează cache-ul offline al utilizatorilor
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedTrip} onValueChange={setSelectedTrip}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrează după călătorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate călătoriile</SelectItem>
              {trips.map(trip => (
                <SelectItem key={trip.id} value={trip.id}>
                  {trip.nume}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchCacheData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reîmprospătează
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Utilizatori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">cu cache activ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-500" />
              Documente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">cached total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-orange-500" />
              Spațiu Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(cacheStats.totalSize)}</div>
            <p className="text-xs text-muted-foreground">utilizat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              Ultima Actualizare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {new Date(cacheStats.lastUpdated).toLocaleDateString('ro-RO')}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(cacheStats.lastUpdated).toLocaleTimeString('ro-RO')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acțiuni Rapide</CardTitle>
          <CardDescription>
            Gestionează cache-ul offline global
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Curăță Documente Expirate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmare Curățare Documente Expirate</AlertDialogTitle>
                <AlertDialogDescription>
                  Această acțiune va șterge din cache toate documentele care au depășit data de expirare. 
                  Utilizatorii vor trebui să le descarce din nou dacă sunt actualizate.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anulează</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearExpiredDocuments}>
                  Curăță Documentele
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Șterge Tot Cache-ul
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmare Ștergere Totală</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedTrip === "all" 
                    ? "Această acțiune va șterge COMPLET tot cache-ul offline pentru TOȚI utilizatorii din TOATE călătoriile. Acțiunea este ireversibilă!"
                    : "Această acțiune va șterge tot cache-ul offline pentru călătoria selectată. Acțiunea este ireversibilă!"
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anulează</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllCache} className="bg-destructive">
                  Confirm Ștergerea
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Utilizatori ({userCaches.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documente ({documentCaches.length})
          </TabsTrigger>
          <TabsTrigger value="trips">
            <Database className="w-4 h-4 mr-2" />
            Călătorii ({tripCaches.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {userCaches.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Niciun utilizator nu are documente cached
              </CardContent>
            </Card>
          ) : (
            userCaches.map(userCache => (
              <Card key={userCache.user_id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{userCache.user_name}</div>
                      <div className="text-sm text-muted-foreground">{userCache.user_email}</div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {userCache.total_documents} documente
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          {formatFileSize(userCache.total_size)}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(userCache.last_cached).toLocaleDateString('ro-RO')}
                        </span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          Șterge Cache
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmare Ștergere Cache Utilizator</AlertDialogTitle>
                          <AlertDialogDescription>
                            Această acțiune va șterge cache-ul offline pentru {userCache.user_name}. 
                            Utilizatorul va trebui să descarce din nou documentele pentru acces offline.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anulează</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleClearUserCache(userCache.user_id)}>
                            Șterge Cache
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {documentCaches.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Niciun document nu este cached
              </CardContent>
            </Card>
          ) : (
            documentCaches.map(docCache => (
              <Card key={docCache.resource_id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{docCache.document_name}</div>
                        {docCache.is_expired && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Expirat
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {docCache.user_count} utilizatori
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          {formatFileSize(docCache.total_size)}
                        </span>
                        {docCache.expiry_date && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            Expiră: {new Date(docCache.expiry_date).toLocaleDateString('ro-RO')}
                          </span>
                        )}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          Șterge Cache
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmare Ștergere Cache Document</AlertDialogTitle>
                          <AlertDialogDescription>
                            Această acțiune va șterge cache-ul pentru "{docCache.document_name}" de la toți utilizatorii ({docCache.user_count}). 
                            Utilizatorii vor trebui să îl descarce din nou pentru acces offline.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anulează</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleClearDocumentCache(docCache.resource_id)}>
                            Șterge Cache
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Trips Tab */}
        <TabsContent value="trips" className="space-y-4">
          {tripCaches.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nicio călătorie nu are cache activ
              </CardContent>
            </Card>
          ) : (
            tripCaches.map(tripCache => (
              <Card key={tripCache.trip_id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{tripCache.trip_name}</div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {tripCache.user_count} utilizatori
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {tripCache.document_count} documente
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          {formatFileSize(tripCache.total_size)}
                        </span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          Șterge Cache
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmare Ștergere Cache Călătorie</AlertDialogTitle>
                          <AlertDialogDescription>
                            Această acțiune va șterge tot cache-ul pentru călătoria "{tripCache.trip_name}" de la toți utilizatorii ({tripCache.user_count}). 
                            Aceasta include {tripCache.document_count} documente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anulează</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleClearTripCache(tripCache.trip_id)}>
                            Șterge Cache
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfflineCacheManager;