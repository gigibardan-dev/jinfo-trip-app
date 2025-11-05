import { useState, useEffect, useCallback } from 'react';
import {
  isDocumentOffline,
  saveDocumentOfflineFromBlob,
  getOfflineDocument,
  deleteOfflineDocument,
  createOfflineDocumentURL,
  revokeOfflineDocumentURL,
} from '@/lib/offlineStorage';
import { supabase } from '@/integrations/supabase/client';
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
      // Extract file path from URL
      let filePath = fileUrl;
      
      if (filePath.includes('supabase.co/storage')) {
        const match = filePath.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/);
        if (match) {
          filePath = decodeURIComponent(match[1]);
        }
      } else if (filePath.includes('/documents/')) {
        const match = filePath.match(/\/documents\/(.+)$/);
        if (match) {
          filePath = match[1];
        }
      }
      
      filePath = filePath.replace(/^\/+/, '');
      
      // Get signed URL for secure download (bucket is private)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60);
      
      if (signedError) throw signedError;
      
      // Fetch blob using signed URL
      const response = await fetch(signedData.signedUrl);
      if (!response.ok) throw new Error('Failed to fetch document');
      
      const data = await response.blob();
      
      // Save blob to offline storage
      const blob = new Blob([data], { type: fileType });
      await saveDocumentOfflineFromBlob(
        documentId,
        fileName,
        fileType,
        fileSize,
        blob,
        lastUpdated,
        fileUrl
      );
      
      setIsOffline(true);
      toast.success('✅ Document disponibil offline');
      
      return true;
    } catch (error) {
      console.error('Failed to download offline:', error);
      toast.error('❌ Eroare la descărcarea offline');
      return false;
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
      // If offline or document is saved offline, use offline version
      if (!navigator.onLine || isOffline) {
        const doc = await getOfflineDocument(documentId);
        if (!doc) {
          toast.error('Document indisponibil offline');
          return;
        }

        // Create a blob URL and open in new tab
        const blob = doc.blobData;
        const url = createOfflineDocumentURL(blob);
        window.open(url, '_blank');
        
        // Cleanup after some time
        setTimeout(() => revokeOfflineDocumentURL(url), 60000);
        return;
      }

      // Online - get signed URL from Supabase
      let filePath = fileUrl;
      
      if (filePath.includes('supabase.co/storage')) {
        const match = filePath.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/);
        if (match) {
          filePath = decodeURIComponent(match[1]);
        }
      } else if (filePath.includes('/documents/')) {
        const match = filePath.match(/\/documents\/(.+)$/);
        if (match) {
          filePath = match[1];
        }
      }
      
      filePath = filePath.replace(/^\/+/, '');
      
      const { data: signedData, error: signedError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60);
      
      if (signedError) throw signedError;
      
      window.open(signedData.signedUrl, '_blank');
    } catch (error) {
      console.error('Failed to view document:', error);
      toast.error('Eroare la deschiderea documentului');
    }
  };

  // Download document (normal download)
  const downloadDocument = async () => {
    try {
      // If offline, use offline version
      if (!navigator.onLine) {
        const offlineURL = await getOfflineURL();
        if (offlineURL) {
          const link = document.createElement('a');
          link.href = offlineURL;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => revokeOfflineDocumentURL(offlineURL), 5000);
        } else {
          toast.error('Document indisponibil offline');
        }
        return;
      }

      // Online - get signed URL and download
      let filePath = fileUrl;
      
      if (filePath.includes('supabase.co/storage')) {
        const match = filePath.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/);
        if (match) {
          filePath = decodeURIComponent(match[1]);
        }
      } else if (filePath.includes('/documents/')) {
        const match = filePath.match(/\/documents\/(.+)$/);
        if (match) {
          filePath = match[1];
        }
      }
      
      filePath = filePath.replace(/^\/+/, '');
      
      const { data: signedData, error: signedError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60);
      
      if (signedError) throw signedError;
      
      // Fetch the blob
      const response = await fetch(signedData.signedUrl);
      if (!response.ok) throw new Error('Failed to fetch document');
      
      const blob = await response.blob();
      const blobUrl = createOfflineDocumentURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => revokeOfflineDocumentURL(blobUrl), 5000);
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
