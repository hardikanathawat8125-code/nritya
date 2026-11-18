import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import { CLASSICAL_DANCE_FORMS } from '../types/nritya';

export const GlobalSearchPage: React.FC = () => {
  const {
    users,
    posts,
    masterclasses,
    events,
    gatherings,
    globalSearchQuery,
    setGlobalSearchQuery,
    navigate,
    setSelectedDancerUid,
  } = useNritya();

  const [scope, setScope] = useState<
    'all' | 'people' | 'posts' | 'masterclasses' | 'events' | 'gatherings'
  >('all');
  const [formFilter, setFormFilter] = useState('All');

  const q = globalSearchQuery.trim().toLowerCase();

  const results = useMemo(() => {
    const matchText = (text: string) => (!q ? true : text.toLowerCase().includes(q));
    const matchForm = (forms: string | string[] | undefined) => {
      if (formFilter === 'All') return true;
      if (!forms) return false;
      return Array.isArray(forms) ? forms.includes(formFilter) : forms === formFilter;
    };

    return {
      people: users.filter(
        (u) =>
          matchForm(u.danceForms) &&
          matchText(`${u.displayName} ${u.role} ${u.bio} ${u.location || ''}`)
      ),
      posts: posts.filter(
        (p) =>
          matchForm(p.danceForm) &&
          matchText(`${p.title} ${p.content} ${p.authorName} ${p.category}`)
      ),
      masterclasses: masterclasses.filter(
        (m) =>
          matchForm(m.danceForm) &&
          matchText(`${m.title} ${m.description} ${m.guruName} ${m.difficulty}`)
      ),
      events: events.filter(
        (e) =>
          matchForm(e.danceForm) &&
          matchText(
            `${e.title} ${e.description} ${e.eventType} ${e.organizerName} ${e.city || ''} ${e.state || ''}`
          )
      ),
      gatherings: gatherings.filter(
        (g) =>
          (formFilter === 'All' || g.danceForm === formFilter) &&
          matchText(`${g.title} ${g.topic} ${g.description} ${g.hostName}`)
      ),
    };
  }, [users, posts, masterclasses, events, gatherings, q, formFilter]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2 border-b border-[#E5DDD2] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B38838]">
          Archive & Community Search
        </p>
        <h1 className="font-display text-4xl font-semibold text-[#1E171D]">
          Search Across NRITYA
        </h1>
        <p className="text-sm text-[#5A4A57]">
          Find dancers, gurus, community posts, masterclasses, performances, competitions,
          auditions, and moderated gatherings.
        </p>
      </div>

      <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5A4A57] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              autoFocus
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Search Bharatanatyam, Kathak, auditions, abhinaya, cities..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
            />
          </div>
          <select
            value={formFilter}
            onChange={(e) => setFormFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
          >
            <option value="All">All Dance Forms</option>
            {CLASSICAL_DANCE_FORMS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'All Results'],
              ['people', `Dancers & Gurus (${results.people.length})`],
              ['posts', `Posts (${results.posts.length})`],
              ['masterclasses', `Masterclasses (${results.masterclasses.length})`],
              ['events', `Events (${results.events.length})`],
              ['gatherings', `Gatherings (${results.gatherings.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setScope(id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors tabular-nums ${
                scope === id
                  ? 'bg-[#4A1D3D] text-[#FAF7F2]'
                  : 'bg-[#FAF7F2] text-[#5A4A57] hover:text-[#1E171D]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {(scope === 'all' || scope === 'people') && results.people.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
              Dancers, Gurus & Organizers
            </h2>
            <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl divide-y divide-[#E5DDD2]">
              {results.people.map((u) => (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => setSelectedDancerUid(u.uid)}
                  className="w-full text-left p-4 hover:bg-[#FAF7F2] flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-sm text-[#1E171D]">{u.displayName}</p>
                    <p className="text-xs text-[#5A4A57] capitalize">
                      {u.role} · {u.danceForms.join(', ')}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#4A1D3D]">View Portfolio →</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {(scope === 'all' || scope === 'masterclasses') && results.masterclasses.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
              Masterclasses
            </h2>
            <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl divide-y divide-[#E5DDD2]">
              {results.masterclasses.map((mc) => (
                <button
                  key={mc.id}
                  type="button"
                  onClick={() => navigate('masterclasses')}
                  className="w-full text-left p-4 hover:bg-[#FAF7F2] flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-sm text-[#1E171D]">{mc.title}</p>
                    <p className="text-xs text-[#5A4A57]">
                      {mc.guruName} · {mc.danceForm} · {mc.date}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#4A1D3D]">Open →</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {(scope === 'all' || scope === 'events') && results.events.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
              Performances, Auditions & Events
            </h2>
            <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl divide-y divide-[#E5DDD2]">
              {results.events.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => navigate('events')}
                  className="w-full text-left p-4 hover:bg-[#FAF7F2] flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-sm text-[#1E171D]">{ev.title}</p>
                    <p className="text-xs text-[#5A4A57]">
                      {ev.eventType} · {ev.danceForm} · {ev.city || 'Online'} · {ev.date}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#4A1D3D]">View →</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {(scope === 'all' || scope === 'gatherings') && results.gatherings.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
              Virtual Gatherings
            </h2>
            <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl divide-y divide-[#E5DDD2]">
              {results.gatherings.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => navigate('gatherings')}
                  className="w-full text-left p-4 hover:bg-[#FAF7F2] flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-sm text-[#1E171D]">{g.title}</p>
                    <p className="text-xs text-[#5A4A57]">
                      {g.hostName} · {g.topic} · {g.date}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#4A1D3D]">Join →</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {(scope === 'all' || scope === 'posts') && results.posts.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
              Community Posts
            </h2>
            <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl divide-y divide-[#E5DDD2]">
              {results.posts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate('community')}
                  className="w-full text-left p-4 hover:bg-[#FAF7F2] flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-sm text-[#1E171D]">{p.title}</p>
                    <p className="text-xs text-[#5A4A57]">
                      {p.authorName} · {p.danceForm} · {p.category}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#4A1D3D]">Read →</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
