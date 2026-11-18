import React, { useMemo, useState } from 'react';
import { CheckCircle2, MapPin, Search } from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import { CLASSICAL_DANCE_FORMS, EXPERIENCE_LEVELS } from '../types/nritya';
import { SafeImage } from '../components/SafeImage';

export const ExploreDancersPage: React.FC = () => {
  const { users, privateAccount, setSelectedDancerUid } = useNritya();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [formFilter, setFormFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');

  const blockedIds = privateAccount?.blockedUserIds || [];

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      if (blockedIds.includes(u.uid)) return false;
      if (roleFilter !== 'All' && u.role !== roleFilter) return false;
      if (formFilter !== 'All' && !u.danceForms.includes(formFilter)) return false;
      if (levelFilter !== 'All' && u.experienceLevel !== levelFilter) return false;
      if (
        q &&
        !u.displayName.toLowerCase().includes(q) &&
        !u.bio.toLowerCase().includes(q) &&
        !(u.location || '').toLowerCase().includes(q) &&
        !u.danceForms.join(' ').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [users, blockedIds, searchTerm, roleFilter, formFilter, levelFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2 border-b border-[#E5DDD2] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B38838]">
          Practitioners & Lineage
        </p>
        <h1 className="font-display text-4xl font-semibold text-[#1E171D]">
          Explore Dancers, Gurus & Organizers
        </h1>
        <p className="text-sm text-[#5A4A57] max-w-2xl">
          Discover artists, students, verified gurus, and sabhas across classical forms.
          Select any profile to view their public portfolio and repertoire.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#5A4A57] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Name, city, or lineage..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
        >
          <option value="All">All Roles</option>
          <option value="dancer">Dancers / Students</option>
          <option value="guru">Gurus / Acharyas</option>
          <option value="organizer">Event Organizers</option>
          <option value="enthusiast">Enthusiasts</option>
        </select>
        <select
          value={formFilter}
          onChange={(e) => setFormFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
        >
          <option value="All">All Dance Forms</option>
          {CLASSICAL_DANCE_FORMS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
        >
          <option value="All">All Experience Levels</option>
          {EXPERIENCE_LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-10 text-center space-y-2">
          <p className="font-display text-2xl font-semibold">No profiles match your search</p>
          <p className="text-sm text-[#5A4A57]">Try resetting one of your directory filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((person) => (
            <button
              key={person.uid}
              type="button"
              onClick={() => setSelectedDancerUid(person.uid)}
              className="text-left bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-6 hover:border-[#4A1D3D] transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#E5DDD2] shrink-0">
                    <SafeImage
                      src={person.photoURL}
                      alt={person.displayName}
                      fallbackTitle={person.displayName}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[#5A4A57] capitalize">
                      {person.role} · {person.experienceLevel}
                    </p>
                    <h2 className="font-display text-2xl font-semibold text-[#1E171D] truncate">
                      {person.displayName}
                    </h2>
                    {person.verificationStatus === 'verified' && (
                      <p className="inline-flex items-center gap-1 text-xs font-medium text-[#4A1D3D] mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#B38838]" />
                        Verified {person.role === 'guru' ? 'Guru' : 'Organizer'}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs font-medium text-[#7B6988]">
                  {person.danceForms.join(' · ')}
                  {person.isSample ? ' · Sample Profile' : ''}
                </p>

                <p className="text-sm text-[#5A4A57] line-clamp-2 leading-relaxed">
                  {person.bio || 'Classical practitioner on NRITYA.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E5DDD2] flex items-center justify-between text-xs text-[#5A4A57] tabular-nums">
                <span>
                  {person.privacyShowLocation && person.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#B38838]" />
                      {person.location}
                    </span>
                  ) : (
                    `${person.followersCount} Followers`
                  )}
                </span>
                <span className="font-medium text-[#4A1D3D]">View Portfolio →</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
