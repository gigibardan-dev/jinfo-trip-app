import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  Calendar, 
  AlertTriangle, 
  Clock,
  Users,
  User,
  Search,
  Filter,
  Eye,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOfflineDocument } from "@/hooks/useOfflineDocument";

interface TouristDocument {
  id: string;
  nume: string;
  descriere?: string;
  file_type: string;
  file_url: string;
  file_size: number;
  document_category: 'itinerary' | 'accommodation' | 'insurance' | 'identity' | 'transport' | 'custom';
  visibility_type: 'group' | 'individual';
  is_mandatory: boolean;
  is_offline_priority: boolean;
  expiry_date?: string;
  upload_date: string;
  target_user_id?: string;
  trip_id: string;
  trips?: {
    nume: string;
    destinatie: string;
  };
}

interface TripInfo {
  id: string;
  nume: string;
  destinatie: string;
}

interface TouristDocumentsProps {
  onOfflineSaved?: () => void;
}

const TouristDocuments = ({ onOfflineSaved }: TouristDocumentsProps) => {
  const [documents, setDocuments] = useState<TouristDocument[]>([]);
  const [trips, setTrips] = useState<TripInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTrip, setFilterTrip] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all'); // group, individual, all

  const { user, profile } = useAuth();
  const { toast } = useToast();

  const documentCategories = [
    { value: 'identity', label: 'Documente Identitate' },
    { value: 'itinerary', label: 'Itinerariu' },
    { value: 'accommodation', label: 'Cazare' },
    { value: 'transport', label: 'Transport' },
    { value: 'insurance', label: 'Asigurări' },
    { value: 'custom', label: 'Altele' }
  ] as const;

  useEffect(() => {
    if (user && profile?.role === 'tourist') {
      fetchUserDocuments();
      fetchUserTrips();
    }
  }, [user, profile]);

  const fetchUserDocuments = async () => {
    try {
      // Găsește grupurile utilizatorului
      const { data: memberGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id);

      if (groupsError) throw groupsError;

      if (!memberGroups || memberGroups.length === 0) {
        setLoading(false);
        return;
      }

      const groupIds = memberGroups.map(g => g.group_id);

      // Găsește circuitele pentru aceste grupuri
      const { data: userTrips, error: tripsError } = await supabase
        .from('trips')
        .select('id')
        .in('group_id', groupIds);

      if (tripsError) throw tripsError;

      if (!userTrips || userTrips.length === 0) {
        setLoading(false);
        return;
      }

      const tripIds = userTrips.map(t => t.id);

      // Găsește documentele pentru aceste circuite
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          trips(nume, destinatie)
        `)
        .in('trip_id', tripIds)
        .or(`visibility_type.eq.group,and(visibility_type.eq.individual,target_user_id.eq.${user!.id})`)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments((data as any) || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca documentele.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTrips = async () => {
    try {
      const { data: memberGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id);

      if (groupsError) throw groupsError;

      if (!memberGroups || memberGroups.length === 0) return;

      const groupIds = memberGroups.map(g => g.group_id);

      const { data, error } = await supabase
        .from('trips')
        .select('id, nume, destinatie')
        .in('group_id', groupIds)
        .order('nume');

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  // Functions removed - using hook functions directly in DocumentCard

  const getCategoryLabel = (category: string) => {
    const cat = documentCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const formatFileSizeLocal = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.descriere && doc.descriere.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || doc.document_category === filterCategory;
    const matchesTrip = filterTrip === 'all' || doc.trip_id === filterTrip;
    const matchesType = filterType === 'all' || doc.visibility_type === filterType;
    return matchesSearch && matchesCategory && matchesTrip && matchesType;
  });

  const groupedDocuments = {
    mandatory: filteredDocuments.filter(doc => doc.is_mandatory),
    expiring: filteredDocuments.filter(doc => doc.expiry_date && isExpiringSoon(doc.expiry_date)),
    expired: filteredDocuments.filter(doc => doc.expiry_date && isExpired(doc.expiry_date)),
    regular: filteredDocuments.filter(doc => 
      !doc.is_mandatory && 
      (!doc.expiry_date || (!isExpiringSoon(doc.expiry_date) && !isExpired(doc.expiry_date)))
    )
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă documentele...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Documentele Mele</h2>
        <p className="text-muted-foreground">
          Documentele încărcate pentru călătoriile tale ({documents.length} documente)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Caută în documente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toate categoriile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate categoriile</SelectItem>
              {documentCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate tipurile</SelectItem>
              <SelectItem value="group">Grup</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
            </SelectContent>
          </Select>

          {trips.length > 1 && (
            <Select value={filterTrip} onValueChange={setFilterTrip}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Toate circuitele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate circuitele</SelectItem>
                {trips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.nume}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {documents.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent className="pt-6">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Niciun document disponibil</h3>
            <p className="text-muted-foreground">
              Administratorul nu a încărcat încă documente pentru călătoriile tale.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Documente Obligatorii */}
          {groupedDocuments.mandatory.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Documente Obligatorii ({groupedDocuments.mandatory.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedDocuments.mandatory.map((document) => (
                  <DocumentCard key={document.id} document={document} onOfflineSaved={onOfflineSaved} />
                ))}
              </div>
            </div>
          )}

          {/* Documente care Expiră */}
          {groupedDocuments.expiring.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                Documentele Expiră Curând ({groupedDocuments.expiring.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedDocuments.expiring.map((document) => (
                  <DocumentCard key={document.id} document={document} onOfflineSaved={onOfflineSaved} />
                ))}
              </div>
            </div>
          )}

          {/* Documente Expirate */}
          {groupedDocuments.expired.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Documente Expirate ({groupedDocuments.expired.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedDocuments.expired.map((document) => (
                  <DocumentCard key={document.id} document={document} onOfflineSaved={onOfflineSaved} />
                ))}
              </div>
            </div>
          )}

          {/* Documente Normale */}
          {groupedDocuments.regular.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Alte Documente ({groupedDocuments.regular.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedDocuments.regular.map((document) => (
                  <DocumentCard key={document.id} document={document} onOfflineSaved={onOfflineSaved} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DocumentCard = ({ 
  document, 
  onOfflineSaved
}: { 
  document: TouristDocument; 
  onOfflineSaved?: () => void;
}) => {


  const {
    isOffline,
    isDownloading,
    downloadOffline,
    removeOffline,
    viewDocument,
    downloadDocument,
  } = useOfflineDocument(
    document.id,
    document.nume,
    document.file_type,
    document.file_size,
    document.file_url,
    document.upload_date,
    document.trip_id 
  );
  
  const handleDownloadOffline = async () => {
    const success = await downloadOffline();
    if (success && onOfflineSaved) {
      onOfflineSaved();
    }
  };

  const formatFileSizeCard = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isExpiring = document.expiry_date && isExpiringSoon(document.expiry_date);
  const isExpiredDoc = document.expiry_date && isExpired(document.expiry_date);

  return (
    <Card className={`shadow-soft border-0 hover:shadow-medium transition-all ${
      document.is_mandatory ? 'border-l-4 border-l-destructive' : 
      isExpiredDoc ? 'border-l-4 border-l-destructive bg-destructive/5' :
      isExpiring ? 'border-l-4 border-l-warning bg-warning/5' : ''
    }`}>
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {document.nume}
            </CardTitle>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="secondary">
                {getCategoryLabel(document.document_category)}
              </Badge>
              
              {document.visibility_type === 'individual' ? (
                <Badge variant="outline" className="text-xs">
                  <User className="w-3 h-3 mr-1" />
                  Personal
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  Grup
                </Badge>
              )}

              {document.is_mandatory && (
                <Badge variant="destructive" className="text-xs">
                  Obligatoriu
                </Badge>
              )}

              {document.is_offline_priority && (
                <Badge variant="default" className="text-xs">
                  Prioritate Offline
                </Badge>
              )}

              {isOffline && (
                <Badge variant="default" className="text-xs bg-success/20 text-success border-success/30">
                  ✅ Disponibil Offline
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-3 sm:px-6">

        {document.descriere && (
          <p className="text-sm text-muted-foreground">{document.descriere}</p>
        )}

        <div className="space-y-2 text-xs text-muted-foreground">
          {document.trips && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {document.trips.nume} - {document.trips.destinatie}
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Mărime: {formatFileSizeCard(document.file_size)}</span>
            <span>Încărcat: {new Date(document.upload_date).toLocaleDateString('ro-RO')}</span>
          </div>

          {document.expiry_date && (
            <div className={`flex items-center gap-1 ${
              isExpiredDoc ? 'text-destructive font-medium' :
              isExpiring ? 'text-warning font-medium' : ''
            }`}>
              <Clock className="w-3 h-3" />
              Expiră: {new Date(document.expiry_date).toLocaleDateString('ro-RO')}
              {isExpiredDoc && ' (EXPIRAT)'}
              {isExpiring && ' (Expiră curând)'}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {/* Vizualizare Online/Offline */}
          {isOffline ? (
            <Button 
              size="sm" 
              variant="default"
              onClick={viewDocument}
              className="w-full bg-success hover:bg-success/90"
            >
              <Eye className="w-3 h-3 mr-1" />
              Vizualizează Offline
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={viewDocument}
              className="w-full"
            >
              <Eye className="w-3 h-3 mr-1" />
              Vizualizează Online
            </Button>
          )}

          {/* Descarcă */}
          <Button 
            size="sm" 
            variant="outline"
            onClick={downloadDocument}
            className="w-full"
          >
            <Download className="w-3 h-3 mr-1" />
            Descarcă
          </Button>

          {/* Offline Controls */}
          {!isOffline ? (
            <Button 
              size="sm" 
              variant="secondary"
              onClick={handleDownloadOffline}
              disabled={isDownloading}
              className="w-full"
            >
              {isDownloading ? (
                <>Se salvează...</>
              ) : (
                <>
                  <Download className="w-3 h-3 mr-1" />
                  Salvează Offline
                </>
              )}
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={removeOffline}
              className="w-full text-muted-foreground hover:text-destructive"
            >
              Șterge din Offline
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions
const getCategoryLabel = (category: string) => {
  const categories = [
    { value: 'identity', label: 'Documente Identitate' },
    { value: 'itinerary', label: 'Itinerariu' },
    { value: 'accommodation', label: 'Cazare' },
    { value: 'transport', label: 'Transport' },
    { value: 'insurance', label: 'Asigurări' },
    { value: 'custom', label: 'Altele' }
  ];
  const cat = categories.find(c => c.value === category);
  return cat ? cat.label : category;
};

const isExpiringSoon = (expiryDate: string) => {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays > 0;
};

const isExpired = (expiryDate: string) => {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const today = new Date();
  return expiry < today;
};

export default TouristDocuments;