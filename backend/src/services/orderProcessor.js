const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const qvtool = require('./qvtool');
const accountPool = require('./accountPool');
const config = require('../config');

async function processOrder(orderId) {
  const db = getFirestore();
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) return { success: false, message: 'Order not found' };
  const order = snap.data();
  if (order.status !== 'queued') return { success: false, message: `Order status is ${order.status}, not queued` };
  await orderRef.update({ status: 'processing', processingStartedAt: FieldValue.serverTimestamp() });

  const settings = await db.collection('settings').doc('packages').get();
  const packages = settings.exists ? settings.data() : config.defaultPackages;
  const pkg = packages[order.packageId] || config.defaultPackages[order.packageId];
  if (!pkg) {
    await orderRef.update({ status: 'failed', error: `Unknown package: ${order.packageId}`, completedAt: FieldValue.serverTimestamp() });
    return { success: false, message: 'Unknown package' };
  }

  let accounts = await accountPool.getAvailableAccounts(pkg.accRequired || 1);
  let source = accounts.length >= (pkg.accRequired || 1) ? 'own' : 'stock';
  if (source === 'stock') accounts = [];
  if (source === 'own') await accountPool.markInUse(accounts.map((a) => a.id));

  try {
    const batch = await qvtool.createBatch({
      code: order.chungSucCode,
      accounts,
      perCode: pkg.accRequired || 1,
      source,
    });

    const result = qvtool.normalizeResults(await qvtool.waitForBatch(batch.id));
    const rowsByUsername = new Map(result.success.concat(result.failed).map((row) => [row.username, row]));
    for (const account of accounts) {
      const row = rowsByUsername.get(account.username);
      if (row) await accountPool.markUsedSuccess(account.id, row.biEarned || 0);
      else await accountPool.releaseAccounts([account.id]);
    }

    const logBatch = db.batch();
    for (const row of result.success) logBatch.set(db.collection('order_logs').doc(), { orderId, username: row.username, result: 'success', biEarned: row.biEarned, raw: row.raw, provider: 'qvtool', createdAt: FieldValue.serverTimestamp() });
    for (const row of result.failed) logBatch.set(db.collection('order_logs').doc(), { orderId, username: row.username, result: 'failed', biEarned: 0, reason: row.reason, raw: row.raw, provider: 'qvtool', createdAt: FieldValue.serverTimestamp() });
    await logBatch.commit();

    const biDone = result.totalBi;
    const status = result.status === 'completed'
      ? (result.failed.length || biDone < pkg.totalBi ? 'partial' : 'completed')
      : (result.timedOut || ['stopping', 'interrupted', 'stopped'].includes(result.status) ? 'partial' : 'failed');
    await orderRef.update({ status, provider: 'qvtool', qvtoolBatchId: result.batchId, qvtoolSource: source, biDone, biTarget: pkg.totalBi, successCount: result.success.length, failedCount: result.failed.length, charged: result.charged, completedAt: FieldValue.serverTimestamp() });
    return { success: status === 'completed', message: `${status}: ${biDone}/${pkg.totalBi} Vé nhảy` };
  } catch (error) {
    if (accounts.length) await accountPool.releaseAccounts(accounts.map((a) => a.id));
    const retryCount = (order.retryCount || 0) + 1;
    if (retryCount < config.maxRetries) await orderRef.update({ status: 'queued', retryCount, lastError: error.message });
    else await orderRef.update({ status: 'failed', retryCount, error: error.message, completedAt: FieldValue.serverTimestamp() });
    return { success: false, message: error.message };
  }
}

module.exports = { processOrder };
