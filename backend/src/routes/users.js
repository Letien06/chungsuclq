/** Firebase Auth users (Admin only). */
const express = require('express');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 200, 1), 1000);
    const result = await getAuth().listUsers(limit, req.query.pageToken || undefined);
    const ordersSnap = await getFirestore().collection('orders').select('userId', 'userEmail').get();
    const orderCounts = new Map();
    ordersSnap.docs.forEach((doc) => {
      const data = doc.data();
      const key = data.userId || data.userEmail;
      if (key) orderCounts.set(key, (orderCounts.get(key) || 0) + 1);
    });

    const users = result.users.map((user) => ({
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || user.email?.split('@')[0] || 'Chưa đặt tên',
      photoURL: user.photoURL || null,
      disabled: Boolean(user.disabled),
      providerIds: user.providerData.map((provider) => provider.providerId),
      createdAt: user.metadata.creationTime || null,
      lastSignInAt: user.metadata.lastSignInTime || null,
      orderCount: orderCounts.get(user.uid) || orderCounts.get(user.email) || 0,
    }));

    res.json({ users, nextPageToken: result.pageToken || null });
  } catch (error) {
    console.error('[API] List Firebase users error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:uid', async (req, res) => {
  try {
    const changes = {};
    if (typeof req.body.disabled === 'boolean') changes.disabled = req.body.disabled;
    if (req.body.displayName !== undefined) {
      const displayName = String(req.body.displayName).trim().slice(0, 80);
      if (!displayName) return res.status(400).json({ error: 'Tên hiển thị không được để trống.' });
      changes.displayName = displayName;
    }
    if (!Object.keys(changes).length) return res.status(400).json({ error: 'Không có thay đổi hợp lệ.' });

    const user = await getAuth().updateUser(req.params.uid, changes);
    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || user.email?.split('@')[0] || 'Chưa đặt tên',
        disabled: Boolean(user.disabled),
        createdAt: user.metadata.creationTime || null,
        lastSignInAt: user.metadata.lastSignInTime || null,
      },
    });
  } catch (error) {
    console.error('[API] Update Firebase user error:', error);
    const status = error.code === 'auth/user-not-found' ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

module.exports = router;
