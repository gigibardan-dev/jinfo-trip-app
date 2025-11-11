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
      <CardContent className="p-2 sm:p-6 pt-0">

        <div className="space-y-3">
          {offlineDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              {/* Titlu - 2 linii max */}
              <div className="flex items-start gap-2 mb-2">
                <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="font-medium text-sm line-clamp-2 flex-1">
                  {doc.fileName}
                </p>
              </div>

              {/* Info pe același rând - Size & Date */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  📦 {formatFileSize(doc.fileSize)}
                </span>
                <span className="flex items-center gap-1">
                  📅 {formatDate(doc.lastUpdated)}
                </span>
              </div>

              {/* Butoane pe un rând separat */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(doc)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  <span className="text-xs">View</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-1" />
                  <span className="text-xs">Save</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id, doc.fileName)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
