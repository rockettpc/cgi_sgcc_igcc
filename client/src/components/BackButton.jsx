import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const BackButton = ({ onClick }) => {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      className="back-btn"
      onClick={onClick}
    >
      <ArrowLeft size={16} />
      <span>{t('backToDashboard')}</span>
    </button>
  );
};
