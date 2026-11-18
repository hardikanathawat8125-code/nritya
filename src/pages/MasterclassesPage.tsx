import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  Star,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import { NRITYA_IMAGES } from '../data/sampleCatalog';
import {
  createMasterclass,
  ensureSampleInteractiveCatalog,
  formatTimestamp,
  seedSampleCatalogToFirestore,
  submitClassFeedback,
  subscribeClassFeedback,
  toggleMasterclassRegistration,
  toggleSaveItem,
} from '../services/nrityaService';
import {
  CLASSICAL_DANCE_FORMS,
  ClassFeedback,
  Masterclass,
} from '../types/nritya';
import { SafeImage } from '../components/SafeImage';

const MasterclassDetailDrawer: React.FC<{
  mc: Masterclass;
  busy: boolean;
  onToggleReg: (mc: Masterclass) => void;
  onClose: () => void;
}> = ({ mc, busy, onToggleReg, onClose }) => {
  const {
    currentUserProfile,
    isAdmin,
    classRegistrations,
    setOpenAuthModal,
    showToast,
    usingPreviewFallback,
  } = useNritya();

  const [feedback, setFeedback] = useState<ClassFeedback[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reg = classRegistrations.find((r) => r.classId === mc.id);
  const isRegistered = reg?.status === 'registered';
  const isFull = !isRegistered && mc.registeredCount >= mc.capacity;
  const canViewLink =
    isRegistered || isAdmin || currentUserProfile?.uid === mc.guruId;

  useEffect(() => {
    if (usingPreviewFallback) return;
    const unsub = subscribeClassFeedback(mc.id, setFeedback);
    return () => unsub();
  }, [mc.id, usingPreviewFallback]);

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      setOpenAuthModal(true);
      return;
    }
    if (comment.trim().length < 3) return;
    setSubmitting(true);
    try {
      if (usingPreviewFallback) {
        await (isAdmin ? seedSampleCatalogToFirestore(false) : ensureSampleInteractiveCatalog());
      }
      await submitClassFeedback({
        classId: mc.id,
        user: currentUserProfile,
        rating,
        comment: comment.trim(),
      });
      setComment('');
      showToast('Thank you for sharing class feedback.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Unable to submit feedback.', 'error');
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
      <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl max-w-2xl w-full p-6 sm:p-8 my-8 relative space-y-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close class details"
          className="absolute top-4 right-4 p-2 rounded-lg text-[#5A4A57] hover:bg-[#F3EDE3]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <p className="text-xs text-[#5A4A57]">
            {mc.danceForm} · {mc.difficulty}
            {mc.isSample ? ' · Sample Class (Illustrative)' : ''}
          </p>
          <h2 className="font-display text-3xl font-semibold text-[#1E171D]">
            {mc.title}
          </h2>
          <p className="text-sm font-medium text-[#4A1D3D]">Led by {mc.guruName}</p>
        </div>

        <p className="text-sm text-[#1E171D] leading-relaxed">{mc.description}</p>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2]">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#5A4A57] tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#B38838]" /> {mc.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B38838]" /> {mc.time} ({mc.durationMinutes} min)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#B38838]" /> {mc.registeredCount}/
              {mc.capacity} registered
            </span>
          </div>
          <button
            type="button"
            disabled={busy || mc.status !== 'scheduled' || isFull}
            onClick={() => onToggleReg(mc)}
            className={`py-2 px-4 rounded-lg text-xs font-medium transition-colors min-h-[38px] disabled:opacity-60 ${
              isRegistered
                ? 'bg-[#F3EDE3] text-[#4A1D3D] border border-[#E5DDD2] hover:border-[#4A1D3D]'
                : 'bg-[#4A1D3D] text-[#FAF7F2] hover:bg-[#36132C]'
            }`}
          >
            {busy
              ? isRegistered
                ? 'Cancelling...'
                : 'Registering...'
              : isRegistered
              ? 'Cancel Registration'
              : isFull
              ? 'Session Full'
              : 'Register Seat'}
          </button>
        </div>

        {mc.guruBio && (
          <div className="p-4 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5A4A57]">
              Instructor Note
            </p>
            <p className="text-sm text-[#5A4A57]">{mc.guruBio}</p>
          </div>
        )}

        <div className="p-4 rounded-lg bg-[#F3EDE3]/60 border border-[#E5DDD2] space-y-2 text-sm">
          <p className="font-semibold text-[#1E171D] flex items-center gap-2">
            <Video className="w-4 h-4 text-[#4A1D3D]" />
            Session Room & Recording Policy
          </p>
          {canViewLink ? (
            <p className="text-xs text-[#1E171D] break-all">
              Meeting Link:{' '}
              <a
                href={mc.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="text-[#4A1D3D] underline inline-flex items-center gap-1"
              >
                {mc.meetingLink} <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          ) : (
            <p className="text-xs text-[#5A4A57]">
              Register for this session to unlock the moderated group meeting link.
            </p>
          )}
          <p className="text-xs text-[#5A4A57]">
            Recording: {mc.recordingAvailable ? 'Available after session' : 'Live only'}
            {mc.recordingNote ? ` — ${mc.recordingNote}` : ''}
          </p>
        </div>

        {/* Feedback section */}
        <div className="pt-4 border-t border-[#E5DDD2] space-y-4">
          <h3 className="font-display text-2xl font-semibold text-[#1E171D]">
            Participant Reflections & Feedback ({feedback.length})
          </h3>

          <form onSubmit={handleFeedback} className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-[#5A4A57]">Rating:</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-md border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} Stars
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={1000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share post-class feedback..."
                className="flex-1 px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
              <button
                type="submit"
                disabled={submitting || comment.trim().length < 3}
                className="px-4 py-2 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-xs font-medium hover:bg-[#36132C] disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </form>

          {feedback.length === 0 ? (
            <p className="text-xs text-[#5A4A57]">No feedback submitted yet.</p>
          ) : (
            <div className="space-y-2.5">
              {feedback.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1E171D]">{f.userName}</span>
                    <span className="inline-flex items-center gap-1 text-[#B38838] tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-[#B38838]" /> {f.rating}/5 ·{' '}
                      {formatTimestamp(f.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[#5A4A57]">{f.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MasterclassesPage: React.FC = () => {
  const {
    masterclasses,
    currentUserProfile,
    isAdmin,
    classRegistrations,
    savedItems,
    setOpenAuthModal,
    setSelectedDancerUid,
    showToast,
    usingPreviewFallback,
  } = useNritya();

  const [formFilter, setFormFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [danceForm, setDanceForm] = useState('Bharatanatyam');
  const [difficulty, setDifficulty] = useState<
    'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels'
  >('All Levels');
  const [date, setDate] = useState('2026-12-20');
  const [time, setTime] = useState('18:00 IST');
  const [durationMinutes, setDurationMinutes] = useState(75);
  const [capacity, setCapacity] = useState(40);
  const [meetingLink, setMeetingLink] = useState('https://meet.nritya-session.example/room');
  const [recordingAvailable, setRecordingAvailable] = useState(true);
  const [recordingNote, setRecordingNote] = useState('');

  const canCreateClass =
    isAdmin ||
    (currentUserProfile?.role === 'guru' &&
      currentUserProfile?.verificationStatus === 'verified');

  const activeDetail = useMemo(
    () => masterclasses.find((m) => m.id === activeDetailId) || null,
    [masterclasses, activeDetailId]
  );

  const filtered = useMemo(() => {
    return masterclasses.filter((mc) => {
      if (formFilter !== 'All' && mc.danceForm !== formFilter) return false;
      if (difficultyFilter !== 'All' && mc.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [masterclasses, formFilter, difficultyFilter]);

  const handleToggleReg = async (mc: Masterclass) => {
    if (!currentUserProfile) {
      setOpenAuthModal(true);
      showToast('Please sign in and complete your profile to register a seat.', 'info');
      return;
    }
    const existingReg = classRegistrations.find((r) => r.classId === mc.id);
    const isCurrentlyReg = existingReg?.status === 'registered';
    if (!isCurrentlyReg && mc.registeredCount >= mc.capacity) {
      showToast('This masterclass has reached full capacity.', 'error');
      return;
    }
    setBusyId(mc.id);
    try {
      if (usingPreviewFallback || mc.isSample) {
        await (isAdmin ? seedSampleCatalogToFirestore(false) : ensureSampleInteractiveCatalog());
      }
      await toggleMasterclassRegistration({
        mc,
        user: currentUserProfile,
        existingReg,
      });
      showToast(
        isCurrentlyReg ? 'Registration cancelled.' : 'Seat confirmed for masterclass!',
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Unable to update registration.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveMasterclass = async (mc: Masterclass, isSaved: boolean) => {
    if (!currentUserProfile) {
      setOpenAuthModal(true);
      return;
    }
    try {
      await toggleSaveItem({
        uid: currentUserProfile.uid,
        itemType: 'masterclass',
        itemId: mc.id,
        title: mc.title,
        subtitle: mc.guruName,
        danceForm: mc.danceForm,
        currentlySaved: isSaved,
      });
      showToast(isSaved ? 'Removed from saved items.' : 'Saved to your dashboard.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Unable to save masterclass.', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile || !canCreateClass) return;
    setBusyId('create');
    try {
      await createMasterclass({
        guru: currentUserProfile,
        title,
        description,
        danceForm,
        difficulty,
        date,
        time,
        durationMinutes,
        capacity,
        meetingLink,
        recordingAvailable,
        recordingNote,
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      showToast('Masterclass published.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Unable to create masterclass.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5DDD2] pb-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B38838]">
            Weekly Online Masterclasses
          </p>
          <h1 className="font-display text-4xl font-semibold text-[#1E171D]">
            Learn Directly From Classical Acharyas
          </h1>
          <p className="text-sm text-[#5A4A57] max-w-2xl">
            Weekly structured sessions covering technique, abhinaya, tala, and repertoire.
            Sample classes are clearly labelled for platform demonstration.
          </p>
        </div>

        {canCreateClass && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C] whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" /> Host Masterclass
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-4">
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

        <div className="flex flex-wrap gap-1.5">
          {(['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'] as const).map(
            (lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDifficultyFilter(lvl)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  difficultyFilter === lvl
                    ? 'bg-[#4A1D3D] text-[#FAF7F2]'
                    : 'bg-[#FAF7F2] text-[#5A4A57] hover:text-[#1E171D]'
                }`}
              >
                {lvl}
              </button>
            )
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-10 text-center space-y-2">
          <p className="font-display text-2xl font-semibold">No matching masterclasses</p>
          <p className="text-sm text-[#5A4A57]">Adjust your dance form or difficulty filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((mc) => {
            const existingReg = classRegistrations.find((r) => r.classId === mc.id);
            const isRegistered = existingReg?.status === 'registered';
            const isFull = !isRegistered && mc.registeredCount >= mc.capacity;
            const isSaved = savedItems.some(
              (s) => s.itemType === 'masterclass' && s.itemId === mc.id
            );

            return (
              <div
                key={mc.id}
                className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl overflow-hidden flex flex-col"
              >
                <div className="h-52 overflow-hidden border-b border-[#E5DDD2]">
                  <SafeImage
                    src={mc.coverImage || NRITYA_IMAGES.masterclass}
                    alt={mc.title}
                    fallbackTitle={mc.danceForm}
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-[#5A4A57]">
                        {mc.danceForm} · {mc.difficulty}
                        {mc.isSample && (
                          <span className="text-[#B5727B]"> · Sample Class</span>
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSaveMasterclass(mc, isSaved)}
                        aria-label="Save masterclass"
                        className="p-1.5 rounded-md text-[#5A4A57] hover:text-[#4A1D3D]"
                      >
                        <Bookmark
                          className={`w-4 h-4 ${isSaved ? 'fill-[#4A1D3D] text-[#4A1D3D]' : ''}`}
                        />
                      </button>
                    </div>

                    <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
                      {mc.title}
                    </h2>

                    <button
                      type="button"
                      onClick={() => setSelectedDancerUid(mc.guruId)}
                      className="text-xs font-medium text-[#4A1D3D] hover:underline"
                    >
                      Instructor: {mc.guruName}
                    </button>

                    <p className="text-sm text-[#5A4A57] leading-relaxed">{mc.description}</p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[#E5DDD2]">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#5A4A57] tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#B38838]" /> {mc.date}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#B38838]" /> {mc.time} ({mc.durationMinutes} min)
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#B38838]" /> {mc.registeredCount}/
                        {mc.capacity} registered
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        disabled={busyId === mc.id || mc.status !== 'scheduled' || isFull}
                        onClick={() => handleToggleReg(mc)}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors min-h-[42px] disabled:opacity-60 ${
                          isRegistered
                            ? 'bg-[#F3EDE3] text-[#4A1D3D] border border-[#E5DDD2] hover:border-[#4A1D3D]'
                            : 'bg-[#4A1D3D] text-[#FAF7F2] hover:bg-[#36132C]'
                        }`}
                      >
                        {busyId === mc.id
                          ? isRegistered
                            ? 'Cancelling...'
                            : 'Registering...'
                          : isRegistered
                          ? 'Cancel Registration'
                          : isFull
                          ? 'Session Full'
                          : 'Register Seat'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDetailId(mc.id)}
                        className="py-2.5 px-4 rounded-lg border border-[#E5DDD2] text-sm font-medium text-[#1E171D] hover:border-[#4A1D3D] min-h-[42px]"
                      >
                        Details & Feedback
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeDetail && (
        <MasterclassDetailDrawer
          mc={activeDetail}
          busy={busyId === activeDetail.id}
          onToggleReg={handleToggleReg}
          onClose={() => setActiveDetailId(null)}
        />
      )}

      {/* Create Masterclass Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-[#1E171D]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl max-w-lg w-full p-6 space-y-4 my-8 relative">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-[#5A4A57] hover:bg-[#F3EDE3]"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
              Publish Online Masterclass
            </h2>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <input
                type="text"
                required
                minLength={3}
                maxLength={160}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masterclass Title"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
              <textarea
                rows={3}
                required
                minLength={10}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Curriculum description, prerequisites, and focus..."
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={danceForm}
                  onChange={(e) => setDanceForm(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                >
                  {CLASSICAL_DANCE_FORMS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                >
                  <option value="All Levels">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                />
                <input
                  type="text"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="18:00 IST"
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={15}
                  max={240}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  placeholder="Duration (min)"
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                />
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  placeholder="Capacity"
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                />
              </div>
              <input
                type="url"
                required
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="Moderated group meeting URL"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
              <label className="flex items-center gap-2 text-xs text-[#5A4A57]">
                <input
                  type="checkbox"
                  checked={recordingAvailable}
                  onChange={(e) => setRecordingAvailable(e.target.checked)}
                  className="accent-[#4A1D3D]"
                />
                Recording available to registered participants
              </label>
              <input
                type="text"
                maxLength={300}
                value={recordingNote}
                onChange={(e) => setRecordingNote(e.target.value)}
                placeholder="Recording availability note (optional)"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
              />
              <button
                type="submit"
                disabled={busyId === 'create'}
                className="w-full py-2.5 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C]"
              >
                {busyId === 'create' ? 'Publishing...' : 'Publish Masterclass'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
