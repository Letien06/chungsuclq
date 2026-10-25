const { getFirestore } = require('firebase-admin/firestore');
const { processOrder } = require('./orderProcessor');

let running = false;

async function processNextQueuedOrder() {
  if (running) return;
  running = true;
  try {
    const snap = await getFirestore()
      .collection('orders')
      .where('status', '==', 'queued')
      .orderBy('createdAt', 'asc')
      .limit(1)
      .get();
    if (!snap.empty) {
      const orderId = snap.docs[0].id;
      console.log(`[Worker] Processing queued order ${orderId}`);
      console.log('[Worker] Result:', await processOrder(orderId));
    }
  } catch (error) {
    console.error('[Worker] Poll failed:', error.message);
  } finally {
    running = false;
  }
}

function startOrderWorker() {
  if (process.env.ORDER_WORKER_ENABLED === 'false') return null;
  const intervalMs = Math.max(5000, Number(process.env.ORDER_POLL_INTERVAL_MS || 30000));
  console.log(`[Worker] Queue poller enabled (every ${intervalMs}ms)`);
  processNextQueuedOrder();
  return setInterval(processNextQueuedOrder, intervalMs);
}

module.exports = { startOrderWorker, processNextQueuedOrder };
