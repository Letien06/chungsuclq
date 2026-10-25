import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PackageCard } from '../PackageCard/PackageCard';
import { Check, ChevronRight, X } from 'lucide-react';
import styles from './PackageSelector.module.css';

export const PackageSelector = () => {
  const { packages, selectedPackageId, setSelectedPackageId, currentPackage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef(null);
  const changeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    const trigger = changeButtonRef.current;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [isOpen]);

  const choosePackage = (id) => {
    setSelectedPackageId(id);
    setIsOpen(false);
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleBox}>
          <span className={styles.stepNumber}>1.</span>
          <h2 className={styles.sectionTitle}>CHỌN GÓI DỊCH VỤ</h2>
          <span className={styles.requiredStar}>*</span>
        </div>
        <span className={styles.sectionSubtitle}>Chọn dịch vụ phù hợp với mục tiêu sự kiện của bạn</span>
      </div>

      <div className={styles.selectedService}>
        <div className={styles.selectedIcon}><Check size={18} /></div>
        <div className={styles.selectedInfo}>
          <span className={styles.selectedLabel}>DỊCH VỤ ĐANG CHỌN</span>
          <strong>{currentPackage.name}</strong>
          <span>{currentPackage.bi} Vé nhảy · {currentPackage.price.toLocaleString('vi-VN')}đ</span>
        </div>
        <button ref={changeButtonRef} className={styles.changeButton} type="button" onClick={() => setIsOpen(true)}>
          Đổi dịch vụ <ChevronRight size={16} />
        </button>
      </div>

      {isOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsOpen(false);
        }}>
          <div className={styles.serviceModal} role="dialog" aria-modal="true" aria-labelledby="service-modal-title">
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEyebrow}>CHỌN DỊCH VỤ</span>
                <h3 id="service-modal-title">Bạn muốn nhận bao nhiêu Vé nhảy?</h3>
              </div>
              <button ref={closeButtonRef} className={styles.closeButton} type="button" aria-label="Đóng" onClick={() => setIsOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalGrid}>
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isSelected={pkg.id === selectedPackageId}
                  onSelect={choosePackage}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
