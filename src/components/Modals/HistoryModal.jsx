import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, History, CheckCircle2, Loader2, AlertCircle, Copy, Check, Clock, Flame } from 'lucide-react';
import styles from './HistoryModal.module.css';

export const HistoryModal = () => {
  const { activeModal, closeModal, orderHistory, addToast } = useApp();
  const [filter, setFilter] = useState('all'); // 'all' | 'processing' | 'completed'
  const [copiedId, setCopiedId] = useState(null);

  if (activeModal !== 'history') return null;

  const filteredOrders = orderHistory.filter((ord) => {
    if (filter === 'all') return true;
    return ord.status === filter;
  });

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    addToast('Đã sao chép mã', code, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className={styles.closeBtn} onClick={closeModal} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleBox}>
            <History size={20} className={styles.titleIcon} />
            <h3 className={styles.title}>LỊCH SỬ CÀY SỰ KIỆN</h3>
          </div>
          <span className={styles.totalOrdersCount}>{orderHistory.length} đơn hàng</span>
        </div>

        {/* Filters */}
        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất Cả ({orderHistory.length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'processing' ? styles.filterActive : ''}`}
            onClick={() => setFilter('processing')}
          >
            Đang Cày ({orderHistory.filter((o) => o.status === 'processing').length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'completed' ? styles.filterActive : ''}`}
            onClick={() => setFilter('completed')}
          >
            Hoàn Thành ({orderHistory.filter((o) => o.status === 'completed').length})
          </button>
        </div>

        {/* Orders List */}
        <div className={styles.ordersList}>
          {filteredOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <AlertCircle size={36} className={styles.emptyIcon} />
              <p>Chưa có đơn hàng nào trong mục này</p>
            </div>
          ) : (
            filteredOrders.map((ord) => (
              <div key={ord.id} className={styles.orderCard}>
                <div className={styles.cardTop}>
                  <div className={styles.orderIdGroup}>
                    <span className={styles.orderId}>#{ord.id}</span>
                    <span className={styles.packageName}>
                      <Flame size={13} className={styles.flameIcon} />
                      {ord.packageName}
                    </span>
                  </div>

                  <span
                    className={`${styles.statusBadge} ${
                      ord.status === 'completed'
                        ? styles.statusSuccess
                        : ord.status === 'processing'
                        ? styles.statusProcess
                        : styles.statusFail
                    }`}
                  >
                    {ord.status === 'completed' ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <Loader2 size={12} className={styles.spinIcon} />
                    )}
                    {ord.statusText || (ord.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý')}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className={styles.progressSection}>
                  <div className={styles.progressBarWrapper}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${ord.progress || (ord.status === 'completed' ? 100 : 50)}%` }}
                    />
                  </div>
                  <div className={styles.progressInfo}>
                    <span>Tiến độ hoàn thành</span>
                    <strong>{ord.progress || (ord.status === 'completed' ? 100 : 50)}%</strong>
                  </div>
                </div>

                {/* Friend Code & Details */}
                <div className={styles.cardBottom}>
                  <div className={styles.codeBox}>
                    <span className={styles.codeLabel}>Mã Mời:</span>
                    <span className={styles.codeText}>{ord.friendCode}</span>
                    <button
                      className={styles.copyBtn}
                      onClick={() => handleCopyCode(ord.friendCode, ord.id)}
                      title="Sao chép"
                    >
                      {copiedId === ord.id ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                    </button>
                  </div>

                  <div className={styles.priceDateBox}>
                    <span className={styles.biTag}>+{ord.bi} Bỉ</span>
                    <span className={styles.amountTag}>
                      {ord.amount?.toLocaleString('vi-VN')}đ
                    </span>
                    <span className={styles.dateTag}>
                      <Clock size={11} /> {ord.createdAt}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
