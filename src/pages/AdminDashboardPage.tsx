import React, { useEffect, useState } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import {
  adminModerateEvent,
  adminResolveReport,
  adminReviewVerification,
  adminUpdatePostModeration,
  adminUpdateUserControls,
  seedSampleCatalogToFirestore,
  subscribeAdminAllEvents,
  subscribeAdminAllPosts,
  subscribeAdminAllUsers,
  subscribeAdminReports,
  subscribeAdminVerificationRequests,
} from '../services/nrityaService';
import {
  CommunityPost,
  DanceEvent,
  ModerationReport,
  UserProfile,
  VerificationRequest,
} from '../types/nritya';

export const AdminDashboardPage: React.FC = () => {
  const { isAdmin, showToast } = useNritya();

  const [tab, setTab] = useState<'verifications' | 'events' | 'reports' | 'users' | 'posts'>(
    'verifications'
  );
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [allEvents, setAllEvents] = useState<DanceEvent[]>([]);
  const [allPosts, setAllPosts] = useState<CommunityPost[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubs = [
      subscribeAdminAllUsers(setAllUsers),
      subscribeAdminVerificationRequests(setVerifications),
      subscribeAdminAllEvents(setAllEvents),
      subscribeAdminAllPosts(setAllPosts),
      subscribeAdminReports(setReports),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="w-8 h-8 text-[#B5727B] mx-auto" />
        <h1 className="font-display text-3xl font-semibold text-[#1E171D]">
          Administrator Access Required
        </h1>
        <p className="text-sm text-[#5A4A57]">
          This console is protected by role-based access control and Firestore security
          rules. Only authorized NRITYA administrators can manage moderation queues.
        </p>
      </div>
    );
  }

  const handleSeedSample = async () => {
    setSeeding(true);
    try {
      await seedSampleCatalogToFirestore(true);
      showToast('Clearly labelled sample catalog seeded into Firestore.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Unable to seed sample catalog.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5DDD2] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B38838]">
            Protected Governance
          </p>
          <h1 className="font-display text-4xl font-semibold text-[#1E171D]">
            NRITYA Administrator Console
          </h1>
          <p className="text-sm text-[#5A4A57]">
            Manage credential verifications, event publication moderation, safety reports,
            and featured cultural profiles.
          </p>
        </div>

        <button
          type="button"
          disabled={seeding}
          onClick={handleSeedSample}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-xs font-medium hover:bg-[#36132C] disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
          {seeding ? 'Seeding Catalog...' : 'Seed / Refresh Sample Catalog'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-[#F3EDE3] rounded-lg border border-[#E5DDD2] w-fit">
        {(
          [
            ['verifications', `Verifications (${verifications.filter((v) => v.status === 'pending').length})`],
            ['events', `Events (${allEvents.filter((e) => e.moderationStatus === 'pending').length})`],
            ['reports', `Reports (${reports.filter((r) => r.status === 'open').length})`],
            ['users', `Users (${allUsers.length})`],
            ['posts', `Posts (${allPosts.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors tabular-nums ${
              tab === id ? 'bg-[#FFFDF9] text-[#4A1D3D] shadow-xs' : 'text-[#5A4A57]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Verifications */}
      {tab === 'verifications' && (
        <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl divide-y divide-[#E5DDD2]">
          {verifications.length === 0 ? (
            <p className="p-6 text-sm text-[#5A4A57]">No verification requests found.</p>
          ) : (
            verifications.map((req) => (
              <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-[#5A4A57] capitalize">
                    {req.requestedRole} · Status: {req.status}
                  </p>
                  <p className="font-semibold text-sm text-[#1E171D]">
                    {req.userName} — {req.lineageOrOrg}
                  </p>
                  <p className="text-sm text-[#5A4A57]">{req.credentialsSummary}</p>
                </div>
                {req.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        adminReviewVerification(req, 'approved', 'Credentials verified by NRITYA Admin.').then(
                          () => showToast('Verification approved.', 'success')
                        )
                      }
                      className="px-3.5 py-2 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-xs font-medium"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        adminReviewVerification(req, 'rejected', 'Insufficient verifiable details.').then(
                          () => showToast('Verification rejected.', 'info')
                        )
                      }
                      className="px-3.5 py-2 rounded-lg border border-[#E5DDD2] text-xs font-medium text-[#B5727B]"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Event Moderation */}
      {tab === 'events' && (
        <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl divide-y divide-[#E5DDD2]">
          {allEvents.length === 0 ? (
            <p className="p-6 text-sm text-[#5A4A57]">No events submitted yet.</p>
          ) : (
            allEvents.map((ev) => (
              <div key={ev.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-[#5A4A57]">
                    {ev.eventType} · {ev.danceForm} · Moderation: {ev.moderationStatus.toUpperCase()}
                    {ev.isSample ? ' · Sample' : ''}
                  </p>
                  <p className="font-display text-xl font-semibold text-[#1E171D]">{ev.title}</p>
                  <p className="text-xs text-[#5A4A57]">Organizer: {ev.organizerName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ev.moderationStatus !== 'approved' && (
                    <button
                      type="button"
                      onClick={() =>
                        adminModerateEvent(ev, 'approved').then(() =>
                          showToast('Event approved and published.', 'success')
                        )
                      }
                      className="px-3.5 py-2 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-xs font-medium"
                    >
                      Approve & Publish
                    </button>
                  )}
                  {ev.moderationStatus !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() =>
                        adminModerateEvent(ev, 'rejected').then(() =>
                          showToast('Event rejected.', 'info')
                        )
                      }
                      className="px-3.5 py-2 rounded-lg border border-[#E5DDD2] text-xs font-medium text-[#B5727B]"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl divide-y divide-[#E5DDD2]">
          {reports.length === 0 ? (
            <p className="p-6 text-sm text-[#5A4A57]">No moderation reports filed.</p>
          ) : (
            reports.map((rep) => (
              <div key={rep.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-[#5A4A57] uppercase">
                    {rep.targetType} Report · Status: {rep.status}
                  </p>
                  <p className="font-semibold text-sm text-[#1E171D]">
                    {rep.targetTitle || rep.targetId} — {rep.reason}
                  </p>
                  <p className="text-xs text-[#5A4A57]">
                    Reported by {rep.reporterName} {rep.details ? `· "${rep.details}"` : ''}
                  </p>
                </div>
                {rep.status === 'open' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        adminResolveReport(rep.id, 'resolved', 'Reviewed and actioned by Admin.').then(
                          () => showToast('Report marked resolved.', 'success')
                        )
                      }
                      className="px-3.5 py-2 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-xs font-medium"
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        adminResolveReport(rep.id, 'dismissed', 'No policy violation found.').then(
                          () => showToast('Report dismissed.', 'info')
                        )
                      }
                      className="px-3.5 py-2 rounded-lg border border-[#E5DDD2] text-xs font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl divide-y divide-[#E5DDD2]">
          {allUsers.map((u) => (
            <div key={u.uid} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-sm text-[#1E171D]">
                  {u.displayName}{' '}
                  <span className="text-xs font-normal text-[#5A4A57]">
                    ({u.role} · {u.verificationStatus} · {u.accountStatus})
                  </span>
                </p>
                <p className="text-xs text-[#5A4A57]">{u.danceForms.join(' · ')}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    adminUpdateUserControls(u.uid, { isFeatured: !u.isFeatured }).then(() =>
                      showToast(
                        u.isFeatured ? 'Removed from featured.' : 'Marked as featured.',
                        'success'
                      )
                    )
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                    u.isFeatured
                      ? 'bg-[#4A1D3D] text-[#FAF7F2] border-[#4A1D3D]'
                      : 'border-[#E5DDD2] text-[#1E171D]'
                  }`}
                >
                  {u.isFeatured ? 'Featured' : 'Feature Profile'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    adminUpdateUserControls(u.uid, {
                      accountStatus: u.accountStatus === 'active' ? 'suspended' : 'active',
                    }).then(() => showToast('Account status updated.', 'info'))
                  }
                  className="px-3 py-1.5 rounded-md border border-[#E5DDD2] text-xs font-medium text-[#B5727B]"
                >
                  {u.accountStatus === 'active' ? 'Suspend' : 'Reactivate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posts Moderation */}
      {tab === 'posts' && (
        <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl divide-y divide-[#E5DDD2]">
          {allPosts.map((p) => (
            <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#5A4A57]">
                  {p.authorName} · {p.danceForm} · {p.moderationStatus.toUpperCase()}
                </p>
                <p className="font-medium text-sm text-[#1E171D]">{p.title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    adminUpdatePostModeration(
                      p.id,
                      p.moderationStatus === 'published' ? 'hidden' : 'published'
                    ).then(() => showToast('Post moderation state updated.', 'info'))
                  }
                  className="px-3 py-1.5 rounded-md border border-[#E5DDD2] text-xs font-medium text-[#4A1D3D]"
                >
                  {p.moderationStatus === 'published' ? 'Hide Post' : 'Restore Post'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
