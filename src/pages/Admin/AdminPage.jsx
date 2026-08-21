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

  // Active tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Login
  const handleLogin = async () => {
    setAuthError('');
    localStorage.setItem('cslq_admin_password', password);
    try {
      const data = await api.getAdminStats();
      setStats(data);
      setIsAuthed(true);
    } catch (err) {
      setAuthError('Sai mật khẩu admin!');
      localStorage.removeItem('cslq_admin_password');
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
      setSettings(settingsData);
      setEditedSettings(settingsData.packages || {});
    } catch (err) {
      console.error('Load dashboard error:', err);
    }
    setLoading(false);
  }, [isAuthed]);

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
          <button className={styles.loginBtn} onClick={handleLogin}>
            Đăng nhập
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
          { id: 'dashboard', label: '📊 Dashboard', },
          { id: 'orders', label: '📦 Đơn hàng', },
          { id: 'accounts', label: '👥 Kho ACC', },
          { id: 'settings', label: '⚙️ Cấu hình', },
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
                    <th>Mã Chung Sức</th>
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

        {/* ========== SETTINGS ========== */}
        {activeTab === 'settings' && (
          <div>
            <h2 className={styles.sectionTitle}>⚙️ Cấu hình gói dịch vụ</h2>
            <p className={styles.settingsHint}>
              Chỉnh số lượng ACC cần thiết cho mỗi gói. Thay đổi khi sự kiện mới có điều chỉnh.
            </p>

            <div className={styles.settingsCards}>
              {Object.entries(editedSettings).map(([id, pkg]) => (
                <div key={id} className={styles.settingsCard}>
                  <h3 className={styles.pkgName}>{pkg.name || id}</h3>
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
                    <label>Số ACC cần:</label>
                    <input
                      type="number"
                      min={1}
                      value={pkg.accRequired || 0}
                      onChange={(e) =>
                        setEditedSettings((prev) => ({
                          ...prev,
                          [id]: { ...prev[id], accRequired: parseInt(e.target.value) || 0 },
                        }))
                      }
                      disabled={!settingsEditing}
                    />
                  </div>
                  <div className={styles.settingsRow}>
                    <label>Bỉ/ACC:</label>
                    <input
                      type="number"
                      min={1}
                      value={pkg.biPerAcc || 0}
                      onChange={(e) =>
                        setEditedSettings((prev) => ({
                          ...prev,
                          [id]: { ...prev[id], biPerAcc: parseInt(e.target.value) || 0 },
                        }))
                      }
                      disabled={!settingsEditing}
                    />
                  </div>
                  <div className={styles.settingsRow}>
                    <label>Tổng Bỉ:</label>
                    <span className={styles.calcBi}>
                      {(pkg.accRequired || 0) * (pkg.biPerAcc || 0)} Bỉ
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.settingsActions}>
              {settingsEditing ? (
                <>
                  <button className={styles.saveBtn} onClick={handleSaveSettings} disabled={loading}>
                    💾 Lưu thay đổi
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
                  ✏️ Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
