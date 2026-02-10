import db from './db';
import client from '@/api/client';
import { ENTITIES, ENTITY_API_PATHS } from './constants';

/**
 * Performs incremental sync for all entities.
 * Fetches only records that have been updated since the last sync.
 *
 * Uses the sync API endpoint: GET /api/sync/{entity}?updated_since=ISO_TIMESTAMP
 *
 * Also handles deleted records via: GET /api/sync/{entity}/deleted?since=ISO_TIMESTAMP
 *
 * @param {Function} onProgress - ({ entity, current, total }) => void
 */
export async function performIncrementalSync(onProgress) {
  const entityList = Object.values(ENTITIES);

  for (let i = 0; i < entityList.length; i++) {
    const entity = entityList[i];

    onProgress?.({
      entity,
      current: i + 1,
      total: entityList.length,
    });

    try {
      const syncMeta = await db._sync_meta.get(entity);
      const lastSync = syncMeta?.last_sync_at;

      if (!lastSync || !syncMeta?.full_sync_done) {
        // No previous sync -- do a full sync for this entity
        await syncEntityFull(entity);
      } else {
        // Incremental: fetch only updated records
        await syncEntityIncremental(entity, lastSync);
      }

      // Also fetch deleted record IDs
      if (lastSync) {
        await syncEntityDeleted(entity, lastSync);
      }

    } catch (error) {
      console.error(`[IncrementalSync] Failed for ${entity}:`, error);
      // Continue with other entities -- don't block everything
    }
  }
}

async function syncEntityFull(entity) {
  let allRecords = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await client.get(`/sync/${entity}?page=${page}&per_page=500`);

      if (response && response.data) {
        allRecords = allRecords.concat(response.data);
        hasMore = response.meta.current_page < response.meta.last_page;
        page++;
      } else if (Array.isArray(response)) {
        allRecords = response;
        hasMore = false;
      } else {
        hasMore = false;
      }
    } catch {
      // Fallback to regular endpoint
      const records = await client.get(ENTITY_API_PATHS[entity]);
      if (Array.isArray(records)) {
        allRecords = records;
      }
      hasMore = false;
    }
  }

  if (allRecords.length > 0) {
    // Upsert -- do not delete records that might have offline mutations pending
    await db[entity].bulkPut(allRecords);
  }

  await db._sync_meta.put({
    entity,
    last_sync_at: new Date().toISOString(),
    record_count: await db[entity].count(),
    full_sync_done: true,
  });
}

async function syncEntityIncremental(entity, lastSync) {
  try {
    const response = await client.get(
      `/sync/${entity}?updated_since=${encodeURIComponent(lastSync)}`
    );

    let records;
    if (response && response.data) {
      records = response.data;
    } else if (Array.isArray(response)) {
      records = response;
    } else {
      records = [];
    }

    if (records.length > 0) {
      // Check for conflicts with locally-modified records before overwriting
      for (const serverRecord of records) {
        const hasPendingMutation = await db._mutations
          .where({ entity, entity_id: serverRecord.id })
          .first();

        if (!hasPendingMutation) {
          // No pending local change -- safe to update
          await db[entity].put(serverRecord);
        }
        // If there IS a pending mutation, skip -- the mutation replay will handle it
      }
    }

    await db._sync_meta.put({
      entity,
      last_sync_at: new Date().toISOString(),
      record_count: await db[entity].count(),
      full_sync_done: true,
    });
  } catch (error) {
    // If the sync endpoint doesn't exist yet, fallback to full fetch
    if (error.status === 404) {
      await syncEntityFull(entity);
    } else {
      throw error;
    }
  }
}

async function syncEntityDeleted(entity, lastSync) {
  try {
    const response = await client.get(
      `/sync/${entity}/deleted?since=${encodeURIComponent(lastSync)}`
    );

    const deletedIds = Array.isArray(response) ? response : (response?.data || []);

    for (const deletedId of deletedIds) {
      // Only delete from IndexedDB if there's no pending mutation for it
      const hasPendingMutation = await db._mutations
        .where({ entity, entity_id: deletedId })
        .first();

      if (!hasPendingMutation) {
        await db[entity].delete(deletedId);
      }
    }
  } catch {
    // Endpoint might not exist yet -- silently skip
  }
}
