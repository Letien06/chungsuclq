/**
 * Cloud Functions Entry Point
 *
 * Exports:
 * 1. api - Express HTTP function (handles all /api/* routes)
 * 2. processNewOrder - Firestore trigger when a new order is created
 */
const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const express = require('express');
const cors = require('cors');
const config = require('./config');

// Initialize Firebase Admin
initializeApp();

// =========================================
// 1. Express API (HTTP Cloud Function)
// =========================================

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple admin auth middleware for protected routes
const adminAuth = (req, res, next) => {
  const adminPassword = req.headers['x-admin-password'] || req.query.adminPassword;

  if (adminPassword !== config.adminPassword) {
    return res.status(401).json({ error: 'Unauthorized - invalid admin password' });
  }

  next();
};

// Public routes
app.use('/api/orders', require('./routes/orders'));

// Admin-protected routes
app.use('/api/accounts', adminAuth, require('./routes/accounts'));
app.use('/api/settings', adminAuth, require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Admin dashboard stats
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const { getFirestore } = require('firebase-admin/firestore');
    const db = getFirestore();
    const accountPool = require('./services/accountPool');

    // Get order counts by status
    const ordersSnap = await db.collection('orders').get();
    const orderStats = {
      total: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      partial: 0,
    };

    ordersSnap.docs.forEach((doc) => {
      const data = doc.data();
      orderStats.total++;
      if (orderStats[data.status] !== undefined) {
        orderStats[data.status]++;
      }
    });

    // Get account stats
    const accountStats = await accountPool.getStats();

    res.json({
      orders: orderStats,
      accounts: accountStats,
    });
  } catch (error) {
    console.error('[API] Admin stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual trigger to process queued orders (admin)
app.post('/api/admin/process', adminAuth, async (req, res) => {
  try {
    const { getFirestore } = require('firebase-admin/firestore');
    const { processOrder } = require('./services/orderProcessor');
    const db = getFirestore();

    // Get queued orders
    const snap = await db
      .collection('orders')
      .where('status', '==', 'queued')
      .orderBy('createdAt', 'asc')
      .limit(1)
      .get();

    if (snap.empty) {
      return res.json({ message: 'No queued orders to process' });
    }

    const orderId = snap.docs[0].id;
    console.log(`[Admin] Manually processing order: ${orderId}`);

    // Process in background - respond immediately
    res.json({
      message: `Processing order ${orderId}`,
      orderId,
    });

    // Actually process (this will continue after response is sent)
    try {
      const result = await processOrder(orderId);
      console.log(`[Admin] Order ${orderId} result:`, result);
    } catch (err) {
      console.error(`[Admin] Order ${orderId} error:`, err);
    }
  } catch (error) {
    console.error('[API] Manual process error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('[API] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export as Cloud Function (v2 - runs on Cloud Run)
exports.api = onRequest(
  {
    region: 'asia-southeast1', // Singapore - closest to Vietnam
    memory: '256MiB',
    timeoutSeconds: 60,
    cors: true,
  },
  app,
);

// =========================================
// 2. Firestore Trigger - Auto-process new orders
// =========================================

exports.processNewOrder = onDocumentCreated(
  {
    document: 'orders/{orderId}',
    region: 'asia-southeast1',
    memory: '2GiB', // Puppeteer needs more memory
    timeoutSeconds: 540, // 9 minutes max
  },
  async (event) => {
    const orderId = event.params.orderId;
    const data = event.data?.data();

    if (!data || data.status !== 'queued') {
      console.log(`[Trigger] Skipping order ${orderId} - status: ${data?.status}`);
      return;
    }

    console.log(`[Trigger] New order detected: ${orderId}`);

    try {
      const { processOrder } = require('./services/orderProcessor');
      const result = await processOrder(orderId);
      console.log(`[Trigger] Order ${orderId} result:`, result);
    } catch (error) {
      console.error(`[Trigger] Order ${orderId} error:`, error);
    }
  },
);
