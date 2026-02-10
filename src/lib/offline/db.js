import Dexie from 'dexie';

const db = new Dexie('mpis_offline');

db.version(1).stores({
  // Entity tables -- 'id' is the primary key (from server or negative temp ID)
  accounts:        'id, last_name, barangay, target_sector, created_by, updated_at',
  assistances:     'id, account_id, source_of_funds_id, type_of_assistance, created_by, updated_at, _offline_status',
  family_members:  'id, account_id, updated_at',
  pharmacies:      'id, pharmacy_name, status, updated_at',
  source_of_funds: 'id, source_name, status, updated_at',
  users:           'id, email, role, updated_at',

  // Mutation queue
  _mutations: '++id, entity, entity_id, operation, status, created_at',

  // Sync metadata
  _sync_meta: 'entity',

  // Device lock
  _device_lock: 'user_id',

  // ID mapping (temp -> server)
  _id_map: '++id, entity, temp_id, server_id',

  // Deleted record tracking (for incremental sync -- server needs to tell us about deletes)
  _deleted_records: '++id, entity, server_id, deleted_at',
});

export default db;

// Helper to clear all offline data (used on logout)
export async function clearAllOfflineData() {
  await db.accounts.clear();
  await db.assistances.clear();
  await db.family_members.clear();
  await db.pharmacies.clear();
  await db.source_of_funds.clear();
  await db.users.clear();
  await db._mutations.clear();
  await db._sync_meta.clear();
  await db._device_lock.clear();
  await db._id_map.clear();
  await db._deleted_records.clear();
}

// Helper to check if initial sync has been completed for all entities
export async function isInitialSyncComplete() {
  const metas = await db._sync_meta.toArray();
  const requiredEntities = ['accounts', 'assistances', 'family_members', 'pharmacies', 'source_of_funds', 'users'];
  return requiredEntities.every(entity =>
    metas.some(m => m.entity === entity && m.full_sync_done === true)
  );
}

// Generate a negative temp ID for offline-created records
export function generateTempId() {
  return -(Date.now() * 1000 + Math.floor(Math.random() * 1000));
}
