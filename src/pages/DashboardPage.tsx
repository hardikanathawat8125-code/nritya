import React from 'react';
import {
  Bell,
  Bookmark,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Shield,
  Users,
} from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import {
  formatTimestamp,
  markNotificationRead,
  toggleSaveItem,
} from '../services/nrityaService';

export const DashboardPage: React.FC = () => {
  const {
    firebaseUser,
    currentUserProfile,
    isAdmin,
    posts,
    masterclasses,
    gatherings,
    classRegistrations,
    eventApplications,
    gatheringRegistrations,
    savedItems,
    notifications,
    followingIds,
    navigate,
    setOpenAuthModal,
    showToast,
  } = useNritya();

  if (!firebaseUser || !currentUserProfile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B38838]">
          Personal Dashboard
        </p>
        <h1 className="font-display text-4xl font-semibold text-[#1E171D]">
          Your Cultural Schedule & Community Activity
        </h1>
        <p className="text-sm text-[#5A4A57] leading-relaxed">
          Sign in to track your upcoming masterclasses, event applications, virtual
          gathering RSVPs, saved reflections, and notifications.
        </p>
        <button
          type="button"
          onClick={() => setOpenAuthModal(true)}
          className="px-6 py-3 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C]"
        >
          Sign In to Access Dashboard
        </button>
      </div>
    );
  }

  const activeClasses = classRegistrations.filter((r) => r.status === 'registered');
  const activeGatherings = gatheringRegistrations.filter((r) => r.status === 'registered');
  const activeApps = eventApplications.filter((a) => a.status !== 'withdrawn');
  const myPosts = posts.filter((p) => p.authorId === currentUserProfile.uid);

  const completionSteps = [
    { label: 'Display Name & Role', done: Boolean(currentUserProfile.displayName) },
    { label: 'Classical Dance Forms', done: currentUserProfile.danceForms.length > 0 },
    { label: 'Artistic Biography', done: currentUserProfile.bio.trim().length >= 15 },
    {
      label: 'Lineage / Portfolio Note',
      done: Boolean(currentUserProfile.portfolioNote && currentUserProfile.portfolioNote.length >= 10),
    },
    {
      label: 'Repertoire Highlights',
      done: Boolean(
        currentUserProfile.repertoireHighlights &&
          currentUserProfile.repertoireHighlights.length > 0
      ),
    },
  ];
  const completedCount = completionSteps.filter((s) => s.done).length;
  const completionPct = Math.round((completedCount / completionSteps.length) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5DDD2] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B38838]">
            Personal Dashboard
          </p>
          <h1 className="font-display text-4xl font-semibold text-[#1E171D]">
            Namaste, {currentUserProfile.displayName}
          </h1>
          <p className="text-sm text-[#5A4A57]">
            <span className="capitalize">{currentUserProfile.role}</span> ·{' '}
            {currentUserProfile.danceForms.join(', ')} ·{' '}
            {currentUserProfile.experienceLevel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('profile')}
            className="px-4 py-2 rounded-lg border border-[#E5DDD2] bg-[#FFFDF9] text-xs font-medium text-[#1E171D] hover:border-[#4A1D3D]"
          >
            Edit Profile & Privacy
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate('admin')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-xs font-medium hover:bg-[#36132C]"
            >
              <Shield className="w-3.5 h-3.5" /> Administrator Console
            </button>
          )}
        </div>
      </div>

      {/* 4-column KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E5DDD2] rounded-xl bg-[#FFFDF9] overflow-hidden">
        <div className="p-5 border-r border-b lg:border-b-0 border-[#E5DDD2]">
          <p className="font-display text-3xl font-semibold text-[#4A1D3D] tabular-nums">
            {activeClasses.length}
          </p>
          <p className="text-xs uppercase tracking-[0.12em] text-[#5A4A57] mt-1">
            Upcoming Classes
          </p>
        </div>
        <div className="p-5 lg:border-r border-b lg:border-b-0 border-[#E5DDD2]">
          <p className="font-display text-3xl font-semibold text-[#4A1D3D] tabular-nums">
            {activeApps.length}
          </p>
          <p className="text-xs uppercase tracking-[0.12em] text-[#5A4A57] mt-1">
            Event Applications
          </p>
        </div>
        <div className="p-5 border-r border-[#E5DDD2]">
          <p className="font-display text-3xl font-semibold text-[#4A1D3D] tabular-nums">
            {activeGatherings.length}
          </p>
          <p className="text-xs uppercase tracking-[0.12em] text-[#5A4A57] mt-1">
            Virtual Gatherings
          </p>
        </div>
        <div className="p-5">
          <p className="font-display text-3xl font-semibold text-[#4A1D3D] tabular-nums">
            {savedItems.length}
          </p>
          <p className="text-xs uppercase tracking-[0.12em] text-[#5A4A57] mt-1">
            Saved Items
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 columns */}
        <div className="lg:col-span-8 space-y-8">
          {/* Upcoming Masterclasses */}
          <section className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-[#1E171D] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#B38838]" /> Upcoming Masterclasses
              </h2>
              <button
                type="button"
                onClick={() => navigate('masterclasses')}
                className="text-xs font-medium text-[#4A1D3D] hover:underline"
              >
                Browse All
              </button>
            </div>
            {activeClasses.length === 0 ? (
              <p className="text-sm text-[#5A4A57]">
                You are not registered for any weekly masterclasses yet.
              </p>
            ) : (
              <div className="divide-y divide-[#E5DDD2]">
                {activeClasses.map((reg) => {
                  const mc = masterclasses.find((m) => m.id === reg.classId);
                  return (
                    <div
                      key={reg.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-medium text-sm text-[#1E171D]">{reg.classTitle}</p>
                        <p className="text-xs text-[#5A4A57] tabular-nums">
                          {reg.danceForm} · {reg.classDate} · {reg.classTime}
                        </p>
                      </div>
                      {mc?.meetingLink && (
                        <a
                          href={mc.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A1D3D] hover:underline shrink-0"
                        >
                          Join Room <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Registered Gatherings */}
          <section className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-[#1E171D] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#B38838]" /> Virtual Gatherings
              </h2>
              <button
                type="button"
                onClick={() => navigate('gatherings')}
                className="text-xs font-medium text-[#4A1D3D] hover:underline"
              >
                Explore Circles
              </button>
            </div>
            {activeGatherings.length === 0 ? (
              <p className="text-sm text-[#5A4A57]">No gathering spots reserved yet.</p>
            ) : (
              <div className="divide-y divide-[#E5DDD2]">
                {activeGatherings.map((reg) => {
                  const g = gatherings.find((item) => item.id === reg.gatheringId);
                  return (
                    <div
                      key={reg.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-medium text-sm text-[#1E171D]">
                          {reg.gatheringTitle}
                        </p>
                        <p className="text-xs text-[#5A4A57] tabular-nums">
                          {reg.gatheringDate} · {reg.gatheringTime}
                        </p>
                      </div>
                      {g?.meetingLink && (
                        <a
                          href={g.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A1D3D] hover:underline shrink-0"
                        >
                          Moderated Link <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Event Applications */}
          <section className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
                Event Applications & Opportunities
              </h2>
              <button
                type="button"
                onClick={() => navigate('events')}
                className="text-xs font-medium text-[#4A1D3D] hover:underline"
              >
                Browse Events
              </button>
            </div>
            {activeApps.length === 0 ? (
              <p className="text-sm text-[#5A4A57]">No event applications submitted yet.</p>
            ) : (
              <div className="divide-y divide-[#E5DDD2]">
                {activeApps.map((app) => (
                  <div key={app.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm text-[#1E171D]">{app.eventTitle}</p>
                      <p className="text-xs text-[#5A4A57]">{app.applicationType}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase text-[#4A1D3D]">
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Saved Content */}
          <section className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold text-[#1E171D] flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#B38838]" /> Saved Content
            </h2>
            {savedItems.length === 0 ? (
              <p className="text-sm text-[#5A4A57]">
                Bookmark posts, masterclasses, events, or gatherings to collect them here.
              </p>
            ) : (
              <div className="divide-y divide-[#E5DDD2]">
                {savedItems.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#5A4A57] capitalize">
                        {item.itemType} {item.danceForm ? `· ${item.danceForm}` : ''}
                      </p>
                      <p className="font-medium text-sm text-[#1E171D]">{item.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleSaveItem({
                          uid: currentUserProfile.uid,
                          itemType: item.itemType,
                          itemId: item.itemId,
                          title: item.title,
                          currentlySaved: true,
                        }).then(() => showToast('Bookmark removed.', 'info'));
                      }}
                      className="text-xs text-[#B5727B] hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right 4 columns: Profile Completion + Community Activity + Notifications */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Profile Completion */}
          <section className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
                Profile Completion
              </h2>
              <span className="font-display text-2xl font-semibold text-[#4A1D3D] tabular-nums">
                {completionPct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#F3EDE3] overflow-hidden">
              <div
                className="h-full bg-[#4A1D3D] transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <ul className="space-y-2 text-xs">
              {completionSteps.map((step) => (
                <li key={step.label} className="flex items-center justify-between">
                  <span className={step.done ? 'text-[#1E171D]' : 'text-[#5A4A57]'}>
                    {step.label}
                  </span>
                  <span className={step.done ? 'text-emerald-700 font-medium' : 'text-[#B38838]'}>
                    {step.done ? 'Complete' : 'Add'}
                  </span>
                </li>
              ))}
            </ul>
            {completionPct < 100 && (
              <button
                type="button"
                onClick={() => navigate('profile')}
                className="w-full py-2 rounded-lg border border-[#E5DDD2] text-xs font-medium text-[#4A1D3D] hover:border-[#4A1D3D]"
              >
                Complete Profile
              </button>
            )}
          </section>

          {/* Community Activity */}
          <section className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-6 space-y-3">
            <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
              Community Activity
            </h2>
            <dl className="space-y-2 text-sm tabular-nums">
              <div className="flex justify-between">
                <dt className="text-[#5A4A57]">Published Posts</dt>
                <dd className="font-semibold text-[#1E171D]">{myPosts.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#5A4A57]">Following</dt>
                <dd className="font-semibold text-[#1E171D]">{followingIds.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#5A4A57]">Followers</dt>
                <dd className="font-semibold text-[#1E171D]">
                  {currentUserProfile.followersCount}
                </dd>
              </div>
            </dl>
          </section>

          {/* Notifications */}
          <section className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold text-[#1E171D] flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#B38838]" /> Notifications
            </h2>
            {notifications.length === 0 ? (
              <p className="text-xs text-[#5A4A57]">No notifications yet.</p>
            ) : (
              <div className="divide-y divide-[#E5DDD2]">
                {notifications.slice(0, 8).map((n) => (
                  <div key={n.id} className="py-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#1E171D]">{n.title}</p>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markNotificationRead(n.id)}
                          className="text-[11px] text-[#4A1D3D] hover:underline shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#5A4A57]">{n.message}</p>
                    <p className="text-[11px] text-[#5A4A57]/80 flex items-center gap-1">
                      {n.read && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                      {formatTimestamp(n.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};
