import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, History, ArrowRight, Zap, Sparkles } from 'lucide-react';
import styles from './OrderSuccessModal.module.css';

export const OrderSuccessModal = () => {
  const { activeModal, closeModal, openModal, lastCompletedOrder } = useApp();

  if (activeModal !== 'success' || !lastCompletedOrder) return null;

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Confetti Icon Header */}
        <div className={styles.iconCircle}>
          <CheckCircle2 size={42} className={styles.checkIcon} />
        </div>

        <h3 className={styles.title}>ĐẶT HÀNG THÀNH CÔNG!</h3>
        <p className={styles.subTitle}>
          Hệ thống cày tự động đã tiếp nhận và đang tiến hành xử lý đơn hàng của bạn.
        </p>

        {/* Order Details Card */}
        <div className={styles.orderCard}>
          <div className={styles.cardRow}>
            <span className={styles.label}>Mã đơn hàng:</span>
            <span className={styles.orderId}>#{lastCompletedOrder.id}</span>
          </div>

          <div className={styles.cardRow}>
            <span className={styles.label}>Gói dịch vụ:</span>
            <span className={styles.valWhite}>{lastCompletedOrder.packageName}</span>
          </div>

          <div className={styles.cardRow}>
            <span className={styles.label}>Mã mời:</span>
            <span className={styles.valCode}>{lastCompletedOrder.friendCode}</span>
          </div>

          <div className={styles.cardRow}>
            <span className={styles.label}>Số Bỉ sẽ nhận:</span>
            <span className={styles.valBi}>+{lastCompletedOrder.bi} Bỉ</span>
          </div>

          <div className={styles.cardRow}>
            <span className={styles.label}>Tổng thanh toán:</span>
            <span className={styles.valPrice}>{lastCompletedOrder.amount?.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            className={styles.viewHistoryBtn}
            onClick={() => {
              closeModal();
              openModal('history');
            }}
          >
            <History size={16} />
            <span>Theo Dõi Tiến Độ (Lịch Sử)</span>
          </button>

          <button className={styles.continueBtn} onClick={closeModal}>
            <span>Tiếp Tục Đặt Hàng</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
