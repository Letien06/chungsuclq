import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageCircle, HelpCircle, ArrowUp } from 'lucide-react';
import styles from './FloatingActions.module.css';

export const FloatingActions = () => {
  const { openModal } = useApp();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>
      {showBackToTop && (
        <button
          className={styles.actionBtn}
          onClick={scrollToTop}
          title="Lên đầu trang"
          aria-label="Scroll to top"
        >
          <ArrowUp size={18} />
        </button>
      )}

      <button
        className={`${styles.actionBtn} ${styles.guideBtn}`}
        onClick={() => openModal('guide')}
        title="Hướng dẫn lấy mã mời"
        aria-label="Guide"
      >
        <HelpCircle size={18} />
      </button>

      <a
        href="https://zalo.me"
        target="_blank"
        rel="noreferrer"
        className={`${styles.actionBtn} ${styles.zaloBtn}`}
        title="Chat hỗ trợ Zalo"
        aria-label="Zalo CSKH"
      >
        <span className={styles.pulseDot} />
        <MessageCircle size={20} />
      </a>
    </div>
  );
};
