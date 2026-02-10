import db from './db';
import client from '@/api/client';
import { ENTITY_API_PATHS, OPERATIONS, MUTATION_STATUS } from './constants';
import { resolveId, recordIdMapping } from './idMapper';

/**
 * Get all pending mutations in order.
 */
export async function getPendingMutations() {
  return db._mutations
    .where('status')
    .anyOf([MUTATION_STATUS.PENDING, MUTATION_STATUS.FAILED])
    .sortBy('id'); // Process in creation order
}

/**
 * Get all conflict mutations.
 */
export async function getConflictMutations() {
  return db._mutations
    .where('status')
    .equals(MUTATION_STATUS.CONFLICT)
    .toArray();
}

/**
 * Replay all pending mutations to the server.
 * Returns { synced: number, conflicts: Array, errors: Array }
 *
 * @param {Function} onProgress - ({ current, total, entity }) => void
 */
export async function replayMutations(onProgress) {
  const mutations = await getPendingMutations();
  const results = { synced: 0, conflicts: [], errors: [] };

  for (let i = 0; i < mutations.length; i++) {
    const mutation = mutations[i];
    const apiPath = ENTITY_API_PATHS[mutation.entity];

    onProgress?.({
      current: i + 1,
      total: mutations.length,
      entity: mutation.entity,
    });

    // Mark as syncing
    await db._mutations.update(mutation.id, { status: MUTATION_STATUS.SYNCING });

    try {
      if (mutation.operation === OPERATIONS.CREATE) {
        await replayCreate(mutation, apiPath);
        results.synced++;
      } else if (mutation.operation === OPERATIONS.UPDATE) {
        const result = await replayUpdate(mutation, apiPath);
        if (result === 'conflict') {
          results.conflicts.push(mutation);
        } else {
          results.synced++;
        }
      } else if (mutation.operation === OPERATIONS.DELETE) {
        const result = await replayDelete(mutation, apiPath);
        if (result === 'conflict') {
          results.conflicts.push(mutation);
        } else {
          results.synced++;
        }
      }
    } catch (error) {
      console.error(`[MutationReplay] Failed for ${mutation.entity}/${mutation.entity_id}:`, error);
      await db._mutations.update(mutation.id, {
        status: MUTATION_STATUS.FAILED,
        error: error.message,
        retry_count: (mutation.retry_count || 0) + 1,
      });
      results.errors.push({ mutation, error: error.message });
    }
  }

  return results;
}

/**
 * Replay a CREATE mutation.
 * Handles temp ID remapping for foreign keys.
 */
async function replayCreate(mutation, apiPath) {
  let data = { ...mutation.data };

  // Resolve any temp IDs in foreign key fields
  if (data.account_id && Number(data.account_id) < 0) {
    data.account_id = await resolveId('accounts', data.account_id);
  }
  if (data.source_of_funds_id && Number(data.source_of_funds_id) < 0) {
    data.source_of_funds_id = await resolveId('source_of_funds', data.source_of_funds_id);
  }
  if (data.pharmacy_id && Number(data.pharmacy_id) < 0) {
    data.pharmacy_id = await resolveId('pharmacies', data.pharmacy_id);
  }

  // POST to server
  const serverRecord = await client.post(apiPath, data);

  // Record the temp ID -> server ID mapping
  await recordIdMapping(mutation.entity, mutation.entity_id, serverRecord.id);

  // Remove the temp record from IndexedDB
  await db[mutation.entity].delete(mutation.entity_id);

  // Insert the server record into IndexedDB
  await db[mutation.entity].put(serverRecord);

  // Remove the mutation from the queue
  await db._mutations.delete(mutation.id);
}

/**
 * Replay an UPDATE mutation.
 * Checks for conflicts using updated_at timestamp.
 * Returns 'conflict' if server record is newer, otherwise void.
 */
async function replayUpdate(mutation, apiPath) {
  // First check the server's current version
  const serverRecord = await client.get(`${apiPath}/${mutation.entity_id}`);

  // Conflict detection: if server's updated_at is newer than what we had when editing
  if (mutation.server_updated_at && serverRecord.updated_at) {
    const serverTime = new Date(serverRecord.updated_at).getTime();
    const ourBaseTime = new Date(mutation.server_updated_at).getTime();

    if (serverTime > ourBaseTime) {
      // CONFLICT: server was modified after our local copy
      await db._mutations.update(mutation.id, {
        status: MUTATION_STATUS.CONFLICT,
        conflict_server_data: serverRecord,
      });
      return 'conflict';
    }
  }

  // No conflict -- apply update
  const updatedRecord = await client.put(`${apiPath}/${mutation.entity_id}`, mutation.data);
  await db[mutation.entity].put(updatedRecord);
  await db._mutations.delete(mutation.id);
}

/**
 * Replay a DELETE mutation.
 * If the record was already modified on server, treat as conflict.
 */
async function replayDelete(mutation, apiPath) {
  try {
    // Check if record still exists and if it was modified
    const serverRecord = await client.get(`${apiPath}/${mutation.entity_id}`);

    if (mutation.server_updated_at && serverRecord.updated_at) {
      const serverTime = new Date(serverRecord.updated_at).getTime();
      const ourBaseTime = new Date(mutation.server_updated_at).getTime();

      if (serverTime > ourBaseTime) {
        // CONFLICT: someone modified this record after we decided to delete it
        await db._mutations.update(mutation.id, {
          status: MUTATION_STATUS.CONFLICT,
          conflict_server_data: serverRecord,
        });
        return 'conflict';
      }
    }

    // No conflict -- proceed with delete
    await client.delete(`${apiPath}/${mutation.entity_id}`);
    await db[mutation.entity].delete(mutation.entity_id);
    await db._mutations.delete(mutation.id);
  } catch (error) {
    if (error.status === 404) {
      // Already deleted on server -- clean up locally
      await db[mutation.entity].delete(mutation.entity_id);
      await db._mutations.delete(mutation.id);
    } else {
      throw error;
    }
  }
}

/**
 * Resolve a single conflict by choosing local or server data.
 *
 * @param {number} mutationId - The mutation queue ID
 * @param {'local' | 'server'} choice - Which version to keep
 * @param {Object} mergedData - (Optional) If the user manually merged fields
 */
export async function resolveConflict(mutationId, choice, mergedData = null) {
  const mutation = await db._mutations.get(mutationId);
  if (!mutation) return;

  const apiPath = ENTITY_API_PATHS[mutation.entity];

  if (choice === 'server') {
    // Keep server version -- discard local changes
    if (mutation.conflict_server_data) {
      await db[mutation.entity].put(mutation.conflict_server_data);
    }
    await db._mutations.delete(mutationId);
  } else if (choice === 'local') {
    // Force local version onto server
    const dataToSend = mergedData || mutation.data;

    if (mutation.operation === OPERATIONS.UPDATE) {
      const updated = await client.put(`${apiPath}/${mutation.entity_id}`, dataToSend);
      await db[mutation.entity].put(updated);
    } else if (mutation.operation === OPERATIONS.DELETE) {
      await client.delete(`${apiPath}/${mutation.entity_id}`);
      await db[mutation.entity].delete(mutation.entity_id);
    }

    await db._mutations.delete(mutationId);
  }
}
