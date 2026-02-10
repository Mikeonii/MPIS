import db, { generateTempId } from './db';
import { ENTITY_API_PATHS, OPERATIONS, MUTATION_STATUS } from './constants';
import client from '@/api/client';

function isOnline() {
  return navigator.onLine;
}

/**
 * Creates an offline-aware entity interface for a given entity.
 *
 * When online: calls API, writes response to IndexedDB
 * When offline: reads from IndexedDB, queues mutations
 *
 * @param {string} entityName - Dexie table name (e.g., 'accounts')
 * @returns {Object} Entity interface matching the existing pattern
 */
function createOfflineEntity(entityName) {
  const apiPath = ENTITY_API_PATHS[entityName];
  const table = db[entityName];

  return {
    /**
     * List all records. Online: fetches from API + updates cache. Offline: reads from IndexedDB.
     */
    list: async (sort, limit) => {
      if (isOnline()) {
        try {
          const params = new URLSearchParams();
          if (sort) params.set('sort', sort);
          if (limit) params.set('limit', limit);
          const qs = params.toString();

          const records = await client.get(`${apiPath}${qs ? `?${qs}` : ''}`);

          // Update IndexedDB cache (but do NOT clear -- incremental approach)
          if (Array.isArray(records)) {
            await table.bulkPut(records);
          }

          return records;
        } catch (error) {
          // Network error -- fall through to IndexedDB
          if (error.message === 'Failed to fetch' || !navigator.onLine) {
            console.log(`[Offline] Falling back to IndexedDB for ${entityName}.list`);
          } else {
            throw error; // Real API error (400, 403, etc.)
          }
        }
      }

      // Offline path: read from IndexedDB
      let records = await table.toArray();

      // Apply basic sort (supports '-field' for desc)
      if (sort) {
        const desc = sort.startsWith('-');
        const field = desc ? sort.substring(1) : sort;
        // Map old field names
        const fieldMap = { created_date: 'created_at', updated_date: 'updated_at' };
        const resolvedField = fieldMap[field] || field;

        records.sort((a, b) => {
          const aVal = a[resolvedField];
          const bVal = b[resolvedField];
          if (aVal < bVal) return desc ? 1 : -1;
          if (aVal > bVal) return desc ? -1 : 1;
          return 0;
        });
      }

      if (limit) {
        records = records.slice(0, parseInt(limit));
      }

      return records;
    },

    /**
     * Get a single record by ID.
     */
    get: async (id) => {
      if (isOnline()) {
        try {
          const record = await client.get(`${apiPath}/${id}`);
          await table.put(record); // Update cache
          return record;
        } catch (error) {
          if (error.message === 'Failed to fetch' || !navigator.onLine) {
            console.log(`[Offline] Falling back to IndexedDB for ${entityName}.get(${id})`);
          } else {
            throw error;
          }
        }
      }

      // Offline: read from IndexedDB
      const record = await table.get(Number(id) || id);
      if (!record) {
        throw new Error(`${entityName} with id ${id} not found offline`);
      }
      return record;
    },

    /**
     * Create a new record. Online: POST to API. Offline: insert into IndexedDB with temp ID + queue mutation.
     */
    create: async (data) => {
      if (isOnline()) {
        try {
          const record = await client.post(apiPath, data);
          await table.put(record); // Cache the server response
          return record;
        } catch (error) {
          if (error.message === 'Failed to fetch' || !navigator.onLine) {
            console.log(`[Offline] Queuing create for ${entityName}`);
          } else {
            throw error;
          }
        }
      }

      // Offline: create with temp ID
      const tempId = generateTempId();
      const now = new Date().toISOString();

      const offlineRecord = {
        ...data,
        id: tempId,
        created_at: now,
        updated_at: now,
        _offline: true,  // Flag to identify offline-created records
      };

      // Special handling for assistances -- mark as draft
      if (entityName === 'assistances') {
        offlineRecord._offline_status = 'draft';
      }

      await table.put(offlineRecord);

      // Queue mutation
      await db._mutations.add({
        entity: entityName,
        entity_id: tempId,
        operation: OPERATIONS.CREATE,
        data: data,  // Original data (without temp ID)
        status: MUTATION_STATUS.PENDING,
        created_at: now,
        error: null,
        conflict_server_data: null,
        retry_count: 0,
      });

      return offlineRecord;
    },

    /**
     * Update an existing record.
     */
    update: async (id, data) => {
      if (isOnline()) {
        try {
          const record = await client.put(`${apiPath}/${id}`, data);
          await table.put(record); // Update cache
          return record;
        } catch (error) {
          if (error.message === 'Failed to fetch' || !navigator.onLine) {
            console.log(`[Offline] Queuing update for ${entityName}/${id}`);
          } else {
            throw error;
          }
        }
      }

      // Offline: update in IndexedDB + queue mutation
      const existing = await table.get(Number(id) || id);
      const now = new Date().toISOString();

      const updated = {
        ...existing,
        ...data,
        id: Number(id) || id,
        updated_at: now,
        _offline: true,
        _offline_updated_at: now,  // Track when the offline edit was made
      };

      await table.put(updated);

      // Queue mutation
      await db._mutations.add({
        entity: entityName,
        entity_id: Number(id) || id,
        operation: OPERATIONS.UPDATE,
        data: data,
        status: MUTATION_STATUS.PENDING,
        created_at: now,
        error: null,
        conflict_server_data: null,
        retry_count: 0,
        // Store the original server updated_at for conflict detection
        server_updated_at: existing?.updated_at || null,
      });

      return updated;
    },

    /**
     * Delete a record.
     */
    delete: async (id) => {
      if (isOnline()) {
        try {
          const result = await client.delete(`${apiPath}/${id}`);
          await table.delete(Number(id) || id); // Remove from cache
          return result;
        } catch (error) {
          if (error.message === 'Failed to fetch' || !navigator.onLine) {
            console.log(`[Offline] Queuing delete for ${entityName}/${id}`);
          } else {
            throw error;
          }
        }
      }

      // Offline: remove from IndexedDB + queue mutation
      const existing = await table.get(Number(id) || id);

      // If this is a temp ID (offline-created), just remove it and its create mutation
      if (Number(id) < 0) {
        await table.delete(Number(id));
        // Remove the pending create mutation for this temp ID
        const createMutation = await db._mutations
          .where({ entity: entityName, entity_id: Number(id), operation: OPERATIONS.CREATE })
          .first();
        if (createMutation) {
          await db._mutations.delete(createMutation.id);
        }
        return { message: 'Deleted offline record' };
      }

      await table.delete(Number(id) || id);

      // Queue mutation
      await db._mutations.add({
        entity: entityName,
        entity_id: Number(id) || id,
        operation: OPERATIONS.DELETE,
        data: null,
        status: MUTATION_STATUS.PENDING,
        created_at: new Date().toISOString(),
        error: null,
        conflict_server_data: null,
        retry_count: 0,
        server_updated_at: existing?.updated_at || null,
      });

      return { message: 'Queued for deletion' };
    },

    /**
     * Filter records. Online: calls API. Offline: filters IndexedDB in-memory.
     */
    filter: async (filters = {}, sort) => {
      if (isOnline()) {
        try {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              params.set(key, value);
            }
          });
          if (sort) params.set('sort', sort);
          const qs = params.toString();

          const records = await client.get(`${apiPath}${qs ? `?${qs}` : ''}`);

          // Do NOT bulk-replace cache here, as this is a filtered result
          return records;
        } catch (error) {
          if (error.message === 'Failed to fetch' || !navigator.onLine) {
            console.log(`[Offline] Falling back to IndexedDB for ${entityName}.filter`);
          } else {
            throw error;
          }
        }
      }

      // Offline: filter from IndexedDB
      let records = await table.toArray();

      // Apply filters
      records = records.filter(record => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === undefined || value === null || value === '') return true;
          return String(record[key]) === String(value);
        });
      });

      // Apply sort
      if (sort) {
        const desc = sort.startsWith('-');
        const field = desc ? sort.substring(1) : sort;
        const fieldMap = { created_date: 'created_at', updated_date: 'updated_at' };
        const resolvedField = fieldMap[field] || field;

        records.sort((a, b) => {
          const aVal = a[resolvedField];
          const bVal = b[resolvedField];
          if (aVal < bVal) return desc ? 1 : -1;
          if (aVal > bVal) return desc ? -1 : 1;
          return 0;
        });
      }

      return records;
    },
  };
}

// Export offline-aware entities (same interface as src/api/entities.js)
export const Account = createOfflineEntity('accounts');
export const Assistance = createOfflineEntity('assistances');
export const FamilyMember = createOfflineEntity('family_members');
export const Pharmacy = createOfflineEntity('pharmacies');
export const SourceOfFunds = createOfflineEntity('source_of_funds');
export const User = createOfflineEntity('users');

// Also export the User.invite method (not a standard CRUD operation)
User.invite = async (data) => {
  if (isOnline()) {
    return client.post('/users/invite', data);
  }
  throw new Error('Cannot invite users while offline');
};

// FamilyMember batch endpoint
FamilyMember.batch = async (data) => {
  if (isOnline()) {
    return client.post('/family-members/batch', data);
  }
  // Offline: create each family member individually
  const results = [];
  for (const member of data) {
    const result = await FamilyMember.create(member);
    results.push(result);
  }
  return results;
};
