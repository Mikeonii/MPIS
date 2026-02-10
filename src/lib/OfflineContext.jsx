import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import db from '@/lib/offline/db';

const OfflineContext = createContext();

export function OfflineProvider({ children }) {
  const { isOnline, wasOffline, acknowledgeReconnection } = useNetworkStatus();
  const [pendingMutationCount, setPendingMutationCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null); // { current, total, entity }
  const [conflicts, setConflicts] = useState([]); // array of conflict objects
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // Refresh pending mutation count
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await db._mutations
        .where('status')
        .anyOf(['pending', 'conflict', 'failed'])
        .count();
      setPendingMutationCount(count);
    } catch {
      setPendingMutationCount(0);
    }
  }, []);

  // Refresh last sync time from _sync_meta
  const refreshLastSyncTime = useCallback(async () => {
    try {
      const metas = await db._sync_meta.toArray();
      if (metas.length > 0) {
        const latest = metas.reduce((a, b) =>
          new Date(a.last_sync_at) > new Date(b.last_sync_at) ? a : b
        );
        setLastSyncTime(latest.last_sync_at);
      }
    } catch {
      // ignore
    }
  }, []);

  // Poll mutation count every 2 seconds
  useEffect(() => {
    refreshPendingCount();
    refreshLastSyncTime();
    const interval = setInterval(() => {
      refreshPendingCount();
    }, 2000);
    return () => clearInterval(interval);
  }, [refreshPendingCount, refreshLastSyncTime]);

  const value = {
    isOnline,
    wasOffline,
    acknowledgeReconnection,
    pendingMutationCount,
    refreshPendingCount,
    lastSyncTime,
    setLastSyncTime,
    refreshLastSyncTime,
    isSyncing,
    setIsSyncing,
    syncProgress,
    setSyncProgress,
    conflicts,
    setConflicts,
    initialSyncDone,
    setInitialSyncDone,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
