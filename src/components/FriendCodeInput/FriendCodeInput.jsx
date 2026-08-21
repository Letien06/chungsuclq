import React from 'react';
import { useApp } from '../../context/AppContext';
import { Ticket, HelpCircle, Clipboard, Check, Layers } from 'lucide-react';
import styles from './FriendCodeInput.module.css';

export const FriendCodeInput = () => {
  const {
    friendCode,
    setFriendCode,
    isBulk,
    setIsBulk,
    bulkCodesText,
    setBulkCodesText,
    parsedBulkCodes,
    openModal,
    addToast
  } = useApp();

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (isBulk) {
          setBulkCodesText((prev) => (prev ? `${prev}\n${text}` : text));
        } else {
          setFriendCode(text.trim());
        }
        addToast('Đã dán từ bộ nhớ tạm', text.substring(0, 30) + '...', 'info');
      }
    } catch (err) {
      addToast('Không thể dán', 'Trình duyệt không cho phép truy cập clipboard tự động. Bạn vui lòng bấm Ctrl+V!', 'warning');
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.headerRow}>
        <div className={styles.titleBox}>
          <span className={styles.stepNumber}>3.</span>
          <h2 className={styles.sectionTitle}>MÃ MỜI (FRIEND CODE)</h2>
          <span className={styles.requiredStar}>*</span>
        </div>

        {/* Bulk toggle switch */}
        <div className={styles.toggleWrapper} onClick={() => setIsBulk(!isBulk)}>
          <span className={`${styles.toggleLabel} ${isBulk ? styles.toggleLabelActive : ''}`}>
            MUA SỐ LƯỢNG LỚN
          </span>
          <div className={`${styles.switch} ${isBulk ? styles.switchActive : ''}`}>
            <div className={styles.switchHandle} />
          </div>
        </div>
      </div>

      {!isBulk ? (
        /* Single Mode Input */
        <div className={styles.inputContainer}>
          <div className={styles.inputIconBox}>
            <Ticket size={20} className={styles.inputIcon} />
          </div>

          <input
            type="text"
            className={styles.inputField}
            placeholder="Nhập 1 Mã Mời (Friend Code)..."
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value)}
          />

          <div className={styles.inputActions}>
            <button
              type="button"
              className={styles.pasteBtn}
              onClick={handlePaste}
              title="Dán từ Clipboard"
            >
              <Clipboard size={15} />
              <span>Dán</span>
            </button>

            <button
              type="button"
              className={styles.guideBtn}
              onClick={() => openModal('guide')}
              title="Hướng dẫn lấy mã mời trong game"
            >
              <HelpCircle size={15} />
              <span>Lấy ở đâu?</span>
            </button>
          </div>
        </div>
      ) : (
        /* Bulk Mode Textarea */
        <div className={styles.bulkContainer}>
          <div className={styles.bulkHeader}>
            <div className={styles.bulkInfo}>
              <Layers size={16} className={styles.bulkIcon} />
              <span>Nhập mỗi dòng 1 Mã Mời (Friend Code)</span>
            </div>
            <div className={styles.bulkStats}>
              Đã nhận diện: <strong className={styles.statsCount}>{parsedBulkCodes.length}</strong> mã
            </div>
          </div>

          <textarea
            className={styles.bulkTextarea}
            rows={5}
            placeholder={`LQ#882194\nLQ#992144\nLQ#102934\nLQ#774829`}
            value={bulkCodesText}
            onChange={(e) => setBulkCodesText(e.target.value)}
          />

          <div className={styles.bulkFooter}>
            <button
              type="button"
              className={styles.pasteBtn}
              onClick={handlePaste}
            >
              <Clipboard size={15} />
              <span>Dán danh sách mã</span>
            </button>

            <button
              type="button"
              className={styles.guideBtn}
              onClick={() => openModal('guide')}
            >
              <HelpCircle size={15} />
              <span>Xem hướng dẫn</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
