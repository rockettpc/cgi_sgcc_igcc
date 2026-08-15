import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TemperedForm } from './pages/TemperedForm';
import { LaminatedForm } from './pages/LaminatedForm';
import { RollWaveForm } from './pages/RollWaveForm';
import { RecordsList } from './pages/RecordsList';
import { AdminPanel } from './pages/AdminPanel';
import { ReferenceDocuments } from './pages/ReferenceDocuments';

function MainLayout() {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');

  if (!user) {
    return (
      <div className="app-container">
        <Header currentTab={tab} setTab={setTab} />
        <main className="main-content">
          <Login />
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header currentTab={tab} setTab={setTab} />
      <main className="main-content">
        {tab === 'dashboard' && <Dashboard setTab={setTab} />}
        {tab === 'tempered' && <TemperedForm setTab={setTab} />}
        {tab === 'laminated' && <LaminatedForm setTab={setTab} />}
        {tab === 'rollwave' && <RollWaveForm setTab={setTab} />}
        {tab === 'records' && <RecordsList setTab={setTab} />}
        {tab === 'docs' && <ReferenceDocuments setTab={setTab} />}
        {tab === 'admin' && user.role === 'Admin' && <AdminPanel setTab={setTab} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <MainLayout />
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
