import React from 'react';
import { Sparkles, Check, Flame } from 'lucide-react';
import styles from './PackageCard.module.css';

export const PackageCard = ({ pkg, isSelected, onSelect }) => {
  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''} ${pkg.isPriority ? styles.priorityCard : ''}`}
      onClick={() => onSelect(pkg.id)}
    >
      {/* Top Badge */}
      {pkg.badge && (
        <div className={`${styles.badge} ${pkg.isPriority ? styles.priorityBadge : styles.normalBadge}`}>
          {pkg.isPriority && <Flame size={12} />}
          <span>{pkg.badge}</span>
        </div>
      )}

      {/* Selected Indicator Checkmark */}
      {isSelected && (
        <div className={styles.checkIndicator}>
          <Check size={12} strokeWidth={3} />
        </div>
      )}

      {/* Header Info */}
      <div className={styles.cardHeader}>
        <h3 className={styles.packageName}>{pkg.name}</h3>
        <div className={styles.priceContainer}>
          <span className={styles.priceValue}>{pkg.price.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {/* Sub Info */}
      <div className={styles.cardSub}>
        <span className={styles.speedText}>{pkg.speedText}</span>
        <span className={styles.biAmount}>
          <strong>{pkg.bi}</strong> Bỉ
        </span>
      </div>

      {/* Speed & Boost Progress Bar */}
      <div className={styles.progressContainer}>
        <div
          className={styles.progressBar}
          style={{ width: `${pkg.progress}%` }}
        />
      </div>
    </div>
  );
};
