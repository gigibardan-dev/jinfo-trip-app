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

          // Get signed URL
          const fileName = data.file_url.split('/').pop() || '';
          const { data: signedData } = await supabase.storage
            .from('documents')
            .createSignedUrl(fileName, 3600);

          if (!signedData) return null;

          return {
            updated_at: data.upload_date,
            url: signedData.signedUrl,
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
