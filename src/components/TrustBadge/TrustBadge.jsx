import React from 'react';
import { ShieldCheck, Zap, Lock, Headphones } from 'lucide-react';
import styles from './TrustBadge.module.css';

export const TrustBadge = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconBox}>
          <ShieldCheck size={20} className={styles.shieldIcon} />
        </div>
        <h4 className={styles.title}>CAM KẾT BẢO MẬT & TỐC ĐỘ</h4>
      </div>

      <p className={styles.description}>
        Đơn Hàng Của Bạn Sẽ Được Hệ Thống Phân Phối Và Xử Lý Tự Động Hoàn Toàn 24/7!
      </p>

      <div className={styles.grid}>
        <div className={styles.item}>
          <Zap size={14} className={styles.itemIcon} />
          <span>Tốc độ: 30s - 3p hoàn thành</span>
        </div>
        <div className={styles.item}>
          <Lock size={14} className={styles.itemIcon} />
          <span>Bảo mật: Chỉ cần Friend Code</span>
        </div>
        <div className={styles.item}>
          <Headphones size={14} className={styles.itemIcon} />
          <span>Hỗ trợ kỹ thuật 24/7 siêu tốc</span>
        </div>
      </div>
    </div>
  );
};
