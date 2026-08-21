import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import styles from './HeroBanner.module.css';

export const HeroBanner = () => {
  return (
    <div className={styles.banner}>
      {/* Orange Corner Accents (L-shape) from screenshot */}
      <div className={styles.cornerTopLeft} />
      <div className={styles.cornerBottomRight} />

      {/* Official Arthur 5v5 Avatar */}
      <div className={styles.avatarWrapper}>
        <div className={styles.avatarBox}>
          <img
            src="/arthur.png"
            alt="Arthur 5v5 Liên Quân Mobile"
            className={styles.avatarImg}
          />
        </div>
      </div>

      {/* Text Container */}
      <div className={styles.content}>
        <h1 className={styles.title}>
          SỰ KIỆN CHUNG SỨC LIÊN QUÂN
        </h1>

        <div className={styles.subtitleRow}>
          <CheckCircle2 size={16} className={styles.checkIcon} />
          <span className={styles.subtitleText}>
            Hệ Thống Cày Tự Động - An Toàn - Siêu Tốc
          </span>
        </div>
      </div>
    </div>
  );
};
