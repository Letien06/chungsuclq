/**
 * Express API Router - Orders
 */
const express = require('express');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const router = express.Router();

/**
 * POST /api/orders
 * Create a new order
 * Body: { chungSucCode, packageId, customerName? }
 */
router.post('/', async (req, res) => {
  try {
    const { chungSucCode, packageId, customerName } = req.body;

    if (!chungSucCode || !packageId) {
      return res.status(400).json({
        error: 'Missing required fields: chungSucCode, packageId',
      });
    }

    // Get package settings
    const db = getFirestore();
    const settingsSnap = await db.collection('settings').doc('packages').get();
    const packages = settingsSnap.exists
      ? settingsSnap.data()
      : config.defaultPackages;

    const pkg = packages[packageId];
    if (!pkg) {
      return res.status(400).json({
        error: `Unknown package: ${packageId}. Available: ${Object.keys(packages).join(', ')}`,
      });
    }

    // Create order
    const orderId = uuidv4().substring(0, 8).toUpperCase();
    const orderData = {
      chungSucCode,
      packageId,
      packageName: pkg.name,
      customerName: customerName || 'Khách hàng',
      accRequired: pkg.accRequired,
      biTarget: pkg.totalBi,
      biDone: 0,
      status: 'queued', // queued | processing | completed | partial | failed
      retryCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      completedAt: null,
      error: null,
    };

    await db.collection('orders').doc(orderId).set(orderData);

    console.log(`[API] Order created: ${orderId} - ${pkg.name} - code: ${chungSucCode}`);

    res.status(201).json({
      success: true,
      orderId,
      ...orderData,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Create order error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orders/:id
 * Get order status
 */
router.get('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('orders').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const data = doc.data();
    res.json({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
      completedAt: data.completedAt?.toDate?.()?.toISOString?.() || null,
    });
  } catch (error) {
    console.error('[API] Get order error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orders
 * List all orders (admin)
 * Query: ?status=queued&limit=50
 */
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    let query = db.collection('orders').orderBy('createdAt', 'desc');

    if (req.query.status) {
      query = query.where('status', '==', req.query.status);
    }

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    query = query.limit(limit);

    const snap = await query.get();
    const orders = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
        completedAt: data.completedAt?.toDate?.()?.toISOString?.() || null,
      };
    });

    res.json({ orders, total: orders.length });
  } catch (error) {
    console.error('[API] List orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orders/:id/logs
 * Get logs for an order
 */
router.get('/:id/logs', async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db
      .collection('order_logs')
      .where('orderId', '==', req.params.id)
      .orderBy('createdAt', 'desc')
      .get();

    const logs = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
      };
    });

    res.json({ logs });
  } catch (error) {
    console.error('[API] Get order logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
