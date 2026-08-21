import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, MessageCircle, Send, Heart, HelpCircle, FileText, Lock } from 'lucide-react';
import styles from './Footer.module.css';

export const Footer = () => {
  const { openModal } = useApp();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Col 1: Brand & Bio */}
          <div className={styles.brandCol}>
            <div className={styles.logoRow}>
              <div className={styles.logoIcon}>
                <img src="/arthur.png" alt="Arthur 5v5" className={styles.footerLogoImg} />
              </div>
              <div className={styles.logoText}>
                <span className={styles.logoName}>CHUNGSUCLIENQUAN.COM</span>
                <span className={styles.logoSub}>Hệ Thống Cày Tự Động Siêu Tốc</span>
              </div>
            </div>

            <p className={styles.bio}>
              Hệ thống hỗ trợ game thủ Liên Quân Mobile cày sự kiện Chung Sức nhận rương SS, SSS uy tín và nhanh nhất Việt Nam.
            </p>

            <div className={styles.secureBadge}>
              <ShieldCheck size={16} className={styles.secureIcon} />
              <span>An toàn 100% • Không yêu cầu mật khẩu game</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>LIÊN KẾT NHANH</h4>
            <ul className={styles.linkList}>
              <li>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Trang Chủ Đặt Hàng
                </button>
              </li>
              <li>
                <button onClick={() => openModal('topup')}>
                  Nạp Tiền Tự Động (+10%)
                </button>
              </li>
              <li>
                <button onClick={() => openModal('history')}>
                  Lịch Sử Đơn Hàng
                </button>
              </li>
              <li>
                <button onClick={() => openModal('guide')}>
                  Hướng Dẫn Lấy Friend Code
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Support Channels */}
          <div className={styles.supportCol}>
            <h4 className={styles.colTitle}>KÊNH HỖ TRỢ 24/7</h4>
            <div className={styles.supportCards}>
              <a
                href="https://zalo.me"
                target="_blank"
                rel="noreferrer"
                className={styles.supportLink}
              >
                <MessageCircle size={18} className={styles.zaloIcon} />
                <div className={styles.supportInfo}>
                  <span className={styles.supportLabel}>Zalo CSKH</span>
                  <span className={styles.supportVal}>0988.776.655</span>
                </div>
              </a>

              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className={styles.supportLink}
              >
                <Send size={18} className={styles.teleIcon} />
                <div className={styles.supportInfo}>
                  <span className={styles.supportLabel}>Telegram Bot</span>
                  <span className={styles.supportVal}>@ChungSucLQ_Bot</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className={styles.disclaimerBox}>
          <p>
            <strong>Miễn trừ trách nhiệm:</strong> Website là cổng dịch vụ công nghệ hỗ trợ người chơi tương tác liên kết sự kiện trong game Liên Quân Mobile. Website không thu thập mật khẩu, OTP hay thông tin nhạy cảm của người dùng.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © 2026 CHUNGSUCLIENQUAN.COM - All rights reserved.
          </p>
          <div className={styles.madeWith}>
            <span>Phát triển cho cộng đồng game thủ Liên Quân</span>
            <Heart size={14} className={styles.heartIcon} />
          </div>
        </div>
      </div>
    </footer>
  );
};
