import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Home, CreditCard, History, User, LogIn, LogOut, Plus, HelpCircle, Menu, X, ShieldCheck, Wallet } from 'lucide-react';
import styles from './Header.module.css';

export const Header = () => {
  const { user, openModal, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo Section */}
        <div className={styles.logoSection} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className={styles.logoGlowWrapper}>
            <div className={styles.logoIconBox}>
              <img src="/arthur.png" alt="Arthur 5v5" className={styles.logoImg} />
            </div>
            <div className={styles.logoText}>
              <div className={styles.brandTitle}>
                <span className={styles.brandPrimary}>CHUNGSUC</span>
                <span className={styles.brandAccent}>LIENQUAN</span>
                <span className={styles.brandDomain}>.COM</span>
              </div>
              <div className={styles.brandSubtitle}>
                SỰ KIỆN CHUNG SỨC • UY TÍN • SIÊU TỐC
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className={styles.navMenu}>
          <button className={`${styles.navItem} ${styles.navItemActive}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Home size={18} className={styles.navIcon} />
            <span>TRANG CHỦ</span>
          </button>

          <button className={styles.navItem} onClick={() => openModal('topup')}>
            <CreditCard size={18} className={styles.navIcon} />
            <span>NẠP TIỀN</span>
            <span className={styles.navHotBadge}>+Khuyến mãi</span>
          </button>

          <button className={styles.navItem} onClick={() => openModal('history')}>
            <History size={18} className={styles.navIcon} />
            <span>LỊCH SỬ CÀY SỰ KIỆN</span>
          </button>

          <button className={styles.navItem} onClick={() => openModal('guide')}>
            <HelpCircle size={18} className={styles.navIcon} />
            <span>LẤY CODE Ở ĐÂU?</span>
          </button>
        </nav>

        {/* User Auth Action Section */}
        <div className={styles.authSection}>
          {user ? (
            <div className={styles.userControls}>
              {/* Balance Box */}
              <div className={styles.balanceBox} onClick={() => openModal('topup')} title="Bấm để nạp thêm">
                <Wallet size={15} className={styles.balanceIcon} />
                <div className={styles.balanceInfo}>
                  <span className={styles.balanceLabel}>Số dư:</span>
                  <span className={styles.balanceValue}>{user.balance.toLocaleString('vi-VN')}đ</span>
                </div>
                <button className={styles.quickTopupBtn} title="Nạp nhanh">
                  <Plus size={14} />
                </button>
              </div>

              {/* User Profile Pill */}
              <div className={styles.userProfileMenu}>
                <button
                  className={styles.userProfileBtn}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <img src={user.avatar} alt="Avatar" className={styles.userAvatar} />
                  <span className={styles.userName}>{user.displayName}</span>
                  {user.isVip && <span className={styles.vipTag}>VIP</span>}
                </button>

                {userDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <p className={styles.dropdownUser}>{user.displayName}</p>
                      <p className={styles.dropdownBalance}>
                        Số dư: <strong>{user.balance.toLocaleString('vi-VN')}đ</strong>
                      </p>
                    </div>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        setUserDropdownOpen(false);
                        openModal('history');
                      }}
                    >
                      <History size={16} /> Đơn hàng của tôi
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        setUserDropdownOpen(false);
                        openModal('topup');
                      }}
                    >
                      <CreditCard size={16} /> Nạp số dư tài khoản
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button
                      className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                    >
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button className={styles.loginBtn} onClick={() => openModal('login')}>
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>ĐĂNG NHẬP GOOGLE</span>
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            className={styles.mobileMenuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className={styles.mobileNavDrawer}>
          <div className={styles.mobileNavLinks}>
            <button
              className={styles.mobileNavItem}
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <Home size={18} />
              <span>Trang Chủ</span>
            </button>
            <button
              className={styles.mobileNavItem}
              onClick={() => {
                setMobileMenuOpen(false);
                openModal('topup');
              }}
            >
              <CreditCard size={18} />
              <span>Nạp Tiền (Khuyến Mãi)</span>
            </button>
            <button
              className={styles.mobileNavItem}
              onClick={() => {
                setMobileMenuOpen(false);
                openModal('history');
              }}
            >
              <History size={18} />
              <span>Lịch Sử Cày Sự Kiện</span>
            </button>
            <button
              className={styles.mobileNavItem}
              onClick={() => {
                setMobileMenuOpen(false);
                openModal('guide');
              }}
            >
              <HelpCircle size={18} />
              <span>Hướng Dẫn Lấy Friend Code</span>
            </button>
          </div>

          {!user && (
            <div className={styles.mobileAuthBox}>
              <button
                className={styles.mobileLoginBtn}
                onClick={() => {
                  setMobileMenuOpen(false);
                  openModal('login');
                }}
              >
                <LogIn size={18} /> Đăng Nhập Google
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
