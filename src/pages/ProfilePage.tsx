import React, { useEffect, useState } from 'react';
import { CheckCircle2, LogOut, ShieldCheck } from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import { NRITYA_IMAGES } from '../data/sampleCatalog';
import {
  createOrUpdateUserProfile,
  submitVerificationRequest,
  toggleBlockUser,
} from '../services/nrityaService';
import {
  CLASSICAL_DANCE_FORMS,
  EXPERIENCE_LEVELS,
  ExperienceLevel,
  UserRole,
} from '../types/nritya';
import { SafeImage } from '../components/SafeImage';

const AVATAR_PRESETS = [
  { label: 'Default Google Photo', url: '' },
  { label: 'Bharatanatyam Courtyard Portrait', url: NRITYA_IMAGES.hero },
  { label: 'Odissi Portrait Study', url: NRITYA_IMAGES.dancerPortrait },
  { label: 'Kathak Studio Aesthetic', url: NRITYA_IMAGES.masterclass },
];

export const ProfilePage: React.FC = () => {
  const {
    firebaseUser,
    currentUserProfile,
    privateAccount,
    verificationRequests,
    users,
    signOutUser,
    setOpenAuthModal,
    showToast,
  } = useNritya();

  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('dancer');
  const [danceForms, setDanceForms] = useState<string[]>(['Bharatanatyam']);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Intermediate');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [portfolioNote, setPortfolioNote] = useState('');
  const [repertoireText, setRepertoireText] = useState('');
  const [privacyShowLocation, setPrivacyShowLocation] = useState(true);
  const [privacyAllowFollows, setPrivacyAllowFollows] = useState(true);
  const [privacyProfileVisibility, setPrivacyProfileVisibility] = useState<'public' | 'community'>('public');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saving, setSaving] = useState(false);

  // Verification submission
  const [requestedRole, setRequestedRole] = useState<'guru' | 'organizer'>('guru');
  const [lineageOrOrg, setLineageOrOrg] = useState('');
  const [credentialsSummary, setCredentialsSummary] = useState('');
  const [referenceLink, setReferenceLink] = useState('');
  const [submittingVer, setSubmittingVer] = useState(false);

  useEffect(() => {
    if (!currentUserProfile) return;
    setDisplayName(currentUserProfile.displayName);
    setRole(currentUserProfile.role);
    setDanceForms(currentUserProfile.danceForms);
    setExperienceLevel(currentUserProfile.experienceLevel);
    setBio(currentUserProfile.bio || '');
    setLocation(currentUserProfile.location || '');
    setPhotoURL(currentUserProfile.photoURL || '');
    setPortfolioNote(currentUserProfile.portfolioNote || '');
    setRepertoireText((currentUserProfile.repertoireHighlights || []).join('\n'));
    setPrivacyShowLocation(currentUserProfile.privacyShowLocation);
    setPrivacyAllowFollows(currentUserProfile.privacyAllowFollows);
  }, [currentUserProfile]);

  useEffect(() => {
    if (!privateAccount) return;
    setPrivacyProfileVisibility(privateAccount.privacyProfileVisibility);
    setEmailNotifications(privateAccount.emailNotifications);
  }, [privateAccount]);

  if (!firebaseUser || !currentUserProfile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B38838]">
          Member Account
        </p>
        <h1 className="font-display text-4xl font-semibold text-[#1E171D]">
          Your NRITYA Profile & Privacy Controls
        </h1>
        <p className="text-sm text-[#5A4A57]">
          Sign in to edit your artistic portfolio, manage privacy preferences, or request
          Guru / Event Organizer verification.
        </p>
        <button
          type="button"
          onClick={() => setOpenAuthModal(true)}
          className="px-6 py-3 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C]"
        >
          Sign In
        </button>
      </div>
    );
  }

  const toggleForm = (form: string) => {
    setDanceForms((prev) =>
      prev.includes(form)
        ? prev.length > 1
          ? prev.filter((f) => f !== form)
          : prev
        : [...prev, form].slice(0, 8)
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createOrUpdateUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName,
        role,
        danceForms,
        experienceLevel,
        bio,
        location,
        photoURL: photoURL || firebaseUser.photoURL || '',
        portfolioNote,
        repertoireHighlights: repertoireText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        privacyShowLocation,
        privacyAllowFollows,
        privacyProfileVisibility,
        emailNotifications,
      });
      showToast('Profile and privacy preferences saved.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Unable to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (credentialsSummary.trim().length < 10) {
      showToast('Please provide at least 10 characters describing your credentials.', 'error');
      return;
    }
    setSubmittingVer(true);
    try {
      await submitVerificationRequest({
        userId: currentUserProfile.uid,
        userName: currentUserProfile.displayName,
        requestedRole,
        lineageOrOrg,
        credentialsSummary,
        referenceLink,
      });
      setLineageOrOrg('');
      setCredentialsSummary('');
      setReferenceLink('');
      showToast('Verification request submitted for administrator review.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Unable to submit verification request.', 'error');
    } finally {
      setSubmittingVer(false);
    }
  };

  const blockedIds = privateAccount?.blockedUserIds || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD2] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#E5DDD2] shrink-0">
            <SafeImage
              src={photoURL || currentUserProfile.photoURL}
              alt={currentUserProfile.displayName}
              fallbackTitle={currentUserProfile.displayName}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-semibold text-[#1E171D]">
                {currentUserProfile.displayName}
              </h1>
              {currentUserProfile.verificationStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#4A1D3D]">
                  <CheckCircle2 className="w-4 h-4 text-[#B38838]" /> Verified
                </span>
              )}
            </div>
            <p className="text-xs text-[#5A4A57]">
              Private Account Email: {privateAccount?.email || firebaseUser.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={signOutUser}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5DDD2] text-xs font-medium text-[#5A4A57] hover:text-[#1E171D] hover:border-[#4A1D3D] self-start sm:self-center"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Edit Profile & Privacy Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-6 sm:p-8 space-y-6"
      >
        <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
          Edit Public Profile & Portfolio
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
              Community Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
            >
              <option value="dancer">Dancer / Student</option>
              <option value="guru">Guru / Acharya</option>
              <option value="organizer">Event Organizer</option>
              <option value="enthusiast">Classical Dance Enthusiast</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
            Classical Dance Forms
          </label>
          <div className="flex flex-wrap gap-2">
            {CLASSICAL_DANCE_FORMS.map((form) => {
              const selected = danceForms.includes(form);
              return (
                <button
                  key={form}
                  type="button"
                  onClick={() => toggleForm(form)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    selected
                      ? 'bg-[#4A1D3D] text-[#FAF7F2] border-[#4A1D3D]'
                      : 'bg-[#FAF7F2] text-[#5A4A57] border-[#E5DDD2]'
                  }`}
                >
                  {form}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
              Experience Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
            >
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
              Location (Optional)
            </label>
            <input
              type="text"
              maxLength={120}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State"
              className="w-full px-3 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
              Profile Photo Preset
            </label>
            <select
              value={AVATAR_PRESETS.some((p) => p.url === photoURL) ? photoURL : ''}
              onChange={(e) => setPhotoURL(e.target.value || firebaseUser.photoURL || '')}
              className="w-full px-3 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
            >
              {AVATAR_PRESETS.map((p) => (
                <option key={p.label} value={p.url}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
            Artistic Biography
          </label>
          <textarea
            rows={3}
            maxLength={1000}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
              Lineage / Portfolio Notes
            </label>
            <textarea
              rows={3}
              maxLength={1200}
              value={portfolioNote}
              onChange={(e) => setPortfolioNote(e.target.value)}
              placeholder="Share training lineage, gharana, bani, or creative research..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
              Repertoire Highlights (one per line)
            </label>
            <textarea
              rows={3}
              value={repertoireText}
              onChange={(e) => setRepertoireText(e.target.value)}
              placeholder="e.g. Khamas Pada Varnam&#10;Gita Govinda Ashtapadi"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5DDD2] space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5A4A57]">
            Privacy & Safety Preferences
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#1E171D]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyShowLocation}
                onChange={(e) => setPrivacyShowLocation(e.target.checked)}
                className="accent-[#4A1D3D]"
              />
              Display city/state on public portfolio
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAllowFollows}
                onChange={(e) => setPrivacyAllowFollows(e.target.checked)}
                className="accent-[#4A1D3D]"
              />
              Allow community members to follow my updates
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="accent-[#4A1D3D]"
              />
              Receive masterclass & moderation updates
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5A4A57]">Visibility:</span>
              <select
                value={privacyProfileVisibility}
                onChange={(e) => setPrivacyProfileVisibility(e.target.value as any)}
                className="px-2.5 py-1 rounded-md border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
              >
                <option value="public">Public Archive</option>
                <option value="community">Signed-in Community</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C] disabled:opacity-60"
          >
            {saving ? 'Saving Changes...' : 'Save Profile & Privacy'}
          </button>
        </div>
      </form>

      {/* Guru & Organizer Verification Workflow */}
      <section className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-semibold text-[#1E171D] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#B38838]" /> Guru & Event Organizer Verification
          </h2>
          <p className="text-sm text-[#5A4A57]">
            Verified Gurus can host official masterclasses, and verified Organizers can submit
            events for publication moderation. Current status:{' '}
            <span className="font-semibold text-[#4A1D3D] uppercase">
              {currentUserProfile.verificationStatus}
            </span>
          </p>
        </div>

        {verificationRequests.length > 0 && (
          <div className="border border-[#E5DDD2] rounded-lg divide-y divide-[#E5DDD2] bg-[#FAF7F2]">
            {verificationRequests.map((req) => (
              <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-semibold text-[#1E171D] capitalize">
                    Requested: {req.requestedRole} — {req.lineageOrOrg}
                  </p>
                  {req.adminNotes && (
                    <p className="text-[#5A4A57] mt-0.5">Moderator Note: {req.adminNotes}</p>
                  )}
                </div>
                <span className="font-semibold uppercase text-[#4A1D3D]">{req.status}</span>
              </div>
            ))}
          </div>
        )}

        {currentUserProfile.verificationStatus !== 'verified' && (
          <form onSubmit={handleRequestVerification} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A4A57] mb-1">
                  Role to Verify
                </label>
                <select
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                >
                  <option value="guru">Guru / Classical Acharya</option>
                  <option value="organizer">Event Organizer / Sabha</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A4A57] mb-1">
                  Lineage / Institution / Sabha Name
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={200}
                  value={lineageOrOrg}
                  onChange={(e) => setLineageOrOrg(e.target.value)}
                  placeholder="e.g. Kalakshetra Lineage / Cultural Trust"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A4A57] mb-1">
                Credentials & Teaching / Organizing History
              </label>
              <textarea
                rows={3}
                required
                minLength={10}
                maxLength={1200}
                value={credentialsSummary}
                onChange={(e) => setCredentialsSummary(e.target.value)}
                placeholder="Summarize your training lineage, teaching years, or cultural festival history..."
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A4A57] mb-1">
                Reference URL (Optional)
              </label>
              <input
                type="url"
                maxLength={500}
                value={referenceLink}
                onChange={(e) => setReferenceLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submittingVer}
              className="px-5 py-2.5 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C] disabled:opacity-60"
            >
              {submittingVer ? 'Submitting...' : 'Submit Verification Request'}
            </button>
          </form>
        )}
      </section>

      {/* Blocked Users */}
      {blockedIds.length > 0 && (
        <section className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-6 space-y-3">
          <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
            Blocked Accounts ({blockedIds.length})
          </h2>
          <div className="divide-y divide-[#E5DDD2]">
            {blockedIds.map((uid) => {
              const target = users.find((u) => u.uid === uid);
              return (
                <div key={uid} className="py-2.5 flex items-center justify-between text-sm">
                  <span>{target?.displayName || uid}</span>
                  <button
                    type="button"
                    onClick={() => toggleBlockUser(currentUserProfile.uid, uid, blockedIds)}
                    className="text-xs font-medium text-[#4A1D3D] hover:underline"
                  >
                    Unblock
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
