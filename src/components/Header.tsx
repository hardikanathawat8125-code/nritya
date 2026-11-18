import React, { useState } from 'react';
import { Menu, Search, User, X } from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import { AppPage } from '../types/nritya';

const NAV_ITEMS: { id: AppPage; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'community', label: 'Community' },
  { id: 'masterclasses', label: 'Masterclasses' },
  { id: 'events', label: 'Events' },
  { id: 'gatherings', label: 'Gatherings' },
  { id: 'explore', label: 'Explore Dancers' },
  { id: 'dashboard', label: 'Dashboard' },
];

export const Header: React.FC = () => {
  const {
    page,
    navigate,
    firebaseUser,
    currentUserProfile,
    isAdmin,
    notifications,
    setOpenAuthModal,
  } = useNritya();
  const [mobileOpen, setMobileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNav = (id: AppPage) => {
    navigate(id);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-sm border-b border-[#E5DDD2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="font-display text-2xl font-semibold tracking-[0.14em] text-[#4A1D3D] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1D3D] rounded"
        >
          NRITYA
        </button>

        {/* Zone 2: Clean single-line typography navigation */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#5A4A57]"
        >
          {NAV_ITEMS.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors hover:text-[#4A1D3D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1D3D] rounded ${
                  active ? 'text-[#4A1D3D] font-semibold' : ''
                }`}
              >
                {item.label}
                {item.id === 'dashboard' && unreadCount > 0 && (
                  <span className="ml-1 text-xs text-[#B38838] tabular-nums">
                    ({unreadCount})
                  </span>
                )}
                {active && (
                  <span className="absolute inset-x-0 -bottom-[19px] h-[2px] bg-[#4A1D3D]" />
                )}
              </button>
            );
          })}
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className={`relative py-1 whitespace-nowrap shrink-0 transition-colors hover:text-[#4A1D3D] ${
                page === 'admin' ? 'text-[#4A1D3D] font-semibold' : ''
              }`}
            >
              Admin
              {page === 'admin' && (
                <span className="absolute inset-x-0 -bottom-[19px] h-[2px] bg-[#4A1D3D]" />
              )}
            </button>
          )}
        </nav>

        {/* Zone 3: Search + Primary Profile / Sign In Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('search')}
            aria-label="Global Search"
            className={`p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
              page === 'search'
                ? 'bg-[#4A1D3D]/10 text-[#4A1D3D]'
                : 'text-[#5A4A57] hover:text-[#4A1D3D] hover:bg-[#F3EDE3]'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {firebaseUser ? (
            <button
              type="button"
              onClick={() => handleNav('profile')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors min-h-[40px] ${
                page === 'profile'
                  ? 'bg-[#36132C] text-[#FAF7F2]'
                  : 'bg-[#4A1D3D] text-[#FAF7F2] hover:bg-[#36132C]'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="max-w-[120px] truncate">
                {currentUserProfile?.displayName?.split(' ')[0] || 'Profile'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpenAuthModal(true)}
              className="px-4 py-2 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 rounded-lg text-[#4A1D3D] hover:bg-[#F3EDE3] min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E5DDD2] bg-[#FAF7F2] px-4 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                page === item.id
                  ? 'bg-[#4A1D3D] text-[#FAF7F2]'
                  : 'text-[#1E171D] hover:bg-[#F3EDE3]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleNav('profile')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
              page === 'profile'
                ? 'bg-[#4A1D3D] text-[#FAF7F2]'
                : 'text-[#1E171D] hover:bg-[#F3EDE3]'
            }`}
          >
            Profile
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                page === 'admin'
                  ? 'bg-[#4A1D3D] text-[#FAF7F2]'
                  : 'text-[#1E171D] hover:bg-[#F3EDE3]'
              }`}
            >
              Administrator Console
            </button>
          )}
        </div>
      )}
    </header>
  );
};
