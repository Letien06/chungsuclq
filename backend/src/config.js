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

  // Package definitions (prices and acc count can be edited in /admin)
  defaultPackages: {
    test_the_lsr: {
      id: 'test_the_lsr',
      name: '🎁 TEST TOOL: QVTOOL CHUNG SỨC',
      price: 0,
      memberPrice: 0,
      accRequired: 1,
      biPerAcc: 38,
      totalBi: 38,
      badge: 'TEST MIỄN PHÍ',
      description: 'Test gửi mã quà tặng Chung Sức qua QVTool (1 tài khoản)',
      isPriority: true,
      speedText: 'Test trực tiếp QVTool',
    },
    full_3_ruong: {
      id: 'full_3_ruong',
      name: 'FULL 3 RƯƠNG',
      price: 50000,
      memberPrice: 45000,
      accRequired: 9,
      biPerAcc: 38,
      totalBi: 342,
      badge: 'ƯU TIÊN',
      description: 'Cày full 3 rương sự kiện nhanh nhất, nhận tối đa quà tặng',
      isPriority: false,
      speedText: 'Tốc độ siêu tốc',
    },
    ruong_skin_ss: {
      id: 'ruong_skin_ss',
      name: 'RƯƠNG SKIN SS',
      price: 30000,
      memberPrice: 27000,
      accRequired: 5,
      biPerAcc: 38,
      totalBi: 190,
      badge: 'PHỔ BIẾN',
      description: 'Mở khóa ngay rương Trang phục bậc SS tự chọn',
      isPriority: false,
      speedText: 'Tốc độ siêu tốc',
    },
    '25_bi_le': {
      id: '25_bi_le',
      name: '38 VÉ NHẢY LẺ',
      price: 10000,
      memberPrice: 9000,
      accRequired: 1,
      biPerAcc: 38,
      totalBi: 38,
      badge: '',
      description: 'Bổ sung số vé nhảy còn thiếu để nhận thưởng ngay',
      isPriority: false,
      speedText: 'Tốc độ siêu tốc',
    },
    goi_san_sss: {
      id: 'goi_san_sss',
      name: 'GÓI SĂN SSS',
      price: 100000,
      memberPrice: 90000,
      accRequired: 20,
      biPerAcc: 38,
      totalBi: 760,
      badge: 'TIẾT KIỆM',
      description: 'Gói cày vé nhảy số lượng lớn giá cực kỳ ưu đãi',
      isPriority: false,
      speedText: 'Tốc độ siêu tốc',
    },
    goi_san_sss_vip: {
      id: 'goi_san_sss_vip',
      name: 'GÓI SĂN SSS VIP',
      price: 180000,
      memberPrice: 162000,
      accRequired: 40,
      biPerAcc: 38,
      totalBi: 1520,
      badge: 'VIP',
      description: 'Dành cho các chiến thần săn trọn bộ Skin SSS & hữu hạn',
      isPriority: false,
      speedText: 'Tốc độ siêu tốc',
    },
    goi_san_sss_svip: {
      id: 'goi_san_sss_svip',
      name: 'GÓI SĂN SSS SVIP',
      price: 450000,
      memberPrice: 400000,
      accRequired: 80,
      biPerAcc: 38,
      totalBi: 3040,
      badge: 'SVIP',
      description: 'Gói cày max vé nhảy dành cho dân chơi hệ VIP',
      isPriority: false,
      speedText: 'Tốc độ siêu tốc',
    },
  },

  // Branding & Site info
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
  // Never fall back to a published/default password in production.
  adminPassword: process.env.ADMIN_PASSWORD || '',

  // Worker account cooldown (ms) - 24 hours default
  accountCooldownMs: 24 * 60 * 60 * 1000,
  maxOrderBatches: Number(process.env.MAX_ORDER_BATCHES || 20),
  maxOrderAccounts: Number(process.env.MAX_ORDER_ACCOUNTS || 100),

  // Order processing
  maxRetries: 3,
  retryDelayMs: 30000, // 30 seconds
};

// Keep compatibility with older Firestore settings that used these IDs.
config.defaultPackages.ruong_ss = { ...config.defaultPackages.ruong_skin_ss, id: 'ruong_ss' };
config.defaultPackages.full_ruong = { ...config.defaultPackages.full_3_ruong, id: 'full_ruong' };

module.exports = config;
