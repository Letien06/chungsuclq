import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, HelpCircle, Smartphone, Share2, Copy, CheckCircle, ArrowRight } from 'lucide-react';
import styles from './EventGuideModal.module.css';

export const EventGuideModal = () => {
  const { activeModal, closeModal } = useApp();

  if (activeModal !== 'guide') return null;

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className={styles.closeBtn} onClick={closeModal} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Header */}
        <div className={styles.header}>
          <HelpCircle size={22} className={styles.headerIcon} />
          <h3 className={styles.title}>HƯỚNG DẪN LẤY FRIEND CODE</h3>
        </div>

        {/* Steps */}
        <div className={styles.stepsList}>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h4>Mở Game & Vào Sự Kiện</h4>
              <p>Mở app <strong>Liên Quân Mobile</strong> trên điện thoại, chọn biểu tượng <strong>SỰ KIỆN</strong> ở sảnh chính.</p>
            </div>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h4>Chọn Sự Kiện Chung Sức</h4>
              <p>Tìm và ấn vào tab sự kiện <strong>"Chung Sức Nhận Trang Phục SS / SSS"</strong> đang diễn ra.</p>
            </div>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h4>Bấm "Chia Sẻ Mã Mời" (Friend Code)</h4>
              <p>Bấm vào nút <strong>Mời Bạn Bè</strong> hoặc biểu tượng <strong>Sao Chép Mã Mời</strong> (Mã có dạng <code>LQ#123456</code> hoặc mã chữ/số).</p>
            </div>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>4</div>
            <div className={styles.stepContent}>
              <h4>Dán Vào Website & Đặt Hàng</h4>
              <p>Quay lại website, dán mã mời vào ô <strong>"3. MÃ MỜI (FRIEND CODE)"</strong> và bấm Thanh Toán để hệ thống cày tự động!</p>
            </div>
          </div>
        </div>

        <div className={styles.footerNote}>
          🔒 <strong>Lưu ý:</strong> Website tuyệt đối KHÔNG yêu cầu tài khoản, mật khẩu hay mã OTP của bạn. Chỉ cần Friend Code là hệ thống có thể hỗ trợ cày bỉ an toàn 100%!
        </div>

        <button className={styles.doneBtn} onClick={closeModal}>
          ĐÃ HIỂU, QUAY LẠI ĐẶT HÀNG
        </button>
      </div>
    </div>
  );
};
