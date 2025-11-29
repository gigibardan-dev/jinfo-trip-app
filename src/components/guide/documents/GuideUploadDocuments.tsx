import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileText, 
  Eye, 
  Download, 
  Trash2,
  AlertTriangle 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface Trip {
  id: string;
  nume: string;
  destinatie: string;
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
}

interface GuideUploadDocumentsProps {
  trips: Trip[];
  selectedTripId: string;
  onTripChange: (tripId: string) => void;
}

const GuideUploadDocuments = ({ trips, selectedTripId, onTripChange }: GuideUploadDocumentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    nume: "",
    descriere: "",
    file: null as File | null,
  });

  useEffect(() => {
    if (selectedTripId) {
      fetchDocuments();
    }
  }, [selectedTripId]);

  const fetchDocuments = async () => {
    if (!selectedTripId) return;

    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("trip_id", selectedTripId)
        .eq("uploaded_by_admin_id", user!.id)
        .order("upload_date", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
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

  return (
    <div className="space-y-6">
      <Alert className="bg-primary/5 border-primary/20">
        <Upload className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong>Secțiunea de Upload pentru Ghizi</strong> - Aici poți încărca documente noi pentru circuiturile tale.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Form */}
        <Card className="border-2 border-primary/20">
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

        {/* Uploaded Documents List */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentele Tale Încărcate ({documents.length})
          </h2>
          <div className="space-y-4">
            {documents.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground text-sm">
                    Nu ai încărcat documente pentru acest circuit.
                  </p>
                </CardContent>
              </Card>
            ) : (
              documents.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="truncate">{doc.nume}</span>
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
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Vezi
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(doc)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Descarcă
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(doc)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
};

export default GuideUploadDocuments;