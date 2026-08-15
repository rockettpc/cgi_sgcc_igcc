import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BackButton } from '../components/BackButton';
import { BookOpen, FileText, Download, ShieldCheck } from 'lucide-react';

const DEFAULT_DOCUMENTS = [
  {
    id: 'sgcc-sd-211',
    titleKey: 'docSgccTitle',
    subtitleKey: 'docSgccSubtitle',
    categoryKey: 'docSgccCat',
    authorityKey: 'docSgccAuth',
    descKey: 'docSgccDesc',
    filename: 'SGCC-SD-211-Guidance-Standard.pdf',
    relativePath: '/docs/standards/SGCC-SD-211-Guidance-Standard.pdf',
    standardCode: 'SGCC SD-211 / ANSI Z97.1 / CPSC 16 CFR 1201',
    available: true,
    fileSize: '0.75 MB'
  },
  {
    id: 'astm-c1651',
    titleKey: 'docC1651Title',
    subtitleKey: 'docC1651Subtitle',
    categoryKey: 'docC1651Cat',
    authorityKey: 'docC1651Auth',
    descKey: 'docC1651Desc',
    filename: 'ASTM-C1651.pdf',
    relativePath: '/docs/standards/ASTM-C1651.pdf',
    standardCode: 'ASTM C1651-11',
    available: true,
    fileSize: '0.11 MB'
  },
  {
    id: 'astm-f3007',
    titleKey: 'docF3007Title',
    subtitleKey: 'docF3007Subtitle',
    categoryKey: 'docF3007Cat',
    authorityKey: 'docF3007Auth',
    descKey: 'docF3007Desc',
    filename: null,
    relativePath: null,
    standardCode: 'ASTM F3007-13',
    available: false,
    fileSize: null
  }
];

export const ReferenceDocuments = ({ setTab }) => {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [documents, setDocuments] = useState(DEFAULT_DOCUMENTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authToken = token || localStorage.getItem('sgcc_token');
    fetch('/api/documents', {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    })
      .then(res => {
        if (!res.ok) throw new Error('API response not ok');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDocuments(data);
        }
      })
      .catch(err => {
        console.warn('Using default fallback reference documents:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <div>
      {setTab && <BackButton onClick={() => setTab('dashboard')} />}
      <div className="card">
        <div className="card-title">
          <BookOpen size={24} color="var(--accent-primary)" />
          <span>{t('refDocsTitle')}</span>
        </div>

        <div className="reminder-banner" style={{ marginBottom: 20 }}>
          <ShieldCheck size={22} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem' }}>
            {t('refDocsBanner')}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
            Loading standard specifications...
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {documents.map((doc) => {
              const title = doc.titleKey ? t(doc.titleKey) : doc.title;
              const subtitle = doc.subtitleKey ? t(doc.subtitleKey) : doc.subtitle;
              const category = doc.categoryKey ? t(doc.categoryKey) : doc.category;
              const authority = doc.authorityKey ? t(doc.authorityKey) : doc.authority;
              const description = doc.descKey ? t(doc.descKey) : doc.description;

              return (
                <div 
                  key={doc.id} 
                  className="card" 
                  style={{ 
                    margin: 0, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justify: 'space-between',
                    borderTop: '4px solid var(--accent-primary)',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="role-pill" style={{ backgroundColor: 'var(--bg-card-subtle)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}>
                        {category}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {doc.standardCode}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '8px 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={20} color="var(--accent-primary)" />
                      {title}
                    </h3>
                    
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
                      {subtitle} • {authority}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                      {description}
                    </p>
                  </div>

                  <div>
                    {doc.available && doc.relativePath ? (
                      <div style={{ marginTop: 12 }}>
                        <a
                          href={doc.relativePath}
                          download={doc.filename}
                          className="btn btn-primary"
                          style={{ 
                            width: '100%', 
                            minHeight: 42, 
                            fontSize: '0.9rem', 
                            fontWeight: 700, 
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'center',
                            gap: 8
                          }}
                          title="Download PDF File"
                        >
                          <Download size={18} />
                          <span>{t('downloadDocument')} {doc.fileSize ? `(${doc.fileSize})` : ''}</span>
                        </a>
                      </div>
                    ) : (
                      <div style={{ padding: '10px 12px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        {t('docNotAvailable')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
