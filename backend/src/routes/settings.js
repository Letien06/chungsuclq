/**
 * Express API Router - Settings & Test Tool (Admin)
 * Manages package configuration, cookies, and live tool testing
 */
const express = require('express');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const config = require('../config');
const SieuCap5sAutomation = require('../services/sieucap5s');
const accountPool = require('../services/accountPool');

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
 * GET /api/settings/cookies
 * Check current cookie status
 */
router.get('/cookies', async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('settings').doc('sieucap5s_cookies').get();

    if (!doc.exists || !doc.data()?.cookies) {
      return res.json({ hasCookies: false, count: 0 });
    }

    const data = doc.data();
    res.json({
      hasCookies: true,
      count: data.cookies?.length || 0,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
    });
  } catch (error) {
    console.error('[API] Get cookies status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/settings/cookies
 * Save cookies from admin UI
 * Body: { cookies: "cookie string or JSON array" }
 */
router.post('/cookies', async (req, res) => {
  try {
    const { cookies } = req.body;

    if (!cookies) {
      return res.status(400).json({ error: 'Missing cookies data' });
    }

    const parsedCookies = SieuCap5sAutomation.parseCookieString(cookies);
    if (!parsedCookies || parsedCookies.length === 0) {
      return res.status(400).json({ error: 'Invalid cookie format. Paste document.cookie or JSON format.' });
    }

    const automation = new SieuCap5sAutomation();
    await automation._saveCookies(parsedCookies);

    res.json({
      success: true,
      message: `Đã lưu ${parsedCookies.length} cookies thành công!`,
      count: parsedCookies.length,
    });
  } catch (error) {
    console.error('[API] Save cookies error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/settings/test-tool
 * Live test of SieuCap5s tool
 * Body: { code: "Mã Quà Tặng LSR" }
 */
router.post('/test-tool', async (req, res) => {
  const { code } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập Mã Quà Tặng / Mã Chung Sức để test!' });
  }

  // Get available accounts
  const accounts = await accountPool.getAvailableAccounts(1);
  if (accounts.length === 0) {
    return res.status(400).json({
      error: 'Kho ACC đang trống! Vui lòng vào mục Kho ACC nạp ít nhất 1 tài khoản để chạy test.'
    });
  }

  let automation = null;
  try {
    console.log(`[TestTool] Starting test with code: ${code.trim()} and 1 account (${accounts[0].username})`);
    automation = new SieuCap5sAutomation();
    await automation.init();
    await automation.login();

    const results = await automation.runTool([accounts[0]], code.trim());

    res.json({
      success: true,
      message: 'Chạy test tool thành công!',
      results,
    });
  } catch (error) {
    console.error('[TestTool] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    if (automation) {
      await automation.close();
    }
  }
});

module.exports = router;
