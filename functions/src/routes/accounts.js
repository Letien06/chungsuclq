/**
 * Express API Router - Accounts (Admin)
 */
const express = require('express');
const accountPool = require('../services/accountPool');

const router = express.Router();

/**
 * GET /api/accounts/stats
 * Get account pool statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await accountPool.getStats();
    res.json(stats);
  } catch (error) {
    console.error('[API] Account stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/accounts/import
 * Import accounts from text
 * Body: { text: "acc1|pass1\nacc2|pass2\n..." }
 */
router.post('/import', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Missing account text' });
    }

    const result = await accountPool.importAccounts(text);

    console.log(`[API] Imported accounts: ${result.imported} new, ${result.duplicates} dupes, ${result.errors} errors`);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[API] Import accounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/accounts/:id
 * Delete a single account
 */
router.delete('/:id', async (req, res) => {
  try {
    await accountPool.deleteAccount(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[API] Delete account error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/accounts/dead/purge
 * Purge all dead accounts
 */
router.delete('/dead/purge', async (req, res) => {
  try {
    const count = await accountPool.purgeDeadAccounts();
    res.json({ success: true, purged: count });
  } catch (error) {
    console.error('[API] Purge dead accounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
