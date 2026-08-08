import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Flame, Layers, FileSpreadsheet, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Dashboard = ({ setTab }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div>
      {/* SGCC Reminder Banner */}
      <div className="reminder-banner">
        <ShieldAlert size={24} style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700 }}>SGCC SD-211 Quality Assurance Reminder</div>
          <div style={{ fontSize: '0.82rem', marginTop: 2, opacity: 0.9 }}>
            {t('temperedBanner')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
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
            Log first-of-thickness per shift center punch break test with auto particle weight calculation & photo.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
            <span>Start Test Entry</span>
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
            Record weekly specimen traceability & monthly ball drop testing with ASTM F3007-13 category selection.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8b5cf6', fontWeight: 600, fontSize: '0.9rem' }}>
            <span>Record Specimen / Test</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 3: Records & Audit Prep */}
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
            Search historical records, view edit audit trail, and export CSV/PDF reports for twice-yearly SGCC audits.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success-text)', fontWeight: 600, fontSize: '0.9rem' }}>
            <span>View Logs & Export</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 8 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 10 }}>Compliance Requirements (SGCC SD-211)</h3>
        <ul style={{ paddingLeft: 20, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <li><strong>Tempered Glass:</strong> Minimum 1 specimen per thickness per shift. Center punch 13mm from edge. Record 10-piece particle weight.</li>
          <li><strong>Laminated Glass:</strong> Minimum weekly sample collection. Monthly ball drop testing (within 30 days). 3-4 specimens per test.</li>
          <li><strong>Record Retention:</strong> Minimum 10 years traceable retained data.</li>
        </ul>
      </div>
    </div>
  );
};
