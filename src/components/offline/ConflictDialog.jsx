import React, { useState } from 'react';
import { useOffline } from '@/lib/OfflineContext';
import { resolveConflict } from '@/lib/offline/mutationQueue';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, Monitor, Cloud } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

/**
 * Conflict resolution dialog.
 * Shows when the sync engine detects that a record was modified on the server
 * while the user was editing it offline.
 *
 * Displays side-by-side comparison of local vs server data.
 * User can choose: Keep Local, Keep Server, or (for updates) pick fields manually.
 */
export default function ConflictDialog() {
  const { conflicts, setConflicts, refreshPendingCount } = useOffline();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolving, setResolving] = useState(false);

  const currentConflict = conflicts[currentIndex];
  const isOpen = conflicts.length > 0;

  if (!isOpen || !currentConflict) return null;

  const localData = currentConflict.data || {};
  const serverData = currentConflict.conflict_server_data || {};
  const entity = currentConflict.entity;
  const operation = currentConflict.operation;

  // Get all fields that differ between local and server
  const allKeys = new Set([...Object.keys(localData), ...Object.keys(serverData)]);
  const diffKeys = Array.from(allKeys).filter(key => {
    // Skip internal/meta fields
    if (key.startsWith('_') || key === 'id' || key === 'created_at' || key === 'created_by') {
      return false;
    }
    return JSON.stringify(localData[key]) !== JSON.stringify(serverData[key]);
  });

  const handleResolve = async (choice) => {
    setResolving(true);
    try {
      await resolveConflict(currentConflict.id, choice);
      toast.success(`Conflict resolved (${choice === 'local' ? 'your changes' : 'server version'} kept)`);

      const remaining = conflicts.filter((_, i) => i !== currentIndex);
      setConflicts(remaining);
      setCurrentIndex(Math.min(currentIndex, remaining.length - 1));
      await refreshPendingCount();
    } catch (error) {
      toast.error('Failed to resolve conflict: ' + error.message);
    } finally {
      setResolving(false);
    }
  };

  const handleDismiss = () => {
    // Leave conflicts in queue for later resolution
    setConflicts([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="max-w-3xl max-h-[85vh] dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Sync Conflict Detected
            {conflicts.length > 1 && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({currentIndex + 1} of {conflicts.length})
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            The {entity.replace('_', ' ')} record was modified on the server while you were offline.
            {operation === 'delete' && ' You attempted to delete this record, but it was updated by another user.'}
            {operation === 'update' && ' Choose which version to keep.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-2 p-1">
            {/* Column headers */}
            <div className="grid grid-cols-3 gap-3 text-xs font-medium uppercase tracking-wider mb-3">
              <div className="text-gray-500 dark:text-gray-400">Field</div>
              <div className="flex items-center gap-1 text-blue-500">
                <Monitor className="w-3 h-3" /> Your Changes
              </div>
              <div className="flex items-center gap-1 text-green-500">
                <Cloud className="w-3 h-3" /> Server Version
              </div>
            </div>

            {diffKeys.map(key => {
              const localVal = localData[key];
              const serverVal = serverData[key];
              const displayLocal = typeof localVal === 'object' ? JSON.stringify(localVal) : String(localVal ?? '-');
              const displayServer = typeof serverVal === 'object' ? JSON.stringify(serverVal) : String(serverVal ?? '-');

              return (
                <div key={key} className="grid grid-cols-3 gap-3 py-2 px-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800/50">
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800/50 dark:text-blue-300">
                    {displayLocal}
                  </div>
                  <div className="px-2 py-1 rounded border bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800/50 dark:text-green-300">
                    {displayServer}
                  </div>
                </div>
              );
            })}

            {diffKeys.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                No visible field differences (conflict may be in timestamps only).
              </div>
            )}

            {/* Timestamps */}
            <div className="mt-4 pt-3 border-t text-xs border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Your edit was made at: {currentConflict.created_at ? format(new Date(currentConflict.created_at), 'MMM d, yyyy HH:mm') : 'Unknown'}</span>
                <span>Server updated at: {serverData.updated_at ? format(new Date(serverData.updated_at), 'MMM d, yyyy HH:mm') : 'Unknown'}</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {conflicts.length > 1 && (
            <div className="flex gap-2 mr-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="rounded-lg"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(Math.min(conflicts.length - 1, currentIndex + 1))}
                disabled={currentIndex === conflicts.length - 1}
                className="rounded-lg"
              >
                Next
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleDismiss}
            className="rounded-xl dark:border-gray-600"
          >
            Resolve Later
          </Button>

          <Button
            onClick={() => handleResolve('server')}
            disabled={resolving}
            className="rounded-xl bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <Cloud className="w-4 h-4" />
            Keep Server Version
          </Button>

          <Button
            onClick={() => handleResolve('local')}
            disabled={resolving}
            className="rounded-xl text-white gap-2"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Monitor className="w-4 h-4" />
            Keep My Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
