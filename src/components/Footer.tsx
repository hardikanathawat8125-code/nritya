import React from 'react';
import { useNritya } from '../context/NrityaContext';

export const Footer: React.FC = () => {
  const { navigate } = useNritya();

  return (
    <footer className="border-t border-[#E5DDD2] bg-[#F3EDE3]/60 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#E5DDD2]">
          <div className="md:col-span-5 space-y-3">
            <h2 className="font-display text-2xl font-semibold tracking-[0.14em] text-[#4A1D3D]">
              NRITYA
            </h2>
            <p className="text-sm text-[#5A4A57] leading-relaxed max-w-md">
              Where Tradition Connects — a calm, respectful digital home for Indian
              classical dancers, students, gurus, event organizers, and enthusiasts.
            </p>
            <p className="text-xs text-[#5A4A57]/90 leading-relaxed max-w-md">
              Transparency Note: Entries marked as Sample are illustrative demonstrations
              of platform workflows and do not represent real-world institutional
              partnerships or real gurus.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5A4A57]">
              Explore
            </p>
            <div className="flex flex-col items-start gap-2 text-sm text-[#1E171D]">
              <button type="button" onClick={() => navigate('community')} className="hover:text-[#4A1D3D] transition-colors">
                Community Feed
              </button>
              <button type="button" onClick={() => navigate('masterclasses')} className="hover:text-[#4A1D3D] transition-colors">
                Weekly Masterclasses
              </button>
              <button type="button" onClick={() => navigate('events')} className="hover:text-[#4A1D3D] transition-colors">
                Events & Opportunities
              </button>
              <button type="button" onClick={() => navigate('gatherings')} className="hover:text-[#4A1D3D] transition-colors">
                Virtual Gatherings
              </button>
            </div>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5A4A57]">
              Community Standards
            </p>
            <div className="flex flex-col items-start gap-2 text-sm text-[#1E171D]">
              <button type="button" onClick={() => navigate('explore')} className="hover:text-[#4A1D3D] transition-colors">
                Explore Practitioners & Gurus
              </button>
              <button type="button" onClick={() => navigate('dashboard')} className="hover:text-[#4A1D3D] transition-colors">
                Personal Dashboard
              </button>
              <button type="button" onClick={() => navigate('profile')} className="hover:text-[#4A1D3D] transition-colors">
                Verification & Privacy Settings
              </button>
              <button type="button" onClick={() => navigate('search')} className="hover:text-[#4A1D3D] transition-colors">
                Global Archive Search
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#5A4A57]">
          <p>NRITYA Cultural Community Platform · Classical Dance & Heritage</p>
          <p>Moderated interactions · Privacy-first design · No unrestricted direct messaging</p>
        </div>
      </div>
    </footer>
  );
};
