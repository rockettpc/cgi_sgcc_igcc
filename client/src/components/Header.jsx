import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, Globe, Sun, Moon, LogOut, Home, ClipboardList, Settings, FileSpreadsheet } from 'lucide-react';

export const Header = ({ currentTab, setTab }) => {
  const { user, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-title" style={{ cursor: 'pointer' }} onClick={() => setTab('dashboard')}>
          <ShieldCheck size={26} color="var(--accent-primary)" />
          <div>
            <div style={{ lineHeight: 1.1 }}>{t('appTitle')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {t('subTitle')}
            </div>
          </div>
        </div>

        <div className="header-actions">
          {user && (
            <>
              <button 
                className={`icon-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setTab('dashboard')} 
                title={t('dashboard')}
              >
                <Home size={18} />
              </button>
              
              <button 
                className={`icon-btn ${currentTab === 'records' ? 'active' : ''}`}
                onClick={() => setTab('records')} 
                title={t('recordsList')}
              >
                <FileSpreadsheet size={18} />
              </button>

              {user.role === 'Admin' && (
                <button 
                  className={`icon-btn ${currentTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setTab('admin')} 
                  title={t('adminPanel')}
                >
                  <Settings size={18} />
                </button>
              )}
            </>
          )}

          <button className="icon-btn" onClick={toggleLanguage} title="Switch Language">
            <Globe size={18} />
            <span style={{ marginLeft: 2, fontSize: '0.75rem' }}>{lang.toUpperCase()}</span>
          </button>

          <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
              <span className={`role-pill role-${user.role.toLowerCase().replace(/\s+/g, '')}`}>
                {user.role}
              </span>
              <button className="icon-btn" onClick={logout} title={t('logout')}>
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
