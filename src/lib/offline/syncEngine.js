import { performInitialSync } from './initialSync';
import { performIncrementalSync } from './incrementalSync';
import { replayMutations, getConflictMutations } from './mutationQueue';
import { verifyDeviceLock } from './deviceLock';
import db, { isInitialSyncComplete } from './db';
import { clearIdMappings } from './idMapper';

/**
 * Main sync orchestrator. Called when:
 * 1. App comes back online after being offline
 * 2. After login (initial sync)
 * 3. Manually triggered by user
 *
 * Sync order:
 * 1. Verify device lock
 * 2. Replay offline mutations (creates, updates, deletes)
 * 3. Pull incremental changes from server
 * 4. Clean up ID mappings
 * 5. Report conflicts
 *
 * @param {Object} options
 * @param {Function} options.onProgress - ({ entity, current, total }) => void
 * @param {Function} options.onConflicts - (conflicts) => void
 * @param {Function} options.onComplete - ({ synced, conflicts, errors, initialSyncResult }) => void
 * @param {Function} options.onError - (error) => void
 * @param {boolean} options.isInitial - Whether this is the first sync after login
 */
export async function runSync({
  onProgress,
  onConflicts,
  onComplete,
  onError,
  isInitial = false,
} = {}) {
  try {
    // Step 0: Check if we should do initial sync
    const needsInitialSync = isInitial || !(await isInitialSyncComplete());
    let initialSyncResult = null;

    if (needsInitialSync) {
      onProgress?.({ entity: 'initial', current: 0, total: 6 });
      initialSyncResult = await performInitialSync(onProgress);
    }

    // Step 1: Verify device lock (optional -- if lock mechanism is active)
    try {
      await verifyDeviceLock();
    } catch (lockError) {
      console.warn('[Sync] Device lock verification failed:', lockError.message);
      // Continue anyway -- lock is advisory, not blocking
    }

    // Step 2: Replay offline mutations
    const mutationResults = await replayMutations(onProgress);

    // Step 3: Pull incremental changes from server
    await performIncrementalSync(onProgress);

    // Step 4: Clean up ID mappings that are no longer needed
    // (Keep them for a while in case there are still pending mutations)
    const pendingCount = await db._mutations.count();
    if (pendingCount === 0) {
      await clearIdMappings();
    }

    // Step 5: Report conflicts
    const conflicts = await getConflictMutations();
    if (conflicts.length > 0) {
      onConflicts?.(conflicts);
    }

    // Step 6: Report completion
    onComplete?.({
      synced: mutationResults.synced,
      conflicts: mutationResults.conflicts,
      errors: mutationResults.errors,
      initialSyncResult,
    });

    return {
      success: true,
      synced: mutationResults.synced,
      conflicts: mutationResults.conflicts.length + conflicts.length,
      errors: mutationResults.errors.length,
      initialSyncResult,
    };

  } catch (error) {
    console.error('[Sync] Error:', error);
    onError?.(error);
    return {
      success: false,
      error: error.message,
    };
  }
}
