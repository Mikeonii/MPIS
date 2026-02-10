// Entity table names matching the API endpoints
export const ENTITIES = {
  ACCOUNTS: 'accounts',
  ASSISTANCES: 'assistances',
  FAMILY_MEMBERS: 'family_members',
  PHARMACIES: 'pharmacies',
  SOURCE_OF_FUNDS: 'source_of_funds',
  USERS: 'users',
};

// Maps entity name to API endpoint path
export const ENTITY_API_PATHS = {
  accounts: '/accounts',
  assistances: '/assistances',
  family_members: '/family-members',
  pharmacies: '/pharmacies',
  source_of_funds: '/source-of-funds',
  users: '/users',
};

// Mutation operation types
export const OPERATIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

// Mutation statuses
export const MUTATION_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  CONFLICT: 'conflict',
  FAILED: 'failed',
};

// Sync constants
export const SYNC_BATCH_SIZE = 500;  // Records per page during initial sync
export const DEVICE_LOCK_TTL_HOURS = 24;
export const DEVICE_ID_KEY = 'mpis_device_id';
export const LAST_USER_KEY = 'mpis_offline_user';
