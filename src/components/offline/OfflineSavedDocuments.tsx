import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Trash2, Download } from "lucide-react";
import { useOfflineDocuments } from "@/hooks/useOfflineDocuments";
import { deleteOfflineDocument, createOfflineDocumentURL, revokeOfflineDocumentURL } from "@/lib/offlineStorage";
import { toast } from "sonner";

export const OfflineSavedDocuments = () => {
  const { offlineDocuments, loading, refreshOfflineDocuments } = useOfflineDocuments();

  const handleView = async (doc: any) => {
    try {
      const url = createOfflineDocumentURL(doc.blobData);
      window.open(url, '_blank');
      
      // Cleanup after some time
      setTimeout(() => revokeOfflineDocumentURL(url), 60000);
      
      toast.success(`📄 ${doc.fileName} deschis`);
    } catch (error) {
      console.error('Failed to view offline document:', error);
      toast.error('Eroare la deschiderea documentului');
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      const url = createOfflineDocumentURL(doc.blobData);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => revokeOfflineDocumentURL(url), 5000);
      
      toast.success(`⬇️ ${doc.fileName} descărcat`);
    } catch (error) {
      console.error('Failed to download offline document:', error);
      toast.error('Eroare la descărcarea documentului');
    }
  };

  const handleDelete = async (docId: string, fileName: string) => {
    try {
      await deleteOfflineDocument(docId);
      toast.success(`🗑️ ${fileName} șters din stocarea offline`);
      refreshOfflineDocuments();
    } catch (error) {
      console.error('Failed to delete offline document:', error);
      toast.error('Eroare la ștergerea documentului');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Se încarcă documentele salvate...</p>
        </CardContent>
      </Card>
    );
  }

  if (offlineDocuments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documente Salvate Offline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Niciun document salvat offline</h3>
            <p className="text-muted-foreground text-sm">
              Documentele salvate pentru acces offline vor apărea aici.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Documente Salvate Offline ({offlineDocuments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {offlineDocuments.map((doc) => (
            <div 
              key={doc.id} 
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.fileName}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(doc.fileSize)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {formatDate(doc.lastUpdated)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(doc)}
                  title="Vizualizează"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  title="Descarcă"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id, doc.fileName)}
                  title="Șterge"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
