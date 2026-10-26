const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const qvtool = require('./qvtool');
const accountPool = require('./accountPool');
const config = require('../config');

const TERMINAL_BATCH_STATES = new Set(['completed', 'stopped', 'interrupted']);
const asNumber = (value, fallback = 0) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; };
const isDeadReason = (reason) => /dead|invalid|banned|disabled|exhaust|h(?:ế|e)t\s*l(?:ư|u)ợt/i.test(String(reason || ''));
const isTemporaryReason = (reason) => /transport|timeout|network|server[_ -]?rejected|credit|rate|busy|temporar|unavailable|429|5\d\d/i.test(String(reason || ''));

async function settleAccounts(accounts, result) {
  const rowsByUsername = new Map(result.success.concat(result.failed).map((row) => [row.username, row]));
  for (const account of accounts) {
    const row = rowsByUsername.get(account.username);
    if (!row) await accountPool.releaseAccounts([account.id]);
    else if (result.success.includes(row)) await accountPool.markUsedSuccess(account.id, row.biEarned || 0);
    else if (isDeadReason(row.reason)) await accountPool.markDead(account.id, row.reason);
    else if (isTemporaryReason(row.reason)) await accountPool.releaseAccounts([account.id]);
    else await accountPool.markUsedSuccess(account.id, 0);
  }
}

async function writeBatchLogs(db, orderId, batchNumber, phase, result) {
  const batch = db.batch();
  const common = { orderId, batchId: result.batchId, batchNumber, phase, provider: 'qvtool', createdAt: FieldValue.serverTimestamp() };
  for (const row of result.success) batch.set(db.collection('order_logs').doc(), { ...common, username: row.username, result: 'success', biEarned: row.biEarned, raw: row.raw });
  for (const row of result.failed) batch.set(db.collection('order_logs').doc(), { ...common, username: row.username, result: 'failed', biEarned: 0, reason: row.reason, raw: row.raw });
  batch.set(db.collection('order_logs').doc(), { ...common, event: 'batch_completed', result: result.status, totalBi: result.totalBi, successCount: result.success.length, failedCount: result.failed.length, charged: result.charged });
  await batch.commit();
}

async function claimOrder(db, orderRef) {
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(orderRef);
    if (!snap.exists) return null;
    const data = snap.data();
    const target = asNumber(data.biTarget);
    const resumablePartial = data.status === 'partial' && asNumber(data.biDone) < target;
    const pendingBatch = data.status === 'processing' && data.qvtoolBatchPending === true;
    if (data.status !== 'queued' && !resumablePartial && !pendingBatch) return data;
    transaction.update(orderRef, { status: 'processing', processingStartedAt: FieldValue.serverTimestamp() });
    return { ...data, status: 'processing' };
  });
}

