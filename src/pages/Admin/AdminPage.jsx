import React, { useState, useEffect, useCallback } from 'react';
import styles from './AdminPage.module.css';
import * as api from '../../services/api';
import { BANK_PAYMENT_INFO } from '../../data/packages';
import { buildVietQrUrl, VIETQR_BANKS } from '../../utils/vietqr';

const createPackageId = (packages) => {
  const base = 'new_service';
  let suffix = 1;
  let id = `${base}_${suffix}`;
  while (Object.prototype.hasOwnProperty.call(packages, id)) {
    suffix += 1;
    id = `${base}_${suffix}`;
  }
  return id;
};

const createDefaultPackage = (id) => ({
  id,
  name: 'Gói dịch vụ mới',
  price: 0,
  memberPrice: 0,
  accRequired: 1,
  biPerAcc: 38,
  totalBi: 38,
  bi: 38,
  badge: '',
  description: '',
  isPriority: false,
  speedText: 'Tốc độ siêu tốc',
});

const normalizePackageMap = (packages) => Object.entries(packages || {}).reduce((next, [id, rawPackage]) => {
  const pkg = rawPackage && typeof rawPackage === 'object' ? rawPackage : {};
  const accRequired = Math.max(1, parseInt(pkg.accRequired, 10) || 1);
  const biPerAcc = Math.max(1, parseInt(pkg.biPerAcc, 10) || 38);
  const totalBi = accRequired * biPerAcc;
  next[id] = {
    ...pkg,
    id,
    name: String(pkg.name || id),
    price: Math.max(0, Number(pkg.price) || 0),
    memberPrice: Math.max(0, Number(pkg.memberPrice) || 0),
    accRequired,
    biPerAcc,
    totalBi,
    bi: totalBi,
  };
  return next;
}, {});

