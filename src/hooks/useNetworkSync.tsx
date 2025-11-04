import { useEffect, useState } from 'react';
import { syncOfflineDocuments } from '@/lib/offlineStorage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to sync offline documents when network reconnects
 */
export function useNetworkSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      console.log('[NetworkSync] Connection restored, starting sync...');
      setIsOnline(true);
      setIsSyncing(true);

      // Wait a bit for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const result = await syncOfflineDocuments(async (docId: string) => {
          const { data, error } = await supabase
            .from('documents')
            .select('upload_date, file_url')
            .eq('id', docId)
            .single();

          if (error || !data) return null;

          // Extract file path
          let filePath = data.file_url;
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

          // Get signed URL for secure download
          const { data: signedData, error: signedError } = await supabase.storage
            .from('documents')
            .createSignedUrl(filePath, 60);

          if (signedError || !signedData) return null;

          // Fetch blob using signed URL
          const response = await fetch(signedData.signedUrl);
          if (!response.ok) return null;
          
          const blobData = await response.blob();

          return {
            updated_at: data.upload_date,
            blob: blobData,
            url: data.file_url,
          };
        });

        if (result.updated.length > 0) {
          toast.success(`✅ ${result.updated.length} documente actualizate offline`);
        }

        if (result.errors.length > 0) {
          toast.error(`⚠️ ${result.errors.length} documente nu au putut fi sincronizate`);
        }

        if (result.updated.length === 0 && result.errors.length === 0) {
          console.log('[NetworkSync] All documents up to date');
        }
      } catch (error) {
        console.error('[NetworkSync] Sync failed:', error);
        toast.error('Eroare la sincronizarea documentelor');
      } finally {
        setIsSyncing(false);
      }
    };

    const handleOffline = () => {
      console.log('[NetworkSync] Connection lost');
      setIsOnline(false);
      toast.warning('📵 Mod offline - documentele salvate rămân disponibile');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isSyncing };
}
