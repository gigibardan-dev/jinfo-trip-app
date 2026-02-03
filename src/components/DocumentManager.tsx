import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileText, Download, Eye, Plus, Edit, Trash2, Calendar, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  nume: string;
  descriere: string;
  file_type: string;
  file_url: string;
  file_size: number;
  upload_date: string;
  expiry_date: string;
  document_category: "custom" | "insurance" | "itinerary" | "identity" | "transport" | "accommodation";
  visibility_type: "group" | "individual";
  is_mandatory: boolean;
  is_offline_priority: boolean;
  trip_id: string;
  uploaded_by_admin_id: string;
  target_user_id: string;
}

interface DocumentFormData {
  nume: string;
  descriere: string;
  document_category: "custom" | "insurance" | "itinerary" | "identity" | "transport" | "accommodation";
  visibility_type: "group" | "individual";
  is_mandatory: boolean;
  is_offline_priority: boolean;
  expiry_date: string;
  trip_id: string;
  target_user_id: string;
}

const DocumentManager = ({ tripId }: { tripId?: string }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [formData, setFormData] = useState<DocumentFormData>({
    nume: "",
    descriere: "",
    document_category: "custom",
    visibility_type: "group",
    is_mandatory: false,
    is_offline_priority: false,
    expiry_date: "",
    trip_id: tripId || "",
    target_user_id: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { user, profile } = useAuth();
  const { toast } = useToast();

  const documentCategories = [
    { value: "insurance", label: "Asigurări" },
    { value: "itinerary", label: "Itinerar" },
    { value: "identity", label: "Identificare" },
    { value: "transport", label: "Transport" },
    { value: "accommodation", label: "Cazare" },
    { value: "custom", label: "Altele" }
  ];

  const visibilityTypes = [
    { value: "group", label: "Grup" },
    { value: "individual", label: "Individual" }
  ];

  useEffect(() => {
    if (user) {
      fetchDocuments();
      if (profile?.role === 'admin') {
        fetchTrips();
        fetchUsers();
      }
    }
  }, [user, tripId]);

  const fetchDocuments = async () => {
    try {
      let query = supabase.from('documents').select('*');
      
      if (tripId) {
        query = query.eq('trip_id', tripId);
      }
      
      query = query.order('upload_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
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

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nume, prenume, email')
        .in('role', ['tourist', 'guide'])
        .order('nume');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.nume) {
        setFormData({ ...formData, nume: file.name.split('.')[0] });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile && !editingDocument) {
      toast({
        title: "Eroare",
        description: "Selectează un fișier pentru încărcare.",
        variant: "destructive",
      });
      return;
    }

    try {
      let fileUrl = editingDocument?.file_url || "";
      let fileSize = editingDocument?.file_size || 0;
      let fileType = editingDocument?.file_type || "";

      if (selectedFile) {
        // Simulare upload - în realitate ai folosi Supabase Storage
        fileUrl = URL.createObjectURL(selectedFile);
        fileSize = selectedFile.size;
        fileType = selectedFile.type;
      }

      const documentData = {
        ...formData,
        file_url: fileUrl,
        file_size: fileSize,
        file_type: fileType,
        uploaded_by_admin_id: user!.id,
        target_user_id: formData.visibility_type === 'individual' ? formData.target_user_id : null
      };

      if (editingDocument) {
        const { error } = await supabase
          .from('documents')
          .update(documentData)
          .eq('id', editingDocument.id);

        if (error) throw error;
        toast({
          title: "Succes",
          description: "Documentul a fost actualizat cu succes.",
        });
      } else {
        const { error } = await supabase
          .from('documents')
          .insert([documentData]);

        if (error) throw error;
        toast({
          title: "Succes",
          description: "Documentul a fost încărcat cu succes.",
        });
      }

      setShowDialog(false);
      setEditingDocument(null);
      setSelectedFile(null);
      resetForm();
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut salva documentul.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setFormData({
      nume: document.nume,
      descriere: document.descriere || "",
      document_category: document.document_category,
      visibility_type: document.visibility_type,
      is_mandatory: document.is_mandatory,
      is_offline_priority: document.is_offline_priority,
      expiry_date: document.expiry_date || "",
      trip_id: document.trip_id,
      target_user_id: document.target_user_id || ""
    });
    setShowDialog(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Ești sigur că vrei să ștergi acest document?")) return;

    try {
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

  const resetForm = () => {
    setFormData({
      nume: "",
      descriere: "",
      document_category: "custom",
      visibility_type: "group",
      is_mandatory: false,
      is_offline_priority: false,
      expiry_date: "",
      trip_id: tripId || "",
      target_user_id: ""
    });
  };

  const getCategoryLabel = (category: string) => {
    return documentCategories.find(c => c.value === category)?.label || category;
  };

  const getVisibilityLabel = (visibility: string) => {
    return visibilityTypes.find(v => v.value === visibility)?.label || visibility;
  };

  const isExpired = (expiryDate: string) => {
    return expiryDate && new Date(expiryDate) < new Date();
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă documentele...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Documente</h2>
        {profile?.role === 'admin' && (
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingDocument(null); setSelectedFile(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                Încarcă Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingDocument ? 'Editează Document' : 'Încarcă Document Nou'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingDocument && (
                  <div className="space-y-2">
                    <Label htmlFor="file">Fișier</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nume">Nume Document</Label>
                    <Input
                      id="nume"
                      value={formData.nume}
                      onChange={(e) => setFormData({ ...formData, nume: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document_category">Categorie</Label>
                    <Select 
                      value={formData.document_category} 
                      onValueChange={(value) => setFormData({ ...formData, document_category: value as any })}
                    >
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descriere">Descriere</Label>
                  <Textarea
                    id="descriere"
                    value={formData.descriere}
                    onChange={(e) => setFormData({ ...formData, descriere: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visibility_type">Vizibilitate</Label>
                    <Select 
                      value={formData.visibility_type} 
                      onValueChange={(value) => setFormData({ ...formData, visibility_type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {visibilityTypes.map((visibility) => (
                          <SelectItem key={visibility.value} value={visibility.value}>
                            {visibility.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.visibility_type === 'individual' && (
                    <div className="space-y-2">
                      <Label htmlFor="target_user_id">Utilizator</Label>
                      <Select 
                        value={formData.target_user_id} 
                        onValueChange={(value) => setFormData({ ...formData, target_user_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează utilizatorul" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.nume} {user.prenume}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {!tripId && (
                    <div className="space-y-2">
                      <Label htmlFor="trip_id">Tură</Label>
                      <Select 
                        value={formData.trip_id} 
                        onValueChange={(value) => setFormData({ ...formData, trip_id: value })}
                      >
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
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Data Expirare</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_mandatory"
                      checked={formData.is_mandatory}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_mandatory: checked })}
                    />
                    <Label htmlFor="is_mandatory">Document obligatoriu</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_offline_priority"
                      checked={formData.is_offline_priority}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_offline_priority: checked })}
                    />
                    <Label htmlFor="is_offline_priority">Prioritate offline</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Anulează
                  </Button>
                  <Button type="submit">
                    {editingDocument ? 'Actualizează' : 'Încarcă'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((document) => (
          <Card key={document.id} className="bg-card/95 backdrop-blur-sm border-border/20">
            <CardHeader>
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
                    {document.is_mandatory && (
                      <Badge variant="destructive">Obligatoriu</Badge>
                    )}
                    {document.is_offline_priority && (
                      <Badge className="bg-orange-500">Prioritate Offline</Badge>
                    )}
                    {isExpired(document.expiry_date) && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Expirat
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {document.descriere && (
                  <p className="text-sm text-muted-foreground">{document.descriere}</p>
                )}
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Mărime: {formatFileSize(document.file_size)}</div>
                  <div>Încărcat: {new Date(document.upload_date).toLocaleDateString('ro-RO')}</div>
                  {document.expiry_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Expiră: {new Date(document.expiry_date).toLocaleDateString('ro-RO')}
                    </div>
                  )}
                  <div>Vizibilitate: {getVisibilityLabel(document.visibility_type)}</div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    Vizualizează
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-1" />
                    Descarcă
                  </Button>
                </div>

                {profile?.role === 'admin' && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(document)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDelete(document.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Niciun document găsit</h3>
          <p className="text-muted-foreground mb-4">
            {profile?.role === 'admin' 
              ? 'Începe prin a încărca primul document.' 
              : 'Nu există documente disponibile momentan.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;