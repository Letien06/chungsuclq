import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './ToastContainer.module.css';

export const ToastContainer = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => {
        let Icon = Info;
        let typeClass = styles.info;

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          typeClass = styles.success;
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          typeClass = styles.warning;
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          typeClass = styles.error;
        }

        return (
          <div key={toast.id} className={`${styles.toast} ${typeClass}`}>
            <div className={styles.iconBox}>
              <Icon size={18} />
            </div>

            <div className={styles.content}>
              <h5 className={styles.title}>{toast.title}</h5>
              <p className={styles.message}>{toast.message}</p>
            </div>

            <button
              className={styles.closeBtn}
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
