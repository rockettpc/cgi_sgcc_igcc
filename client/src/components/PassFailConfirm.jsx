import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export const PassFailConfirm = ({ 
  type = 'tempered', // 'tempered' or 'laminated'
  suggestedValue, // 'Pass'/'Fail' or '1'/'2'/'3'/'4'
  confirmedValue, 
  onConfirm 
}) => {
  const { t } = useLanguage();

  if (type === 'tempered' || type === 'rollwave') {
    const isPass = suggestedValue === 'Pass';
    return (
      <div className="confirm-box">
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {t('suggestedResult')}:
          <span className={`suggested-badge ${isPass ? 'badge-pass' : 'badge-fail'}`}>
            {isPass ? (type === 'rollwave' ? t('passLimit') : t('passWeight')) : (type === 'rollwave' ? t('failLimit') : t('failWeight'))}
          </span>
        </div>

        <div style={{ margin: '12px 0 6px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <AlertCircle size={14} color="var(--warning-text)" />
          <span>{t('operatorConfirmation')}</span>
        </div>

        <div className="confirm-toggle-group">
          <button
            type="button"
            className={`confirm-btn confirm-btn-pass ${confirmedValue === 'Pass' ? 'selected' : ''}`}
            onClick={() => onConfirm('Pass')}
          >
            ✓ {t('confirmPass')}
          </button>

          <button
            type="button"
            className={`confirm-btn confirm-btn-fail ${confirmedValue === 'Fail' ? 'selected' : ''}`}
            onClick={() => onConfirm('Fail')}
          >
            ✕ {t('confirmFail')}
          </button>
        </div>
      </div>
    );
  }

  // Laminated Ball Drop ASTM F3007-13 Categories (1, 2, 3, 4)
  return (
    <div className="confirm-box">
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        {t('suggestedResult')}:
        <span className="suggested-badge badge-pass">
          Cat {suggestedValue || '1'}
        </span>
      </div>

      <div style={{ margin: '12px 0 6px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <AlertCircle size={14} color="var(--warning-text)" />
        <span>{t('selectCategoryConfirmation')}</span>
      </div>

      <div className="confirm-toggle-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {['1', '2', '3', '4'].map((cat) => (
          <button
            key={cat}
            type="button"
            className={`confirm-btn ${confirmedValue === cat ? (cat === '1' || cat === '2' ? 'confirm-btn-pass selected' : 'confirm-btn-fail selected') : 'confirm-btn-pass'}`}
            style={{ fontSize: '0.95rem', minHeight: 44, padding: 4 }}
            onClick={() => onConfirm(cat)}
          >
            Cat {cat}
          </button>
        ))}
      </div>
    </div>
  );
};
