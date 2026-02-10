import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useOffline } from '@/lib/OfflineContext';

export default function NetworkToast() {
  const { isOnline, pendingMutationCount } = useOffline();
  const prevOnlineRef = useRef(isOnline);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the initial render -- only fire on actual transitions
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevOnlineRef.current = isOnline;
      return;
    }

    if (isOnline && !prevOnlineRef.current) {
      // Just came back online
      toast.success('You are back online', {
        description: pendingMutationCount > 0
          ? `Syncing ${pendingMutationCount} pending change${pendingMutationCount !== 1 ? 's' : ''}...`
          : 'All data is up to date.',
        duration: 4000,
      });
    } else if (!isOnline && prevOnlineRef.current) {
      // Just went offline
      toast.warning('You are offline', {
        description: 'Changes will be saved locally and synced when you reconnect.',
        duration: 5000,
      });
    }

    prevOnlineRef.current = isOnline;
  }, [isOnline, pendingMutationCount]);

  return null; // Render-less component
}
