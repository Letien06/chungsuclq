import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './NoteInput.module.css';

export const NoteInput = () => {
  const { note, setNote } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className={styles.section}>
      <button className={styles.titleBox} type="button" onClick={() => setIsExpanded((value) => !value)} aria-expanded={isExpanded}>
        <span className={styles.stepNumber}>4.</span>
        <h2 className={styles.sectionTitle}>GHI CHÚ (NẾU CÓ)</h2>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && <div className={styles.container}>
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder="Nhập Mã Code Sự Kiện Hoặc Yêu Cầu Riêng..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
        />
        <div className={styles.counter}>{note.length}/300 ký tự</div>
      </div>}
    </section>
  );
};
