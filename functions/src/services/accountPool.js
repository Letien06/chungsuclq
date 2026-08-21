/**
 * Account Pool Manager
 *
 * Manages worker accounts in Firestore:
 * - Import accounts from text (acc|pass format)
 * - Get available accounts for processing
 * - Mark accounts as used / cooldown / dead
 * - Track statistics
 */
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const config = require('../config');

const COLLECTION = 'accounts';

/**
 * Get Firestore db instance
 */
function getDb() {
  return getFirestore();
}

/**
 * Import accounts from text input
 * Format: each line is "username|password"
 * @param {string} text - Raw text with accounts
 * @returns {Promise<{imported: number, duplicates: number, errors: number}>}
 */
async function importAccounts(text) {
  const db = getDb();
  const lines = text
    .trim()
    .split('\n')
    .filter((l) => l.trim());

  let imported = 0;
  let duplicates = 0;
  let errors = 0;

  const batch = db.batch();
  const existingSnap = await db.collection(COLLECTION).get();
  const existingUsernames = new Set(
    existingSnap.docs.map((d) => d.data().username),
  );

  for (const line of lines) {
    try {
      const parts = line.trim().split('|');
      if (parts.length < 2) {
        errors++;
        continue;
      }

      const username = parts[0].trim();
      const password = parts[1].trim();

      if (!username || !password) {
        errors++;
        continue;
      }

      if (existingUsernames.has(username)) {
        duplicates++;
        continue;
      }

      const docRef = db.collection(COLLECTION).doc();
      batch.set(docRef, {
        username,
        password,
        status: 'available', // available | in_use | cooldown | dead
        lastUsedAt: null,
        totalUsed: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
      existingUsernames.add(username);
      imported++;
    } catch (err) {
      errors++;
    }
  }

  if (imported > 0) {
    await batch.commit();
  }

  return { imported, duplicates, errors };
}

/**
 * Get N available accounts for processing
 * @param {number} count - Number of accounts needed
 * @returns {Promise<Array<{id: string, username: string, password: string}>>}
 */
async function getAvailableAccounts(count) {
  const db = getDb();

  // Get accounts that are available
  const snap = await db
    .collection(COLLECTION)
    .where('status', '==', 'available')
    .limit(count)
    .get();

  const accounts = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    accounts.push({
      id: doc.id,
      username: data.username,
      password: data.password,
    });
  }

  // Also check cooldown accounts whose cooldown has expired
  if (accounts.length < count) {
    const remaining = count - accounts.length;
    const cooldownThreshold = new Date(Date.now() - config.accountCooldownMs);

    const cooldownSnap = await db
      .collection(COLLECTION)
      .where('status', '==', 'cooldown')
      .where('lastUsedAt', '<', cooldownThreshold)
      .limit(remaining)
      .get();

    for (const doc of cooldownSnap.docs) {
      const data = doc.data();
      accounts.push({
        id: doc.id,
        username: data.username,
        password: data.password,
      });
    }
  }

  return accounts;
}

/**
 * Mark accounts as in_use (lock them for processing)
 * @param {string[]} accountIds
 */
async function markInUse(accountIds) {
  const db = getDb();
  const batch = db.batch();

  for (const id of accountIds) {
    batch.update(db.collection(COLLECTION).doc(id), {
      status: 'in_use',
    });
  }

  await batch.commit();
}

/**
 * Mark account as used successfully → cooldown
 * @param {string} accountId
 * @param {number} biEarned
 */
async function markUsedSuccess(accountId, biEarned = 0) {
  const db = getDb();
  await db
    .collection(COLLECTION)
    .doc(accountId)
    .update({
      status: 'cooldown',
      lastUsedAt: FieldValue.serverTimestamp(),
      totalUsed: FieldValue.increment(1),
      lastBiEarned: biEarned,
    });
}

/**
 * Mark account as dead (e.g., "hết lượt giúp" permanently)
 * @param {string} accountId
 * @param {string} reason
 */
async function markDead(accountId, reason = '') {
  const db = getDb();
  await db.collection(COLLECTION).doc(accountId).update({
    status: 'dead',
    deadReason: reason,
    lastUsedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Release accounts back to available (e.g., on error before they were actually used)
 * @param {string[]} accountIds
 */
async function releaseAccounts(accountIds) {
  const db = getDb();
  const batch = db.batch();

  for (const id of accountIds) {
    batch.update(db.collection(COLLECTION).doc(id), {
      status: 'available',
    });
  }

  await batch.commit();
}

/**
 * Get account pool statistics
 * @returns {Promise<{total: number, available: number, inUse: number, cooldown: number, dead: number}>}
 */
async function getStats() {
  const db = getDb();
  const snap = await db.collection(COLLECTION).get();

  const stats = {
    total: 0,
    available: 0,
    inUse: 0,
    cooldown: 0,
    dead: 0,
  };

  const now = Date.now();

  for (const doc of snap.docs) {
    const data = doc.data();
    stats.total++;

    if (data.status === 'available') {
      stats.available++;
    } else if (data.status === 'in_use') {
      stats.inUse++;
    } else if (data.status === 'cooldown') {
      // Check if cooldown has expired
      const lastUsed = data.lastUsedAt?.toDate?.()?.getTime?.() || 0;
      if (now - lastUsed >= config.accountCooldownMs) {
        stats.available++; // Count as available
      } else {
        stats.cooldown++;
      }
    } else if (data.status === 'dead') {
      stats.dead++;
    }
  }

  return stats;
}

/**
 * Delete an account from the pool
 * @param {string} accountId
 */
async function deleteAccount(accountId) {
  const db = getDb();
  await db.collection(COLLECTION).doc(accountId).delete();
}

/**
 * Delete all dead accounts
 * @returns {Promise<number>} number of deleted accounts
 */
async function purgeDeadAccounts() {
  const db = getDb();
  const snap = await db
    .collection(COLLECTION)
    .where('status', '==', 'dead')
    .get();

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  return snap.size;
}

module.exports = {
  importAccounts,
  getAvailableAccounts,
  markInUse,
  markUsedSuccess,
  markDead,
  releaseAccounts,
  getStats,
  deleteAccount,
  purgeDeadAccounts,
};
