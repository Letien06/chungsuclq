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

  // Package definitions (prices and acc count can be edited in /admin)
  defaultPackages: {
    test_the_lsr: {
      id: 'test_the_lsr',
      name: '🎁 TEST TOOL: TẶNG THẺ LSR',
      price: 0,
      memberPrice: 0,
      accRequired: 1,
      biPerAcc: 25,
      totalBi: 25,
      badge: 'TEST MIỄN PHÍ',
      description: 'Test gửi mã quà tặng SK Thẻ LSR trực tiếp qua tool sieucap5s.com (1 Acc test)',
      isPriority: true,
      speedText: 'Test trực tiếp SieuCap5s',
    },
    full_3_ruong: {
      id: 'full_3_ruong',
      name: 'FULL 3 RƯƠNG',
      price: 50000,
      memberPrice: 45000,
      accRequired: 10,
      biPerAcc: 25,
      totalBi: 250,
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
      accRequired: 4,
      biPerAcc: 25,
      totalBi: 100,
      badge: 'PHỔ BIẾN',
      description: 'Mở khóa ngay rương Trang phục bậc SS tự chọn',
      isPriority: false,
      speedText: 'Tốc độ siêu tốc',
    },
    '25_bi_le': {
      id: '25_bi_le',
      name: '25 BỈ LẺ',
      price: 15000,
      memberPrice: 13500,
      accRequired: 1,
      biPerAcc: 25,
      totalBi: 25,
      badge: '',
      description: 'Bổ sung số bỉ lẻ còn thiếu để nhận thưởng ngay',
      isPriority: false,
      speedText: 'Tốc độ siêu tốc',
    },
    goi_san_sss: {
      id: 'goi_san_sss',
      name: 'GÓI SĂN SSS',
      price: 100000,
      memberPrice: 90000,
      accRequired: 20,
      biPerAcc: 25,
      totalBi: 500,
      badge: 'TIẾT KIỆM',
      description: 'Gói cày bỉ số lượng lớn giá cực kỳ ưu đãi',
      isPriority: false,
      speedText: 'Tốc độ siêu tốc',
    },
    goi_san_sss_vip: {
      id: 'goi_san_sss_vip',
      name: 'GÓI SĂN SSS VIP',
      price: 180000,
      memberPrice: 162000,
      accRequired: 40,
      biPerAcc: 25,
      totalBi: 1000,
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
      biPerAcc: 25,
      totalBi: 2000,
      badge: 'SVIP',
      description: 'Gói cày max bỉ dành cho dân chơi hệ VIP',
      isPriority: false,
      speedText: 'Tốc độ siêu tốc',
    },
  },

  // Admin
  adminPassword: process.env.ADMIN_PASSWORD || 'tien3006',

  // Worker account cooldown (ms) - 24 hours default
  accountCooldownMs: 24 * 60 * 60 * 1000,

  // Order processing
  maxRetries: 3,
  retryDelayMs: 30000, // 30 seconds
};

module.exports = config;
