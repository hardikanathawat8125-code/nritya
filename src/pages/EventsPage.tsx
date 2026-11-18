import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Calendar,
  MapPin,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import { NRITYA_IMAGES } from '../data/sampleCatalog';
import {
  applyForEvent,
  submitDanceEvent,
  subscribeOrganizerApplications,
  subscribeOrganizerEvents,
  toggleSaveItem,
  updateApplicationStatusByOrganizer,
  withdrawEventApplication,
} from '../services/nrityaService';
import {
  CLASSICAL_DANCE_FORMS,
  DanceEvent,
  EVENT_TYPES,
  EventApplication,
  EventFormat,
  EventType,
} from '../types/nritya';
import { SafeImage } from '../components/SafeImage';

export const EventsPage: React.FC = () => {
  const {
    events,
    currentUserProfile,
    isAdmin,
    eventApplications,
    savedItems,
    setOpenAuthModal,
    setSelectedDancerUid,
    showToast,
    usingPreviewFallback,
  } = useNritya();

  const [tab, setTab] = useState<'discover' | 'organizer'>('discover');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [formFilter, setFormFilter] = useState('All');
  const [formatFilter, setFormatFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');

  const [selectedEvent, setSelectedEvent] = useState<DanceEvent | null>(null);
  const [applicationType, setApplicationType] = useState<
    'Application' | 'Expression of Interest'
  >('Application');
  const [experienceSummary, setExperienceSummary] = useState('');
  const [busy, setBusy] = useState(false);

  // Organizer state
  const [myEvents, setMyEvents] = useState<DanceEvent[]>([]);
  const [incomingApps, setIncomingApps] = useState<EventApplication[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [evTitle, setEvTitle] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evType, setEvType] = useState<EventType>('Performance');
  const [evForm, setEvForm] = useState('Bharatanatyam');
  const [evFormat, setEvFormat] = useState<EventFormat>('In-Person');
  const [evDate, setEvDate] = useState('2027-02-15');
  const [evDeadline, setEvDeadline] = useState('2027-01-30');
  const [evCity, setEvCity] = useState('');
  const [evState, setEvState] = useState('');
  const [evVenue, setEvVenue] = useState('');
  const [evEligibility, setEvEligibility] = useState('');
  const [evProcess, setEvProcess] = useState('');

  const isVerifiedOrganizer =
    isAdmin ||
    (currentUserProfile?.role === 'organizer' &&
      currentUserProfile?.verificationStatus === 'verified');

  useEffect(() => {
    if (!currentUserProfile || !isVerifiedOrganizer) {
      setMyEvents([]);
      setIncomingApps([]);
      return;
    }
    const u1 = subscribeOrganizerEvents(currentUserProfile.uid, setMyEvents);
    const u2 = subscribeOrganizerApplications(currentUserProfile.uid, setIncomingApps);
    return () => {
      u1();
      u2();
    };
  }, [currentUserProfile, isVerifiedOrganizer]);

  const filteredEvents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const loc = locationFilter.trim().toLowerCase();
    return events.filter((ev) => {
      if (typeFilter !== 'All' && ev.eventType !== typeFilter) return false;
      if (formFilter !== 'All' && ev.danceForm !== formFilter) return false;
      if (formatFilter !== 'All' && ev.format !== formatFilter) return false;
      if (loc) {
        const cityState = `${ev.city || ''} ${ev.state || ''}`.toLowerCase();
        if (!cityState.includes(loc)) return false;
      }
      if (
        q &&
        !ev.title.toLowerCase().includes(q) &&
        !ev.description.toLowerCase().includes(q) &&
        !ev.organizerName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [events, searchTerm, typeFilter, formFilter, formatFilter, locationFilter]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!currentUserProfile) {
      setOpenAuthModal(true);
      return;
    }
    if (usingPreviewFallback) {
      showToast('Sample preview events require database seeding by Admin.', 'info');
      return;
    }
    if (experienceSummary.trim().length < 10) {
      showToast('Please enter at least 10 characters summarizing your readiness.', 'error');
      return;
    }
    setBusy(true);
    try {
      await applyForEvent({
        event: selectedEvent,
        applicant: currentUserProfile,
        applicationType,
        experienceSummary: experienceSummary.trim(),
      });
      setExperienceSummary('');
      showToast(`${applicationType} submitted for "${selectedEvent.title}".`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Unable to submit application.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile || !isVerifiedOrganizer) return;
    setBusy(true);
    try {
      await submitDanceEvent({
        organizer: currentUserProfile,
        isAdmin,
        title: evTitle,
        description: evDesc,
        eventType: evType,
        danceForm: evForm,
        format: evFormat,
        date: evDate,
        registrationDeadline: evDeadline,
        city: evCity,
        state: evState,
        venue: evVenue,
        eligibility: evEligibility,
        applicationProcess: evProcess,
      });
      setShowSubmitModal(false);
      setEvTitle('');
      setEvDesc('');
      showToast(
        isAdmin
          ? 'Event published.'
          : 'Event submitted for administrator moderation before publication.',
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Unable to submit event.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5DDD2] pb-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7B6988]">
            Events & Opportunities
          </p>
          <h1 className="font-display text-4xl font-semibold text-[#1E171D]">
            Performances, Competitions, Auditions & Grants
          </h1>
          <p className="text-sm text-[#5A4A57] max-w-2xl">
            Every organizer submission undergoes moderation before publication. Sample events
            are clearly labelled for reference.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#F3EDE3] rounded-lg border border-[#E5DDD2]">
            <button
              type="button"
              onClick={() => setTab('discover')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tab === 'discover' ? 'bg-[#FFFDF9] text-[#4A1D3D] shadow-xs' : 'text-[#5A4A57]'
              }`}
            >
              Discover Events
            </button>
            <button
              type="button"
              onClick={() => setTab('organizer')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tab === 'organizer' ? 'bg-[#FFFDF9] text-[#4A1D3D] shadow-xs' : 'text-[#5A4A57]'
              }`}
            >
              Organizer Portal
            </button>
          </div>
        </div>
      </div>

      {tab === 'discover' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-[#5A4A57] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events, sabhas, or fellowships..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                />
              </div>
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
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              >
                <option value="All">All Formats</option>
                <option value="In-Person">In-Person</option>
                <option value="Online">Online</option>
                <option value="Hybrid">Hybrid</option>
              </select>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="City or State..."
                className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(['All', ...EVENT_TYPES] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    typeFilter === t
                      ? 'bg-[#4A1D3D] text-[#FAF7F2]'
                      : 'bg-[#FAF7F2] text-[#5A4A57] hover:text-[#1E171D]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-10 text-center space-y-2">
              <p className="font-display text-2xl font-semibold">No matching events</p>
              <p className="text-sm text-[#5A4A57]">
                Try broadening your event type, city, or dance form filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((ev) => {
                const myApp = eventApplications.find((a) => a.eventId === ev.id);
                const isSaved = savedItems.some(
                  (s) => s.itemType === 'event' && s.itemId === ev.id
                );

                return (
                  <div
                    key={ev.id}
                    className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl overflow-hidden flex flex-col"
                  >
                    <div className="h-44 overflow-hidden border-b border-[#E5DDD2]">
                      <SafeImage
                        src={ev.coverImage || NRITYA_IMAGES.eventStage}
                        alt={ev.title}
                        fallbackTitle={ev.eventType}
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-[#5A4A57]">
                            {ev.eventType} · {ev.danceForm} · {ev.format}
                            {ev.isSample && (
                              <span className="text-[#B5727B]"> · Sample Event</span>
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (!currentUserProfile) {
                                setOpenAuthModal(true);
                                return;
                              }
                              if (usingPreviewFallback) return;
                              toggleSaveItem({
                                uid: currentUserProfile.uid,
                                itemType: 'event',
                                itemId: ev.id,
                                title: ev.title,
                                subtitle: ev.organizerName,
                                danceForm: ev.danceForm,
                                currentlySaved: isSaved,
                              });
                            }}
                            aria-label="Save event"
                            className="p-1 text-[#5A4A57] hover:text-[#4A1D3D]"
                          >
                            <Bookmark
                              className={`w-4 h-4 ${isSaved ? 'fill-[#4A1D3D] text-[#4A1D3D]' : ''}`}
                            />
                          </button>
                        </div>

                        <h2 className="font-display text-2xl font-semibold text-[#1E171D] leading-snug">
                          {ev.title}
                        </h2>
                        <button
                          type="button"
                          onClick={() => setSelectedDancerUid(ev.organizerId)}
                          className="text-xs font-medium text-[#4A1D3D] hover:underline"
                        >
                          {ev.organizerName}
                        </button>
                        <p className="text-sm text-[#5A4A57] line-clamp-2">{ev.description}</p>
                      </div>

                      <div className="pt-4 border-t border-[#E5DDD2] space-y-3">
                        <div className="space-y-1 text-xs text-[#5A4A57] tabular-nums">
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#B38838]" />
                            Event: {ev.date} · Deadline: {ev.registrationDeadline}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#B38838]" />
                            {ev.city ? `${ev.city}, ${ev.state}` : 'Online'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedEvent(ev)}
                          className="w-full py-2.5 px-4 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-xs font-medium hover:bg-[#36132C] transition-colors"
                        >
                          {myApp && myApp.status !== 'withdrawn'
                            ? `Applied (${myApp.status}) — View Details`
                            : 'View Details & Apply'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Organizer Portal */
        <div className="space-y-8">
          {!isVerifiedOrganizer ? (
            <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-8 max-w-2xl space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
                Verified Organizer Access Required
              </h2>
              <p className="text-sm text-[#5A4A57] leading-relaxed">
                To uphold community trust, only verified Event Organizers and Administrators
                can submit listings for moderation. Request organizer verification in your
                Profile settings.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
                  Your Submitted Events ({myEvents.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C]"
                >
                  <Plus className="w-4 h-4" /> Submit Event
                </button>
              </div>

              {myEvents.length === 0 ? (
                <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-8 text-sm text-[#5A4A57]">
                  You have not submitted any events yet.
                </div>
              ) : (
                <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl divide-y divide-[#E5DDD2]">
                  {myEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs text-[#5A4A57]">
                          {ev.eventType} · {ev.danceForm} · {ev.date}
                        </p>
                        <p className="font-display text-xl font-semibold text-[#1E171D]">
                          {ev.title}
                        </p>
                      </div>
                      <div className="text-xs font-medium tabular-nums">
                        Moderation:{' '}
                        <span
                          className={
                            ev.moderationStatus === 'approved'
                              ? 'text-emerald-700'
                              : ev.moderationStatus === 'rejected'
                              ? 'text-[#B5727B]'
                              : 'text-[#B38838]'
                          }
                        >
                          {ev.moderationStatus.toUpperCase()}
                        </span>{' '}
                        · {ev.applicationsCount} applications
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
                  Dancer Applications & Expressions of Interest ({incomingApps.length})
                </h2>
                {incomingApps.length === 0 ? (
                  <p className="text-sm text-[#5A4A57]">No dancer applications received yet.</p>
                ) : (
                  <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl divide-y divide-[#E5DDD2]">
                    {incomingApps.map((app) => (
                      <div
                        key={app.id}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <p className="text-xs text-[#5A4A57]">
                            {app.eventTitle} · {app.applicationType} · Status: {app.status}
                          </p>
                          <p className="font-semibold text-sm text-[#1E171D]">
                            {app.applicantName} ({app.applicantDanceForm || 'Classical'})
                          </p>
                          <p className="text-sm text-[#5A4A57]">{app.experienceSummary}</p>
                        </div>
                        {app.status !== 'withdrawn' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateApplicationStatusByOrganizer(app.id, 'reviewed')}
                              className="px-3 py-1.5 rounded-md border border-[#E5DDD2] text-xs font-medium hover:border-[#4A1D3D]"
                            >
                              Mark Reviewed
                            </button>
                            <button
                              type="button"
                              onClick={() => updateApplicationStatusByOrganizer(app.id, 'shortlisted')}
                              className="px-3 py-1.5 rounded-md bg-[#4A1D3D] text-[#FAF7F2] text-xs font-medium"
                            >
                              Shortlist
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Event Detail & Application Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-[#1E171D]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl max-w-2xl w-full p-6 sm:p-8 my-8 relative space-y-5">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              aria-label="Close event details"
              className="absolute top-4 right-4 p-2 rounded-lg text-[#5A4A57] hover:bg-[#F3EDE3]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5">
              <p className="text-xs text-[#5A4A57]">
                {selectedEvent.eventType} · {selectedEvent.danceForm} · {selectedEvent.format}
                {selectedEvent.isSample ? ' · Sample Event' : ''}
              </p>
              <h2 className="font-display text-3xl font-semibold text-[#1E171D]">
                {selectedEvent.title}
              </h2>
              <p className="text-xs font-medium text-[#4A1D3D]">
                Organized by {selectedEvent.organizerName}
              </p>
            </div>

            <p className="text-sm text-[#1E171D] leading-relaxed">{selectedEvent.description}</p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-y border-[#E5DDD2] py-4">
              <div>
                <dt className="font-semibold text-[#5A4A57]">Date & Deadline</dt>
                <dd className="text-[#1E171D] mt-0.5 tabular-nums">
                  {selectedEvent.date} (Apply by {selectedEvent.registrationDeadline})
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[#5A4A57]">Venue / Location</dt>
                <dd className="text-[#1E171D] mt-0.5">
                  {selectedEvent.venue || 'Online'}{' '}
                  {selectedEvent.city ? `· ${selectedEvent.city}, ${selectedEvent.state}` : ''}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[#5A4A57]">Eligibility</dt>
                <dd className="text-[#1E171D] mt-0.5">{selectedEvent.eligibility}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#5A4A57]">Application Process</dt>
                <dd className="text-[#1E171D] mt-0.5">{selectedEvent.applicationProcess}</dd>
              </div>
            </dl>

            {/* Application Form */}
            {(() => {
              const existingApp = eventApplications.find((a) => a.eventId === selectedEvent.id);
              if (existingApp && existingApp.status !== 'withdrawn') {
                return (
                  <div className="p-4 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#4A1D3D]">
                        {existingApp.applicationType} Status: {existingApp.status.toUpperCase()}
                      </p>
                      <p className="text-xs text-[#5A4A57] mt-0.5">
                        {existingApp.experienceSummary}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => withdrawEventApplication(existingApp)}
                      className="px-3.5 py-2 rounded-lg border border-[#E5DDD2] text-xs font-medium text-[#B5727B] hover:border-[#B5727B] shrink-0"
                    >
                      Withdraw
                    </button>
                  </div>
                );
              }
              return (
                <form onSubmit={handleApply} className="space-y-3">
                  <h3 className="font-display text-xl font-semibold text-[#1E171D]">
                    Submit Application or Expression of Interest
                  </h3>
                  <select
                    value={applicationType}
                    onChange={(e) => setApplicationType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                  >
                    <option value="Application">Formal Application</option>
                    <option value="Expression of Interest">Expression of Interest</option>
                  </select>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    maxLength={1000}
                    value={experienceSummary}
                    onChange={(e) => setExperienceSummary(e.target.value)}
                    placeholder="Briefly describe your classical training, repertoire readiness, and interest..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-2.5 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C] disabled:opacity-60"
                  >
                    {busy ? 'Submitting...' : `Send ${applicationType}`}
                  </button>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* Submit New Event Modal */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 bg-[#1E171D]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl max-w-xl w-full p-6 my-8 relative space-y-4">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-[#5A4A57] hover:bg-[#F3EDE3]"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="font-display text-2xl font-semibold text-[#1E171D]">
              Submit Event for Moderation
            </h2>
            <form onSubmit={handleSubmitEvent} className="space-y-3">
              <input
                type="text"
                required
                minLength={3}
                maxLength={160}
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                placeholder="Event Title"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
              <textarea
                rows={3}
                required
                minLength={10}
                maxLength={2500}
                value={evDesc}
                onChange={(e) => setEvDesc(e.target.value)}
                placeholder="Event overview..."
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
              <div className="grid grid-cols-3 gap-2.5">
                <select
                  value={evType}
                  onChange={(e) => setEvType(e.target.value as EventType)}
                  className="px-2.5 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={evForm}
                  onChange={(e) => setEvForm(e.target.value)}
                  className="px-2.5 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                >
                  {CLASSICAL_DANCE_FORMS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <select
                  value={evFormat}
                  onChange={(e) => setEvFormat(e.target.value as EventFormat)}
                  className="px-2.5 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                >
                  <option value="In-Person">In-Person</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#5A4A57] mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={evDate}
                    onChange={(e) => setEvDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#5A4A57] mb-1">
                    Registration Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={evDeadline}
                    onChange={(e) => setEvDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={evCity}
                  onChange={(e) => setEvCity(e.target.value)}
                  placeholder="City"
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                />
                <input
                  type="text"
                  value={evState}
                  onChange={(e) => setEvState(e.target.value)}
                  placeholder="State"
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                />
                <input
                  type="text"
                  value={evVenue}
                  onChange={(e) => setEvVenue(e.target.value)}
                  placeholder="Venue"
                  className="px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-xs"
                />
              </div>
              <input
                type="text"
                required
                value={evEligibility}
                onChange={(e) => setEvEligibility(e.target.value)}
                placeholder="Eligibility criteria"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
              <input
                type="text"
                required
                value={evProcess}
                onChange={(e) => setEvProcess(e.target.value)}
                placeholder="Application process"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C]"
              >
                {busy ? 'Submitting...' : 'Submit for Moderation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
