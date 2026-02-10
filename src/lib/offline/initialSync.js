import db from './db';
import client from '@/api/client';
import { ENTITIES, ENTITY_API_PATHS } from './constants';

/**
 * Performs the initial full sync for all entities.
 * Called after login when no sync metadata exists.
 *
 * Uses paginated fetching for large datasets.
 * Each entity's data is fetched via the new /api/sync/{entity} endpoint
 * which supports ?page=N&per_page=500&updated_since=...
 *
 * Falls back to regular list endpoints if sync endpoints are not yet available.
 *
 * @param {Function} onProgress - Callback: ({ entity, current, total }) => void
 * @returns {Promise<void>}
 */
export async function performInitialSync(onProgress) {
  const entityList = Object.values(ENTITIES);

  for (let i = 0; i < entityList.length; i++) {
    const entity = entityList[i];

    onProgress?.({
      entity,
      current: i + 1,
      total: entityList.length,
    });

    try {
      // Try the paginated sync endpoint first
      let allRecords = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await client.get(
          `/sync/${entity}?page=${page}&per_page=500`
        );

        if (response && response.data) {
          // Paginated response: { data: [...], meta: { current_page, last_page } }
          allRecords = allRecords.concat(response.data);
          hasMore = response.meta.current_page < response.meta.last_page;
          page++;
        } else if (Array.isArray(response)) {
          // Fallback: non-paginated response (regular list endpoint)
          allRecords = response;
          hasMore = false;
        } else {
          hasMore = false;
        }
      }

      // Clear existing data for this entity and bulk-insert
      await db[entity].clear();
      if (allRecords.length > 0) {
        await db[entity].bulkPut(allRecords);
      }

      // Update sync metadata
      await db._sync_meta.put({
        entity,
        last_sync_at: new Date().toISOString(),
        record_count: allRecords.length,
        full_sync_done: true,
      });

    } catch (error) {
      console.error(`[InitialSync] Failed for ${entity}:`, error);

      // Try fallback to regular list endpoint
      try {
        const fallbackPath = ENTITY_API_PATHS[entity];
        const records = await client.get(fallbackPath);

        if (Array.isArray(records)) {
          await db[entity].clear();
          if (records.length > 0) {
            await db[entity].bulkPut(records);
          }

          await db._sync_meta.put({
            entity,
            last_sync_at: new Date().toISOString(),
            record_count: records.length,
            full_sync_done: true,
          });
        }
      } catch (fallbackError) {
        console.error(`[InitialSync] Fallback also failed for ${entity}:`, fallbackError);
        // Mark as not synced -- will retry next time
        await db._sync_meta.put({
          entity,
          last_sync_at: null,
          record_count: 0,
          full_sync_done: false,
        });
      }
    }
  }
}
