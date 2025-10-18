import { useState, useEffect } from 'react';
import { getAllOfflineDocuments, OfflineDocument } from '@/lib/offlineStorage';

/**
 * Hook pentru gestionarea listei complete de documente offline
 */
export function useOfflineDocuments() {
  const [offlineDocuments, setOfflineDocuments] = useState<OfflineDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshOfflineDocuments = async () => {
    setLoading(true);
    try {
      const docs = await getAllOfflineDocuments();
      setOfflineDocuments(docs);
    } catch (error) {
      console.error('[OfflineDocuments] Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshOfflineDocuments();
  }, []);

  return {
    offlineDocuments,
    loading,
    refreshOfflineDocuments,
  };
}
