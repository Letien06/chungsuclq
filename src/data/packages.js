export const PACKAGES = [
  {
    id: 'test_the_lsr',
    name: '🎁 TEST TOOL: QVTOOL CHUNG SỨC',
    price: 0,
    memberPrice: 0,
    bi: 38,
    speedText: 'Test trực tiếp QVTool',
    progress: 100,
    badge: 'TEST MIỄN PHÍ',
    isPriority: true,
    description: 'Test gửi mã Chung Sức qua QVTool (1 tài khoản)'
  },
  {
    id: 'full_3_ruong',
    name: 'FULL 3 RƯƠNG',
    price: 50000,
    memberPrice: 45000,
    bi: 342,
    speedText: 'Tốc độ siêu tốc',
    progress: 90,
    badge: 'ƯU TIÊN',
    isPriority: false,
    description: 'Dùng 9 tài khoản để nhận đủ 342 vé nhảy, mở full 3 rương sự kiện'
  },
  {
    id: 'ruong_skin_ss',
    name: 'RƯƠNG SKIN SS',
    price: 30000,
    memberPrice: 27000,
    bi: 190,
    speedText: 'Tốc độ siêu tốc',
    progress: 75,
    badge: 'PHỔ BIẾN',
    isPriority: false,
    description: 'Dùng 5 tài khoản để nhận đủ 190 vé nhảy, mở Rương Trang phục SS'
  },
  {
    id: '25_bi_le',
    name: '38 VÉ NHẢY LẺ',
    price: 10000,
    memberPrice: 9000,
    bi: 38,
    speedText: 'Tốc độ siêu tốc',
    progress: 50,
    badge: '',
    isPriority: false,
    description: 'Dùng 1 tài khoản, nhận 38 vé nhảy để bổ sung phần còn thiếu'
  },
  {
    id: 'goi_san_sss',
    name: 'GÓI SĂN SSS',
    price: 100000,
    memberPrice: 90000,
    bi: 760,
    speedText: 'Tốc độ siêu tốc',
    progress: 82,
    badge: 'TIẾT KIỆM',
    isPriority: false,
    description: 'Gói cày vé nhảy số lượng lớn giá cực kỳ ưu đãi'
  },
  {
    id: 'goi_san_sss_vip',
    name: 'GÓI SĂN SSS VIP',
    price: 180000,
    memberPrice: 162000,
    bi: 1520,
    speedText: 'Tốc độ siêu tốc',
    progress: 92,
    badge: 'VIP',
    isPriority: false,
    description: 'Dành cho các chiến thần săn trọn bộ Skin SSS & hữu hạn'
  },
  {
    id: 'goi_san_sss_svip',
    name: 'GÓI SĂN SSS SVIP',
    price: 450000,
    memberPrice: 400000,
    bi: 3040,
    speedText: 'Tốc độ siêu tốc',
    progress: 98,
    badge: 'SVIP',
    isPriority: false,
    description: 'Gói VIP tối thượng hỗ trợ cày xuyên suốt sự kiện'
  }
];

export const INITIAL_TICKER_ITEMS = [
  {
    id: 'tk_1',
    user: 'ch***an',
    packageName: '38 VÉ NHẢY LẺ',
    code: 'zA***wa',
    bi: 38,
    status: 'HOÀN THÀNH',
    price: 10000,
    time: '09/08 21:33'
  },
  {
    id: 'tk_2',
    user: 'th***99',
    packageName: 'RƯƠNG SKIN SS',
    code: 'LQ#8812',
    bi: 190,
    status: 'HOÀN THÀNH',
    price: 30000,
    time: '09/08 21:30'
  },
  {
    id: 'tk_3',
    user: 'sj***c4',
    packageName: 'FULL 3 RƯƠNG',
    code: 'kB***19',
    bi: 342,
    status: 'HOÀN THÀNH',
    price: 50000,
    time: '09/08 21:28'
  },
  {
    id: 'tk_4',
    user: 'Bi***01',
    packageName: 'RƯƠNG SKIN SS',
    code: 'vP***88',
    bi: 190,
    status: 'HOÀN THÀNH',
    price: 30000,
    time: '09/08 21:25'
  },
  {
    id: 'tk_5',
    user: 'Vip***99',
    packageName: 'GÓI SĂN SSS',
    code: 'sA***02',
    bi: 760,
    status: 'HOÀN THÀNH',
    price: 100000,
    time: '09/08 21:20'
  },
  {
    id: 'tk_6',
    user: 'Nam***Pro',
    packageName: 'GÓI SĂN SSS VIP',
    code: 'xM***77',
    bi: 1520,
    status: 'HOÀN THÀNH',
    price: 180000,
    time: '09/08 21:15'
  },
  {
    id: 'tk_7',
    user: 'Dark***88',
    packageName: 'FULL 3 RƯƠNG',
    code: 'pL***44',
    bi: 342,
    status: 'HOÀN THÀNH',
    price: 50000,
    time: '09/08 21:10'
  },
  {
    id: 'tk_8',
    user: 'Hai***Gaming',
    packageName: '38 VÉ NHẢY LẺ',
    code: 'tQ***91',
    bi: 38,
    status: 'HOÀN THÀNH',
    price: 10000,
    time: '09/08 21:05'
  }
];

export const BANK_PAYMENT_INFO = {
  bankName: 'MB BANK (Ngân hàng Quân Đội)',
  accountNumber: '999988886666',
  accountName: 'NGUYEN VAN CHUNG SUC',
  transferPrefix: 'CSLQ',
  momoPhone: '0988776655',
  momoName: 'NGUYEN VAN CHUNG SUC'
};

export const SAMPLE_HISTORIES = [
  {
    id: 'ORD-89214',
    packageName: 'RƯƠNG SKIN SS',
    friendCode: 'LQ#882194',
    bi: 190,
    amount: 30000,
    status: 'completed',
    statusText: 'Hoàn thành',
    createdAt: '2026-08-17 10:15',
    completedAt: '2026-08-17 10:17',
    progress: 100
  },
  {
    id: 'ORD-89211',
    packageName: 'FULL 3 RƯƠNG',
    friendCode: 'LQ#771923',
    bi: 342,
    amount: 50000,
    status: 'processing',
    statusText: 'Đang cày (250/342 Vé nhảy)',
    createdAt: '2026-08-17 10:35',
    completedAt: null,
    progress: 80
  }
];
