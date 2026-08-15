import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const BackButton = ({ onClick }) => {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      className="btn btn-secondary"
      style={{ width: 'auto', marginBottom: 14, minHeight: 36, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
      onClick={onClick}
    >
      <ArrowLeft size={16} />
      <span>{t('backToDashboard')}</span>
    </button>
  );
};
