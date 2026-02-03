import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Eye,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Document {
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
  profiles?: {
    nume: string;
    prenume: string;
  } | null;
}

interface Trip {
  id: string;
  nume: string;
  destinatie: string;
}

interface Tourist {
  id: string;
  nume: string;
  prenume: string;
  email: string;
}

interface DocumentFormData {
  nume: string;
  descriere: string;
  document_category: 'itinerary' | 'accommodation' | 'insurance' | 'identity' | 'transport' | 'custom';
  visibility_type: 'group' | 'individual';
  is_mandatory: boolean;
  is_offline_priority: boolean;
  expiry_date: string;
  target_user_id: string;
  trip_id: string;
  file: File | null;
}

const DocumentUploader = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTrip, setFilterTrip] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<DocumentFormData>({
    nume: "",
    descriere: "",
    document_category: "identity",
    visibility_type: "group",
    is_mandatory: false,
    is_offline_priority: false,
    expiry_date: "",
    target_user_id: "",
    trip_id: "",
    file: null
  });

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

  const visibilityTypes = [
    { value: 'group', label: 'Grup' },
    { value: 'individual', label: 'Individual' }
  ] as const;

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchDocuments();
      fetchTrips();
      fetchTourists();
    }
  }, [user, profile]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          trips(nume, destinatie),
          profiles!documents_target_user_id_fkey(nume, prenume)
        `)
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

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('id, nume, destinatie')
        .order('nume');

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const fetchTourists = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nume, prenume, email')
        .in('role', ['tourist', 'guide'])
        .eq('is_active', true)
        .order('nume');

      if (error) throw error;
      setTourists(data || []);
    } catch (error) {
      console.error('Error fetching tourists:', error);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      toast({
        title: "Eroare",
        description: "Te rog selectează un fișier.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique file name
      const fileName = `${Date.now()}_${formData.file.name}`;
      const filePath = `${formData.trip_id}/${fileName}`;
      
      // Update progress to show upload starting
      setUploadProgress(20);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, formData.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      
      setUploadProgress(60);

      // Store only the file path (not public URL since bucket is private)
      setUploadProgress(80);
      
      const documentData = {
        nume: formData.nume,
        descriere: formData.descriere,
        file_type: formData.file.type,
        file_url: filePath, // Store just the path
        file_size: formData.file.size,
        document_category: formData.document_category,
        visibility_type: formData.visibility_type,
        is_mandatory: formData.is_mandatory,
        is_offline_priority: formData.is_offline_priority,
        expiry_date: formData.expiry_date || null,
        target_user_id: formData.visibility_type === 'individual' ? formData.target_user_id : null,
        trip_id: formData.trip_id,
        uploaded_by_admin_id: user!.id
      };

      const { error } = await supabase
        .from('documents')
        .insert([documentData]);

      if (error) throw error;

      setUploadProgress(100);

      toast({
        title: "Succes",
        description: "Documentul a fost uploadat cu succes.",
      });

      setShowDialog(false);
      resetForm();
      fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut uploada documentul.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (documentId: string, fileUrl: string) => {
    if (!confirm("Ești sigur că vrei să ștergi acest document?")) return;

    try {
      // Extract path from URL if it's a full URL (old format)
      let filePath = fileUrl;
      if (filePath.includes('supabase.co/storage')) {
        const urlParts = filePath.split('/storage/v1/object/public/documents/');
        if (urlParts.length > 1) {
          filePath = decodeURIComponent(urlParts[1]);
        }
      }
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) {
        console.warn('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Documentul a fost șters cu succes.",
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge documentul.",
        variant: "destructive",
      });
    }
  };

  const handleView = async (doc: Document) => {
    try {
      const fileType = doc.file_type.toLowerCase();
      
      // Extract path from URL if it's a full URL (old format)
      let filePath = doc.file_url;
      if (filePath.includes('supabase.co/storage')) {
        const urlParts = filePath.split('/storage/v1/object/public/documents/');
        if (urlParts.length > 1) {
          filePath = decodeURIComponent(urlParts[1]);
        }
      }
      
      // Get signed URL for secure viewing
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 300); // 5 minutes for viewing

      if (error) throw error;
      
      const viewUrl = data.signedUrl;
      
      if (fileType.includes('image') || fileType.includes('pdf')) {
        window.open(viewUrl, '_blank');
      } else {
        // For office documents, download them
        handleDownload(doc);
        return;
      }
      
      toast({
        title: "Document deschis",
        description: `Se vizualizează ${doc.nume}`,
      });
    } catch (error) {
      console.error('View error:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut deschide documentul.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      // Extract path from URL if it's a full URL (old format)
      let filePath = doc.file_url;
      if (filePath.includes('supabase.co/storage')) {
        const urlParts = filePath.split('/storage/v1/object/public/documents/');
        if (urlParts.length > 1) {
          filePath = decodeURIComponent(urlParts[1]);
        }
      }
      
      // Get signed URL for secure download
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60); // 60 seconds expiry

      if (error) throw error;

      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = doc.nume;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Descărcare inițiată",
        description: `Se descarcă ${doc.nume}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      // Fallback to direct URL
      const link = document.createElement('a');
      link.href = doc.file_url;
      link.download = doc.nume;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Descărcare inițiată",
        description: `Se descarcă ${doc.nume}`,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nume: "",
      descriere: "",
    document_category: "identity",
    visibility_type: "group",
      is_mandatory: false,
      is_offline_priority: false,
      expiry_date: "",
      target_user_id: "",
      trip_id: "",
      file: null
    });
  };

  const getCategoryLabel = (category: string) => {
    const cat = documentCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getVisibilityLabel = (visibility: string) => {
    const vis = visibilityTypes.find(v => v.value === visibility);
    return vis ? vis.label : visibility;
  };

  const formatFileSize = (bytes: number) => {
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
    const matchesSearch = (doc.nume || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.descriere && doc.descriere.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || doc.document_category === filterCategory;
    const matchesTrip = filterTrip === 'all' || doc.trip_id === filterTrip;
    return matchesSearch && matchesCategory && matchesTrip;
  });

  if (loading) {
    return <div className="text-center py-8">Se încarcă documentele...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Upload & Gestionare Documente</h2>
          <p className="text-muted-foreground">Încarcă și organizează documentele pentru călătorii</p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-gradient-hero">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Document Nou</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Informații de Bază</TabsTrigger>
                  <TabsTrigger value="settings">Setări</TabsTrigger>
                  <TabsTrigger value="upload">Fișier</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nume">Nume Document *</Label>
                    <Input
                      id="nume"
                      value={formData.nume}
                      onChange={(e) => setFormData({ ...formData, nume: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descriere">Descriere</Label>
                    <Textarea
                      id="descriere"
                      value={formData.descriere}
                      onChange={(e) => setFormData({ ...formData, descriere: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="document_category">Categorie *</Label>
                      <Select value={formData.document_category} onValueChange={(value) => setFormData({ ...formData, document_category: value as any })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {documentCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trip_id">Tură *</Label>
                      <Select value={formData.trip_id} onValueChange={(value) => setFormData({ ...formData, trip_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează tura" />
                        </SelectTrigger>
                        <SelectContent>
                          {trips.map((trip) => (
                            <SelectItem key={trip.id} value={trip.id}>
                              {trip.nume} - {trip.destinatie}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="visibility_type">Vizibilitate</Label>
                    <Select value={formData.visibility_type} onValueChange={(value) => setFormData({ ...formData, visibility_type: value as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {visibilityTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.visibility_type === 'individual' && (
                    <div className="space-y-2">
                      <Label htmlFor="target_user_id">Utilizator Țintă</Label>
                      <Select value={formData.target_user_id} onValueChange={(value) => setFormData({ ...formData, target_user_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează utilizatorul" />
                        </SelectTrigger>
                        <SelectContent>
                          {tourists.map((tourist) => (
                            <SelectItem key={tourist.id} value={tourist.id}>
                              {tourist.nume} {tourist.prenume} ({tourist.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Data Expirării</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_mandatory">Document Obligatoriu</Label>
                      <Switch
                        id="is_mandatory"
                        checked={formData.is_mandatory}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_mandatory: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_offline_priority">Prioritate Offline</Label>
                      <Switch
                        id="is_offline_priority"
                        checked={formData.is_offline_priority}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_offline_priority: checked })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Selectează Fișierul *</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                      required
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formate acceptate: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, GIF
                    </p>
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Upload în progres...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Anulează
                </Button>
                <Button type="submit" disabled={uploading} className="bg-gradient-hero">
                  {uploading ? 'Se uploadează...' : 'Upload Document'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Caută documente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categorie" />
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

          <Select value={filterTrip} onValueChange={setFilterTrip}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tură" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate turele</SelectItem>
              {trips.map((trip) => (
                <SelectItem key={trip.id} value={trip.id}>
                  {trip.nume}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((document) => (
          <Card key={document.id} className="hover:shadow-soft transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{document.nume}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {document.trips?.nume} - {document.trips?.destinatie}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {document.is_mandatory && (
                    <Badge variant="destructive" className="text-xs">
                      Obligatoriu
                    </Badge>
                  )}
                  {document.is_offline_priority && (
                    <Badge variant="secondary" className="text-xs">
                      Offline
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Categorie:</span>
                  <Badge variant="outline">{getCategoryLabel(document.document_category)}</Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Vizibilitate:</span>
                  <span>{getVisibilityLabel(document.visibility_type)}</span>
                </div>

                {document.target_user_id && document.profiles && (
                  <div className="flex items-center text-sm">
                    <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                    {document.profiles.nume} {document.profiles.prenume}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Mărime: {formatFileSize(document.file_size)}
                </div>

                {document.expiry_date && (
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Expiră: {new Date(document.expiry_date).toLocaleDateString('ro-RO')}</span>
                    {isExpired(document.expiry_date) && (
                      <AlertTriangle className="w-4 h-4 ml-1 text-destructive" />
                    )}
                    {isExpiringSoon(document.expiry_date) && !isExpired(document.expiry_date) && (
                      <Clock className="w-4 h-4 ml-1 text-warning" />
                    )}
                  </div>
                )}

                {document.descriere && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {document.descriere}
                  </p>
                )}

                <div className="text-xs text-muted-foreground">
                  Uploadat: {new Date(document.upload_date).toLocaleDateString('ro-RO')}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleView(document)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Vizualizează
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDownload(document)}
                    title="Descarcă document"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDelete(document.id, document.file_url)}
                    className="text-destructive hover:text-destructive"
                    title="Șterge document"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Niciun document găsit</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterCategory !== 'all' || filterTrip !== 'all'
              ? 'Încearcă să modifici filtrele de căutare.'
              : 'Începe prin a uploada primul document.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;