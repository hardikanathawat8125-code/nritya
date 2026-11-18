import React from 'react';
import { ArrowRight, Calendar, CheckCircle2, Clock, MapPin, Users } from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import { NRITYA_IMAGES } from '../data/sampleCatalog';
import { SafeImage } from '../components/SafeImage';
import { CLASSICAL_DANCE_FORMS } from '../types/nritya';

export const HomePage: React.FC = () => {
  const {
    navigate,
    posts,
    masterclasses,
    events,
    gatherings,
    users,
    firebaseUser,
    setOpenAuthModal,
    setSelectedDancerUid,
    usingPreviewFallback,
  } = useNritya();

  const featuredProfiles = users
    .filter((u) => u.isFeatured || u.role === 'guru')
    .slice(0, 4);

  return (
    <div className="space-y-20 pb-12">
      {/* 1. Editorial Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B38838]">
              Indian Classical Dance Community
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#1E171D] leading-[1.08] text-balance">
              Where Tradition Connects.
            </h1>
            <p className="text-base sm:text-lg text-[#5A4A57] leading-relaxed max-w-xl">
              NRITYA is a dedicated cultural home uniting classical dancers, students,
              acharyas, event organizers, and rasikas across Bharatanatyam, Kathak, Odissi,
              Kuchipudi, Kathakali, Mohiniyattam, Manipuri, and Sattriya.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('community')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C] transition-colors min-h-[44px]"
              >
                Explore the Community
                <ArrowRight className="w-4 h-4" />
              </button>
              {firebaseUser ? (
                <button
                  type="button"
                  onClick={() => navigate('dashboard')}
                  className="px-6 py-3 rounded-lg border border-[#E5DDD2] bg-[#FFFDF9] text-[#1E171D] text-sm font-medium hover:border-[#4A1D3D] transition-colors min-h-[44px]"
                >
                  Open My Dashboard
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenAuthModal(true)}
                  className="px-6 py-3 rounded-lg border border-[#E5DDD2] bg-[#FFFDF9] text-[#1E171D] text-sm font-medium hover:border-[#4A1D3D] transition-colors min-h-[44px]"
                >
                  Create Dancer Profile
                </button>
              )}
            </div>

            {usingPreviewFallback && (
              <p className="text-xs text-[#5A4A57] pt-1">
                Currently displaying clearly labelled sample catalog previews. Sign in to
                participate and save live activity.
              </p>
            )}
          </div>

          <div className="lg:col-span-6">
            <div className="h-[340px] sm:h-[420px] lg:h-full min-h-[380px] rounded-xl overflow-hidden border border-[#E5DDD2] relative">
              <SafeImage
                src={NRITYA_IMAGES.hero}
                alt="Classical Bharatanatyam dancer performing a graceful mudra in warm sandstone courtyard"
                fallbackTitle="NRITYA Classical Dance"
              />
            </div>
          </div>
        </div>

        {/* 4-column Cultural Rhythm Strip directly below Hero */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 border-y border-[#E5DDD2] bg-[#FFFDF9]">
          <div className="p-5 sm:p-6 border-r border-b lg:border-b-0 border-[#E5DDD2]">
            <p className="font-display text-3xl font-semibold text-[#4A1D3D] tabular-nums">
              {CLASSICAL_DANCE_FORMS.length}
            </p>
            <p className="text-xs uppercase tracking-[0.14em] text-[#5A4A57] mt-1">
              Classical Forms
            </p>
          </div>
          <div className="p-5 sm:p-6 lg:border-r border-b lg:border-b-0 border-[#E5DDD2]">
            <p className="font-display text-3xl font-semibold text-[#4A1D3D] tabular-nums">
              {masterclasses.length}
            </p>
            <p className="text-xs uppercase tracking-[0.14em] text-[#5A4A57] mt-1">
              Weekly Masterclasses
            </p>
          </div>
          <div className="p-5 sm:p-6 border-r border-[#E5DDD2]">
            <p className="font-display text-3xl font-semibold text-[#4A1D3D] tabular-nums">
              {events.length}
            </p>
            <p className="text-xs uppercase tracking-[0.14em] text-[#5A4A57] mt-1">
              Moderated Events
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <p className="font-display text-3xl font-semibold text-[#4A1D3D] tabular-nums">
              {gatherings.length}
            </p>
            <p className="text-xs uppercase tracking-[0.14em] text-[#5A4A57] mt-1">
              Virtual Gatherings
            </p>
          </div>
        </div>
      </section>

      {/* 2. Explore the Community */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5DDD2] pb-5">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B5727B]">
              Community Highlights
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1E171D]">
              Explore the Community
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('community')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A1D3D] hover:underline whitespace-nowrap shrink-0"
          >
            View All Reflections <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((post) => (
            <article
              key={post.id}
              className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl overflow-hidden flex flex-col"
            >
              {post.mediaUrl && (
                <div className="h-44 overflow-hidden border-b border-[#E5DDD2]">
                  <SafeImage
                    src={post.mediaUrl}
                    alt={post.title}
                    fallbackTitle={post.danceForm}
                  />
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <p className="text-xs text-[#5A4A57]">
                    {post.category} <span aria-hidden="true">·</span> {post.danceForm}
                    {post.isSample && (
                      <>
                        {' '}
                        <span aria-hidden="true">·</span>{' '}
                        <span className="text-[#B5727B]">Sample Post</span>
                      </>
                    )}
                  </p>
                  <h3 className="font-display text-xl font-semibold text-[#1E171D] leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm text-[#5A4A57] leading-relaxed line-clamp-3">
                    {post.content}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5DDD2] flex items-center justify-between text-xs text-[#5A4A57]">
                  <button
                    type="button"
                    onClick={() => setSelectedDancerUid(post.authorId)}
                    className="font-medium text-[#4A1D3D] hover:underline truncate max-w-[180px]"
                  >
                    {post.authorName}
                  </button>
                  <span className="tabular-nums">
                    {post.likesCount} Likes · {post.commentsCount} Replies
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Discover Masterclasses */}
      <section className="bg-[#F3EDE3]/70 border-y border-[#E5DDD2] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5DDD2] pb-5">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B38838]">
                Weekly Online Learning
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1E171D]">
                Discover Masterclasses
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('masterclasses')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A1D3D] hover:underline whitespace-nowrap shrink-0"
            >
              Browse All Masterclasses <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {masterclasses.slice(0, 2).map((mc) => (
              <div
                key={mc.id}
                className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-12"
              >
                <div className="sm:col-span-5 h-52 sm:h-auto">
                  <SafeImage
                    src={mc.coverImage || NRITYA_IMAGES.masterclass}
                    alt={mc.title}
                    fallbackTitle={mc.danceForm}
                  />
                </div>
                <div className="sm:col-span-7 p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs text-[#5A4A57]">
                      {mc.danceForm} <span aria-hidden="true">·</span> {mc.difficulty}
                      {mc.isSample && (
                        <>
                          {' '}
                          <span aria-hidden="true">·</span>{' '}
                          <span className="text-[#B5727B]">Sample Class</span>
                        </>
                      )}
                    </p>
                    <h3 className="font-display text-2xl font-semibold text-[#1E171D] leading-snug">
                      {mc.title}
                    </h3>
                    <p className="text-sm text-[#5A4A57] line-clamp-2">{mc.description}</p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[#E5DDD2]">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5A4A57] tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#B38838]" /> {mc.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#B38838]" /> {mc.time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#B38838]" /> {mc.registeredCount}/
                        {mc.capacity} seats
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#4A1D3D] truncate">
                        {mc.guruName}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('masterclasses')}
                        className="px-4 py-2 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-xs font-medium hover:bg-[#36132C] transition-colors whitespace-nowrap shrink-0"
                      >
                        View Class
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Discover Performances & Upcoming Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5DDD2] pb-5">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7B6988]">
              Stage, Auditions & Grants
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1E171D]">
              Discover Performances & Upcoming Events
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('events')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A1D3D] hover:underline whitespace-nowrap shrink-0"
          >
            Explore All Opportunities <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.slice(0, 3).map((ev) => (
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
                  <p className="text-xs text-[#5A4A57]">
                    {ev.eventType} <span aria-hidden="true">·</span> {ev.danceForm}{' '}
                    <span aria-hidden="true">·</span> {ev.format}
                    {ev.isSample && (
                      <>
                        {' '}
                        <span aria-hidden="true">·</span>{' '}
                        <span className="text-[#B5727B]">Sample Event</span>
                      </>
                    )}
                  </p>
                  <h3 className="font-display text-xl font-semibold text-[#1E171D] leading-snug">
                    {ev.title}
                  </h3>
                  <p className="text-sm text-[#5A4A57] line-clamp-2">{ev.description}</p>
                </div>

                <div className="pt-4 border-t border-[#E5DDD2] space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#5A4A57] tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#B38838]" />
                      {ev.city ? `${ev.city}, ${ev.state}` : 'Online'}
                    </span>
                    <span>{ev.date}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('events')}
                    className="w-full py-2 px-4 rounded-lg border border-[#E5DDD2] text-xs font-medium text-[#4A1D3D] hover:border-[#4A1D3D] transition-colors"
                  >
                    Event Details & Apply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Featured Gurus & Practitioners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5DDD2] pb-5">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B38838]">
              Lineage & Mentorship
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1E171D]">
              Featured Gurus & Practitioners
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('explore')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A1D3D] hover:underline whitespace-nowrap shrink-0"
          >
            Explore All Dancers <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProfiles.map((person) => (
            <button
              key={person.uid}
              type="button"
              onClick={() => setSelectedDancerUid(person.uid)}
              className="text-left bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-5 hover:border-[#4A1D3D] transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#E5DDD2]">
                  <SafeImage
                    src={person.photoURL}
                    alt={person.displayName}
                    fallbackTitle={person.displayName}
                  />
                </div>
                <div>
                  <p className="text-xs text-[#5A4A57] capitalize">
                    {person.role}
                    {person.verificationStatus === 'verified' && (
                      <span className="inline-flex items-center gap-1 ml-1.5 text-[#4A1D3D]">
                        <CheckCircle2 className="w-3 h-3 text-[#B38838]" /> Verified
                      </span>
                    )}
                  </p>
                  <h3 className="font-display text-xl font-semibold text-[#1E171D] mt-0.5">
                    {person.displayName}
                  </h3>
                  <p className="text-xs text-[#7B6988] mt-1">
                    {person.danceForms.join(' · ')}
                  </p>
                </div>
                <p className="text-xs text-[#5A4A57] line-clamp-2 leading-relaxed">
                  {person.bio}
                </p>
              </div>
              <span className="text-xs font-medium text-[#4A1D3D]">View Portfolio →</span>
            </button>
          ))}
        </div>
      </section>

      {/* 6. Virtual Gatherings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-5 h-64 lg:h-auto">
            <SafeImage
              src={NRITYA_IMAGES.gatheringStudy}
              alt="Classical scholar study with tanpura, ghungroos, and notation notebook"
              fallbackTitle="Virtual Gatherings"
            />
          </div>
          <div className="lg:col-span-7 p-8 sm:p-10 space-y-6 flex flex-col justify-center">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B38838]">
                Moderated Virtual Gatherings
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1E171D]">
                Sit Together in Classical Dialogue
              </h2>
              <p className="text-sm text-[#5A4A57] leading-relaxed">
                Join small, facilitated virtual circles on practice discipline, Natyashastra
                readings, injury-mindful conditioning, and creative reflection—designed with
                clear safety guidelines and shared discussion prompts.
              </p>
            </div>

            <div className="divide-y divide-[#E5DDD2] border-y border-[#E5DDD2]">
              {gatherings.slice(0, 2).map((g) => (
                <div key={g.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-semibold text-[#1E171D]">
                      {g.title}
                    </p>
                    <p className="text-xs text-[#5A4A57]">
                      Host: {g.hostName} · {g.date} · {g.time}
                      {g.isSample ? ' · Sample Gathering' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('gatherings')}
                    className="text-xs font-medium text-[#4A1D3D] hover:underline whitespace-nowrap shrink-0 self-start sm:self-center"
                  >
                    Join Circle →
                  </button>
                </div>
              ))}
            </div>

            <div>
              <button
                type="button"
                onClick={() => navigate('gatherings')}
                className="px-6 py-2.5 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C] transition-colors"
              >
                Explore Virtual Gatherings
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
