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
              <LogIn size={18} className={styles.loginBtnIcon} />
              <span>ĐĂNG NHẬP</span>
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
                <LogIn size={18} /> Đăng Nhập / Đăng Ký
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
