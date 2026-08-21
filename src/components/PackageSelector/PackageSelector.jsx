import React from 'react';
import { useApp } from '../../context/AppContext';
import { PackageCard } from '../PackageCard/PackageCard';
import { Layers } from 'lucide-react';
import styles from './PackageSelector.module.css';

export const PackageSelector = () => {
  const { packages, selectedPackageId, setSelectedPackageId } = useApp();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleBox}>
          <span className={styles.stepNumber}>1.</span>
          <h2 className={styles.sectionTitle}>CHỌN GÓI DỊCH VỤ</h2>
          <span className={styles.requiredStar}>*</span>
        </div>
        <span className={styles.sectionSubtitle}>Chọn gói phù hợp với mục tiêu sự kiện của bạn</span>
      </div>

      <div className={styles.grid}>
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            isSelected={pkg.id === selectedPackageId}
            onSelect={setSelectedPackageId}
          />
        ))}
      </div>
    </section>
  );
};
