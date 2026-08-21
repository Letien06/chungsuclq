import React, { useState, useEffect, useCallback } from 'react';
import styles from './AdminPage.module.css';
import * as api from '../../services/api';

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

  // Cookies Management
  const [cookieStatus, setCookieStatus] = useState(null);
  const [cookieInput, setCookieInput] = useState('');
  const [cookieSaving, setCookieSaving] = useState(false);
  const [cookieResult, setCookieResult] = useState(null);

  // Live Test Tool
  const [testCode, setTestCode] = useState('');
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('dashboard');

  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
        setAuthError('❌ Sai mật khẩu admin! Mật khẩu là: tien3006');
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
      const [statsData, ordersData, settingsData, cookiesData] = await Promise.all([
        api.getAdminStats(),
        api.listOrders({ limit: 20 }),
        api.getSettings(),
        api.getCookieStatus().catch(() => ({ hasCookies: false, count: 0 })),
      ]);
      setStats(statsData);
      setOrders(ordersData.orders || []);
      setSettings(settingsData);
      setEditedSettings(settingsData.packages || {});
      if (settingsData.siteInfo) {
        setSiteInfo(settingsData.siteInfo);
        setEditedSiteInfo(settingsData.siteInfo);
      }
      setCookieStatus(cookiesData);
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
    setLoading(true);
    try {
      await api.updateSettings(editedSettings);
      setSettingsEditing(false);
      loadDashboard();
      alert('Đã lưu cấu hình!');
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
    setLoading(false);
  };

  // Save Cookies
  const handleSaveCookies = async () => {
    if (!cookieInput.trim()) return;
    setCookieSaving(true);
    setCookieResult(null);
    try {
      const res = await api.saveCookies(cookieInput.trim());
      setCookieResult(res);
      setCookieInput('');
      const updated = await api.getCookieStatus();
      setCookieStatus(updated);
    } catch (err) {
      setCookieResult({ error: err.message });
    }
    setCookieSaving(false);
  };

  // Run Test Tool
  const handleRunTest = async () => {
    if (!testCode.trim()) {
      alert('Vui lòng nhập Mã Quà Tặng SK Thẻ LSR để test!');
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
          { id: 'settings', label: '⚙️ Giá & Gói Cước' },
          { id: 'test', label: '🧪 Test Tool SieuCap5s' },
          { id: 'cookies', label: '🍪 Cookies SieuCap5s' },
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
                🧪 Chạy Test Tool SieuCap5s
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
                    <th>Bỉ</th>
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

        {/* ========== TEST TOOL SIEUCAP5S ========== */}
        {activeTab === 'test' && (
          <div>
            <h2 className={styles.sectionTitle}>🧪 Test Kết Nối Tool SieuCap5s.com</h2>
            <div className={styles.importSection}>
              <p className={styles.importHint}>
                Chạy thử nghiệm tự động hóa Puppeteer kết nối vào tool <strong>Nhập Mã Quà Tặng SK Thẻ LSR</strong> trên <code>sieucap5s.com</code>.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#eab308', fontWeight: 'bold', marginBottom: 8 }}>
                  Nhập Mã Quà Tặng SK Thẻ LSR / Mã Chung Sức để Test:
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
                  {testRunning ? '⏳ Đang khởi chạy Puppeteer và cày test...' : '🚀 Chạy Test Tool Ngay (1 Acc)'}
                </button>

                <button
                  className={styles.refreshBtn}
                  onClick={() => setActiveTab('cookies')}
                >
                  🍪 Kiểm tra Cookies
                </button>
              </div>

              {testRunning && (
                <div style={{ marginTop: 20, padding: 16, background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', borderRadius: 8, color: '#93c5fd' }}>
                  ⏳ Hệ thống đang mở trình duyệt ảo Puppeteer ➔ Đăng nhập bằng Cookies ➔ Vào trang tool LSR ➔ Nhập 1 Acc test + Mã quà tặng ➔ Bấm "Bắt đầu"... Vui lòng chờ khoảng 15-30 giây!
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
                      <p><strong>Tổng Bỉ / Thưởng:</strong> {testResult.results.totalBi || 0}</p>
                      <p><strong>Số Acc thành công:</strong> {testResult.results.success?.length || 0}</p>
                      <p><strong>Số Acc thất bại:</strong> {testResult.results.failed?.length || 0}</p>
                      {testResult.results.success?.length > 0 && (
                        <div style={{ background: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: 6, marginTop: 8 }}>
                          <strong>Chi tiết Success:</strong>
                          <pre style={{ margin: 0, fontSize: 13, color: '#a7f3d0' }}>
                            {JSON.stringify(testResult.results.success, null, 2)}
                          </pre>
                        </div>
                      )}
                      {testResult.results.failed?.length > 0 && (
                        <div style={{ background: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: 6, marginTop: 8 }}>
                          <strong>Chi tiết Failed:</strong>
                          <pre style={{ margin: 0, fontSize: 13, color: '#fecaca' }}>
                            {JSON.stringify(testResult.results.failed, null, 2)}
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

        {/* ========== COOKIES SIEUCAP5S ========== */}
        {activeTab === 'cookies' && (
          <div>
            <h2 className={styles.sectionTitle}>🍪 Cấu Hình Cookies SieuCap5s.com</h2>
            <div className={styles.importSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 16 }}>
                  Trạng thái Cookies hiện tại:
                </span>
                {cookieStatus?.hasCookies ? (
                  <span style={{ background: '#10b981', color: '#fff', padding: '4px 12px', borderRadius: 20, fontWeight: 'bold' }}>
                    🟢 Đã có ({cookieStatus.count} cookies)
                  </span>
                ) : (
                  <span style={{ background: '#ef4444', color: '#fff', padding: '4px 12px', borderRadius: 20, fontWeight: 'bold' }}>
                    🔴 Chưa có Cookies
                  </span>
                )}
                {cookieStatus?.updatedAt && (
                  <span style={{ color: '#9ca3af', fontSize: 13 }}>
                    (Cập nhật: {new Date(cookieStatus.updatedAt).toLocaleString('vi-VN')})
                  </span>
                )}
              </div>

              <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
                <h4 style={{ color: '#eab308', margin: '0 0 8px 0' }}>💡 Hướng dẫn lấy Cookies SieuCap5s từ trình duyệt của bạn:</h4>
                <ol style={{ margin: 0, paddingLeft: 20, color: '#d1d5db', lineHeight: 1.6 }}>
                  <li>Mở tab <strong>sieucap5s.com</strong> mà bạn đang đăng nhập tài khoản Google.</li>
                  <li>Bấm phím <strong>F12</strong> (hoặc chuột phải chọn <em>Inspect / Kiểm tra</em>) ➔ Chọn tab <strong>Console</strong>.</li>
                  <li>Gõ lệnh: <code>copy(document.cookie)</code> rồi nhấn <strong>Enter</strong>.</li>
                  <li>Dán nội dung vừa copy vào ô dưới đây rồi bấm <strong>"💾 Lưu Cookies"</strong>.</li>
                </ol>
              </div>

              <textarea
                className={styles.importTextarea}
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                placeholder="Dán chuỗi cookies (VD: ASP.NET_SessionId=...; cf_clearance=...) vào đây..."
                rows={6}
              />

              <div className={styles.importActions}>
                <button
                  className={styles.importBtn}
                  onClick={handleSaveCookies}
                  disabled={cookieSaving || !cookieInput.trim()}
                >
                  {cookieSaving ? '⏳ Đang lưu...' : '💾 Lưu Cookies Vào Hệ Thống'}
                </button>
              </div>

              {cookieResult && (
                <div className={cookieResult.error ? styles.importError : styles.importSuccess}>
                  {cookieResult.error ? (
                    <span>❌ {cookieResult.error}</span>
                  ) : (
                    <span>✅ {cookieResult.message}</span>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 className={styles.pkgName} style={{ margin: 0 }}>{pkg.name || id}</h3>
                    {pkg.badge && (
                      <span style={{ background: '#eab308', color: '#000', fontSize: 11, fontWeight: 'bold', padding: '2px 8px', borderRadius: 12 }}>
                        {pkg.badge}
                      </span>
                    )}
                  </div>

                  <div className={styles.settingsRow}>
                    <label>Tên gói:</label>
                    <input
                      type="text"
                      value={pkg.name || ''}
                      onChange={(e) =>
                        setEditedSettings((prev) => ({
                          ...prev,
                          [id]: { ...prev[id], name: e.target.value },
                        }))
                      }
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow}>
                    <label style={{ color: '#fbbf24', fontWeight: 'bold' }}>💵 Giá gốc (đ):</label>
                    <input
                      type="number"
                      step={1000}
                      value={pkg.price ?? 0}
                      onChange={(e) =>
                        setEditedSettings((prev) => ({
                          ...prev,
                          [id]: { ...prev[id], price: Number(e.target.value) },
                        }))
                      }
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow}>
                    <label style={{ color: '#34d399', fontWeight: 'bold' }}>👑 Giá VIP (đ):</label>
                    <input
                      type="number"
                      step={1000}
                      value={pkg.memberPrice ?? 0}
                      onChange={(e) =>
                        setEditedSettings((prev) => ({
                          ...prev,
                          [id]: { ...prev[id], memberPrice: Number(e.target.value) },
                        }))
                      }
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow}>
                    <label>👥 Số ACC cần:</label>
                    <input
                      type="number"
                      min={1}
                      value={pkg.accRequired || 0}
                      onChange={(e) => {
                        const accReq = parseInt(e.target.value) || 0;
                        const biAcc = pkg.biPerAcc || 25;
                        setEditedSettings((prev) => ({
                          ...prev,
                          [id]: {
                            ...prev[id],
                            accRequired: accReq,
                            totalBi: accReq * biAcc,
                            bi: accReq * biAcc,
                          },
                        }));
                      }}
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow}>
                    <label>Bỉ/ACC:</label>
                    <input
                      type="number"
                      min={1}
                      value={pkg.biPerAcc || 25}
                      onChange={(e) => {
                        const biAcc = parseInt(e.target.value) || 0;
                        const accReq = pkg.accRequired || 1;
                        setEditedSettings((prev) => ({
                          ...prev,
                          [id]: {
                            ...prev[id],
                            biPerAcc: biAcc,
                            totalBi: accReq * biAcc,
                            bi: accReq * biAcc,
                          },
                        }));
                      }}
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow}>
                    <label>🏷️ Nhãn (Badge):</label>
                    <input
                      type="text"
                      value={pkg.badge || ''}
                      placeholder="ƯU TIÊN, VIP, HOT..."
                      onChange={(e) =>
                        setEditedSettings((prev) => ({
                          ...prev,
                          [id]: { ...prev[id], badge: e.target.value },
                        }))
                      }
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow}>
                    <label>📝 Mô tả:</label>
                    <input
                      type="text"
                      value={pkg.description || ''}
                      onChange={(e) =>
                        setEditedSettings((prev) => ({
                          ...prev,
                          [id]: { ...prev[id], description: e.target.value },
                        }))
                      }
                      disabled={!settingsEditing}
                    />
                  </div>

                  <div className={styles.settingsRow} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, marginTop: 8 }}>
                    <label style={{ fontWeight: 'bold' }}>⭐ Tổng Bỉ:</label>
                    <span className={styles.calcBi}>
                      {(pkg.accRequired || 0) * (pkg.biPerAcc || 25)} Bỉ
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
