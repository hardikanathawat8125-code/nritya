import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Calendar,
  Clock,
  ExternalLink,
  MessageCircle,
  Plus,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import { NRITYA_IMAGES } from '../data/sampleCatalog';
import {
  addGatheringReflection,
  createGathering,
  ensureSampleInteractiveCatalog,
  formatTimestamp,
  seedSampleCatalogToFirestore,
  subscribeGatheringReflections,
  toggleGatheringRegistration,
  toggleSaveItem,
} from '../services/nrityaService';
import {
  CLASSICAL_DANCE_FORMS,
  Gathering,
  GatheringReflection,
} from '../types/nritya';
import { SafeImage } from '../components/SafeImage';

const GatheringDetailModal: React.FC<{
  gathering: Gathering;
  onClose: () => void;
}> = ({ gathering, onClose }) => {
  const {
    currentUserProfile,
    isAdmin,
    gatheringRegistrations,
    setOpenAuthModal,
    showToast,
    usingPreviewFallback,
  } = useNritya();

  const [reflections, setReflections] = useState<GatheringReflection[]>([]);
  const [reflectionType, setReflectionType] = useState<'Reflection' | 'Feedback'>('Reflection');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reg = gatheringRegistrations.find((r) => r.gatheringId === gathering.id);
  const isRegistered = reg?.status === 'registered';
  const canViewLink =
    isRegistered || isAdmin || currentUserProfile?.uid === gathering.hostId;

  useEffect(() => {
    if (usingPreviewFallback) return;
    const unsub = subscribeGatheringReflections(gathering.id, setReflections);
    return () => unsub();
  }, [gathering.id, usingPreviewFallback]);

  const handlePostReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      setOpenAuthModal(true);
      return;
    }
    if (content.trim().length < 5) return;
    setSubmitting(true);
    try {
      if (usingPreviewFallback || gathering.isSample) {
        await (isAdmin ? seedSampleCatalogToFirestore(false) : ensureSampleInteractiveCatalog());
      }
      await addGatheringReflection({
        gatheringId: gathering.id,
        author: currentUserProfile,
        reflectionType,
        content: content.trim(),
      });
      setContent('');
      showToast('Reflection posted to gathering circle.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Unable to post reflection.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1E171D]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl max-w-2xl w-full p-6 sm:p-8 my-8 relative space-y-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close gathering dialog"
          className="absolute top-4 right-4 p-2 rounded-lg text-[#5A4A57] hover:bg-[#F3EDE3]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1.5">
          <p className="text-xs text-[#5A4A57]">
            {gathering.topic} · {gathering.danceForm || 'All Classical Forms'}
            {gathering.isSample ? ' · Sample Gathering' : ''}
          </p>
          <h2 className="font-display text-3xl font-semibold text-[#1E171D]">
            {gathering.title}
          </h2>
          <p className="text-xs font-medium text-[#4A1D3D]">Hosted by {gathering.hostName}</p>
        </div>

        <p className="text-sm text-[#1E171D] leading-relaxed">{gathering.description}</p>

        {/* Discussion Prompts */}
        <div className="p-4 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5A4A57]">
            Discussion Prompts
          </p>
          <ul className="space-y-1.5 text-sm text-[#1E171D]">
            {gathering.discussionPrompts.map((prompt, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#B38838] font-semibold tabular-nums">{i + 1}.</span>
                <span>{prompt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Safety & Meeting Link */}
        <div className="p-4 rounded-lg bg-[#F3EDE3]/60 border border-[#E5DDD2] space-y-2 text-xs">
          <p className="font-semibold text-[#1E171D] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#4A1D3D]" /> Moderation & Safety Guidelines
          </p>
          <p className="text-[#5A4A57]">{gathering.safetyGuidelines}</p>
          {canViewLink ? (
            <p className="pt-1 text-[#1E171D] break-all">
              Moderated Room Link:{' '}
              <a
                href={gathering.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="text-[#4A1D3D] underline inline-flex items-center gap-1"
              >
                {gathering.meetingLink} <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          ) : (
            <p className="pt-1 text-[#4A1D3D] font-medium">
              RSVP to this gathering to reveal the moderated group session link.
            </p>
          )}
        </div>

        {/* Reflections & Feedback */}
        <div className="pt-4 border-t border-[#E5DDD2] space-y-4">
          <h3 className="font-display text-2xl font-semibold text-[#1E171D]">
            Circle Reflections & Feedback ({reflections.length})
          </h3>

          <form onSubmit={handlePostReflection} className="space-y-2.5">
            <div className="flex items-center gap-3">
              <select
                value={reflectionType}
                onChange={(e) => setReflectionType(e.target.value as any)}
                className="px-3 py-1.5 rounded-md border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
              >
                <option value="Reflection">Reflection Post</option>
                <option value="Feedback">Session Feedback</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={1500}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share a reflection from the prompts or post-session feedback..."
                className="flex-1 px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
              <button
                type="submit"
                disabled={submitting || content.trim().length < 5}
                className="px-4 py-2 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-xs font-medium hover:bg-[#36132C] disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </form>

          {reflections.length === 0 ? (
            <p className="text-xs text-[#5A4A57]">
              No reflections posted yet. Be the first to respond to a prompt above.
            </p>
          ) : (
            <div className="space-y-2.5">
              {reflections.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1E171D]">{r.authorName}</span>
                    <span className="text-[#5A4A57]">
                      {r.reflectionType} · {formatTimestamp(r.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[#1E171D]">{r.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const GatheringsPage: React.FC = () => {
  const {
    gatherings,
    currentUserProfile,
    isAdmin,
    gatheringRegistrations,
    savedItems,
    setOpenAuthModal,
    setSelectedDancerUid,
    showToast,
    usingPreviewFallback,
  } = useNritya();

  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Host form
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [danceForm, setDanceForm] = useState('All Classical Forms');
  const [date, setDate] = useState('2026-12-22');
  const [time, setTime] = useState('19:00 IST');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [capacity, setCapacity] = useState(30);
  const [promptsText, setPromptsText] = useState(
    'What inspires your classical riyaz this season?\nHow do you balance technique and personal expression?'
  );
  const [meetingLink, setMeetingLink] = useState('https://meet.nritya-circle.example/session');
  const [safetyGuidelines, setSafetyGuidelines] = useState(
    'Moderated group session. Respectful dialogue upheld; no unapproved recording or private solicitation.'
  );

  const canHost =
    isAdmin || currentUserProfile?.verificationStatus === 'verified';

  const activeDetail = gatherings.find((g) => g.id === activeDetailId) || null;

  const handleToggleRsvp = async (g: Gathering) => {
    if (!currentUserProfile) {
      setOpenAuthModal(true);
      showToast('Please sign in and complete your profile to reserve a spot.', 'info');
      return;
    }
    const existing = gatheringRegistrations.find((r) => r.gatheringId === g.id);
    const isReg = existing?.status === 'registered';
    if (!isReg && g.registeredCount >= g.capacity) {
      showToast('This gathering circle is full.', 'error');
      return;
    }
    setBusyId(g.id);
    try {
      if (usingPreviewFallback || g.isSample) {
        await (isAdmin ? seedSampleCatalogToFirestore(false) : ensureSampleInteractiveCatalog());
      }
      await toggleGatheringRegistration({
        gathering: g,
        user: currentUserProfile,
        existingReg: existing,
      });
      showToast(isReg ? 'RSVP cancelled.' : 'Spot reserved in gathering!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Unable to update RSVP.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile || !canHost) return;
    setBusyId('create');
    try {
      await createGathering({
        host: currentUserProfile,
        title,
        topic,
        description,
        danceForm,
        date,
        time,
        durationMinutes,
        capacity,
        discussionPrompts: promptsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        meetingLink,
        safetyGuidelines,
      });
      setShowCreateModal(false);
      setTitle('');
      setTopic('');
      setDescription('');
      showToast('Virtual gathering published.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Unable to create gathering.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5DDD2] pb-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B38838]">
            Virtual Dance Gatherings
          </p>
          <h1 className="font-display text-4xl font-semibold text-[#1E171D]">
            Moderated Circles for Dialogue & Reflection
          </h1>
          <p className="text-sm text-[#5A4A57] max-w-2xl">
            Meet fellow dancers in structured, host-facilitated group sessions with safety
            controls, shared prompts, and post-session reflections.
          </p>
        </div>

        {canHost && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C] whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" /> Host Gathering
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {gatherings.map((g) => {
          const existing = gatheringRegistrations.find((r) => r.gatheringId === g.id);
          const isReg = existing?.status === 'registered';
          const isSaved = savedItems.some(
            (s) => s.itemType === 'gathering' && s.itemId === g.id
          );

          return (
            <div
              key={g.id}
              className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl overflow-hidden flex flex-col"
            >
              <div className="h-48 overflow-hidden border-b border-[#E5DDD2]">
                <SafeImage
                  src={g.coverImage || NRITYA_IMAGES.gatheringStudy}
                  alt={g.title}
                  fallbackTitle={g.topic}
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-[#5A4A57]">
                      {g.topic} · {g.danceForm || 'All Classical Forms'}
                      {g.isSample && (
                        <span className="text-[#B5727B]"> · Sample Gathering</span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!currentUserProfile) {
                          setOpenAuthModal(true);
                          return;
                        }
                        try {
                          await toggleSaveItem({
                            uid: currentUserProfile.uid,
                            itemType: 'gathering',
                            itemId: g.id,
                            title: g.title,
                            subtitle: g.hostName,
                            danceForm: g.danceForm,
                            currentlySaved: isSaved,
                          });
                          showToast(
                            isSaved ? 'Removed from saved items.' : 'Saved to your dashboard.',
                            'success'
                          );
                        } catch (err: any) {
                          showToast(err?.message || 'Unable to save gathering.', 'error');
                        }
                      }}
                      aria-label="Save gathering"
                      className="p-1.5 text-[#5A4A57] hover:text-[#4A1D3D]"
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isSaved ? 'fill-[#4A1D3D] text-[#4A1D3D]' : ''}`}
                      />
                    </button>
                  </div>

                  <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
                    {g.title}
                  </h2>

                  <button
                    type="button"
                    onClick={() => setSelectedDancerUid(g.hostId)}
                    className="text-xs font-medium text-[#4A1D3D] hover:underline"
                  >
                    Facilitated by {g.hostName}
                  </button>

                  <p className="text-sm text-[#5A4A57] leading-relaxed">{g.description}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#E5DDD2]">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#5A4A57] tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#B38838]" /> {g.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#B38838]" /> {g.time} ({g.durationMinutes} min)
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#B38838]" /> {g.registeredCount}/
                      {g.capacity} spots
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        disabled={busyId === g.id || g.status !== 'upcoming' || (!isReg && g.registeredCount >= g.capacity)}
                        onClick={() => handleToggleRsvp(g)}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors min-h-[42px] disabled:opacity-60 ${
                          isReg
                            ? 'bg-[#F3EDE3] text-[#4A1D3D] border border-[#E5DDD2]'
                            : 'bg-[#4A1D3D] text-[#FAF7F2] hover:bg-[#36132C]'
                        }`}
                      >
                        {busyId === g.id
                          ? isReg
                            ? 'Cancelling...'
                            : 'Reserving...'
                          : isReg
                          ? 'Cancel Spot'
                          : g.registeredCount >= g.capacity
                          ? 'Circle Full'
                          : 'Reserve Spot'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDetailId(g.id)}
                        className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-lg border border-[#E5DDD2] text-sm font-medium text-[#1E171D] hover:border-[#4A1D3D] min-h-[42px]"
                      >
                        <MessageCircle className="w-4 h-4" /> Prompts & Reflections
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {activeDetail && (
          <GatheringDetailModal
            gathering={activeDetail}
            onClose={() => setActiveDetailId(null)}
          />
        )}

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-[#1E171D]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl max-w-lg w-full p-6 my-8 relative space-y-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-[#5A4A57] hover:bg-[#F3EDE3]"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
              Host Moderated Virtual Gathering
            </h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                required
                minLength={3}
                maxLength={160}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Gathering Title"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
              <input
                type="text"
                required
                minLength={3}
                maxLength={160}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Primary Topic"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
              <textarea
                rows={3}
                required
                minLength={10}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Session overview..."
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={danceForm}
                  onChange={(e) => setDanceForm(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                >
                  <option value="All Classical Forms">All Classical Forms</option>
                  {CLASSICAL_DANCE_FORMS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <input
                  type="text"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="19:00 IST"
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                />
                <input
                  type="number"
                  min={15}
                  max={240}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  placeholder="Duration"
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                />
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  placeholder="Capacity"
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                />
              </div>
              <textarea
                rows={2}
                value={promptsText}
                onChange={(e) => setPromptsText(e.target.value)}
                placeholder="Discussion prompts (one per line)"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
              />
              <input
                type="url"
                required
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="Moderated meeting URL"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
              <input
                type="text"
                required
                value={safetyGuidelines}
                onChange={(e) => setSafetyGuidelines(e.target.value)}
                placeholder="Safety & moderation guidelines"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
              />
              <button
                type="submit"
                disabled={busyId === 'create'}
                className="w-full py-2.5 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C]"
              >
                {busyId === 'create' ? 'Creating...' : 'Publish Gathering'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
