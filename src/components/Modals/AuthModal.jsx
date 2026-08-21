import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, LogIn, UserPlus, Sparkles, Shield, User, Lock } from 'lucide-react';
import styles from './AuthModal.module.css';

export const AuthModal = () => {
  const { activeModal, closeModal, login } = useApp();
  const [isRegisterTab, setIsRegisterTab] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (activeModal !== 'login' && activeModal !== 'register') return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    login(username.trim(), isRegisterTab ? 50000 : 250000);
  };

  const handleQuickDemo = (type) => {
    if (type === 'vip') {
      login('Chiến_Tướng_LQ', 350000);
    } else {
      login('Tan_Thu_LienQuan', 50000);
    }
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={closeModal} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Tabs */}
        <div className={styles.tabHeader}>
          <button
            className={`${styles.tabBtn} ${!isRegisterTab ? styles.tabActive : ''}`}
            onClick={() => setIsRegisterTab(false)}
          >
            <LogIn size={16} />
            <span>ĐĂNG NHẬP</span>
          </button>
          <button
            className={`${styles.tabBtn} ${isRegisterTab ? styles.tabActive : ''}`}
            onClick={() => setIsRegisterTab(true)}
          >
            <UserPlus size={16} />
            <span>ĐĂNG KÝ MỚI</span>
          </button>
        </div>

        {/* Form Body */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tên đăng nhập / Số điện thoại</label>
            <div className={styles.inputWrapper}>
              <User size={16} className={styles.fieldIcon} />
              <input
                type="text"
                className={styles.input}
                placeholder="Nhập tên tài khoản hoặc SĐT..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Mật khẩu</label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.fieldIcon} />
              <input
                type="password"
                className={styles.input}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {isRegisterTab && (
            <div className={styles.bonusNotice}>
              🎁 Tặng ngay <strong>50.000đ</strong> vào số dư cho thành viên mới đăng ký hôm nay!
            </div>
          )}

          <button type="submit" className={styles.submitBtn}>
            {isRegisterTab ? 'TẠO TÀI KHOẢN & NHẬN QUÀ' : 'ĐĂNG NHẬP HỆ THỐNG'}
          </button>
        </form>

        {/* Quick 1-Click Demo Section */}
        <div className={styles.demoSection}>
          <div className={styles.demoDivider}>
            <span>HOẶC TRẢI NGHIỆM NHANH (1-CLICK)</span>
          </div>

          <div className={styles.demoButtons}>
            <button
              type="button"
              className={styles.demoBtnVip}
              onClick={() => handleQuickDemo('vip')}
            >
              <Sparkles size={16} />
              <span>Acc VIP Sẵn 350.000đ</span>
            </button>

            <button
              type="button"
              className={styles.demoBtnNew}
              onClick={() => handleQuickDemo('new')}
            >
              <User size={16} />
              <span>Acc Thường Sẵn 50.000đ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
