/**
 * Express API Router - Settings (Admin)
 * Manages package configuration (number of accounts per package, etc.)
 */
const express = require('express');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const config = require('../config');

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
 *   ruong_ss: { name: "Rương SS", accRequired: 4, biPerAcc: 25, totalBi: 100 },
 *   full_ruong: { name: "Full 3 Rương", accRequired: 10, biPerAcc: 25, totalBi: 250 }
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

module.exports = router;
