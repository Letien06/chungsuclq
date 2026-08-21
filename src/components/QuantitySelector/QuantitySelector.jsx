import React from 'react';
import { useApp } from '../../context/AppContext';
import { Minus, Plus } from 'lucide-react';
import styles from './QuantitySelector.module.css';

export const QuantitySelector = () => {
  const { quantity, setQuantity, currentPackage, isBulk, parsedBulkCodes } = useApp();

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < 99) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      setQuantity(1);
    } else if (val > 99) {
      setQuantity(99);
    } else {
      setQuantity(val);
    }
  };

  const setQuickQuantity = (qty) => {
    setQuantity(qty);
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionTitleBox}>
        <span className={styles.stepNumber}>2.</span>
        <h2 className={styles.sectionTitle}>SỐ LƯỢNG (GÓI)</h2>
        <span className={styles.requiredStar}>*</span>
      </div>

      <div className={styles.container}>
        {/* Counter Box */}
        <div className={`${styles.counterBox} ${isBulk ? styles.disabledCounter : ''}`}>
          <button
            type="button"
            className={styles.counterBtn}
            onClick={handleDecrement}
            disabled={quantity <= 1 || isBulk}
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>

          <input
            type="number"
            className={styles.counterInput}
            value={isBulk ? Math.max(1, parsedBulkCodes.length || 1) : quantity}
            onChange={handleInputChange}
            min="1"
            max="99"
            disabled={isBulk}
          />

          <button
            type="button"
            className={styles.counterBtn}
            onClick={handleIncrement}
            disabled={quantity >= 99 || isBulk}
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Dynamic Package Info Display */}
        <div className={styles.infoBox}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Giá Mỗi Gói:</span>
            <span className={styles.priceHighlight}>
              {currentPackage.price.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Bao Gồm:</span>
            <span className={styles.biHighlight}>
              {currentPackage.bi} Bỉ
            </span>
          </div>
        </div>

        {/* Quick select pills */}
        {!isBulk && (
          <div className={styles.quickPills}>
            {[1, 2, 3, 5, 10].map((num) => (
              <button
                key={num}
                type="button"
                className={`${styles.pillBtn} ${quantity === num ? styles.pillActive : ''}`}
                onClick={() => setQuickQuantity(num)}
              >
                x{num}
              </button>
            ))}
          </div>
        )}
      </div>

      {isBulk && (
        <p className={styles.bulkNote}>
          ℹ️ Ở chế độ Mua Số Lượng Lớn, số lượng gói sẽ được tự động tính theo số dòng Friend Code bạn nhập bên dưới.
        </p>
      )}
    </section>
  );
};
