import React from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquareText } from 'lucide-react';
import styles from './NoteInput.module.css';

export const NoteInput = () => {
  const { note, setNote } = useApp();

  return (
    <section className={styles.section}>
      <div className={styles.titleBox}>
        <span className={styles.stepNumber}>4.</span>
        <h2 className={styles.sectionTitle}>GHI CHÚ (NẾU CÓ)</h2>
      </div>

      <div className={styles.container}>
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder="Nhập Mã Code Sự Kiện Hoặc Yêu Cầu Riêng..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
        />
        <div className={styles.counter}>{note.length}/300 ký tự</div>
      </div>
    </section>
  );
};
