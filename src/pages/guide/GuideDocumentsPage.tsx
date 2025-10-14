import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, FileText, Upload, Download, Eye, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface Trip {
  id: string;
  nume: string;
  destinatie: string;
  start_date: string;
  end_date: string;
}

interface Document {
  id: string;
  nume: string;
  descriere?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  trip_id: string;
  document_category: string;
  visibility_type: string;
}

const GuideDocumentsPage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    nume: "",
    descriere: "",
    file: null as File | null,
  });

  useEffect(() => {
    if (user && profile?.role === "guide") {
      fetchAssignedTrips();
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedTripId) {
      fetchDocuments();
    }
  }, [selectedTripId]);

  const fetchAssignedTrips = async () => {
    try {
      const { data: assignments, error: assignmentsError } = await supabase
        .from("guide_assignments")
        .select("trip_id, trips(id, nume, destinatie, start_date, end_date)")
        .eq("guide_user_id", user!.id)
        .eq("is_active", true);

      if (assignmentsError) throw assignmentsError;

      const tripsData = assignments
        ?.map((a: any) => a.trips)
        .filter((t: any) => t !== null) || [];

      setTrips(tripsData);
      if (tripsData.length > 0) {
        setSelectedTripId(tripsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching assigned trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!selectedTripId) return;

    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("trip_id", selectedTripId)
        .order("upload_date", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca documentele",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm({ ...uploadForm, file: e.target.files[0] });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.nume || !selectedTripId) {
      toast({
        title: "Eroare",
        description: "Completează toate câmpurile obligatorii",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = uploadForm.file.name.split(".").pop();
      const fileName = `${Date.now()}_${uploadForm.file.name}`;
      const filePath = `${selectedTripId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, uploadForm.file);

      if (uploadError) throw uploadError;

      const documentData = {
        nume: uploadForm.nume,
        descriere: uploadForm.descriere || null,
        file_url: filePath,
        file_type: fileExt || "",
        file_size: uploadForm.file.size,
        trip_id: selectedTripId,
        uploaded_by_admin_id: user!.id,
        document_category: "custom" as const,
        visibility_type: "group" as const,
      };

      const { error: dbError } = await supabase
        .from("documents")
        .insert([documentData]);

      if (dbError) throw dbError;

      toast({
        title: "Succes",
        description: "Documentul a fost încărcat cu succes",
      });

      setUploadForm({ nume: "", descriere: "", file: null });
      fetchDocuments();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut încărca documentul",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      let filePath = doc.file_url;
      if (filePath.includes('/storage/v1/object/')) {
        const pathParts = filePath.split('/documents/');
        filePath = pathParts[1] || filePath;
      }

      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 60);

      if (error) throw error;

      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = doc.nume;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut descărca documentul",
        variant: "destructive",
      });
    }
  };

  const handleView = async (doc: Document) => {
    try {
      let filePath = doc.file_url;
      if (filePath.includes('/storage/v1/object/')) {
        const pathParts = filePath.split('/documents/');
        filePath = pathParts[1] || filePath;
      }

      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 60);

      if (error) throw error;

      window.open(data.signedUrl, "_blank");
    } catch (error: any) {
      console.error("View error:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut deschide documentul",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm("Sigur vrei să ștergi acest document?")) return;

    try {
      let filePath = doc.file_url;
      if (filePath.includes('/storage/v1/object/')) {
        const pathParts = filePath.split('/documents/');
        filePath = pathParts[1] || filePath;
      }

      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) throw dbError;

      toast({
        title: "Succes",
        description: "Documentul a fost șters",
      });

      fetchDocuments();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge documentul",
        variant: "destructive",
      });
    }
  };

  if (!user || profile?.role !== "guide") {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navigation userRole="guide" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Această pagină este disponibilă doar pentru ghizi autentificați.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navigation userRole="guide" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Se încarcă...</div>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navigation userRole="guide" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nu ai circuite asignate momentan.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="guide" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Documente</h1>
          <p className="text-muted-foreground">
            Gestionează documentele pentru circuiturile tale
          </p>
        </div>

        {trips.length > 1 && (
          <div className="mb-6">
            <Label htmlFor="trip-select">Selectează circuitul:</Label>
            <select
              id="trip-select"
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
            >
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.nume} - {trip.destinatie}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Încarcă Document Nou
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="doc-name">Nume document*</Label>
                <Input
                  id="doc-name"
                  value={uploadForm.nume}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, nume: e.target.value })
                  }
                  placeholder="ex: Program detaliat"
                />
              </div>

              <div>
                <Label htmlFor="doc-desc">Descriere</Label>
                <Textarea
                  id="doc-desc"
                  value={uploadForm.descriere}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, descriere: e.target.value })
                  }
                  placeholder="Descriere opțională"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="doc-file">Fișier*</Label>
                <Input
                  id="doc-file"
                  type="file"
                  onChange={handleFileChange}
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading || !uploadForm.file || !uploadForm.nume}
                className="w-full"
              >
                {uploading ? "Se încarcă..." : "Încarcă Document"}
              </Button>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documente ({documents.length})
            </h2>
            <div className="space-y-4">
              {documents.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Nu există documente pentru acest circuit.
                  </AlertDescription>
                </Alert>
              ) : (
                documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{doc.nume}</span>
                        <Badge variant="secondary">{doc.file_type}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {doc.descriere && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {doc.descriere}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <span>
                          {format(new Date(doc.upload_date), "d MMMM yyyy", {
                            locale: ro,
                          })}
                        </span>
                        <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(doc)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Vezi
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descarcă
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Șterge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideDocumentsPage;
