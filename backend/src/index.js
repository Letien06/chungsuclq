/**
 * Standalone Backend Server
 * Deploy on Render.com (FREE tier)
 * Uses Firebase Admin SDK to access Firestore (FREE Spark plan)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { initializeApp, cert, applicationDefault } = require('firebase-admin/app');
const config = require('./config');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'data', 'serviceAccountKey.json');
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Parse JSON from env var (for Render.com deployment)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
    console.log('[Firebase] Init via env var');
  } else if (fs.existsSync(serviceAccountPath)) {
    // Use local file (for development)
    const serviceAccount = require(serviceAccountPath);
    initializeApp({ credential: cert(serviceAccount) });
    console.log('[Firebase] Init via serviceAccountKey.json');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({ credential: applicationDefault() });
    console.log('[Firebase] Init via GOOGLE_APPLICATION_CREDENTIALS');
  } else {
    // Fallback
    initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'chungsuclq-auto' });
    console.log('[Firebase] Init via project ID only (limited access)');
  }
} catch (error) {
  console.error('[Firebase] Init error:', error.message);
  process.exit(1);
}

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Simple admin auth middleware
const adminAuth = (req, res, next) => {
  const adminPassword = req.headers['x-admin-password'] || req.query.adminPassword;
  if (adminPassword !== config.adminPassword) {
    return res.status(401).json({ error: 'Unauthorized - invalid admin password' });
  }
  next();
};

// ==========================================
// Routes
// ==========================================

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
    project: process.env.FIREBASE_PROJECT_ID || 'chungsuclq-auto',
  });
});

// Admin dashboard stats
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const { getFirestore } = require('firebase-admin/firestore');
    const db = getFirestore();
    const accountPool = require('./services/accountPool');

    const ordersSnap = await db.collection('orders').get();
    const orderStats = { total: 0, queued: 0, processing: 0, completed: 0, failed: 0, partial: 0 };
    ordersSnap.docs.forEach((doc) => {
      const data = doc.data();
      orderStats.total++;
      if (orderStats[data.status] !== undefined) orderStats[data.status]++;
    });

    const accountStats = await accountPool.getStats();

    res.json({ orders: orderStats, accounts: accountStats });
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
    console.log(`[Admin] Processing order: ${orderId}`);

    // Respond immediately, process in background
    res.json({ message: `Processing order ${orderId}`, orderId });

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

// ==========================================
// Start Server
// ==========================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Backend server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Project: ${process.env.FIREBASE_PROJECT_ID || 'chungsuclq-auto'}\n`);
});
