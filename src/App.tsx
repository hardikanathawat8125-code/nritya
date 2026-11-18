/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { X } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NrityaProvider, useNritya } from './context/NrityaContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthOnboardingModal } from './components/AuthOnboardingModal';
import { DancerPortfolioModal } from './components/DancerPortfolioModal';
import { HomePage } from './pages/HomePage';
import { CommunityPage } from './pages/CommunityPage';
import { MasterclassesPage } from './pages/MasterclassesPage';
import { EventsPage } from './pages/EventsPage';
import { GatheringsPage } from './pages/GatheringsPage';
import { ExploreDancersPage } from './pages/ExploreDancersPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { GlobalSearchPage } from './pages/GlobalSearchPage';

const ToastRack: React.FC = () => {
  const { toasts, dismissToast } = useNritya();
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-sm shadow-sm ${
            t.tone === 'error'
              ? 'bg-[#FFFDF9] border-[#B5727B] text-[#4A1D3D]'
              : t.tone === 'success'
              ? 'bg-[#4A1D3D] border-[#4A1D3D] text-[#FAF7F2]'
              : 'bg-[#FFFDF9] border-[#E5DDD2] text-[#1E171D]'
          }`}
        >
          <span>{t.text}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss message"
            className="opacity-80 hover:opacity-100 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

const NrityaShell: React.FC = () => {
  const { page, isOffline } = useNritya();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E171D]">
      <Header />

      {isOffline && (
        <div className="bg-[#4A1D3D] text-[#FAF7F2] text-xs text-center py-2 px-4">
          Unable to reach Firestore server. Please check your internet or Firebase configuration.
        </div>
      )}

      <main className="flex-1">
        {page === 'home' && <HomePage />}
        {page === 'community' && <CommunityPage />}
        {page === 'masterclasses' && <MasterclassesPage />}
        {page === 'events' && <EventsPage />}
        {page === 'gatherings' && <GatheringsPage />}
        {page === 'explore' && <ExploreDancersPage />}
        {page === 'dashboard' && <DashboardPage />}
        {page === 'profile' && <ProfilePage />}
        {page === 'admin' && <AdminDashboardPage />}
        {page === 'search' && <GlobalSearchPage />}
      </main>

      <Footer />
      <AuthOnboardingModal />
      <DancerPortfolioModal />
      <ToastRack />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <NrityaProvider>
        <NrityaShell />
      </NrityaProvider>
    </ErrorBoundary>
  );
}
