import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BANK_PAYMENT_INFO } from '../../data/packages';
import { X, QrCode, Smartphone, CreditCard, Copy, Check, Zap, Sparkles, ShieldCheck } from 'lucide-react';
import styles from './TopUpModal.module.css';

export const TopUpModal = () => {
  const { activeModal, closeModal, user, topUpBalance, addToast } = useApp();
  const [method, setMethod] = useState('bank'); // 'bank' | 'momo' | 'card'
  const [selectedAmount, setSelectedAmount] = useState(50000);
  const [copiedField, setCopiedField] = useState(null);

  // Card form state
  const [cardTelco, setCardTelco] = useState('VIETTEL');
  const [cardSerial, setCardSerial] = useState('');
  const [cardCode, setCardCode] = useState('');

  if (activeModal !== 'topup') return null;

  const username = user?.username || 'CSLQ_GUEST';
  const transferContent = `NAP ${username} ${selectedAmount / 1000}K`;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast('Đã sao chép', `Đã sao chép ${fieldName} vào clipboard!`, 'info');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCardSubmit = (e) => {
    e.preventDefault();
    if (!cardSerial || !cardCode) {
      addToast('Lỗi nhập thẻ', 'Vui lòng nhập đầy đủ mã thẻ và số serial!', 'error');
      return;
    }
    // Simulate auto card recharge
    addToast('Đang nạp thẻ...', 'Hệ thống đang kiểm tra thẻ cào của bạn...', 'info');
    setTimeout(() => {
      topUpBalance(selectedAmount);
    }, 1500);
  };

  const qrUrl = `https://img.vietqr.io/image/MB-${BANK_PAYMENT_INFO.accountNumber}-compact2.png?amount=${selectedAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_PAYMENT_INFO.accountName)}`;

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className={styles.closeBtn} onClick={closeModal} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.titleBox}>
            <CreditCard size={20} className={styles.titleIcon} />
            <h3 className={styles.title}>NẠP TIỀN TỰ ĐỘNG 24/7</h3>
          </div>
          <div className={styles.promoBadge}>
            <Sparkles size={12} />
            <span>+10% KHUYẾN MÃI</span>
          </div>
        </div>

        {/* Method Selectors */}
        <div className={styles.methodTabs}>
          <button
            className={`${styles.methodBtn} ${method === 'bank' ? styles.methodActive : ''}`}
            onClick={() => setMethod('bank')}
          >
            <QrCode size={16} />
            <span>Quét Mã QR Ngân Hàng</span>
          </button>

          <button
            className={`${styles.methodBtn} ${method === 'momo' ? styles.methodActive : ''}`}
            onClick={() => setMethod('momo')}
          >
            <Smartphone size={16} />
            <span>Ví MoMo</span>
          </button>

          <button
            className={`${styles.methodBtn} ${method === 'card' ? styles.methodActive : ''}`}
            onClick={() => setMethod('card')}
          >
            <CreditCard size={16} />
            <span>Thẻ Cào</span>
          </button>
        </div>

        {/* Amount Selector Chips */}
        <div className={styles.amountSection}>
          <span className={styles.amountLabel}>Chọn số tiền nạp:</span>
          <div className={styles.amountGrid}>
            {[20000, 30000, 50000, 100000, 180000, 200000, 500000].map((amt) => (
              <button
                key={amt}
                type="button"
                className={`${styles.amountChip} ${selectedAmount === amt ? styles.amountActive : ''}`}
                onClick={() => setSelectedAmount(amt)}
              >
                {amt.toLocaleString('vi-VN')}đ
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: VietQR Bank Transfer */}
        {method === 'bank' && (
          <div className={styles.contentBox}>
            <div className={styles.qrSide}>
              <div className={styles.qrWrapper}>
                <img
                  src={qrUrl}
                  alt="VietQR Chuyển Khoản"
                  className={styles.qrImage}
                  onError={(e) => {
                    // fallback placeholder if VietQR img blocked
                    e.target.style.display = 'none';
                  }}
                />
                <span className={styles.qrScanText}>Quét mã bằng App Ngân Hàng bất kỳ</span>
              </div>
            </div>

            <div className={styles.infoSide}>
              <div className={styles.bankInfoItem}>
                <span className={styles.infoKey}>Ngân Hàng:</span>
                <span className={styles.infoVal}>{BANK_PAYMENT_INFO.bankName}</span>
              </div>

              <div className={styles.bankInfoItem}>
                <span className={styles.infoKey}>Số Tài Khoản:</span>
                <div className={styles.copyRow}>
                  <span className={styles.infoValHighlight}>{BANK_PAYMENT_INFO.accountNumber}</span>
                  <button
                    className={styles.copyBtn}
                    onClick={() => handleCopy(BANK_PAYMENT_INFO.accountNumber, 'Số tài khoản')}
                  >
                    {copiedField === 'Số tài khoản' ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className={styles.bankInfoItem}>
                <span className={styles.infoKey}>Chủ Tài Khoản:</span>
                <span className={styles.infoVal}>{BANK_PAYMENT_INFO.accountName}</span>
              </div>

              <div className={styles.bankInfoItem}>
                <span className={styles.infoKey}>Số Tiền:</span>
                <span className={styles.priceVal}>{selectedAmount.toLocaleString('vi-VN')}đ</span>
              </div>

              <div className={styles.bankInfoItem}>
                <span className={styles.infoKey}>Nội Dung CK:</span>
                <div className={styles.copyRow}>
                  <span className={styles.contentVal}>{transferContent}</span>
                  <button
                    className={styles.copyBtn}
                    onClick={() => handleCopy(transferContent, 'Nội dung chuyển khoản')}
                  >
                    {copiedField === 'Nội dung chuyển khoản' ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: MoMo */}
        {method === 'momo' && (
          <div className={styles.contentBox}>
            <div className={styles.infoSide} style={{ width: '100%' }}>
              <div className={styles.bankInfoItem}>
                <span className={styles.infoKey}>Ví Điện Tử:</span>
                <span className={styles.infoVal}>MoMo Pay Tự Động</span>
              </div>
              <div className={styles.bankInfoItem}>
                <span className={styles.infoKey}>Số Điện Thoại:</span>
                <div className={styles.copyRow}>
                  <span className={styles.infoValHighlight}>{BANK_PAYMENT_INFO.momoPhone}</span>
                  <button
                    className={styles.copyBtn}
                    onClick={() => handleCopy(BANK_PAYMENT_INFO.momoPhone, 'SĐT MoMo')}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className={styles.bankInfoItem}>
                <span className={styles.infoKey}>Người Nhận:</span>
                <span className={styles.infoVal}>{BANK_PAYMENT_INFO.momoName}</span>
              </div>
              <div className={styles.bankInfoItem}>
                <span className={styles.infoKey}>Nội Dung:</span>
                <div className={styles.copyRow}>
                  <span className={styles.contentVal}>{transferContent}</span>
                  <button
                    className={styles.copyBtn}
                    onClick={() => handleCopy(transferContent, 'Nội dung MoMo')}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Thẻ Cào */}
        {method === 'card' && (
          <form className={styles.cardForm} onSubmit={handleCardSubmit}>
            <div className={styles.cardSelectGroup}>
              {['VIETTEL', 'VINAPHONE', 'MOBIFONE'].map((telco) => (
                <button
                  key={telco}
                  type="button"
                  className={`${styles.telcoBtn} ${cardTelco === telco ? styles.telcoActive : ''}`}
                  onClick={() => setCardTelco(telco)}
                >
                  {telco}
                </button>
              ))}
            </div>

            <div className={styles.cardInputGroup}>
              <input
                type="text"
                className={styles.cardInput}
                placeholder="Nhập mã thẻ..."
                value={cardCode}
                onChange={(e) => setCardCode(e.target.value)}
                required
              />
              <input
                type="text"
                className={styles.cardInput}
                placeholder="Nhập số serial..."
                value={cardSerial}
                onChange={(e) => setCardSerial(e.target.value)}
                required
              />
            </div>

            <button type="submit" className={styles.cardSubmitBtn}>
              NẠP THẺ CÀO NGAY
            </button>
          </form>
        )}

        {/* Quick Instant Test Recharge (Simulator) */}
        <div className={styles.demoBar}>
          <div className={styles.demoPrompt}>
            <span>⚙️ Đang ở chế độ Demo FE:</span>
          </div>
          <button
            type="button"
            className={styles.demoTopupBtn}
            onClick={() => topUpBalance(selectedAmount)}
          >
            <Zap size={15} />
            <span>Mô phỏng Nạp Ngay {selectedAmount.toLocaleString('vi-VN')}đ (1-Click)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
