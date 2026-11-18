import React, { useState } from 'react';
import { Ban, CheckCircle2, Flag, MapPin, ShieldAlert, UserCheck, UserPlus, X } from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import { toggleBlockUser, toggleFollowUser } from '../services/nrityaService';
import { SafeImage } from './SafeImage';
import { ReportModal } from './ReportModal';

export const DancerPortfolioModal: React.FC = () => {
  const {
    users,
    posts,
    selectedDancerUid,
    setSelectedDancerUid,
    currentUserProfile,
    privateAccount,
    followingIds,
    setOpenAuthModal,
    showToast,
  } = useNritya();

  const [reportTarget, setReportTarget] = useState<{
    type: 'user';
    id: string;
    title: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!selectedDancerUid) return null;

  const dancer = users.find((u) => u.uid === selectedDancerUid);
  if (!dancer) return null;

  const isSelf = currentUserProfile?.uid === dancer.uid;
  const isFollowing = followingIds.includes(dancer.uid);
  const blockedIds = privateAccount?.blockedUserIds || [];
  const isBlocked = blockedIds.includes(dancer.uid);
  const authoredPosts = posts.filter((p) => p.authorId === dancer.uid);

  const handleFollow = async () => {
    if (!currentUserProfile) {
      setOpenAuthModal(true);
      return;
    }
    if (dancer.isSample) {
      showToast('Sample profiles are read-only previews until seeded by an administrator.', 'info');
      return;
    }
    setBusy(true);
    try {
      await toggleFollowUser(currentUserProfile.uid, dancer.uid, isFollowing);
      showToast(
        isFollowing ? `Unfollowed ${dancer.displayName}.` : `Now following ${dancer.displayName}.`,
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Unable to update follow status.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleBlock = async () => {
    if (!currentUserProfile) {
      setOpenAuthModal(true);
      return;
    }
    setBusy(true);
    try {
      await toggleBlockUser(currentUserProfile.uid, dancer.uid, blockedIds);
      showToast(
        isBlocked
          ? `Unblocked ${dancer.displayName}.`
          : `Blocked ${dancer.displayName}. Their posts are hidden from your feed.`,
        'info'
      );
    } catch (err: any) {
      showToast(err?.message || 'Unable to update block setting.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-[#1E171D]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl max-w-3xl w-full my-8 overflow-hidden relative">
          <button
            type="button"
            onClick={() => setSelectedDancerUid(null)}
            aria-label="Close portfolio"
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-[#FAF7F2]/90 text-[#1E171D] hover:bg-[#F3EDE3]"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-[#E5DDD2] shrink-0">
                <SafeImage
                  src={dancer.photoURL}
                  alt={dancer.displayName}
                  fallbackTitle={dancer.displayName}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A4A57]">
                  <span className="capitalize font-medium text-[#4A1D3D]">{dancer.role}</span>
                  <span aria-hidden="true">·</span>
                  <span>{dancer.experienceLevel}</span>
                  {dancer.verificationStatus === 'verified' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-[#4A1D3D] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#B38838]" />
                        Verified {dancer.role === 'guru' ? 'Guru' : 'Organizer'}
                      </span>
                    </>
                  )}
                  {dancer.isSample && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#B5727B] font-medium">Sample Profile</span>
                    </>
                  )}
                </div>

                <h2 className="font-display text-3xl font-semibold text-[#1E171D]">
                  {dancer.displayName}
                </h2>

                <p className="text-sm text-[#5A4A57]">
                  {dancer.danceForms.join(' · ')}
                  {dancer.privacyShowLocation && dancer.location ? (
                    <span className="inline-flex items-center gap-1 ml-3">
                      <MapPin className="w-3.5 h-3.5 text-[#B38838]" />
                      {dancer.location}
                    </span>
                  ) : null}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#5A4A57] tabular-nums">
                  <span>{dancer.followersCount} Followers</span>
                  <span aria-hidden="true">·</span>
                  <span>{dancer.followingCount} Following</span>
                  <span aria-hidden="true">·</span>
                  <span>{authoredPosts.length} Community Posts</span>
                </div>
              </div>
            </div>

            {/* Action bar — privacy conscious: no unrestricted private DM */}
            {!isSelf && (
              <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-[#E5DDD2]">
                <div className="flex flex-wrap items-center gap-3">
                  {dancer.privacyAllowFollows && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleFollow}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                        isFollowing
                          ? 'bg-[#F3EDE3] text-[#4A1D3D] border border-[#E5DDD2]'
                          : 'bg-[#4A1D3D] text-[#FAF7F2] hover:bg-[#36132C]'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4" /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" /> Follow
                        </>
                      )}
                    </button>
                  )}
                  <span className="text-xs text-[#5A4A57] inline-flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#7B6988]" />
                    Connect publicly via comments & moderated gatherings
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleBlock}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A4A57] hover:text-[#1E171D] px-2.5 py-1.5 rounded-md hover:bg-[#F3EDE3]"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {isBlocked ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReportTarget({
                        type: 'user',
                        id: dancer.uid,
                        title: dancer.displayName,
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B5727B] hover:text-[#4A1D3D] px-2.5 py-1.5 rounded-md hover:bg-[#F3EDE3]"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Report
                  </button>
                </div>
              </div>
            )}

            {/* Bio & Portfolio */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5A4A57] mb-1.5">
                  Artistic Biography
                </h3>
                <p className="text-sm text-[#1E171D] leading-relaxed">
                  {dancer.bio || 'No biography added yet.'}
                </p>
              </div>

              {dancer.portfolioNote && (
                <div className="pt-3 border-t border-[#E5DDD2]">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5A4A57] mb-1.5">
                    Lineage & Portfolio Notes
                  </h3>
                  <p className="text-sm text-[#1E171D] leading-relaxed">{dancer.portfolioNote}</p>
                </div>
              )}

              {dancer.repertoireHighlights && dancer.repertoireHighlights.length > 0 && (
                <div className="pt-3 border-t border-[#E5DDD2]">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5A4A57] mb-2">
                    Repertoire Highlights
                  </h3>
                  <ul className="space-y-1.5 text-sm text-[#1E171D]">
                    {dancer.repertoireHighlights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#B38838] mt-1 text-xs">◆</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Authored Posts */}
            <div className="pt-4 border-t border-[#E5DDD2] space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5A4A57]">
                Community Contributions ({authoredPosts.length})
              </h3>
              {authoredPosts.length === 0 ? (
                <p className="text-sm text-[#5A4A57]">No published community posts yet.</p>
              ) : (
                <div className="divide-y divide-[#E5DDD2]">
                  {authoredPosts.map((post) => (
                    <div key={post.id} className="py-3 space-y-1">
                      <p className="text-xs text-[#5A4A57]">
                        {post.category} · {post.danceForm}
                      </p>
                      <p className="font-display text-lg font-semibold text-[#1E171D]">
                        {post.title}
                      </p>
                      <p className="text-sm text-[#5A4A57] line-clamp-2">{post.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />
    </>
  );
};
