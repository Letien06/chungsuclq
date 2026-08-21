import React from 'react';
import { useApp } from '../../context/AppContext';
import { CreditCard, ShoppingCart, Zap, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './OrderSummary.module.css';

export const OrderSummary = () => {
  const {
    user,
    currentPackage,
    effectiveQty,
    unitPrice,
    originalTotalPrice,
    totalPrice,
    totalBi,
    discountAmount,
    handleOrderSubmit,
    openModal
  } = useApp();

  const isBalanceEnough = user && user.balance >= totalPrice;

  return (
    <div className={styles.summaryCard}>
      {/* Header */}
      <div className={styles.header}>
        <CreditCard size={18} className={styles.headerIcon} />
        <h3 className={styles.headerTitle}>THÔNG TIN THANH TOÁN</h3>
      </div>

      {/* Details List */}
      <div className={styles.detailsList}>
        <div className={styles.detailRow}>
          <span className={styles.label}>Dịch Vụ:</span>
          <span className={styles.value}>Chung Sức Liên Quân</span>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.label}>Gói:</span>
          <span className={`${styles.value} ${styles.packageNameHighlight}`}>
            {currentPackage.name}
          </span>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.label}>Số Lượng:</span>
          <span className={styles.value}>{effectiveQty} Gói</span>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.label}>Bỉ/Gói:</span>
          <span className={styles.biValue}>{currentPackage.bi} Bỉ</span>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.label}>Giá/Gói:</span>
          <span className={styles.priceValue}>{currentPackage.price.toLocaleString('vi-VN')}đ</span>
        </div>

        {user && discountAmount > 0 && (
          <div className={styles.detailRow}>
            <span className={styles.label}>Ưu đãi VIP:</span>
            <span className={styles.discountValue}>-{discountAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        )}

        <div className={styles.detailRow}>
          <span className={styles.label}>Tổng Bỉ nhận được:</span>
          <span className={styles.totalBiValue}>⚡ {totalBi.toLocaleString('vi-VN')} Bỉ</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Total Section */}
      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Tổng Tiền:</span>
        <span className={styles.totalAmount}>{totalPrice.toLocaleString('vi-VN')}đ</span>
      </div>

      {/* User Member Discount Hint */}
      {!user ? (
        <div className={styles.memberNotice} onClick={() => openModal('login')}>
          <Sparkles size={14} className={styles.sparkleIcon} />
          <span>Đăng Nhập Để Được Giá Ưu Đãi & Lưu Đơn</span>
        </div>
      ) : (
        <div className={styles.balanceStatus}>
          <span>Số dư hiện tại: <strong>{user.balance.toLocaleString('vi-VN')}đ</strong></span>
          {!isBalanceEnough && (
            <button className={styles.inlineTopup} onClick={() => openModal('topup')}>
              + Nạp thêm
            </button>
          )}
        </div>
      )}

      {/* Main Action Button */}
      {!user ? (
        <button className={styles.ctaButton} onClick={handleOrderSubmit}>
          <ShoppingCart size={18} />
          <span>ĐĂNG NHẬP ĐỂ MUA</span>
        </button>
      ) : isBalanceEnough ? (
        <button className={`${styles.ctaButton} ${styles.payNowBtn}`} onClick={handleOrderSubmit}>
          <Zap size={18} />
          <span>THANH TOÁN NGAY ({totalPrice.toLocaleString('vi-VN')}đ)</span>
        </button>
      ) : (
        <button className={`${styles.ctaButton} ${styles.needTopupBtn}`} onClick={() => openModal('topup')}>
          <AlertCircle size={18} />
          <span>NẠP TIỀN ĐỂ TIẾP TỤC (Thiếu {(totalPrice - user.balance).toLocaleString('vi-VN')}đ)</span>
        </button>
      )}
    </div>
  );
};
