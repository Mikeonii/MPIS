import React from 'react';
import { useOffline } from '@/lib/OfflineContext';
import { WifiOff, CloudOff, RefreshCw, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OfflineBanner({ darkMode }) {
  const { isOnline, pendingMutationCount, isSyncing, syncProgress } = useOffline();

  // Only show when offline or syncing or has pending mutations
  if (isOnline && pendingMutationCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
      !isOnline
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
        : isSyncing
          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
          : "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20"
    )}>
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline</span>
          {pendingMutationCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-[10px]">
              {pendingMutationCount} pending
            </span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>
            Syncing{syncProgress ? ` ${syncProgress.entity} (${syncProgress.current}/${syncProgress.total})` : '...'}
          </span>
        </>
      ) : (
        <>
          <CloudUpload className="w-3.5 h-3.5" />
          <span>{pendingMutationCount} unsent change{pendingMutationCount !== 1 ? 's' : ''}</span>
        </>
      )}
    </div>
  );
}
