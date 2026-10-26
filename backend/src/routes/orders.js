/**
 * Express API Router - Orders
 */
const express = require('express');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { normalizeChungSucCode } = require('../services/chungSucCode');
const {
  requireFirebaseUser,
  requireAdminOrFirebaseUser,
} = require('../middleware/firebaseAuth');
const { orderRateLimit } = require('../middleware/orderRateLimit');

const router = express.Router();

/**
 * POST /api/orders
 * Create a new order
 * Body: { chungSucCode, packageId, quantity }
 */
router.post('/', requireFirebaseUser, orderRateLimit, async (req, res) => {
  try {
    const { chungSucCode, packageId } = req.body;
    const clientRequestId = String(req.body.clientRequestId || '').trim().slice(0, 120);
    const quantity = Math.min(Math.max(Number.parseInt(req.body.quantity, 10) || 1, 1), 100);
    const normalizedCode = normalizeChungSucCode(chungSucCode);

    if (!normalizedCode) {
      return res.status(400).json({
        error: 'Mã Chung Sức phải có đúng 10 ký tự chữ/số (ví dụ: --RjAeKB2cvY--).',
      });
    }
    if (!packageId) {
      return res.status(400).json({ error: 'Missing required field: packageId' });
    }

    // Get package settings
    const db = getFirestore();
    if (clientRequestId) {
      const duplicateSnap = await db.collection('orders')
        .where('userId', '==', req.user.uid)
        .where('clientRequestId', '==', clientRequestId)
        .limit(1)
        .get();
      if (!duplicateSnap.empty) {
        const existing = duplicateSnap.docs[0];
        return res.status(200).json({ success: true, duplicate: true, orderId: existing.id, ...existing.data(), balanceAfter: null });
      }
    }
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

    const unitPrice = Math.max(0, Number(pkg.price) || 0);
    const unitBi = Math.max(0, Number(pkg.totalBi ?? pkg.bi) || 0);
    const unitAccounts = Math.max(1, Number.parseInt(pkg.accRequired, 10) || 1);
    const biPerAccount = Math.max(1, Number.parseInt(pkg.biPerAcc, 10) || Math.ceil(unitBi / unitAccounts) || 38);
    const amount = unitPrice * quantity;
    const biTarget = unitBi * quantity;
    const accRequired = unitAccounts * quantity;

    // Create the order and reserve the user's balance atomically. This keeps
    // the server authoritative and prevents concurrent requests from spending
    // the same balance twice.
    const orderId = uuidv4().substring(0, 8).toUpperCase();
    const orderRef = db.collection('orders').doc(orderId);
    const balanceRef = db.collection('user_balances').doc(req.user.uid);
    const customerName = String(
      req.user.name || req.user.email?.split('@')[0] || 'Khách hàng',
    ).trim().slice(0, 80) || 'Khách hàng';
    const orderData = {
      chungSucCode: normalizedCode,
      packageId,
      packageName: pkg.name,
      quantity,
      clientRequestId: clientRequestId || null,
      customerName,
      userId: req.user.uid,
      userEmail: req.user.email || null,
      accRequired,
      biPerAcc: biPerAccount,
      amount,
      biTarget,
      biDone: 0,
      status: 'queued', // queued | processing | completed | partial | failed
      retryCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      completedAt: null,
      error: null,
    };

    let balanceAfter = 0;
    await db.runTransaction(async (transaction) => {
      const balanceSnap = await transaction.get(balanceRef);
      const currentBalance = Math.max(0, Number(balanceSnap.exists ? balanceSnap.data().balance || 0 : 0));
      if (currentBalance < amount) {
        const error = new Error(`Số dư không đủ. Cần ${amount.toLocaleString('vi-VN')}đ.`);
        error.code = 'INSUFFICIENT_BALANCE';
        throw error;
      }
      balanceAfter = currentBalance - amount;
      if (amount > 0) {
        transaction.set(balanceRef, {
          balance: balanceAfter,
          email: req.user.email || null,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      transaction.create(orderRef, orderData);
    });

    console.log(`[API] Order created: ${orderId} - ${pkg.name} - code: ${chungSucCode}`);

    res.status(201).json({
      success: true,
      orderId,
      ...orderData,
      balanceAfter,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Create order error:', error);
    const status = error.code === 'INSUFFICIENT_BALANCE' ? 402 : 500;
    res.status(status).json({ error: error.message });
  }
});

/**
 * GET /api/orders/:id/logs
 * Get logs for an order. Keep this route before /:id so "logs" cannot be
 * interpreted as an order id.
 */
router.get('/:id/logs', requireAdminOrFirebaseUser(config), async (req, res) => {
  try {
    const db = getFirestore();
    const order = await db.collection('orders').doc(req.params.id).get();
    if (!order.exists) return res.status(404).json({ error: 'Order not found' });
    const orderData = order.data();
    if (!req.isAdmin && (!orderData.userId || orderData.userId !== req.user.uid)) {
      return res.status(403).json({ error: 'Bạn không có quyền xem log đơn hàng này.' });
    }
    const snap = await db.collection('order_logs')
      .where('orderId', '==', req.params.id)
      .orderBy('createdAt', 'desc')
      .get();
    const logs = snap.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null };
    });
    res.json({ logs });
  } catch (error) {
    console.error('[API] Get order logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orders/:id
 * Get order status
 */
router.get('/:id', requireAdminOrFirebaseUser(config), async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('orders').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const data = doc.data();
    if (!req.isAdmin && data.userId && data.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Bạn không có quyền xem đơn hàng này.' });
    }
    if (!req.isAdmin && !data.userId) {
      return res.status(403).json({ error: 'Đơn hàng cũ không có thông tin chủ sở hữu.' });
    }
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
 * List orders. Admins receive all orders; signed-in users receive only their
 * own orders.
 * Query: ?status=queued&limit=50
 */
router.get('/', requireAdminOrFirebaseUser(config), async (req, res) => {
  try {
    const db = getFirestore();
    const isAdmin = Boolean(req.isAdmin);
    // Customer history uses a simple userId query to avoid requiring a
    // composite Firestore index; it is sorted and filtered after the read.
    let query = isAdmin
      ? db.collection('orders').orderBy('createdAt', 'desc')
      : db.collection('orders').where('userId', '==', req.user.uid);

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    query = query.limit(limit);

    const snap = await query.get();
    let orders = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
        completedAt: data.completedAt?.toDate?.()?.toISOString?.() || null,
      };
    });
    if (!isAdmin) {
      if (req.query.status) orders = orders.filter((order) => order.status === req.query.status);
      orders.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    } else if (req.query.status) {
      orders = orders.filter((order) => order.status === req.query.status);
    }

    res.json({ orders, total: orders.length });
  } catch (error) {
    console.error('[API] List orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
