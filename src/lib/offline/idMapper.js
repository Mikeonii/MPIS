import db from './db';

/**
 * Record a mapping from a temporary (negative) ID to a real server ID.
 */
export async function recordIdMapping(entity, tempId, serverId) {
  await db._id_map.add({
    entity,
    temp_id: tempId,
    server_id: serverId,
  });

  // Also update any other IndexedDB records that reference this temp ID as a foreign key
  await remapForeignKeys(entity, tempId, serverId);
}

/**
 * Resolve a temp ID to its server ID. Returns the temp ID itself if no mapping found.
 */
export async function resolveId(entity, tempId) {
  const mapping = await db._id_map
    .where({ entity, temp_id: Number(tempId) })
    .first();
  return mapping ? mapping.server_id : tempId;
}

/**
 * After a record gets its real server ID, update any other records
 * in IndexedDB that referenced it by its temp ID.
 *
 * For example: if an account was created offline with temp_id = -123,
 * and family_members reference account_id = -123, update them.
 */
async function remapForeignKeys(entity, tempId, serverId) {
  if (entity === 'accounts') {
    // Update assistances.account_id
    const assistances = await db.assistances
      .where('account_id')
      .equals(tempId)
      .toArray();
    for (const a of assistances) {
      await db.assistances.update(a.id, { account_id: serverId });
    }

    // Update family_members.account_id
    const members = await db.family_members
      .where('account_id')
      .equals(tempId)
      .toArray();
    for (const m of members) {
      await db.family_members.update(m.id, { account_id: serverId });
    }

    // Update pending mutations that reference this temp account_id
    const mutations = await db._mutations.toArray();
    for (const mut of mutations) {
      if (mut.data && mut.data.account_id === tempId) {
        await db._mutations.update(mut.id, {
          data: { ...mut.data, account_id: serverId },
        });
      }
    }
  }

  if (entity === 'pharmacies') {
    // Update assistances.pharmacy_id
    const mutations = await db._mutations.toArray();
    for (const mut of mutations) {
      if (mut.data && mut.data.pharmacy_id === tempId) {
        await db._mutations.update(mut.id, {
          data: { ...mut.data, pharmacy_id: serverId },
        });
      }
    }
  }

  if (entity === 'source_of_funds') {
    // Update assistances.source_of_funds_id
    const mutations = await db._mutations.toArray();
    for (const mut of mutations) {
      if (mut.data && mut.data.source_of_funds_id === tempId) {
        await db._mutations.update(mut.id, {
          data: { ...mut.data, source_of_funds_id: serverId },
        });
      }
    }
  }
}

/**
 * Clear all ID mappings (called after full sync or on logout).
 */
export async function clearIdMappings() {
  await db._id_map.clear();
}
