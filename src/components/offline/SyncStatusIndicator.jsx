import React from 'react';
import { useOffline } from '@/lib/OfflineContext';
import { Cloud, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function SyncStatusIndicator({ darkMode }) {
  const { isOnline, lastSyncTime, pendingMutationCount } = useOffline();

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 text-xs",
      darkMode ? "text-gray-500" : "text-gray-400"
    )}>
      {isOnline ? (
        <Cloud className="w-3 h-3 text-green-500" />
      ) : (
        <CloudOff className="w-3 h-3 text-amber-500" />
      )}
      <span>
        {lastSyncTime
          ? `Synced ${formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}`
          : 'Not yet synced'
        }
      </span>
      {pendingMutationCount > 0 && (
        <span className="text-amber-500">
          ({pendingMutationCount} pending)
        </span>
      )}
    </div>
  );
}
