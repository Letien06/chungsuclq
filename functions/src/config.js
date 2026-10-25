/**
 * Configuration constants for the backend
 */
const config = {
  // QVTool API settings. Keep the key in the deployment environment only.
  qvtool: {
    baseUrl: process.env.QVTOOL_API_URL || 'https://aov.qvtool.com/api/v1',
    apiKey: process.env.QVTOOL_API_KEY || '',
    resultPollInterval: Number(process.env.QVTOOL_POLL_INTERVAL || 5000),
    resultTimeout: Number(process.env.QVTOOL_RESULT_TIMEOUT || 540000),
  },

  // Legacy SieuCap5s settings (kept only for backward compatibility)
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
      name: 'QVTool Chung Sức Test',
      accRequired: 1,
      biPerAcc: 38,
      totalBi: 38,
    },
    ruong_ss: {
      id: 'ruong_ss',
      name: 'Rương SS',
      accRequired: 5,
      biPerAcc: 38,
      totalBi: 190,
    },
    full_ruong: {
      id: 'full_ruong',
      name: 'Full 3 Rương',
      accRequired: 9,
      biPerAcc: 38,
      totalBi: 342,
    },
  },

  // Public branding and customer support contact information.
  // Keep this separate from paymentInfo because it is safe for the storefront.
  defaultSiteInfo: {
    brandPrimary: 'CHUNGSUC',
    brandAccent: 'LIENQUAN',
    brandDomain: '.COM',
    brandSubtitle: 'SỰ KIỆN CHUNG SỨC • UY TÍN • SIÊU TỐC',
    footerTitle: 'CHUNGSUCLIENQUAN.COM',
    footerSubtitle: 'Hệ Thống Cày Tự Động Siêu Tốc',
    zaloUrl: 'https://zalo.me',
    supportHotline: '0988.776.655',
  },

  // Admin
  defaultPaymentInfo: {
    bankCode: 'MB',
    bankName: 'MB BANK (Ngân hàng Quân Đội)',
    accountNumber: '999988886666',
    accountName: 'NGUYEN VAN CHUNG SUC',
    transferPrefix: 'UNGHO',
    momoPhone: '0988776655',
    momoName: 'NGUYEN VAN CHUNG SUC',
  },
  adminPassword: process.env.ADMIN_PASSWORD || 'changeme123',

  // Worker account cooldown (ms) - 24 hours default
  accountCooldownMs: 24 * 60 * 60 * 1000,

  // Order processing
  maxRetries: 3,
  retryDelayMs: 30000, // 30 seconds
};

// Match the package IDs used by the React storefront. These aliases keep
// Cloud Functions safe when Firestore settings have not been initialized yet.
config.defaultPackages.ruong_skin_ss = { ...config.defaultPackages.ruong_ss, id: 'ruong_skin_ss' };
config.defaultPackages.full_3_ruong = { ...config.defaultPackages.full_ruong, id: 'full_3_ruong' };
config.defaultPackages['25_bi_le'] = { ...config.defaultPackages.ruong_ss, id: '25_bi_le', totalBi: 38, accRequired: 1 };
config.defaultPackages.goi_san_sss = { ...config.defaultPackages.full_ruong, id: 'goi_san_sss', totalBi: 760, accRequired: 20 };
config.defaultPackages.goi_san_sss_vip = { ...config.defaultPackages.full_ruong, id: 'goi_san_sss_vip', totalBi: 1520, accRequired: 40 };
config.defaultPackages.goi_san_sss_svip = { ...config.defaultPackages.full_ruong, id: 'goi_san_sss_svip', totalBi: 3040, accRequired: 80 };

module.exports = config;
