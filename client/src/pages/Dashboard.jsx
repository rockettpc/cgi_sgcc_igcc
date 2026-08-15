import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Flame, Layers, FileSpreadsheet, ShieldAlert, ArrowRight, Activity, BookOpen } from 'lucide-react';

export const Dashboard = ({ setTab }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div>
      {/* SGCC Reminder Banner */}
      <div className="reminder-banner">
        <ShieldAlert size={24} style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700 }}>{t('sgccReminderTitle')}</div>
          <div style={{ fontSize: '0.82rem', marginTop: 2, opacity: 0.9 }}>
            {t('temperedBanner')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {/* Card 1: Tempered Break Test */}
        <div 
          className="card" 
          style={{ cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid var(--accent-primary)' }}
          onClick={() => setTab('tempered')}
        >
          <div className="card-title">
            <Flame size={22} color="var(--accent-primary)" />
            <span>{t('newTemperedTest')}</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            {t('cardTemperedDesc')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
            <span>{t('cardStartEntry')}</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 2: Laminated Ball Drop Test */}
        <div 
          className="card" 
          style={{ cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid #8b5cf6' }}
          onClick={() => setTab('laminated')}
        >
          <div className="card-title">
            <Layers size={22} color="#8b5cf6" />
            <span>{t('newLaminatedTest')}</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            {t('cardLaminatedDesc')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8b5cf6', fontWeight: 600, fontSize: '0.9rem' }}>
            <span>{t('cardRecordSpecimen')}</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 3: Roll Wave Distortion Test */}
        <div 
          className="card" 
          style={{ cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid #06b6d4' }}
          onClick={() => setTab('rollwave')}
        >
          <div className="card-title">
            <Activity size={22} color="#06b6d4" />
            <span>{t('newRollWaveTest')}</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            {t('cardRollWaveDesc')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#06b6d4', fontWeight: 600, fontSize: '0.9rem' }}>
            <span>{t('cardMeasureRollWave')}</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 4: Records & Audit Prep */}
        <div 
          className="card" 
          style={{ cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid var(--success-text)' }}
          onClick={() => setTab('records')}
        >
          <div className="card-title">
            <FileSpreadsheet size={22} color="var(--success-text)" />
            <span>{t('recordsList')}</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            {t('cardRecordsDesc')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success-text)', fontWeight: 600, fontSize: '0.9rem' }}>
            <span>{t('cardViewLogs')}</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 5: Reference Standards */}
        <div 
          className="card" 
          style={{ cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid #f59e0b' }}
          onClick={() => setTab('docs')}
        >
          <div className="card-title">
            <BookOpen size={22} color="#f59e0b" />
            <span>{t('navDocs')}</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            {t('cardDocsDesc')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontWeight: 600, fontSize: '0.9rem' }}>
            <span>{t('cardViewDocs')}</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 8 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 10 }}>{t('complianceHeader')}</h3>
        <ul style={{ paddingLeft: 20, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <li>{t('complianceTempered')}</li>
          <li>{t('complianceLaminated')}</li>
          <li>{t('complianceRollWave')}</li>
          <li>{t('complianceRetention')}</li>
        </ul>
      </div>
    </div>
  );
};
