import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import { createOrUpdateUserProfile } from '../services/nrityaService';
import {
  CLASSICAL_DANCE_FORMS,
  EXPERIENCE_LEVELS,
  ExperienceLevel,
  UserRole,
} from '../types/nritya';

export const AuthOnboardingModal: React.FC = () => {
  const {
    firebaseUser,
    openAuthModal,
    setOpenAuthModal,
    profileNeedsOnboarding,
    signInWithGoogle,
    signOutUser,
    showToast,
  } = useNritya();

  const [displayName, setDisplayName] = useState(firebaseUser?.displayName || '');
  const [role, setRole] = useState<UserRole>('dancer');
  const [danceForms, setDanceForms] = useState<string[]>(['Bharatanatyam']);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Intermediate');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [privacyShowLocation, setPrivacyShowLocation] = useState(true);
  const [privacyAllowFollows, setPrivacyAllowFollows] = useState(true);
  const [saving, setSaving] = useState(false);

  const visible = openAuthModal || profileNeedsOnboarding;
  if (!visible) return null;

  const toggleForm = (form: string) => {
    setDanceForms((prev) =>
      prev.includes(form)
        ? prev.length > 1
          ? prev.filter((f) => f !== form)
          : prev
        : [...prev, form].slice(0, 8)
    );
  };

  const handleSaveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    if (displayName.trim().length < 2) {
      showToast('Please enter a display name (at least 2 characters).', 'error');
      return;
    }

    setSaving(true);
    try {
      await createOrUpdateUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: displayName.trim(),
        role,
        danceForms,
        experienceLevel,
        bio: bio.trim(),
        location: location.trim(),
        photoURL: firebaseUser.photoURL || '',
        privacyShowLocation,
        privacyAllowFollows,
      });
      showToast('Welcome to NRITYA! Your profile is now saved.', 'success');
      setOpenAuthModal(false);
    } catch (err: any) {
      showToast(err?.message || 'Unable to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1E171D]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl max-w-xl w-full p-6 sm:p-8 my-8 relative">
        {!profileNeedsOnboarding && (
          <button
            type="button"
            onClick={() => setOpenAuthModal(false)}
            aria-label="Close modal"
            className="absolute top-5 right-5 p-2 rounded-lg text-[#5A4A57] hover:bg-[#F3EDE3]"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {!firebaseUser ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B38838]">
                Join the Sabha
              </p>
              <h2 id="auth-modal-title" className="font-display text-3xl font-semibold text-[#1E171D]">
                Sign in to NRITYA
              </h2>
              <p className="text-sm text-[#5A4A57] leading-relaxed">
                Sign in with your verified Google account to share reflections, register for
                masterclasses, apply to performances, and join moderated gatherings.
              </p>
            </div>

            <div className="motif-divider" />

            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full py-3 px-5 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C] transition-colors min-h-[44px]"
            >
              Continue with Google Account
            </button>

            <p className="text-xs text-[#5A4A57] leading-relaxed">
              Your email address is kept strictly private inside isolated account storage
              and is never displayed publicly on your dancer profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSaveOnboarding} className="space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B38838]">
                Complete Your Cultural Profile
              </p>
              <h2 id="auth-modal-title" className="font-display text-3xl font-semibold text-[#1E171D]">
                Welcome to NRITYA
              </h2>
              <p className="text-sm text-[#5A4A57]">
                Tell the community about your dance lineage and role. You can request Guru or
                Organizer verification later in Profile Settings.
              </p>
            </div>

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
                  placeholder="Your full name or stage name"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm focus:outline-none focus:border-[#4A1D3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
                  Community Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm focus:outline-none focus:border-[#4A1D3D]"
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
                          : 'bg-[#FAF7F2] text-[#5A4A57] border-[#E5DDD2] hover:border-[#4A1D3D]'
                      }`}
                    >
                      {form}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm focus:outline-none focus:border-[#4A1D3D]"
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
                  City / Location (Optional)
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Chennai, Tamil Nadu"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm focus:outline-none focus:border-[#4A1D3D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
                Artistic Bio
              </label>
              <textarea
                rows={3}
                maxLength={1000}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your training background, interests, or classical journey..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm focus:outline-none focus:border-[#4A1D3D]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 text-xs text-[#5A4A57]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyShowLocation}
                  onChange={(e) => setPrivacyShowLocation(e.target.checked)}
                  className="accent-[#4A1D3D]"
                />
                Show city on public profile
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAllowFollows}
                  onChange={(e) => setPrivacyAllowFollows(e.target.checked)}
                  className="accent-[#4A1D3D]"
                />
                Allow community members to follow me
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={signOutUser}
                className="px-4 py-2 text-xs font-medium text-[#5A4A57] hover:text-[#1E171D]"
              >
                Sign out
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C] disabled:opacity-60 transition-colors min-h-[44px]"
              >
                {saving ? 'Saving Profile...' : 'Save & Enter NRITYA'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