export function AdminPage() {
  // Auth
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard data
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Account import
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState(null);

  // Settings
  const [settings, setSettings] = useState(null);
  const [settingsEditing, setSettingsEditing] = useState(false);
  const [editedSettings, setEditedSettings] = useState({});

  // Branding & Site Info
  const [siteInfo, setSiteInfo] = useState(null);
  const [editedSiteInfo, setEditedSiteInfo] = useState({
    brandPrimary: 'CHUNGSUC',
    brandAccent: 'LIENQUAN',
    brandDomain: '.COM',
    brandSubtitle: 'SỰ KIỆN CHUNG SỨC • UY TÍN • SIÊU TỐC',
    footerTitle: 'CHUNGSUCLIENQUAN.COM',
    footerSubtitle: 'Hệ Thống Cày Tự Động Siêu Tốc',
  });
  const [editedPaymentInfo, setEditedPaymentInfo] = useState({
    ...BANK_PAYMENT_INFO,
    transferPrefix: 'UNGHO',
  });

  // Live Test Tool
  const [testCode, setTestCode] = useState('');
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('dashboard');

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Package editing helpers. Every update clones both the settings map and
  // the selected package so fields from the server are never dropped.
  const updateEditedPackage = (id, changes) => {
    setEditedSettings((prev) => {
      const current = prev[id];
      if (!current) return prev;
      const patch = typeof changes === 'function' ? changes(current) : changes;
      return { ...prev, [id]: { ...current, ...patch } };
    });
  };

  const handleAddPackage = () => {
    setSettingsEditing(true);
    setEditedSettings((prev) => {
      const id = createPackageId(prev);
      return { ...prev, [id]: createDefaultPackage(id) };
    });
  };

  const handleDeletePackage = (id) => {
    if (Object.keys(editedSettings).length <= 1) {
      alert('Phải giữ lại ít nhất một gói dịch vụ.');
      return;
    }
    const packageName = editedSettings[id]?.name || id;
    if (!window.confirm(`Xóa gói dịch vụ "${packageName}"? Thay đổi chỉ được lưu khi bấm Lưu.`)) {
      return;
    }
    setEditedSettings((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, id)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Login
  const handleLogin = async () => {
    if (!password.trim()) {
      setAuthError('Vui lòng nhập mật khẩu admin!');
      return;
    }
    setAuthError('');
    setIsLoggingIn(true);
    localStorage.setItem('cslq_admin_password', password.trim());
    try {
      const data = await api.getAdminStats();
      setStats(data);
      setIsAuthed(true);
    } catch (err) {
      console.error('Admin login error:', err);
      if (err.message && err.message.includes('401')) {
        setAuthError('❌ Sai mật khẩu admin!');
      } else {
        setAuthError(`❌ ${err.message || 'Lỗi kết nối máy chủ'}. (Máy chủ Render đang kết nối, vui lòng thử lại sau vài giây).`);
      }
      localStorage.removeItem('cslq_admin_password');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Load dashboard
  const loadDashboard = useCallback(async () => {
    if (!isAuthed) return;
    setLoading(true);
    try {
      const [statsData, ordersData, settingsData] = await Promise.all([
        api.getAdminStats(),
        api.listOrders({ limit: 20 }),
        api.getSettings(),
      ]);
      setStats(statsData);
      setOrders(ordersData.orders || []);
      const normalizedPackages = normalizePackageMap(settingsData.packages);
      setSettings({ ...settingsData, packages: normalizedPackages });
      setEditedSettings(normalizedPackages);
      if (settingsData.siteInfo) {
        setSiteInfo(settingsData.siteInfo);
        setEditedSiteInfo(settingsData.siteInfo);
      }
      if (settingsData.paymentInfo) {
        const serverPaymentInfo = settingsData.paymentInfo;
        const legacyPrefix = ['NAP', 'CSLQ'].includes(String(serverPaymentInfo.transferPrefix || '').trim().toUpperCase());
        setEditedPaymentInfo({
          ...BANK_PAYMENT_INFO,
          ...serverPaymentInfo,
          transferPrefix: legacyPrefix ? 'UNGHO' : (serverPaymentInfo.transferPrefix || 'UNGHO'),
        });
      }
    } catch (err) {
      console.error('Load dashboard error:', err);
    }
    setLoading(false);
  }, [isAuthed]);

  // Save Site Info & Branding
  const handleSaveSiteInfo = async () => {
    setLoading(true);
    try {
      await api.updateSiteInfo(editedSiteInfo);
      alert('Đã lưu thông tin tên miền & thương hiệu thành công!');
      loadDashboard();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
    setLoading(false);
  };

  const handleSavePaymentInfo = async () => {
    const normalized = {
      ...editedPaymentInfo,
      bankCode: String(editedPaymentInfo.bankCode || '').trim().toUpperCase(),
      accountNumber: String(editedPaymentInfo.accountNumber || '').replace(/\s+/g, ''),
      accountName: String(editedPaymentInfo.accountName || '').trim().toUpperCase(),
    };
    if (!normalized.bankCode || !normalized.accountNumber || !normalized.accountName) {
      alert('Vui lòng nhập đủ mã ngân hàng, số tài khoản và chủ tài khoản.');
      return;
    }
    setEditedPaymentInfo(normalized);
    setLoading(true);
    try {
      await api.updatePaymentInfo(normalized);
      alert('Đã lưu thông tin thanh toán!');
      await loadDashboard();
    } catch (err) { alert('Lỗi: ' + err.message); }
    setLoading(false);
  };

  useEffect(() => {
    // Check if admin password is saved
    const saved = localStorage.getItem('cslq_admin_password');
    if (saved) {
      setPassword(saved);
      api.getAdminStats()
        .then((data) => {
          setStats(data);
          setIsAuthed(true);
        })
        .catch(() => {
          localStorage.removeItem('cslq_admin_password');
        });
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Import accounts
  const handleImport = async () => {
    if (!importText.trim()) return;
    setLoading(true);
    try {
      const result = await api.importAccounts(importText);
      setImportResult(result);
      setImportText('');
      loadDashboard();
    } catch (err) {
      setImportResult({ error: err.message });
    }
    setLoading(false);
  };

  // Purge dead accounts
  const handlePurgeDead = async () => {
    if (!window.confirm('Xóa tất cả acc đã chết (dead)?')) return;
    setLoading(true);
    try {
      const result = await api.purgeDeadAccounts();
      alert(`Đã xóa ${result.purged} acc dead`);
      loadDashboard();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
    setLoading(false);
  };

  // Save settings
  const handleSaveSettings = async () => {
    // Canonicalize each package before sending it. The object key is the
    // package ID used by orders; keeping it as the `id` field prevents stale
    // IDs from older Firestore documents from breaking order creation.
    const packagesToSave = Object.entries(editedSettings).reduce((next, [id, rawPackage]) => {
      const pkg = rawPackage && typeof rawPackage === 'object' ? rawPackage : {};
      const name = String(pkg.name || '').trim();
      if (!name) return next;
      const accRequired = Math.max(1, parseInt(pkg.accRequired, 10) || 1);
      const biPerAcc = Math.max(1, parseInt(pkg.biPerAcc, 10) || 38);
      const totalBi = accRequired * biPerAcc;
      next[id] = {
        ...pkg,
        id,
        name,
        price: Math.max(0, Number(pkg.price) || 0),
        memberPrice: Math.max(0, Number(pkg.memberPrice) || 0),
        accRequired,
        biPerAcc,
        totalBi,
        bi: totalBi,
      };
      return next;
    }, {});

    if (Object.keys(packagesToSave).length !== Object.keys(editedSettings).length) {
      alert('Vui lòng nhập tên cho tất cả các gói trước khi lưu.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.updateSettings(packagesToSave);
      const savedPackages = result?.packages || packagesToSave;
      setEditedSettings(savedPackages);
      setSettings((prev) => ({ ...(prev || {}), packages: savedPackages }));
      setSettingsEditing(false);
      await loadDashboard();
      alert('Đã lưu cấu hình!');
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
    setLoading(false);
  };

  // Run Test Tool
  const handleRunTest = async () => {
    if (!testCode.trim()) {
      alert('Vui lòng nhập mã Chung Sức để test!');
      return;
    }
    setTestRunning(true);
    setTestResult(null);
    try {
      const res = await api.testToolLive(testCode.trim());
      setTestResult(res);
      loadDashboard();
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    }
    setTestRunning(false);
  };

  // Trigger process
  const handleTriggerProcess = async () => {
    setLoading(true);
    try {
      const result = await api.triggerProcessOrders();
      alert(result.message);
      setTimeout(loadDashboard, 3000);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
    setLoading(false);
  };

  // Login screen
  if (!isAuthed) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <div className={styles.loginIcon}>🔒</div>
          <h2>Admin Panel</h2>
          <p>Nhập mật khẩu admin để truy cập</p>
          <input
            type="password"
            className={styles.loginInput}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Mật khẩu admin..."
            autoFocus
          />
          {authError && <div className={styles.authError}>{authError}</div>}
          <button className={styles.loginBtn} onClick={handleLogin} disabled={isLoggingIn}>
            {isLoggingIn ? '⏳ Đang xác thực...' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    queued: '#f59e0b',
    processing: '#3b82f6',
    completed: '#10b981',
    partial: '#8b5cf6',
    failed: '#ef4444',
  };

  const statusLabels = {
    queued: 'Đang chờ',
    processing: 'Đang xử lý',
    completed: 'Hoàn thành',
    partial: 'Hoàn thành 1 phần',
    failed: 'Thất bại',
  };

  const paymentQrPreview = buildVietQrUrl({
    bankCode: editedPaymentInfo.bankCode,
    accountNumber: editedPaymentInfo.accountNumber,
    amount: 50000,
    description: `${editedPaymentInfo.transferPrefix || 'UNGHO'} DEMO`,
    accountName: editedPaymentInfo.accountName,
  });

  return (
    <div className={styles.admin}>
      {/* Header */}
      <div className={styles.adminHeader}>
        <div className={styles.headerLeft}>
          <img src="/arthur.png" alt="Logo" className={styles.headerLogo} />
          <div>
            <h1 className={styles.headerTitle}>ADMIN PANEL</h1>
            <p className={styles.headerSub}>Chung Sức Liên Quân - Quản trị hệ thống</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <a href="/" className={styles.refreshBtn} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            🏠 Về Trang Chủ
          </a>
          <button className={styles.refreshBtn} onClick={loadDashboard} disabled={loading}>
            🔄 {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button
            className={styles.logoutBtn}
            onClick={() => {
              localStorage.removeItem('cslq_admin_password');
              setIsAuthed(false);
            }}
          >
            🚪 Đăng xuất
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'orders', label: '📦 Đơn hàng' },
          { id: 'accounts', label: '👥 Kho ACC' },
          { id: 'branding', label: '🌐 Tên Miền & Logo' },
          { id: 'payment', label: '💳 Tài khoản nhận tiền' },
          { id: 'settings', label: '⚙️ Giá & Gói Cước' },
          { id: 'test', label: '🧪 Test QVTool API' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {/* ========== DASHBOARD ========== */}
        {activeTab === 'dashboard' && stats && (
          <div className={styles.dashboard}>
            <h2 className={styles.sectionTitle}>📊 Tổng quan hệ thống</h2>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📦</div>
                <div className={styles.statValue}>{stats.orders?.total || 0}</div>
                <div className={styles.statLabel}>Tổng đơn hàng</div>
              </div>
              <div className={`${styles.statCard} ${styles.statQueued}`}>
                <div className={styles.statIcon}>⏳</div>
                <div className={styles.statValue}>{stats.orders?.queued || 0}</div>
                <div className={styles.statLabel}>Đang chờ</div>
              </div>
              <div className={`${styles.statCard} ${styles.statProcessing}`}>
                <div className={styles.statIcon}>⚡</div>
                <div className={styles.statValue}>{stats.orders?.processing || 0}</div>
                <div className={styles.statLabel}>Đang xử lý</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCompleted}`}>
                <div className={styles.statIcon}>✅</div>
                <div className={styles.statValue}>{stats.orders?.completed || 0}</div>
                <div className={styles.statLabel}>Hoàn thành</div>
              </div>
              <div className={`${styles.statCard} ${styles.statFailed}`}>
                <div className={styles.statIcon}>❌</div>
                <div className={styles.statValue}>{stats.orders?.failed || 0}</div>
                <div className={styles.statLabel}>Thất bại</div>
              </div>
            </div>

            <h3 className={styles.subTitle}>👥 Kho ACC Worker</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📋</div>
                <div className={styles.statValue}>{stats.accounts?.total || 0}</div>
                <div className={styles.statLabel}>Tổng ACC</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCompleted}`}>
                <div className={styles.statIcon}>🟢</div>
                <div className={styles.statValue}>{stats.accounts?.available || 0}</div>
                <div className={styles.statLabel}>Sẵn sàng</div>
              </div>
              <div className={`${styles.statCard} ${styles.statProcessing}`}>
                <div className={styles.statIcon}>🔵</div>
                <div className={styles.statValue}>{stats.accounts?.inUse || 0}</div>
                <div className={styles.statLabel}>Đang dùng</div>
              </div>
              <div className={`${styles.statCard} ${styles.statQueued}`}>
                <div className={styles.statIcon}>🟡</div>
                <div className={styles.statValue}>{stats.accounts?.cooldown || 0}</div>
                <div className={styles.statLabel}>Cooldown</div>
              </div>
              <div className={`${styles.statCard} ${styles.statFailed}`}>
                <div className={styles.statIcon}>💀</div>
                <div className={styles.statValue}>{stats.accounts?.dead || 0}</div>
                <div className={styles.statLabel}>Dead</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
              <button className={styles.actionBtn} onClick={() => setActiveTab('test')}>
                🧪 Chạy Test QVTool API
              </button>
              <button className={styles.actionBtn} onClick={handleTriggerProcess} disabled={loading}>
                🚀 Xử lý đơn chờ
              </button>
              <button className={styles.actionBtnDanger} onClick={handlePurgeDead} disabled={loading}>
                🗑️ Xóa ACC dead
              </button>
            </div>
          </div>
        )}

        {/* ========== ORDERS ========== */}
        {activeTab === 'orders' && (
          <div>
            <h2 className={styles.sectionTitle}>📦 Danh sách đơn hàng</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Mã Chung Sức / LSR</th>
                    <th>Gói</th>
                    <th>Vé nhảy</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.emptyRow}>
                        Chưa có đơn hàng nào
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td className={styles.orderId}>{order.id}</td>
                        <td className={styles.code}>{order.chungSucCode}</td>
                        <td>{order.packageName}</td>
                        <td>
                          {order.biDone || 0}/{order.biTarget || 0}
                        </td>
                        <td>
                          <span
                            className={styles.statusBadge}
                            style={{ background: statusColors[order.status] || '#666' }}
                          >
                            {statusLabels[order.status] || order.status}
                          </span>
                        </td>
                        <td className={styles.timeCell}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== ACCOUNTS ========== */}
        {activeTab === 'accounts' && (
          <div>
            <h2 className={styles.sectionTitle}>👥 Import ACC Worker</h2>
            <div className={styles.importSection}>
              <p className={styles.importHint}>
                Nhập danh sách acc theo format: <code>taikhoan|matkhau</code> (mỗi dòng 1 acc)
              </p>
              <textarea
                className={styles.importTextarea}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={'acc1|pass1\nacc2|pass2\nacc3|pass3'}
                rows={10}
              />
              <div className={styles.importActions}>
                <span className={styles.accCount}>
                  {importText.trim() ? importText.trim().split('\n').filter(l => l.trim()).length : 0} acc
                </span>
                <button className={styles.importBtn} onClick={handleImport} disabled={loading || !importText.trim()}>
                  📥 Import ACC
                </button>
              </div>
              {importResult && (
                <div className={importResult.error ? styles.importError : styles.importSuccess}>
                  {importResult.error ? (
                    <span>❌ {importResult.error}</span>
                  ) : (
                    <span>
                      ✅ Imported: {importResult.imported} | Trùng: {importResult.duplicates} | Lỗi: {importResult.errors}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Account Stats */}
            {stats?.accounts && (
              <div className={styles.accStats}>
                <div className={styles.accStatItem}>
                  <span>Tổng:</span> <strong>{stats.accounts.total}</strong>
                </div>
                <div className={styles.accStatItem}>
                  <span>🟢 Sẵn sàng:</span> <strong>{stats.accounts.available}</strong>
                </div>
                <div className={styles.accStatItem}>
                  <span>🟡 Cooldown:</span> <strong>{stats.accounts.cooldown}</strong>
                </div>
                <div className={styles.accStatItem}>
                  <span>💀 Dead:</span> <strong>{stats.accounts.dead}</strong>
                </div>
                <button className={styles.purgeBtnSmall} onClick={handlePurgeDead}>
                  🗑️ Xóa dead
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========== QVTOOL API TEST ========== */}
        {activeTab === 'test' && (
          <div>
            <h2 className={styles.sectionTitle}>🧪 Test Kết Nối QVTool API</h2>
            <div className={styles.importSection}>
              <p className={styles.importHint}>
                Gửi thử một lượt chạy tới <strong>QVTool</strong> bằng API server-to-server. API key chỉ nằm ở backend, không gửi xuống trình duyệt.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#eab308', fontWeight: 'bold', marginBottom: 8 }}>
                  Nhập mã Chung Sức để test:
                </label>
                <input
                  type="text"
                  className={styles.loginInput}
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  placeholder="Ví dụ: XYZ123 hoặc Mã quà tặng LSR của bạn..."
                  style={{ maxWidth: '100%', marginBottom: 12 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  className={styles.importBtn}
                  onClick={handleRunTest}
                  disabled={testRunning || !testCode.trim()}
                  style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000', fontWeight: 'bold', padding: '12px 28px' }}
                >
                  {testRunning ? '⏳ Đang tạo lượt chạy QVTool...' : '🚀 Chạy Test QVTool Ngay'}
                </button>

                <button
                  className={styles.refreshBtn}
                  onClick={() => loadDashboard()}
                >
                  🔄 Làm mới trạng thái
                </button>
              </div>

              {testRunning && (
                <div style={{ marginTop: 20, padding: 16, background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', borderRadius: 8, color: '#93c5fd' }}>
                  ⏳ QVTool đang xử lý lượt chạy. Trạng thái sẽ được cập nhật từ API.
                </div>
              )}

              {testResult && (
                <div style={{ marginTop: 20, padding: 20, background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${testResult.success ? '#10b981' : '#ef4444'}`, borderRadius: 8 }}>
                  <h3 style={{ color: testResult.success ? '#34d399' : '#f87171', margin: '0 0 12px 0' }}>
                    {testResult.success ? '🎉 KẾT QUẢ TEST THÀNH CÔNG!' : '❌ KẾT QUẢ TEST THẤT BẠI!'}
                  </h3>
                  {testResult.error && (
                    <p style={{ color: '#fca5a5', margin: '0 0 12px 0' }}>
                      <strong>Lỗi:</strong> {testResult.error}
                    </p>
                  )}
                  {testResult.results && (
                    <div>
                      <p><strong>Batch ID:</strong> {testResult.results.id || testResult.results.batchId || '—'}</p>
                      <p><strong>Trạng thái:</strong> {testResult.results.status || '—'}</p>
                      <p><strong>Tổng thưởng:</strong> {testResult.results.reward ?? testResult.results.totalBi ?? 0}</p>
                      <p><strong>Thành công:</strong> {Array.isArray(testResult.results.success) ? testResult.results.success.length : (testResult.results.success ?? 0)}</p>
                      <p><strong>Đã xử lý:</strong> {testResult.results.processed ?? testResult.results.rows?.length ?? 0}/{testResult.results.total ?? 0}</p>
                      {testResult.results.rows?.length > 0 && (
                        <div style={{ background: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: 6, marginTop: 8 }}>
                          <strong>Chi tiết:</strong>
                          <pre style={{ margin: 0, fontSize: 13, color: '#a7f3d0' }}>
                            {JSON.stringify(testResult.results.rows, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== BRANDING & SITE INFO ========== */}
        {activeTab === 'branding' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>🌐 Cấu Hình Tên Miền & Thương Hiệu Logo</h2>
                <p className={styles.settingsHint} style={{ margin: '4px 0 0 0' }}>
                  Tùy chỉnh tên thương hiệu, đuôi tên miền (.COM, .VN...), slogan Header và Footer của website.
                </p>
              </div>
              <button
                className={styles.saveBtn}
                onClick={handleSaveSiteInfo}
                disabled={loading}
                style={{ padding: '10px 24px' }}
              >
                {loading ? '⏳ Đang lưu...' : '💾 Lưu Tên Miền & Thương Hiệu'}
              </button>
            </div>

            {/* Live Preview Box */}
            <div style={{ background: '#0b0e14', border: '1px solid rgba(234, 179, 8, 0.4)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: 12, color: '#eab308', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: 12 }}>
                👁️ Xem Trước Trực Tiếp Logo Header:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#111827', padding: '12px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', width: 'fit-content' }}>
                <img src="/arthur.png" alt="Arthur" style={{ width: 44, height: 44, borderRadius: 8, border: '2px solid #eab308' }} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Times New Roman, serif', letterSpacing: '0.5px' }}>
                    <span style={{ color: '#ffffff' }}>{editedSiteInfo.brandPrimary || 'CHUNGSUC'}</span>
                    <span style={{ color: '#ff6600' }}>{editedSiteInfo.brandAccent || 'LIENQUAN'}</span>
                    <span style={{ color: '#ff6600' }}>{editedSiteInfo.brandDomain || '.COM'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>
                    {editedSiteInfo.brandSubtitle || 'SỰ KIỆN CHUNG SỨC • UY TÍN • SIÊU TỐC'}
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Form */}
            <div className={styles.importSection}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {/* Brand Primary */}
                <div>
                  <label style={{ display: 'block', color: '#fff', fontWeight: 'bold', marginBottom: 6 }}>
                    1. Tên thương hiệu phần 1 (Chữ Trắng):
                  </label>
                  <input
                    type="text"
                    className={styles.loginInput}
                    value={editedSiteInfo.brandPrimary || ''}
                    onChange={(e) => setEditedSiteInfo((prev) => ({ ...prev, brandPrimary: e.target.value }))}
                    placeholder="VD: CHUNGSUC, DICHVU, SHOP..."
                    style={{ maxWidth: '100%' }}
                  />
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>Hiển thị màu trắng ở đầu logo</span>
                </div>

                {/* Brand Accent */}
                <div>
                  <label style={{ display: 'block', color: '#ff6600', fontWeight: 'bold', marginBottom: 6 }}>
                    2. Tên thương hiệu phần 2 (Chữ Cam):
                  </label>
                  <input
                    type="text"
                    className={styles.loginInput}
                    value={editedSiteInfo.brandAccent || ''}
                    onChange={(e) => setEditedSiteInfo((prev) => ({ ...prev, brandAccent: e.target.value }))}
                    placeholder="VD: LIENQUAN, GAMER, AUTO..."
                    style={{ maxWidth: '100%' }}
                  />
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>Hiển thị màu cam nổi bật</span>
                </div>

                {/* Brand Domain */}
                <div>
                  <label style={{ display: 'block', color: '#eab308', fontWeight: 'bold', marginBottom: 6 }}>
                    3. Đuôi tên miền (Domain):
                  </label>
                  <input
                    type="text"
                    className={styles.loginInput}
                    value={editedSiteInfo.brandDomain || ''}
                    onChange={(e) => setEditedSiteInfo((prev) => ({ ...prev, brandDomain: e.target.value }))}
                    placeholder="VD: .COM, .VN, .NET, .ONLINE..."
                    style={{ maxWidth: '100%' }}
                  />
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>Đuôi website (thay đổi khi bạn trỏ tên miền mới)</span>
                </div>
              </div>

              {/* Slogan & Subtitle */}
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', color: '#93c5fd', fontWeight: 'bold', marginBottom: 6 }}>
                  4. Slogan Header (Dòng chữ nhỏ dưới logo):
                </label>
                <input
                  type="text"
                  className={styles.loginInput}
                  value={editedSiteInfo.brandSubtitle || ''}
                  onChange={(e) => setEditedSiteInfo((prev) => ({ ...prev, brandSubtitle: e.target.value }))}
                  placeholder="VD: SỰ KIỆN CHUNG SỨC • UY TÍN • SIÊU TỐC"
                  style={{ maxWidth: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 20 }}>
                {/* Footer Title */}
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontWeight: 'bold', marginBottom: 6 }}>
                    5. Tiêu đề thương hiệu Footer:
                  </label>
                  <input
                    type="text"
                    className={styles.loginInput}
                    value={editedSiteInfo.footerTitle || ''}
                    onChange={(e) => setEditedSiteInfo((prev) => ({ ...prev, footerTitle: e.target.value }))}
                    placeholder="VD: CHUNGSUCLIENQUAN.COM"
                    style={{ maxWidth: '100%' }}
                  />
                </div>

                {/* Footer Subtitle */}
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontWeight: 'bold', marginBottom: 6 }}>
                    6. Slogan / Dòng phụ Footer:
                  </label>
                  <input
                    type="text"
                    className={styles.loginInput}
                    value={editedSiteInfo.footerSubtitle || ''}
                    onChange={(e) => setEditedSiteInfo((prev) => ({ ...prev, footerSubtitle: e.target.value }))}
                    placeholder="VD: Hệ Thống Cày Tự Động Siêu Tốc"
                    style={{ maxWidth: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <button
                  className={styles.saveBtn}
                  onClick={handleSaveSiteInfo}
                  disabled={loading}
                  style={{ padding: '12px 32px', fontSize: 15 }}
                >
                  {loading ? '⏳ Đang lưu...' : '💾 Lưu Thay Đổi Tên Miền & Thương Hiệu'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== PAYMENT ========== */}
        {activeTab === 'payment' && (
          <div className={styles.settingsCard} style={{ maxWidth: 860 }}>
            <h2 className={styles.sectionTitle}>💳 Tài khoản nhận tiền</h2>
            <p className={styles.settingsHint}>Chọn ngân hàng và nhập tài khoản nhận tiền. QR VietQR ở bên phải sẽ tự cập nhật theo thông tin hiện tại.</p>
            <div className={styles.paymentGrid}>
              <div>
                <div className={styles.settingsRow}>
                  <label htmlFor="payment-bank">Ngân hàng:</label>
                  <select
                    id="payment-bank"
                    value={editedPaymentInfo.bankCode || ''}
                    onChange={(e) => {
                      const bank = VIETQR_BANKS.find((item) => item.code === e.target.value);
                      setEditedPaymentInfo((prev) => ({
                        ...prev,
                        bankCode: e.target.value,
                        bankName: bank?.name || prev.bankName,
                      }));
                    }}
                  >
                    {VIETQR_BANKS.map((bank) => <option key={bank.code} value={bank.code}>{bank.name} ({bank.code})</option>)}
                  </select>
                </div>
                {[
                  ['accountNumber', 'Số tài khoản'], ['accountName', 'Chủ tài khoản'],
                  ['transferPrefix', 'Tiền tố nội dung CK'], ['momoPhone', 'Số điện thoại MoMo'], ['momoName', 'Tên người nhận MoMo'],
                ].map(([key, label]) => (
                  <div className={styles.settingsRow} key={key}>
                    <label htmlFor={`payment-${key}`}>{label}:</label>
                    <input id={`payment-${key}`} value={editedPaymentInfo[key] || ''} onChange={(e) => setEditedPaymentInfo((prev) => ({ ...prev, [key]: e.target.value }))} />
                  </div>
                ))}
                <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0' }}>
                  Nội dung tự động có dạng <strong style={{ color: '#fbbf24' }}>UNGHO + username</strong>. QR mẫu dùng số tiền 50.000đ và sẽ tự đổi theo số tiền khách chọn.
                </p>
              </div>
              <div className={styles.paymentQrPreview}>
                {paymentQrPreview ? (
                  <img src={paymentQrPreview} alt="QR VietQR xem trước" style={{ width: '100%', height: 'auto' }} />
                ) : (
                  <div style={{ color: '#64748b', fontSize: 12, padding: '56px 8px' }}>Nhập đủ thông tin để tạo QR</div>
                )}
                <div style={{ color: '#334155', fontSize: 11, fontWeight: 700, marginTop: 6 }}>VietQR mẫu · 50.000đ</div>
              </div>
            </div>
            <div className={styles.settingsActions} style={{ marginTop: 20 }}>
              <button className={styles.saveBtn} onClick={handleSavePaymentInfo} disabled={loading}>💾 Lưu thông tin thanh toán</button>
            </div>
          </div>
        )}

        {/* ========== SETTINGS ========== */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>⚙️ Cấu Hình & Giá Gói Dịch Vụ</h2>
                <p className={styles.settingsHint} style={{ margin: '4px 0 0 0' }}>
                  Chỉnh sửa giá tiền, giá thành viên, số lượng ACC và nhãn của tất cả các gói hiển thị cho khách hàng.
                </p>
              </div>
              <div className={styles.settingsActions}>
                <button
                  className={styles.addPackageBtn}
                  onClick={handleAddPackage}
                  disabled={loading}
                  type="button"
                >
                  ➕ Thêm gói dịch vụ
                </button>
                {settingsEditing ? (
                  <>
                    <button className={styles.saveBtn} onClick={handleSaveSettings} disabled={loading}>
                      💾 Lưu Tất Cả Thay Đổi
                    </button>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => {
                        setSettingsEditing(false);
                        setEditedSettings(settings?.packages || {});
                      }}
                    >
                      ❌ Hủy
                    </button>
                  </>
                ) : (
                  <button className={styles.editBtn} onClick={() => setSettingsEditing(true)}>
                    ✏️ Chỉnh Sửa Giá & Cấu Hình
                  </button>
                )}
              </div>
            </div>

            <div className={styles.settingsCards}>
              {Object.entries(editedSettings).map(([id, pkg]) => (
                <div key={id} className={styles.settingsCard}>
                  <div className={styles.settingsCardHeader}>
                    <h3 className={styles.pkgName} style={{ margin: 0 }}>{pkg.name || id}</h3>
                    <div className={styles.packageCardActions}>
                      {pkg.badge && (
                        <span className={styles.packageBadge}>{pkg.badge}</span>
                      )}
                      {settingsEditing && (
                        <button
                          type="button"
                          className={styles.deletePackageBtn}
                          onClick={() => handleDeletePackage(id)}
                          aria-label={`Xóa gói ${pkg.name || id}`}
                          title="Xóa gói dịch vụ"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.settingsRow}>
                    <label>Mã gói (ID):</label>
                    <input
                      className={styles.packageIdInput}
                      type="text"
                      value={pkg.id || id}
                      readOnly
                      aria-label={`Mã gói ${pkg.name || id}`}
                    />
                  </div>

                  <div className={styles.settingsRow}>
                    <label>Tên gói:</label>
                    <input
                      type="text"
                      value={pkg.name || ''}
                      onChange={(e) => updateEditedPackage(id, { name: e.target.value })}
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow}>
                    <label style={{ color: '#fbbf24', fontWeight: 'bold' }}>💵 Giá gốc (đ):</label>
                    <input
                      type="number"
                      step={1000}
                      value={pkg.price ?? 0}
                      onChange={(e) => updateEditedPackage(id, { price: Number(e.target.value) })}
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow}>
                    <label style={{ color: '#34d399', fontWeight: 'bold' }}>👑 Giá VIP (đ):</label>
                    <input
                      type="number"
                      step={1000}
                      value={pkg.memberPrice ?? 0}
                      onChange={(e) => updateEditedPackage(id, { memberPrice: Number(e.target.value) })}
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow}>
                    <label>👥 Số ACC cần:</label>
                    <input
                      type="number"
                      min={1}
                      value={pkg.accRequired || 0}
                      onChange={(e) => updateEditedPackage(id, (current) => {
                        const accReq = Math.max(1, parseInt(e.target.value, 10) || 1);
                        const biAcc = Math.max(1, parseInt(current.biPerAcc, 10) || 38);
                        return { accRequired: accReq, totalBi: accReq * biAcc, bi: accReq * biAcc };
                      })}
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow}>
                    <label>Vé nhảy/ACC:</label>
                    <input
                      type="number"
                      min={1}
                      value={pkg.biPerAcc || 38}
                      onChange={(e) => updateEditedPackage(id, (current) => {
                        const biAcc = Math.max(1, parseInt(e.target.value, 10) || 1);
                        const accReq = Math.max(1, parseInt(current.accRequired, 10) || 1);
                        return { biPerAcc: biAcc, totalBi: accReq * biAcc, bi: accReq * biAcc };
                      })}
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow}>
                    <label>🏷️ Nhãn (Badge):</label>
                    <input
                      type="text"
                      value={pkg.badge || ''}
                      placeholder="ƯU TIÊN, VIP, HOT..."
                      onChange={(e) => updateEditedPackage(id, { badge: e.target.value })}
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow}>
                    <label>📝 Mô tả:</label>
                    <input
                      type="text"
                      value={pkg.description || ''}
                      onChange={(e) => updateEditedPackage(id, { description: e.target.value })}
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, marginTop: 8 }}>
                    <label style={{ fontWeight: 'bold' }}>⭐ Tổng Vé nhảy:</label>
                    <span className={styles.calcBi}>
                      {(pkg.accRequired || 0) * (pkg.biPerAcc || 38)} Vé nhảy
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.settingsActions} style={{ marginTop: 20 }}>
              {settingsEditing ? (
                <>
                  <button className={styles.saveBtn} onClick={handleSaveSettings} disabled={loading}>
                    💾 Lưu Tất Cả Thay Đổi
                  </button>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => {
                      setSettingsEditing(false);
                      setEditedSettings(settings?.packages || {});
                    }}
                  >
                    ❌ Hủy
                  </button>
                </>
              ) : (
                <button className={styles.editBtn} onClick={() => setSettingsEditing(true)}>
                  ✏️ Chỉnh Sửa Giá & Cấu Hình
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
