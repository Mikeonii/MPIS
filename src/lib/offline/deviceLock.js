import { v4 as uuidv4 } from 'uuid';
import client from '@/api/client';
import db from './db';
import { DEVICE_ID_KEY, DEVICE_LOCK_TTL_HOURS } from './constants';

/**
 * Get or create a unique device ID.
 * Stored in localStorage so it persists across sessions.
 */
export function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Acquire the offline lock for this device.
 * Only one device per user can hold the lock at a time.
 *
 * Calls POST /api/offline/lock with { device_id, ttl_hours }
 * Server stores the lock and rejects other devices.
 *
 * @returns {Promise<boolean>} true if lock acquired
 */
export async function acquireDeviceLock() {
  const deviceId = getDeviceId();

  try {
    const result = await client.post('/offline/lock', {
      device_id: deviceId,
      ttl_hours: DEVICE_LOCK_TTL_HOURS,
    });

    // Store lock locally
    await db._device_lock.put({
      user_id: result.user_id,
      device_id: deviceId,
      locked_at: result.locked_at,
      expires_at: result.expires_at,
    });

    return true;
  } catch (error) {
    if (error.status === 409) {
      // Another device already holds the lock
      throw new Error(
        'Offline mode is active on another device. ' +
        'Please release it from that device first, or wait for the lock to expire.'
      );
    }
    throw error;
  }
}

/**
 * Release the offline lock for this device.
 * Called on logout or when user explicitly disables offline mode.
 */
export async function releaseDeviceLock() {
  const deviceId = getDeviceId();

  try {
    await client.delete(`/offline/lock/${deviceId}`);
  } catch {
    // Ignore errors -- lock will expire naturally
  }

  await db._device_lock.clear();
}

/**
 * Verify that this device still holds the lock.
 * If the lock expired or was taken by another device, throws.
 */
export async function verifyDeviceLock() {
  const deviceId = getDeviceId();

  try {
    const result = await client.get(`/offline/lock/status?device_id=${deviceId}`);

    if (!result.is_locked || result.device_id !== deviceId) {
      // Lock lost -- try to re-acquire
      return acquireDeviceLock();
    }

    return true;
  } catch (error) {
    if (error.status === 404) {
      // No lock exists -- acquire one
      return acquireDeviceLock();
    }
    throw error;
  }
}

/**
 * Check if the current device has the offline lock (local check only).
 * Does not make an API call.
 */
export async function hasLocalLock() {
  const deviceId = getDeviceId();
  const lock = await db._device_lock.toArray();

  if (lock.length === 0) return false;

  const currentLock = lock[0];
  if (currentLock.device_id !== deviceId) return false;

  // Check if expired
  if (new Date(currentLock.expires_at) < new Date()) return false;

  return true;
}
