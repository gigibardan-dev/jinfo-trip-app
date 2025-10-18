import { useState, useEffect, useCallback } from 'react';
import {
  isDocumentOffline,
  saveDocumentOffline,
  getOfflineDocument,
  deleteOfflineDocument,
  createOfflineDocumentURL,
  revokeOfflineDocumentURL,
} from '@/lib/offlineStorage';
import { toast } from 'sonner';

export function useOfflineDocument(
  documentId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  fileUrl: string,
  lastUpdated: string
) {
  const [isOffline, setIsOffline] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if document is available offline
  const checkOfflineStatus = useCallback(async () => {
    setIsChecking(true);
    const offline = await isDocumentOffline(documentId);
    setIsOffline(offline);
    setIsChecking(false);
  }, [documentId]);

  useEffect(() => {
    checkOfflineStatus();
  }, [checkOfflineStatus]);

  // Download document for offline access
  const downloadOffline = async () => {
    setIsDownloading(true);
    try {
      await saveDocumentOffline(
        documentId,
        fileName,
        fileType,
        fileSize,
        fileUrl,
        lastUpdated
      );
      setIsOffline(true);
      toast.success('✅ Document disponibil offline');
    } catch (error) {
      console.error('Failed to download offline:', error);
      toast.error('❌ Eroare la descărcarea offline');
    } finally {
      setIsDownloading(false);
    }
  };

  // Remove document from offline storage
  const removeOffline = async () => {
    try {
      await deleteOfflineDocument(documentId);
      setIsOffline(false);
      toast.success('Document șters din stocarea offline');
    } catch (error) {
      console.error('Failed to remove offline:', error);
      toast.error('Eroare la ștergerea documentului offline');
    }
  };

  // Get offline document URL
  const getOfflineURL = async (): Promise<string | null> => {
    try {
      const doc = await getOfflineDocument(documentId);
      if (!doc) return null;
      return createOfflineDocumentURL(doc.blobData);
    } catch (error) {
      console.error('Failed to get offline URL:', error);
      return null;
    }
  };

  // View document (online or offline)
  const viewDocument = async () => {
    try {
      // Check if we're offline
      if (!navigator.onLine) {
        const doc = await getOfflineDocument(documentId);
        if (!doc) {
          toast.error('Document indisponibil offline');
          return;
        }

        // Create a blob URL and download directly instead of opening in new tab
        const blob = doc.blobData;
        const url = createOfflineDocumentURL(blob);
        
        // Create an invisible anchor and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Cleanup
        setTimeout(() => revokeOfflineDocumentURL(url), 1000);
        toast.success('Document deschis din cache offline');
        return;
      }

      // Online - open from Supabase
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Failed to view document:', error);
      toast.error('Eroare la deschiderea documentului');
    }
  };

  // Download document (normal download)
  const downloadDocument = async () => {
    try {
      let downloadUrl = fileUrl;

      // If offline, use offline version
      if (!navigator.onLine) {
        const offlineURL = await getOfflineURL();
        if (offlineURL) {
          downloadUrl = offlineURL;
        } else {
          toast.error('Document indisponibil offline');
          return;
        }
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (!navigator.onLine) {
        setTimeout(() => revokeOfflineDocumentURL(downloadUrl), 5000);
      }
    } catch (error) {
      console.error('Failed to download:', error);
      toast.error('Eroare la descărcarea documentului');
    }
  };

  return {
    isOffline,
    isDownloading,
    isChecking,
    downloadOffline,
    removeOffline,
    viewDocument,
    downloadDocument,
    getOfflineURL,
  };
}
