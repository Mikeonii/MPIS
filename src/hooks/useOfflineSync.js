import { useEffect, useCallback, useRef } from 'react';
import { useOffline } from '@/lib/OfflineContext';
import { useAuth } from '@/lib/AuthContext';
import { runSync } from '@/lib/offline/syncEngine';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook that monitors online status and triggers sync when reconnecting.
 * Also handles initial sync after login.
 */
export function useOfflineSync() {
  const {
    isOnline,
    wasOffline,
    acknowledgeReconnection,
    setIsSyncing,
    setSyncProgress,
    setConflicts,
    refreshPendingCount,
    refreshLastSyncTime,
    initialSyncDone,
    setInitialSyncDone,
  } = useOffline();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const syncInProgressRef = useRef(false);

  const doSync = useCallback(async (isInitial = false) => {
    if (syncInProgressRef.current) return;
    if (!isOnline) return;
    if (!isAuthenticated) return;

    syncInProgressRef.current = true;
    setIsSyncing(true);

    try {
      const result = await runSync({
        isInitial,
        onProgress: (progress) => {
          setSyncProgress(progress);
        },
        onConflicts: (conflicts) => {
          setConflicts(conflicts);
          if (conflicts.length > 0) {
            toast.warning(`${conflicts.length} conflict${conflicts.length !== 1 ? 's' : ''} detected`, {
              description: 'Please review and resolve the conflicting changes.',
              duration: 6000,
            });
          }
        },
        onComplete: ({ synced, errors, initialSyncResult }) => {
          // Show initial sync result
          if (initialSyncResult) {
            const { synced: syncedEntities, failed, totalRecords } = initialSyncResult;
            if (failed.length === 0) {
              toast.success('Offline data ready', {
                description: `${totalRecords} records synced across ${syncedEntities.length} categories.`,
                duration: 4000,
              });
            } else {
              toast.warning('Partial sync completed', {
                description: `${syncedEntities.length} synced, ${failed.length} failed: ${failed.join(', ')}`,
                duration: 6000,
              });
            }
          }

          // Show mutation replay results
          if (synced > 0) {
            toast.success(`Synced ${synced} change${synced !== 1 ? 's' : ''}`);
          }
          if (errors.length > 0) {
            toast.error(`${errors.length} change${errors.length !== 1 ? 's' : ''} failed to sync`);
          }
          // Invalidate all React Query caches so the UI refreshes
          queryClient.invalidateQueries();
        },
        onError: (error) => {
          toast.error('Sync failed', {
            description: error.message,
          });
        },
      });

      if (result.success) {
        setInitialSyncDone(true);
      }
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
      syncInProgressRef.current = false;
      await refreshPendingCount();
      await refreshLastSyncTime();
    }
  }, [
    isOnline, isAuthenticated, queryClient,
    setIsSyncing, setSyncProgress, setConflicts, setInitialSyncDone,
    refreshPendingCount, refreshLastSyncTime,
  ]);

  // Trigger initial sync after login
  useEffect(() => {
    if (isAuthenticated && isOnline && !initialSyncDone) {
      doSync(true);
    }
  }, [isAuthenticated, isOnline, initialSyncDone, doSync]);

  // Trigger sync when coming back online
  useEffect(() => {
    if (wasOffline && isOnline && isAuthenticated) {
      acknowledgeReconnection();
      doSync(false);
    }
  }, [wasOffline, isOnline, isAuthenticated, acknowledgeReconnection, doSync]);

  return { doSync };
}
