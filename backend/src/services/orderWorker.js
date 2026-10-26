const { getFirestore } = require('firebase-admin/firestore');
const { processOrder } = require('./orderProcessor');

let running = false;

async function findNextOrder() {
  const orders = getFirestore().collection('orders');
  const queued = await orders.where('status', '==', 'queued').orderBy('createdAt', 'asc').limit(1).get();
  if (!queued.empty) return queued.docs[0];
  const partial = await orders.where('status', '==', 'partial').orderBy('createdAt', 'asc').limit(1).get();
  if (!partial.empty) return partial.docs[0];
  const pending = await orders.where('status', '==', 'processing').where('qvtoolBatchPending', '==', true).limit(1).get();
  return pending.empty ? null : pending.docs[0];
}

async function processNextQueuedOrder() {
  if (running) return;
  running = true;
  try {
    const doc = await findNextOrder();
    if (doc) {
      console.log(`[Worker] Processing ${doc.data().status} order ${doc.id}`);
      console.log('[Worker] Result:', await processOrder(doc.id));
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
