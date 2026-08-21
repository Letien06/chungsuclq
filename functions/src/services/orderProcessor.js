/**
 * Order Processing Worker
 *
 * Processes orders from Firestore:
 * 1. Pick up new orders (status: queued)
 * 2. Get worker accounts from pool
 * 3. Run Puppeteer automation on sieucap5s
 * 4. Update order status and log results
 */
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const SieuCap5sAutomation = require('./sieucap5s');
const accountPool = require('./accountPool');
const config = require('../config');

/**
 * Process a single order
 * @param {string} orderId - Firestore document ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function processOrder(orderId) {
  const db = getFirestore();
  const orderRef = db.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    return { success: false, message: 'Order not found' };
  }

  const order = orderSnap.data();

  // Only process queued orders
  if (order.status !== 'queued') {
    return { success: false, message: `Order status is ${order.status}, not queued` };
  }

  // Update status to processing
  await orderRef.update({
    status: 'processing',
    processingStartedAt: FieldValue.serverTimestamp(),
  });

  console.log(`[Worker] Processing order ${orderId}: ${order.packageId} - code: ${order.chungSucCode}`);

  // Get package settings
  const settingsSnap = await db.collection('settings').doc('packages').get();
  const packageSettings = settingsSnap.exists
    ? settingsSnap.data()
    : config.defaultPackages;

  const pkg = packageSettings[order.packageId] || config.defaultPackages[order.packageId];
  if (!pkg) {
    await orderRef.update({
      status: 'failed',
      error: `Unknown package: ${order.packageId}`,
      completedAt: FieldValue.serverTimestamp(),
    });
    return { success: false, message: `Unknown package: ${order.packageId}` };
  }

  const accNeeded = pkg.accRequired;

  // Get available worker accounts
  const accounts = await accountPool.getAvailableAccounts(accNeeded);

  if (accounts.length < accNeeded) {
    await orderRef.update({
      status: 'failed',
      error: `Not enough accounts. Need ${accNeeded}, have ${accounts.length} available`,
      completedAt: FieldValue.serverTimestamp(),
    });
    return {
      success: false,
      message: `Not enough accounts: need ${accNeeded}, available ${accounts.length}`,
    };
  }

  // Lock accounts
  await accountPool.markInUse(accounts.map((a) => a.id));

  let automation = null;

  try {
    // Initialize Puppeteer
    automation = new SieuCap5sAutomation();
    await automation.init();

    // Login to sieucap5s
    await automation.login();

    // Run the tool
    const results = await automation.runTool(accounts, order.chungSucCode);

    // Process results - match results back to account IDs
    const successUsernames = new Set(results.success.map((s) => s.username));
    const failedUsernames = new Set(results.failed.map((f) => f.username));

    // Update account statuses
    for (const acc of accounts) {
      if (successUsernames.has(acc.username)) {
        const successEntry = results.success.find((s) => s.username === acc.username);
        await accountPool.markUsedSuccess(acc.id, successEntry?.biEarned || 0);
      } else if (failedUsernames.has(acc.username)) {
        const failedEntry = results.failed.find((f) => f.username === acc.username);
        const reason = failedEntry?.reason || 'unknown';

        // If "hết lượt giúp", mark as cooldown (not dead - might work for another code)
        if (reason.includes('hết lượt')) {
          await accountPool.markUsedSuccess(acc.id, 0); // cooldown
        } else {
          await accountPool.markDead(acc.id, reason);
        }
      } else {
        // Account not in results - release it
        await accountPool.releaseAccounts([acc.id]);
      }
    }

    // Log results
    const logBatch = db.batch();
    for (const s of results.success) {
      const logRef = db.collection('order_logs').doc();
      logBatch.set(logRef, {
        orderId,
        username: s.username,
        result: 'success',
        biEarned: s.biEarned,
        raw: s.raw,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    for (const f of results.failed) {
      const logRef = db.collection('order_logs').doc();
      logBatch.set(logRef, {
        orderId,
        username: f.username,
        result: 'failed',
        biEarned: 0,
        reason: f.reason,
        raw: f.raw,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await logBatch.commit();

    // Update order status
    const biDone = results.totalBi;
    const biTarget = pkg.totalBi;
    const isComplete = biDone >= biTarget || !results.timedOut;

    await orderRef.update({
      status: isComplete ? 'completed' : 'partial',
      biDone,
      biTarget,
      successCount: results.success.length,
      failedCount: results.failed.length,
      completedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[Worker] Order ${orderId} ${isComplete ? 'completed' : 'partial'}: ${biDone}/${biTarget} Bỉ`);
    return { success: true, message: `Completed: ${biDone}/${biTarget} Bỉ` };
  } catch (error) {
    console.error(`[Worker] Order ${orderId} error:`, error.message);

    // Release locked accounts on error
    await accountPool.releaseAccounts(accounts.map((a) => a.id));

    // Update order status
    const retryCount = (order.retryCount || 0) + 1;

    if (retryCount < config.maxRetries) {
      await orderRef.update({
        status: 'queued', // Put back in queue for retry
        retryCount,
        lastError: error.message,
      });
      return { success: false, message: `Error (will retry ${retryCount}/${config.maxRetries}): ${error.message}` };
    } else {
      await orderRef.update({
        status: 'failed',
        retryCount,
        error: error.message,
        completedAt: FieldValue.serverTimestamp(),
      });
      return { success: false, message: `Failed after ${retryCount} retries: ${error.message}` };
    }
  } finally {
    // Always close browser
    if (automation) {
      await automation.close();
    }
  }
}

module.exports = { processOrder };
