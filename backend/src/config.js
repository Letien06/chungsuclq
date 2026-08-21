/**
 * Configuration constants for the backend
 */
const config = {
  // SieuCap5s settings
  sieucap5s: {
    baseUrl: 'https://sieucap5s.com',
    toolUrl: process.env.SIEUCAP5S_TOOL_URL ||
      'https://sieucap5s.com/services/tool/nhap-ma-qua-tang-sk-the-lsr.aspx',
    username: process.env.SIEUCAP5S_USERNAME || '',
    password: process.env.SIEUCAP5S_PASSWORD || '',
    // Max accounts per batch (sieucap5s warns: don't open >2 tabs)
    maxAccountsPerBatch: 20,
    // Timeout waiting for tool results (ms)
    resultTimeout: 120000, // 2 minutes
    // Poll interval for checking results (ms)
    resultPollInterval: 2000, // 2 seconds
  },

  // Package definitions
  // Admin can change these via settings API
  defaultPackages: {
    test_the_lsr: {
      id: 'test_the_lsr',
      name: 'Test Thẻ LSR (1 Acc)',
      accRequired: 1,
      biPerAcc: 25,
      totalBi: 25,
    },
    ruong_ss: {
      id: 'ruong_ss',
      name: 'Rương SS',
      accRequired: 4,
      biPerAcc: 25,
      totalBi: 100,
    },
    full_ruong: {
      id: 'full_ruong',
      name: 'Full 3 Rương',
      accRequired: 10,
      biPerAcc: 25,
      totalBi: 250,
    },
  },

  // Admin
  adminPassword: process.env.ADMIN_PASSWORD || 'changeme123',

  // Worker account cooldown (ms) - 24 hours default
  accountCooldownMs: 24 * 60 * 60 * 1000,

  // Order processing
  maxRetries: 3,
  retryDelayMs: 30000, // 30 seconds
};

module.exports = config;
