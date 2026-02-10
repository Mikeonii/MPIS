import { useState, useEffect, useCallback, useRef } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const previousOnline = useRef(navigator.onLine);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (!previousOnline.current) {
      setWasOffline(true); // Flag that we just came back online
    }
    previousOnline.current = true;
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    previousOnline.current = false;
  }, []);

  // Acknowledge that reconnection was handled (reset wasOffline flag)
  const acknowledgeReconnection = useCallback(() => {
    setWasOffline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also do a real connectivity check (navigator.onLine can be unreliable)
    const checkConnectivity = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'HEAD',
          cache: 'no-store',
        });
        if (!response.ok && response.status === 401) {
          // Server reachable but unauthorized -- still "online" from network perspective
          setIsOnline(true);
          previousOnline.current = true;
        } else {
          setIsOnline(true);
          previousOnline.current = true;
        }
      } catch {
        setIsOnline(false);
        previousOnline.current = false;
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkConnectivity, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline, acknowledgeReconnection };
}
