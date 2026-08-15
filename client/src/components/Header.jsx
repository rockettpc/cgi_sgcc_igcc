import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, Globe, Sun, Moon, LogOut, Home, Flame, Layers, Activity, FileSpreadsheet, Settings, BookOpen } from 'lucide-react';

export const Header = ({ currentTab, setTab }) => {
  const { user, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard', label: t('navDashboard'), icon: Home },
    { id: 'tempered', label: t('navTempered'), icon: Flame },
    { id: 'laminated', label: t('navLaminated'), icon: Layers },
    { id: 'rollwave', label: t('navRollWave'), icon: Activity },
    { id: 'records', label: t('navRecords'), icon: FileSpreadsheet },
    { id: 'docs', label: t('navDocs'), icon: BookOpen },
  ];

  if (user?.role === 'Admin') {
    navItems.push({ id: 'admin', label: t('navAdmin'), icon: Settings });
  }

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Top Bar */}
        <div className="header-top">
          <div className="header-brand" style={{ cursor: 'pointer' }} onClick={() => setTab('dashboard')}>
            <ShieldCheck size={28} className="brand-icon" />
            <div>
              <div className="brand-title">{t('appTitle')}</div>
              <div className="brand-subtitle">{t('subTitle')}</div>
            </div>
          </div>

          <div className="header-utilities">
            <button className="utility-btn" onClick={toggleLanguage} title="Switch Language">
              <Globe size={16} />
              <span>{lang.toUpperCase()}</span>
            </button>

            <button className="utility-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user && (
              <div className="user-controls">
                <span className={`role-pill role-${user.role.toLowerCase().replace(/\s+/g, '')}`}>
                  {user.role}
                </span>
                <button className="utility-btn logout-btn" onClick={logout} title={t('logout')}>
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tab Bar (When user logged in) */}
        {user && (
          <nav className="header-nav">
            <div className="nav-scroller">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`nav-tab ${isActive ? 'active' : ''}`}
                    onClick={() => setTab(item.id)}
                  >
                    <Icon size={17} className="nav-tab-icon" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
