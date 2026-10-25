/**
 * Express API Router - Settings & QVTool test (Admin)
 * Manages package configuration and live QVTool API testing
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
 * Get current settings (packages and siteInfo)
 */
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    const [pkgDoc, siteDoc] = await Promise.all([
      db.collection('settings').doc('packages').get(),
      db.collection('settings').doc('site_info').get(),
    ]);

    res.json({
      packages: pkgDoc.exists ? pkgDoc.data() : config.defaultPackages,
      siteInfo: siteDoc.exists ? siteDoc.data() : config.defaultSiteInfo,
      isDefault: !pkgDoc.exists,
    });
  } catch (error) {
    console.error('[API] Get settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/settings/site-info
 * Update branding & site info
 */
router.put('/site-info', async (req, res) => {
  try {
    const siteInfo = req.body;
    if (!siteInfo || typeof siteInfo !== 'object') {
      return res.status(400).json({ error: 'Invalid siteInfo format' });
    }

    const db = getFirestore();
    await db.collection('settings').doc('site_info').set(siteInfo, { merge: true });

    console.log('[API] Site info updated:', JSON.stringify(siteInfo));
    res.json({
      success: true,
      siteInfo,
    });
  } catch (error) {
    console.error('[API] Update site-info error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/settings
 * Update package settings
 */
router.put('/', async (req, res) => {
  try {
    const packages = req.body;

    if (!packages || typeof packages !== 'object') {
      return res.status(400).json({ error: 'Invalid settings format' });
    }

    // Validate each package
    for (const [id, pkg] of Object.entries(packages)) {
      if (!pkg.name) {
        return res.status(400).json({
          error: `Invalid package ${id}: requires name`,
        });
      }
      pkg.id = id;
      pkg.price = Number(pkg.price) >= 0 ? Number(pkg.price) : 0;
      pkg.memberPrice = Number(pkg.memberPrice) >= 0 ? Number(pkg.memberPrice) : 0;
      pkg.accRequired = parseInt(pkg.accRequired) || 1;
      pkg.biPerAcc = parseInt(pkg.biPerAcc) || 38;
      pkg.totalBi = parseInt(pkg.totalBi) || (pkg.accRequired * pkg.biPerAcc);
      pkg.bi = pkg.totalBi;
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
 * Live test of QVTool API. Uses one local account when available,
 * otherwise QVTool's stock pool.
 * Body: { code: "Mã Chung Sức" }
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
    console.error('[TestTool] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
