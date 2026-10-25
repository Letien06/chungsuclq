/**
 * Express API Router - Settings (Admin)
 * Manages package configuration (number of accounts per package, etc.)
 */
const express = require('express');
const { getFirestore } = require('firebase-admin/firestore');
const config = require('../config');
const qvtool = require('../services/qvtool');
const accountPool = require('../services/accountPool');
const { normalizeChungSucCode } = require('../services/chungSucCode');

const router = express.Router();

/**
 * GET /api/settings
 * Get current settings (packages config)
 */
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('settings').doc('packages').get();

    if (!doc.exists) {
      // Return defaults
      res.json({
        packages: config.defaultPackages,
        isDefault: true,
      });
    } else {
      res.json({
        packages: doc.data(),
        isDefault: false,
      });
    }
  } catch (error) {
    console.error('[API] Get settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/settings
 * Update package settings
 * Body: {
 *   ruong_ss: { name: "Rương SS", accRequired: 5, biPerAcc: 38, totalBi: 190 },
 *   full_ruong: { name: "Full 3 Rương", accRequired: 9, biPerAcc: 38, totalBi: 342 }
 * }
 */
router.put('/', async (req, res) => {
  try {
    const packages = req.body;

    if (!packages || typeof packages !== 'object') {
      return res.status(400).json({ error: 'Invalid settings format' });
    }

    // Validate each package
    for (const [id, pkg] of Object.entries(packages)) {
      if (!pkg.name || !pkg.accRequired || !pkg.biPerAcc) {
        return res.status(400).json({
          error: `Invalid package ${id}: requires name, accRequired, biPerAcc`,
        });
      }
      // Ensure totalBi is calculated
      pkg.biPerAcc = parseInt(pkg.biPerAcc) || 38;
      pkg.totalBi = pkg.accRequired * pkg.biPerAcc;
      pkg.id = id;
    }

    const db = getFirestore();
    await db.collection('settings').doc('packages').set(packages);

    console.log('[API] Settings updated:', JSON.stringify(packages));

    res.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error('[API] Update settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/settings/reset
 * Reset to default settings
 */
router.post('/reset', async (req, res) => {
  try {
    const db = getFirestore();
    await db.collection('settings').doc('packages').set(config.defaultPackages);

    res.json({
      success: true,
      packages: config.defaultPackages,
    });
  } catch (error) {
    console.error('[API] Reset settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/settings/test-tool
 * Run a small QVTool test using one local account when available,
 * otherwise QVTool's stock pool.
 */
router.post('/test-tool', async (req, res) => {
  const { code } = req.body;
  const normalizedCode = normalizeChungSucCode(code);
  if (!normalizedCode) {
    return res.status(400).json({ error: 'Mã Chung Sức phải có đúng 10 ký tự chữ/số.' });
  }

  const accounts = await accountPool.getAvailableAccounts(1);
  const source = accounts.length > 0 ? 'own' : 'stock';
  const selectedAccounts = source === 'own' ? [accounts[0]] : [];

  try {
    if (source === 'own') await accountPool.markInUse(selectedAccounts.map((account) => account.id));
    const batch = await qvtool.createBatch({ code: normalizedCode, accounts: selectedAccounts, perCode: 1, source });

    const results = qvtool.normalizeResults(await qvtool.waitForBatch(batch.id));
    if (source === 'own') {
      const row = results.success[0] || results.failed[0];
      if (row) await accountPool.markUsedSuccess(selectedAccounts[0].id, row.biEarned || 0);
      else await accountPool.releaseAccounts(selectedAccounts.map((account) => account.id));
    }

    res.json({
      success: true,
      message: `Đã tạo lượt chạy QVTool bằng kho ${source === 'own' ? 'local' : 'QVTool'}.`,
      results,
    });
  } catch (error) {
    if (source === 'own') await accountPool.releaseAccounts(selectedAccounts.map((account) => account.id));
    console.error('[TestTool] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
