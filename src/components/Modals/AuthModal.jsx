import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import styles from './AuthModal.module.css';

export const AuthModal = () => {
  const { activeModal, closeModal, loginWithGoogle } = useApp();
  const [loading, setLoading] = useState(false);

  if (activeModal !== 'login' && activeModal !== 'register') return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={closeModal} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img
            src="/arthur.png"
            alt="Arthur 5v5"
            style={{ width: 64, height: 64, borderRadius: 12, border: '2px solid #eab308', marginBottom: 12 }}
          />
          <h2 style={{ color: '#eab308', fontSize: 24, fontWeight: 800, margin: '0 0 6px 0', fontFamily: 'Times New Roman, serif' }}>
            CHUNG SỨC LIÊN QUÂN
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>
            Đăng nhập nhanh chóng 1-chạm bằng tài khoản Google
          </p>
        </div>

        {/* Benefits List */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#34d399', fontSize: 14, marginBottom: 10 }}>
            <Zap size={16} />
            <span>Tự động kích hoạt tài khoản & số dư thành viên</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#60a5fa', fontSize: 14, marginBottom: 10 }}>
            <ShieldCheck size={16} />
            <span>Bảo mật 100% qua Google OAuth (Không cần mật khẩu)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f59e0b', fontSize: 14 }}>
            <Sparkles size={16} />
            <span>Tự động theo dõi tiến độ cày Bỉ realtime</span>
          </div>
        </div>

        {/* Big Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: '#ffffff',
            color: '#1f2937',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 20px rgba(255, 255, 255, 0.2)',
            transition: 'all 0.2s',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {/* Official Google 'G' Icon */}
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? 'Đang xác thực Google...' : 'Tiếp Tục Với Google'}</span>
        </button>
      </div>
    </div>
  );
};