/** Process initial accounts, then measured top-up batches until target or pool exhaustion. */
async function processOrder(orderId) {
  const db = getFirestore();
  const orderRef = db.collection('orders').doc(orderId);
  const order = await claimOrder(db, orderRef);
  if (!order) return { success: false, message: 'Order not found' };
  if (order.status !== 'processing') return { success: false, message: `Order status is ${order.status}, not queued or resumable` };

  const settings = await db.collection('settings').doc('packages').get();
  const packages = settings.exists ? settings.data() : config.defaultPackages;
  const pkg = packages[order.packageId] || config.defaultPackages[order.packageId];
  if (!pkg) {
    await orderRef.update({ status: 'failed', error: `Unknown package: ${order.packageId}`, completedAt: FieldValue.serverTimestamp() });
    return { success: false, message: 'Unknown package' };
  }

  // Prefer the immutable values captured when the order was paid.
  const target = Math.max(0, asNumber(order.biTarget, asNumber(pkg.totalBi)));
  const initialCount = Math.max(1, asNumber(order.accRequired, asNumber(pkg.accRequired, 1)));
  const perAccountBi = Math.max(1, asNumber(order.biPerAcc, asNumber(pkg.biPerAcc, target / initialCount || 38)));
  let biDone = Math.max(0, asNumber(order.biDone));
  let successCount = Math.max(0, asNumber(order.successCount));
  let failedCount = Math.max(0, asNumber(order.failedCount));
  let charged = Math.max(0, asNumber(order.charged));
  let batchIds = Array.isArray(order.qvtoolBatchIds) ? [...order.qvtoolBatchIds] : (order.qvtoolBatchId ? [order.qvtoolBatchId] : []);
  let batchNumber = batchIds.length;
  // A partial order already has batches recorded; resume with only the
  // number of accounts needed for its remaining ticket target.
  let firstBatch = batchIds.length === 0 && biDone === 0;
  const maxBatches = Math.max(1, asNumber(config.maxOrderBatches, 20));
  const maxAccounts = Math.max(initialCount, asNumber(config.maxOrderAccounts, 100));
  let claimedOwnAccounts = 0;
  let activeAccounts = [];
  let pendingBatchState = null;
  let lastSource = order.qvtoolSource || null;

  try {
    if (order.qvtoolBatchPending && order.qvtoolBatchId) {
      const pending = qvtool.normalizeResults(await qvtool.waitForBatch(order.qvtoolBatchId));
      if (pending.timedOut) {
        await orderRef.update({ status: 'processing', qvtoolBatchPending: true });
        return { success: false, message: 'QVTool batch vẫn đang xử lý, chưa tạo batch mới.' };
      }
      const pendingAccounts = await accountPool.getAccountsByIds(order.qvtoolBatchAccountIds || []);
      await settleAccounts(pendingAccounts, pending);
      if (pending.batchId && !batchIds.includes(pending.batchId)) batchIds.push(pending.batchId);
      batchNumber = batchIds.length;
      biDone += pending.totalBi;
      successCount += pending.success.length;
      failedCount += pending.failed.length;
      charged += pending.charged;
      await writeBatchLogs(db, orderId, batchNumber || 1, 'resume', pending);
      await orderRef.update({ qvtoolBatchPending: false, qvtoolBatchAccountIds: [], biDone, successCount, failedCount, charged, status: 'processing' });
      firstBatch = false;
    }
    while (firstBatch || biDone < target) {
      const neededBi = Math.max(0, target - biDone);
      const calculated = firstBatch ? initialCount : Math.max(1, Math.ceil(neededBi / perAccountBi));
      const requested = firstBatch
        ? calculated
        : Math.min(calculated, Math.max(0, maxAccounts - claimedOwnAccounts));
      if (!requested) break;
      let accounts = await accountPool.claimAvailableAccounts(requested);
      let source = 'own';
      if (accounts.length < requested) {
        if (accounts.length) await accountPool.releaseAccounts(accounts.map((account) => account.id));
        accounts = [];
        source = 'stock';
      } else if (!accounts.length) {
        break;
      }
      activeAccounts = accounts;
      claimedOwnAccounts += accounts.length;
      const perCode = source === 'own' ? accounts.length : requested;
      const batch = await qvtool.createBatch({ code: order.chungSucCode, accounts, perCode, source });
      await orderRef.update({ status: 'processing', qvtoolBatchPending: true, qvtoolBatchId: batch.id, qvtoolBatchAccountIds: accounts.map((account) => account.id), qvtoolSource: source });
      pendingBatchState = { id: batch.id, accountIds: accounts.map((account) => account.id), source };
      const result = qvtool.normalizeResults(await qvtool.waitForBatch(batch.id));
      if (result.timedOut) {
        await orderRef.update({ status: 'processing', qvtoolBatchPending: true, qvtoolBatchId: batch.id, qvtoolBatchAccountIds: pendingBatchState.accountIds, qvtoolSource: source });
        pendingBatchState = null;
        activeAccounts = [];
        return { success: false, message: 'QVTool batch vẫn đang xử lý.' };
      }
      await settleAccounts(accounts, result);
      pendingBatchState = null;
      activeAccounts = [];
      batchNumber += 1;
      batchIds.push(result.batchId);
      biDone += result.totalBi;
      successCount += result.success.length;
      failedCount += result.failed.length;
      charged += result.charged;
      lastSource = source;
      await writeBatchLogs(db, orderId, batchNumber, firstBatch ? 'initial' : 'topup', result);
      await orderRef.update({ status: 'processing', provider: 'qvtool', qvtoolBatchPending: false, qvtoolBatchAccountIds: [], qvtoolBatchId: result.batchId, qvtoolBatchIds: batchIds, qvtoolSource: source, biDone, biTarget: target, successCount, failedCount, charged });
      firstBatch = false;
      if (result.timedOut || result.status !== 'completed' || result.totalBi <= 0 || result.success.length === 0) break;
      if (batchNumber >= maxBatches) break;
    }

    const reachedTarget = biDone >= target;
    const status = reachedTarget ? 'completed' : 'partial';
    await orderRef.update({ status, provider: 'qvtool', qvtoolBatchIds: batchIds, qvtoolBatchId: batchIds[batchIds.length - 1] || null, qvtoolSource: lastSource, biDone, biTarget: target, successCount, failedCount, charged, completedAt: FieldValue.serverTimestamp(), ...(reachedTarget ? {} : { partialReason: 'target_not_reached_or_account_pool_exhausted' }) });
    return { success: reachedTarget, message: `${status}: ${biDone}/${target} Vé nhảy` };
  } catch (error) {
    if (pendingBatchState) {
      await orderRef.update({ status: 'processing', qvtoolBatchPending: true, qvtoolBatchId: pendingBatchState.id, qvtoolBatchAccountIds: pendingBatchState.accountIds, qvtoolSource: pendingBatchState.source, lastError: error.message });
      return { success: false, message: 'QVTool batch đang xử lý, sẽ được kiểm tra lại.' };
    }
    if (activeAccounts.length) await accountPool.releaseAccounts(activeAccounts.map((account) => account.id));
    const retryCount = (order.retryCount || 0) + 1;
    if (retryCount < config.maxRetries) await orderRef.update({ status: 'queued', retryCount, biDone, biTarget: target, lastError: error.message });
    else await orderRef.update({ status: biDone > 0 ? 'partial' : 'failed', retryCount, biDone, biTarget: target, error: error.message, completedAt: FieldValue.serverTimestamp() });
    return { success: false, message: error.message };
  }
}

module.exports = { processOrder };
