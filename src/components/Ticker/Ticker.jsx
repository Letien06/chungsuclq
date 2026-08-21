import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Megaphone, User } from 'lucide-react';
import styles from './Ticker.module.css';

export const Ticker = () => {
  const { tickerItems } = useApp();
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const hr = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      setCurrentDateStr(`${d}/${m} ${hr}:${min}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const renderItemContent = (item, index, prefix) => (
    <div key={`${prefix}-${item.id}-${index}`} className={styles.tickerCard}>
      {/* User */}
      <span className={styles.userTag}>
        <User size={13} className={styles.userIcon} />
        <span className={styles.userName}>{item.user}</span>
      </span>

      <span className={styles.dot}>•</span>

      {/* Package Name */}
      <span className={styles.packageTag}>{item.packageName}</span>

      <span className={styles.dot}>•</span>

      {/* Friend Code */}
      <span className={styles.codeTag}>{item.code || 'LQ#8812'}</span>

      <span className={styles.dot}>•</span>

      {/* Bi Amount */}
      <span className={styles.biTag}>{item.bi} Bỉ</span>

      <span className={styles.dot}>•</span>

      {/* Status */}
      <span className={styles.statusBadge}>{item.status || 'HOÀN THÀNH'}</span>

      <span className={styles.dot}>•</span>

      {/* Price */}
      <span className={styles.priceTag}>{item.price?.toLocaleString('vi-VN')}đ</span>

      <span className={styles.dot}>•</span>

      {/* Time */}
      <span className={styles.timeTag}>{item.time}</span>

      {/* Vertical divider */}
      <span className={styles.pipe}>|</span>
    </div>
  );

  return (
    <div className={styles.tickerWrapper}>
      {/* Fixed Header on Left */}
      <div className={styles.leftFixedBadge}>
        <Megaphone size={16} className={styles.megaIcon} />
        <span className={styles.dot}>•</span>
        <span className={styles.timeStr}>{currentDateStr || '09/08 21:46'}</span>
        <span className={styles.pipe}>|</span>
      </div>

      {/* Infinite Seamless Two-Group Marquee Track */}
      <div className={styles.marqueeContainer}>
        <div className={styles.marqueeTrack}>
          {/* Group 1 */}
          <div className={styles.marqueeGroup}>
            {tickerItems.map((item, idx) => renderItemContent(item, idx, 'g1'))}
          </div>
          {/* Group 2 (Identical Clone for 100% Seamless Infinite Loop) */}
          <div className={styles.marqueeGroup} aria-hidden="true">
            {tickerItems.map((item, idx) => renderItemContent(item, idx, 'g2'))}
          </div>
        </div>
      </div>
    </div>
  );
};
