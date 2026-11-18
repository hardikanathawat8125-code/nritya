export type UserRole = 'dancer' | 'guru' | 'organizer' | 'enthusiast';

export type ExperienceLevel =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Senior Practitioner'
  | 'Guru / Acharya';

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export type DanceForm =
  | 'Bharatanatyam'
  | 'Kathak'
  | 'Odissi'
  | 'Kuchipudi'
  | 'Kathakali'
  | 'Mohiniyattam'
  | 'Manipuri'
  | 'Sattriya';

export const CLASSICAL_DANCE_FORMS: DanceForm[] = [
  'Bharatanatyam',
  'Kathak',
  'Odissi',
  'Kuchipudi',
  'Kathakali',
  'Mohiniyattam',
  'Manipuri',
  'Sattriya',
];

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Senior Practitioner',
  'Guru / Acharya',
];

export const POST_CATEGORIES = [
  'Dance Journey',
  'Achievement',
  'Practice Reflection',
  'Abhinaya & Technique',
  'Question',
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const EVENT_TYPES = [
  'Performance',
  'Competition',
  'Audition',
  'Festival',
  'Workshop',
  'Scholarship',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type EventFormat = 'In-Person' | 'Online' | 'Hybrid';

export interface UserProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  danceForms: string[];
  experienceLevel: ExperienceLevel;
  bio: string;
  location?: string;
  photoURL?: string;
  portfolioNote?: string;
  repertoireHighlights?: string[];
  verificationStatus: VerificationStatus;
  isFeatured: boolean;
  accountStatus: 'active' | 'suspended';
  privacyShowLocation: boolean;
  privacyAllowFollows: boolean;
  followersCount: number;
  followingCount: number;
  isSample: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface UserPrivateInfo {
  uid: string;
  email: string;
  privacyProfileVisibility: 'public' | 'community';
  emailNotifications: boolean;
  blockedUserIds: string[];
  updatedAt: any;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  requestedRole: 'guru' | 'organizer';
  lineageOrOrg: string;
  credentialsSummary: string;
  referenceLink?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorPhoto?: string;
  authorVerified: boolean;
  title: string;
  content: string;
  category: PostCategory;
  danceForm: string;
  mediaUrl?: string;
  mediaCaption?: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  moderationStatus: 'published' | 'flagged' | 'hidden';
  isSample: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: any;
}

export interface SavedItem {
  id: string;
  userId: string;
  itemType: 'post' | 'masterclass' | 'event' | 'gathering';
  itemId: string;
  title: string;
  subtitle?: string;
  danceForm?: string;
  createdAt: any;
}

export interface Masterclass {
  id: string;
  guruId: string;
  guruName: string;
  guruBio?: string;
  guruPhoto?: string;
  title: string;
  description: string;
  danceForm: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  date: string;
  time: string;
  durationMinutes: number;
  capacity: number;
  registeredCount: number;
  meetingLink: string;
  recordingAvailable: boolean;
  recordingNote?: string;
  coverImage?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  isSample: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface ClassRegistration {
  id: string;
  classId: string;
  guruId: string;
  userId: string;
  userName: string;
  classTitle: string;
  danceForm?: string;
  classDate?: string;
  classTime?: string;
  status: 'registered' | 'cancelled';
  createdAt: any;
  updatedAt: any;
}

export interface ClassFeedback {
  id: string;
  classId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface DanceEvent {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  description: string;
  eventType: EventType;
  danceForm: string;
  format: EventFormat;
  date: string;
  registrationDeadline: string;
  city?: string;
  state?: string;
  venue?: string;
  eligibility: string;
  applicationProcess: string;
  coverImage?: string;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  applicationsCount: number;
  isSample: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface EventApplication {
  id: string;
  eventId: string;
  eventTitle: string;
  organizerId: string;
  applicantId: string;
  applicantName: string;
  applicantDanceForm?: string;
  applicationType: 'Application' | 'Expression of Interest';
  experienceSummary: string;
  status: 'submitted' | 'reviewed' | 'shortlisted' | 'withdrawn';
  createdAt: any;
  updatedAt: any;
}

export interface Gathering {
  id: string;
  hostId: string;
  hostName: string;
  hostPhoto?: string;
  title: string;
  topic: string;
  description: string;
  danceForm?: string;
  date: string;
  time: string;
  durationMinutes: number;
  capacity: number;
  registeredCount: number;
  discussionPrompts: string[];
  meetingLink: string;
  safetyGuidelines: string;
  coverImage?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  isSample: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface GatheringRegistration {
  id: string;
  gatheringId: string;
  gatheringTitle: string;
  hostId: string;
  userId: string;
  userName: string;
  gatheringDate?: string;
  gatheringTime?: string;
  status: 'registered' | 'cancelled';
  createdAt: any;
  updatedAt: any;
}

export interface GatheringReflection {
  id: string;
  gatheringId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  reflectionType: 'Reflection' | 'Feedback';
  content: string;
  createdAt: any;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'post' | 'user' | 'event' | 'gathering';
  targetId: string;
  targetTitle?: string;
  reason: string;
  details?: string;
  status: 'open' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: 'class' | 'event' | 'gathering' | 'community' | 'verification';
  read: boolean;
  createdAt: any;
}

export type AppPage =
  | 'home'
  | 'community'
  | 'masterclasses'
  | 'events'
  | 'gatherings'
  | 'explore'
  | 'dashboard'
  | 'profile'
  | 'admin'
  | 'search';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'hardikanathawat8125@gmail.com';
