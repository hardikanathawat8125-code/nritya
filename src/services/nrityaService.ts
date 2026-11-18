import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  NRITYA_IMAGES,
  SAMPLE_EVENTS,
  SAMPLE_GATHERINGS,
  SAMPLE_MASTERCLASSES,
  SAMPLE_POSTS,
  SAMPLE_USERS,
} from '../data/sampleCatalog';
import {
  ClassFeedback,
  ClassRegistration,
  CommunityPost,
  DanceEvent,
  EventApplication,
  EventFormat,
  EventType,
  ExperienceLevel,
  Gathering,
  GatheringReflection,
  GatheringRegistration,
  Masterclass,
  ModerationReport,
  PostCategory,
  PostComment,
  SavedItem,
  UserNotification,
  UserPrivateInfo,
  UserProfile,
  UserRole,
  VerificationRequest,
} from '../types/nritya';

// Sanitization helpers matching firebase-blueprint.json boundaries
function clampStr(value: string | undefined | null, maxLen: number): string {
  return (value || '').trim().slice(0, maxLen);
}

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function formatTimestamp(ts: any): string {
  if (!ts) return 'Just now';
  try {
    const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
    if (Number.isNaN(date.getTime())) return 'Recent';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}

export function sortByCreatedDesc<T extends { createdAt?: any }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return tb - ta;
  });
}

// ---------------------------------------------------------------------------
// Subscriptions (Public Catalog & User-Scoped)
// ---------------------------------------------------------------------------

export function subscribePublicUsers(
  onData: (users: UserProfile[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, 'users'), where('accountStatus', '==', 'active'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as UserProfile));
    },
    (err) => {
      if (onError) onError(err);
      else handleFirestoreError(err, OperationType.LIST, 'users');
    }
  );
}

export function subscribePublishedPosts(onData: (posts: CommunityPost[]) => void) {
  const q = query(collection(db, 'posts'), where('moderationStatus', '==', 'published'));
  return onSnapshot(
    q,
    (snap) => {
      onData(sortByCreatedDesc(snap.docs.map((d) => d.data() as CommunityPost)));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'posts')
  );
}

export function subscribeMasterclasses(onData: (classes: Masterclass[]) => void) {
  const q = query(
    collection(db, 'masterclasses'),
    where('status', 'in', ['scheduled', 'completed', 'cancelled'])
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Masterclass);
      list.sort((a, b) => a.date.localeCompare(b.date));
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'masterclasses')
  );
}

export function subscribeApprovedEvents(onData: (events: DanceEvent[]) => void) {
  const q = query(collection(db, 'events'), where('moderationStatus', '==', 'approved'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as DanceEvent);
      list.sort((a, b) => a.date.localeCompare(b.date));
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'events')
  );
}

export function subscribeGatherings(onData: (gatherings: Gathering[]) => void) {
  const q = query(
    collection(db, 'gatherings'),
    where('status', 'in', ['upcoming', 'completed', 'cancelled'])
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Gathering);
      list.sort((a, b) => a.date.localeCompare(b.date));
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'gatherings')
  );
}

export function subscribeUserPrivateAccount(
  uid: string,
  onData: (priv: UserPrivateInfo | null) => void
) {
  return onSnapshot(
    doc(db, 'users', uid, 'private', 'account'),
    (snap) => {
      onData(snap.exists() ? (snap.data() as UserPrivateInfo) : null);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/private/account`)
  );
}

export function subscribeUserSavedItems(
  uid: string,
  onData: (items: SavedItem[]) => void
) {
  return onSnapshot(
    collection(db, 'users', uid, 'savedItems'),
    (snap) => {
      onData(sortByCreatedDesc(snap.docs.map((d) => d.data() as SavedItem)));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/savedItems`)
  );
}

export function subscribeUserFollows(
  uid: string,
  onData: (followingIds: string[]) => void
) {
  const q = query(collection(db, 'follows'), where('followerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => (d.data() as { followingId: string }).followingId));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'follows')
  );
}

export function subscribeUserClassRegistrations(
  uid: string,
  onData: (regs: ClassRegistration[]) => void
) {
  const q = query(collection(db, 'classRegistrations'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data() as ClassRegistration)),
    (err) => handleFirestoreError(err, OperationType.LIST, 'classRegistrations')
  );
}

export function subscribeUserEventApplications(
  uid: string,
  onData: (apps: EventApplication[]) => void
) {
  const q = query(collection(db, 'eventApplications'), where('applicantId', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(sortByCreatedDesc(snap.docs.map((d) => d.data() as EventApplication))),
    (err) => handleFirestoreError(err, OperationType.LIST, 'eventApplications')
  );
}

export function subscribeOrganizerEvents(
  uid: string,
  onData: (events: DanceEvent[]) => void
) {
  const q = query(collection(db, 'events'), where('organizerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(sortByCreatedDesc(snap.docs.map((d) => d.data() as DanceEvent))),
    (err) => handleFirestoreError(err, OperationType.LIST, 'events')
  );
}

export function subscribeOrganizerApplications(
  uid: string,
  onData: (apps: EventApplication[]) => void
) {
  const q = query(collection(db, 'eventApplications'), where('organizerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(sortByCreatedDesc(snap.docs.map((d) => d.data() as EventApplication))),
    (err) => handleFirestoreError(err, OperationType.LIST, 'eventApplications')
  );
}

export function subscribeUserGatheringRegistrations(
  uid: string,
  onData: (regs: GatheringRegistration[]) => void
) {
  const q = query(collection(db, 'gatheringRegistrations'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data() as GatheringRegistration)),
    (err) => handleFirestoreError(err, OperationType.LIST, 'gatheringRegistrations')
  );
}

export function subscribeUserNotifications(
  uid: string,
  onData: (notifs: UserNotification[]) => void
) {
  const q = query(collection(db, 'notifications'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(sortByCreatedDesc(snap.docs.map((d) => d.data() as UserNotification))),
    (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
  );
}

export function subscribeUserVerificationRequests(
  uid: string,
  onData: (reqs: VerificationRequest[]) => void
) {
  const q = query(collection(db, 'verificationRequests'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => onData(sortByCreatedDesc(snap.docs.map((d) => d.data() as VerificationRequest))),
    (err) => handleFirestoreError(err, OperationType.LIST, 'verificationRequests')
  );
}

// ---------------------------------------------------------------------------
// User Profile & Private Account Actions
// ---------------------------------------------------------------------------

export async function createOrUpdateUserProfile(params: {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  danceForms: string[];
  experienceLevel: ExperienceLevel;
  bio: string;
  location?: string;
  photoURL?: string;
  portfolioNote?: string;
  repertoireHighlights?: string[];
  privacyShowLocation: boolean;
  privacyAllowFollows: boolean;
  privacyProfileVisibility?: 'public' | 'community';
  emailNotifications?: boolean;
}) {
  const { uid } = params;
  const userRef = doc(db, 'users', uid);
  const privRef = doc(db, 'users', uid, 'private', 'account');

  try {
    const existingSnap = await getDoc(userRef);
    const batch = writeBatch(db);

    const cleanForms = params.danceForms.slice(0, 8).map((f) => clampStr(f, 60)).filter(Boolean);
    const cleanHighlights = (params.repertoireHighlights || [])
      .slice(0, 10)
      .map((h) => clampStr(h, 120))
      .filter(Boolean);

    if (!existingSnap.exists()) {
      batch.set(userRef, {
        uid,
        displayName: clampStr(params.displayName, 80) || 'Classical Dancer',
        role: params.role,
        danceForms: cleanForms.length > 0 ? cleanForms : ['Bharatanatyam'],
        experienceLevel: params.experienceLevel,
        bio: clampStr(params.bio, 1000),
        location: clampStr(params.location, 120),
        photoURL: clampStr(params.photoURL, 500),
        portfolioNote: clampStr(params.portfolioNote, 1200),
        repertoireHighlights: cleanHighlights,
        verificationStatus: 'none',
        isFeatured: false,
        accountStatus: 'active',
        privacyShowLocation: params.privacyShowLocation,
        privacyAllowFollows: params.privacyAllowFollows,
        followersCount: 0,
        followingCount: 0,
        isSample: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(privRef, {
        uid,
        email: clampStr(params.email, 200),
        privacyProfileVisibility: params.privacyProfileVisibility || 'public',
        emailNotifications: params.emailNotifications ?? true,
        blockedUserIds: [],
        updatedAt: serverTimestamp(),
      });

      const welcomeId = makeId('notif');
      batch.set(doc(db, 'notifications', welcomeId), {
        id: welcomeId,
        userId: uid,
        title: 'Welcome to NRITYA',
        message:
          'Your cultural profile is live. Explore weekly sample masterclasses, community reflections, and moderated gatherings.',
        category: 'community',
        read: false,
        createdAt: serverTimestamp(),
      });
    } else {
      batch.update(userRef, {
        displayName: clampStr(params.displayName, 80) || 'Classical Dancer',
        role: params.role,
        danceForms: cleanForms.length > 0 ? cleanForms : ['Bharatanatyam'],
        experienceLevel: params.experienceLevel,
        bio: clampStr(params.bio, 1000),
        location: clampStr(params.location, 120),
        photoURL: clampStr(params.photoURL, 500),
        portfolioNote: clampStr(params.portfolioNote, 1200),
        repertoireHighlights: cleanHighlights,
        privacyShowLocation: params.privacyShowLocation,
        privacyAllowFollows: params.privacyAllowFollows,
        updatedAt: serverTimestamp(),
      });

      const privSnap = await getDoc(privRef);
      if (privSnap.exists()) {
        batch.update(privRef, {
          email: clampStr(params.email, 200),
          privacyProfileVisibility: params.privacyProfileVisibility || 'public',
          emailNotifications: params.emailNotifications ?? true,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(privRef, {
          uid,
          email: clampStr(params.email, 200),
          privacyProfileVisibility: params.privacyProfileVisibility || 'public',
          emailNotifications: params.emailNotifications ?? true,
          blockedUserIds: [],
          updatedAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
  }
}

export async function submitVerificationRequest(params: {
  userId: string;
  userName: string;
  requestedRole: 'guru' | 'organizer';
  lineageOrOrg: string;
  credentialsSummary: string;
  referenceLink?: string;
}) {
  const id = makeId('ver');
  try {
    await setDoc(doc(db, 'verificationRequests', id), {
      id,
      userId: params.userId,
      userName: clampStr(params.userName, 80),
      requestedRole: params.requestedRole,
      lineageOrOrg: clampStr(params.lineageOrOrg, 200),
      credentialsSummary: clampStr(params.credentialsSummary, 1200),
      referenceLink: clampStr(params.referenceLink, 500),
      status: 'pending',
      adminNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `verificationRequests/${id}`);
  }
}

export async function toggleBlockUser(
  currentUid: string,
  targetUid: string,
  currentBlocked: string[]
) {
  const next = currentBlocked.includes(targetUid)
    ? currentBlocked.filter((id) => id !== targetUid)
    : [...currentBlocked, targetUid].slice(0, 100);
  try {
    await updateDoc(doc(db, 'users', currentUid, 'private', 'account'), {
      blockedUserIds: next,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${currentUid}/private/account`);
  }
}

export async function toggleFollowUser(
  followerUid: string,
  targetUid: string,
  isCurrentlyFollowing: boolean
) {
  if (followerUid === targetUid) return;
  const followId = `${followerUid}_${targetUid}`;
  const followRef = doc(db, 'follows', followId);
  const followerRef = doc(db, 'users', followerUid);
  const targetRef = doc(db, 'users', targetUid);

  try {
    const batch = writeBatch(db);
    if (isCurrentlyFollowing) {
      batch.delete(followRef);
      batch.update(targetRef, {
        followersCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
      batch.update(followerRef, {
        followingCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(followRef, {
        followerId: followerUid,
        followingId: targetUid,
        createdAt: serverTimestamp(),
      });
      batch.update(targetRef, {
        followersCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      batch.update(followerRef, {
        followingCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `follows/${followId}`);
  }
}

// ---------------------------------------------------------------------------
// Community Posts, Comments, Likes, Saves
// ---------------------------------------------------------------------------

export async function createCommunityPost(params: {
  author: UserProfile;
  title: string;
  content: string;
  category: PostCategory;
  danceForm: string;
  mediaUrl?: string;
  mediaCaption?: string;
}) {
  const id = makeId('post');
  try {
    await setDoc(doc(db, 'posts', id), {
      id,
      authorId: params.author.uid,
      authorName: clampStr(params.author.displayName, 80),
      authorRole: params.author.role,
      authorPhoto: clampStr(params.author.photoURL, 500),
      authorVerified: params.author.verificationStatus === 'verified',
      title: clampStr(params.title, 160),
      content: clampStr(params.content, 3000),
      category: params.category,
      danceForm: clampStr(params.danceForm, 60),
      mediaUrl: clampStr(params.mediaUrl, 500),
      mediaCaption: clampStr(params.mediaCaption, 200),
      likesCount: 0,
      commentsCount: 0,
      savesCount: 0,
      moderationStatus: 'published',
      isSample: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `posts/${id}`);
  }
}

export async function deleteCommunityPost(postId: string) {
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
  }
}

export async function checkPostLiked(postId: string, uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'posts', postId, 'likes', uid));
    return snap.exists();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `posts/${postId}/likes/${uid}`);
  }
}

export async function toggleLikePost(postId: string, uid: string, currentlyLiked: boolean) {
  const likeRef = doc(db, 'posts', postId, 'likes', uid);
  const postRef = doc(db, 'posts', postId);
  try {
    const batch = writeBatch(db);
    if (currentlyLiked) {
      batch.delete(likeRef);
      batch.update(postRef, {
        likesCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(likeRef, {
        userId: uid,
        postId,
        createdAt: serverTimestamp(),
      });
      batch.update(postRef, {
        likesCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `posts/${postId}/likes/${uid}`);
  }
}

export async function toggleSaveItem(params: {
  uid: string;
  itemType: 'post' | 'masterclass' | 'event' | 'gathering';
  itemId: string;
  title: string;
  subtitle?: string;
  danceForm?: string;
  currentlySaved: boolean;
}) {
  const savedDocId = `${params.itemType}_${params.itemId}`;
  const savedRef = doc(db, 'users', params.uid, 'savedItems', savedDocId);

  try {
    const batch = writeBatch(db);
    if (params.currentlySaved) {
      batch.delete(savedRef);
      if (params.itemType === 'post') {
        batch.update(doc(db, 'posts', params.itemId), {
          savesCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      batch.set(savedRef, {
        id: savedDocId,
        userId: params.uid,
        itemType: params.itemType,
        itemId: params.itemId,
        title: clampStr(params.title, 160),
        subtitle: clampStr(params.subtitle, 160),
        danceForm: clampStr(params.danceForm, 60),
        createdAt: serverTimestamp(),
      });
      if (params.itemType === 'post') {
        batch.update(doc(db, 'posts', params.itemId), {
          savesCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      }
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${params.uid}/savedItems/${savedDocId}`);
  }
}

export function subscribePostComments(
  postId: string,
  onData: (comments: PostComment[]) => void
) {
  return onSnapshot(
    collection(db, 'posts', postId, 'comments'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as PostComment);
      list.sort((a, b) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return ta - tb;
      });
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `posts/${postId}/comments`)
  );
}

export async function addPostComment(params: {
  postId: string;
  author: UserProfile;
  content: string;
}) {
  const commentId = makeId('cmt');
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'posts', params.postId, 'comments', commentId), {
      id: commentId,
      postId: params.postId,
      authorId: params.author.uid,
      authorName: clampStr(params.author.displayName, 80),
      authorPhoto: clampStr(params.author.photoURL, 500),
      content: clampStr(params.content, 1000),
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'posts', params.postId), {
      commentsCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `posts/${params.postId}/comments/${commentId}`);
  }
}

// ---------------------------------------------------------------------------
// Masterclasses
// ---------------------------------------------------------------------------

export async function createMasterclass(params: {
  guru: UserProfile;
  title: string;
  description: string;
  danceForm: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  date: string;
  time: string;
  durationMinutes: number;
  capacity: number;
  meetingLink: string;
  recordingAvailable: boolean;
  recordingNote?: string;
}) {
  const id = makeId('mc');
  try {
    await setDoc(doc(db, 'masterclasses', id), {
      id,
      guruId: params.guru.uid,
      guruName: clampStr(params.guru.displayName, 80),
      guruBio: clampStr(params.guru.bio, 600),
      guruPhoto: clampStr(params.guru.photoURL, 500),
      title: clampStr(params.title, 160),
      description: clampStr(params.description, 2000),
      danceForm: clampStr(params.danceForm, 60),
      difficulty: params.difficulty,
      date: clampStr(params.date, 40),
      time: clampStr(params.time, 40),
      durationMinutes: Math.max(15, Math.min(240, Math.round(params.durationMinutes))),
      capacity: Math.max(1, Math.min(500, Math.round(params.capacity))),
      registeredCount: 0,
      meetingLink: clampStr(params.meetingLink, 500),
      recordingAvailable: params.recordingAvailable,
      recordingNote: clampStr(params.recordingNote, 300),
      coverImage: NRITYA_IMAGES.masterclass,
      status: 'scheduled',
      isSample: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `masterclasses/${id}`);
  }
}

export async function toggleMasterclassRegistration(params: {
  mc: Masterclass;
  user: UserProfile;
  existingReg?: ClassRegistration;
}) {
  const regId = `${params.mc.id}_${params.user.uid}`;
  const regRef = doc(db, 'classRegistrations', regId);
  const mcRef = doc(db, 'masterclasses', params.mc.id);

  try {
    const [regSnap, mcSnap] = await Promise.all([getDoc(regRef), getDoc(mcRef)]);
    if (!mcSnap.exists()) {
      throw new Error('Masterclass record is not yet initialized in the database.');
    }
    const liveMc = mcSnap.data() as Masterclass;
    if (liveMc.status !== 'scheduled') {
      throw new Error('Registrations are only open for scheduled masterclasses.');
    }

    const liveReg = regSnap.exists()
      ? (regSnap.data() as ClassRegistration)
      : params.existingReg;
    const isCurrentlyRegistered = liveReg?.status === 'registered';

    if (!isCurrentlyRegistered && liveMc.registeredCount >= liveMc.capacity) {
      throw new Error('This masterclass has reached full capacity.');
    }

    const safeUserName =
      clampStr(params.user.displayName, 80).length >= 2
        ? clampStr(params.user.displayName, 80)
        : 'Classical Dancer';

    const batch = writeBatch(db);

    if (isCurrentlyRegistered) {
      batch.update(regRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      batch.update(mcRef, {
        registeredCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    } else if (regSnap.exists()) {
      batch.update(regRef, {
        status: 'registered',
        updatedAt: serverTimestamp(),
      });
      batch.update(mcRef, {
        registeredCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(regRef, {
        id: regId,
        classId: params.mc.id,
        guruId: liveMc.guruId,
        userId: params.user.uid,
        userName: safeUserName,
        classTitle: clampStr(liveMc.title, 160),
        danceForm: clampStr(liveMc.danceForm, 60),
        classDate: clampStr(liveMc.date, 40),
        classTime: clampStr(liveMc.time, 40),
        status: 'registered',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.update(mcRef, {
        registeredCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    }

    const notifId = makeId('notif');
    batch.set(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: params.user.uid,
      title: isCurrentlyRegistered ? 'Masterclass Seat Cancelled' : 'Masterclass Seat Confirmed',
      message: `${isCurrentlyRegistered ? 'Cancelled registration for' : 'Confirmed your seat in'} "${clampStr(liveMc.title, 80)}" on ${liveMc.date}.`,
      category: 'class',
      read: false,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes('capacity') ||
        err.message.includes('scheduled') ||
        err.message.includes('initialized'))
    ) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `classRegistrations/${regId}`);
  }
}

export function subscribeClassFeedback(
  classId: string,
  onData: (feedback: ClassFeedback[]) => void
) {
  const q = query(collection(db, 'classFeedback'), where('classId', '==', classId));
  return onSnapshot(
    q,
    (snap) => onData(sortByCreatedDesc(snap.docs.map((d) => d.data() as ClassFeedback))),
    (err) => handleFirestoreError(err, OperationType.LIST, 'classFeedback')
  );
}

export async function submitClassFeedback(params: {
  classId: string;
  user: UserProfile;
  rating: number;
  comment: string;
}) {
  const id = makeId('fb');
  try {
    await setDoc(doc(db, 'classFeedback', id), {
      id,
      classId: params.classId,
      userId: params.user.uid,
      userName: clampStr(params.user.displayName, 80),
      rating: Math.max(1, Math.min(5, Math.round(params.rating))),
      comment: clampStr(params.comment, 1000),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `classFeedback/${id}`);
  }
}

// ---------------------------------------------------------------------------
// Events & Opportunities
// ---------------------------------------------------------------------------

export async function submitDanceEvent(params: {
  organizer: UserProfile;
  isAdmin: boolean;
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
}) {
  const id = makeId('evt');
  try {
    await setDoc(doc(db, 'events', id), {
      id,
      organizerId: params.organizer.uid,
      organizerName: clampStr(params.organizer.displayName, 120),
      title: clampStr(params.title, 160),
      description: clampStr(params.description, 2500),
      eventType: params.eventType,
      danceForm: clampStr(params.danceForm, 60),
      format: params.format,
      date: clampStr(params.date, 40),
      registrationDeadline: clampStr(params.registrationDeadline, 40),
      city: clampStr(params.city, 80),
      state: clampStr(params.state, 80),
      venue: clampStr(params.venue, 200),
      eligibility: clampStr(params.eligibility, 600),
      applicationProcess: clampStr(params.applicationProcess, 800),
      coverImage: NRITYA_IMAGES.eventStage,
      moderationStatus: params.isAdmin ? 'approved' : 'pending',
      applicationsCount: 0,
      isSample: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `events/${id}`);
  }
}

export async function applyForEvent(params: {
  event: DanceEvent;
  applicant: UserProfile;
  applicationType: 'Application' | 'Expression of Interest';
  experienceSummary: string;
}) {
  const appId = `${params.event.id}_${params.applicant.uid}`;
  const appRef = doc(db, 'eventApplications', appId);
  const evtRef = doc(db, 'events', params.event.id);
  const notifId = makeId('notif');

  try {
    const batch = writeBatch(db);
    batch.set(appRef, {
      id: appId,
      eventId: params.event.id,
      eventTitle: clampStr(params.event.title, 160),
      organizerId: params.event.organizerId,
      applicantId: params.applicant.uid,
      applicantName: clampStr(params.applicant.displayName, 80),
      applicantDanceForm: clampStr(params.applicant.danceForms[0] || 'Classical', 60),
      applicationType: params.applicationType,
      experienceSummary: clampStr(params.experienceSummary, 1000),
      status: 'submitted',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.update(evtRef, {
      applicationsCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: params.applicant.uid,
      title: `${params.applicationType} Submitted`,
      message: `Your submission for "${clampStr(params.event.title, 80)}" has been recorded.`,
      category: 'event',
      read: false,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `eventApplications/${appId}`);
  }
}

export async function withdrawEventApplication(app: EventApplication) {
  const appRef = doc(db, 'eventApplications', app.id);
  const evtRef = doc(db, 'events', app.eventId);
  try {
    const batch = writeBatch(db);
    batch.update(appRef, {
      status: 'withdrawn',
      updatedAt: serverTimestamp(),
    });
    batch.update(evtRef, {
      applicationsCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `eventApplications/${app.id}`);
  }
}

export async function updateApplicationStatusByOrganizer(
  appId: string,
  status: 'reviewed' | 'shortlisted'
) {
  try {
    await updateDoc(doc(db, 'eventApplications', appId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `eventApplications/${appId}`);
  }
}

// ---------------------------------------------------------------------------
// Virtual Gatherings
// ---------------------------------------------------------------------------

export async function createGathering(params: {
  host: UserProfile;
  title: string;
  topic: string;
  description: string;
  danceForm?: string;
  date: string;
  time: string;
  durationMinutes: number;
  capacity: number;
  discussionPrompts: string[];
  meetingLink: string;
  safetyGuidelines: string;
}) {
  const id = makeId('gath');
  try {
    await setDoc(doc(db, 'gatherings', id), {
      id,
      hostId: params.host.uid,
      hostName: clampStr(params.host.displayName, 80),
      hostPhoto: clampStr(params.host.photoURL, 500),
      title: clampStr(params.title, 160),
      topic: clampStr(params.topic, 160),
      description: clampStr(params.description, 2000),
      danceForm: clampStr(params.danceForm || 'All Classical Forms', 60),
      date: clampStr(params.date, 40),
      time: clampStr(params.time, 40),
      durationMinutes: Math.max(15, Math.min(240, Math.round(params.durationMinutes))),
      capacity: Math.max(1, Math.min(300, Math.round(params.capacity))),
      registeredCount: 0,
      discussionPrompts: params.discussionPrompts.slice(0, 6).map((p) => clampStr(p, 120)).filter(Boolean),
      meetingLink: clampStr(params.meetingLink, 500),
      safetyGuidelines: clampStr(params.safetyGuidelines, 600),
      coverImage: NRITYA_IMAGES.gatheringStudy,
      status: 'upcoming',
      isSample: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `gatherings/${id}`);
  }
}

export async function toggleGatheringRegistration(params: {
  gathering: Gathering;
  user: UserProfile;
  existingReg?: GatheringRegistration;
}) {
  const regId = `${params.gathering.id}_${params.user.uid}`;
  const regRef = doc(db, 'gatheringRegistrations', regId);
  const gathRef = doc(db, 'gatherings', params.gathering.id);

  try {
    const [regSnap, gathSnap] = await Promise.all([getDoc(regRef), getDoc(gathRef)]);
    if (!gathSnap.exists()) {
      throw new Error('Gathering record is not yet initialized in the database.');
    }
    const liveGath = gathSnap.data() as Gathering;
    if (liveGath.status !== 'upcoming') {
      throw new Error('RSVPs are only open for upcoming gatherings.');
    }

    const liveReg = regSnap.exists()
      ? (regSnap.data() as GatheringRegistration)
      : params.existingReg;
    const isCurrentlyRegistered = liveReg?.status === 'registered';

    if (!isCurrentlyRegistered && liveGath.registeredCount >= liveGath.capacity) {
      throw new Error('This gathering circle has reached full capacity.');
    }

    const safeUserName =
      clampStr(params.user.displayName, 80).length >= 2
        ? clampStr(params.user.displayName, 80)
        : 'Classical Dancer';

    const batch = writeBatch(db);

    if (isCurrentlyRegistered) {
      batch.update(regRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      batch.update(gathRef, {
        registeredCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    } else if (regSnap.exists()) {
      batch.update(regRef, {
        status: 'registered',
        updatedAt: serverTimestamp(),
      });
      batch.update(gathRef, {
        registeredCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(regRef, {
        id: regId,
        gatheringId: params.gathering.id,
        gatheringTitle: clampStr(liveGath.title, 160),
        hostId: liveGath.hostId,
        userId: params.user.uid,
        userName: safeUserName,
        gatheringDate: clampStr(liveGath.date, 40),
        gatheringTime: clampStr(liveGath.time, 40),
        status: 'registered',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.update(gathRef, {
        registeredCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    }

    const notifId = makeId('notif');
    batch.set(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: params.user.uid,
      title: isCurrentlyRegistered ? 'Gathering RSVP Cancelled' : 'Gathering Seat Reserved',
      message: `${isCurrentlyRegistered ? 'Cancelled RSVP for' : 'Reserved spot in'} "${clampStr(liveGath.title, 80)}".`,
      category: 'gathering',
      read: false,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes('capacity') ||
        err.message.includes('upcoming') ||
        err.message.includes('initialized'))
    ) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `gatheringRegistrations/${regId}`);
  }
}

export function subscribeGatheringReflections(
  gatheringId: string,
  onData: (items: GatheringReflection[]) => void
) {
  const q = query(
    collection(db, 'gatheringReflections'),
    where('gatheringId', '==', gatheringId)
  );
  return onSnapshot(
    q,
    (snap) => onData(sortByCreatedDesc(snap.docs.map((d) => d.data() as GatheringReflection))),
    (err) => handleFirestoreError(err, OperationType.LIST, 'gatheringReflections')
  );
}

export async function addGatheringReflection(params: {
  gatheringId: string;
  author: UserProfile;
  reflectionType: 'Reflection' | 'Feedback';
  content: string;
}) {
  const id = makeId('ref');
  try {
    await setDoc(doc(db, 'gatheringReflections', id), {
      id,
      gatheringId: params.gatheringId,
      authorId: params.author.uid,
      authorName: clampStr(params.author.displayName, 80),
      authorPhoto: clampStr(params.author.photoURL, 500),
      reflectionType: params.reflectionType,
      content: clampStr(params.content, 1500),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `gatheringReflections/${id}`);
  }
}

// ---------------------------------------------------------------------------
// Reports & Notifications
// ---------------------------------------------------------------------------

export async function submitReport(params: {
  reporter: UserProfile;
  targetType: 'post' | 'user' | 'event' | 'gathering';
  targetId: string;
  targetTitle?: string;
  reason: string;
  details?: string;
}) {
  const id = makeId('rep');
  try {
    await setDoc(doc(db, 'reports', id), {
      id,
      reporterId: params.reporter.uid,
      reporterName: clampStr(params.reporter.displayName, 80),
      targetType: params.targetType,
      targetId: params.targetId,
      targetTitle: clampStr(params.targetTitle, 160),
      reason: clampStr(params.reason, 120),
      details: clampStr(params.details, 1000),
      status: 'open',
      adminNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `reports/${id}`);
  }
}

export async function markNotificationRead(notifId: string) {
  try {
    await updateDoc(doc(db, 'notifications', notifId), {
      read: true,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `notifications/${notifId}`);
  }
}

// ---------------------------------------------------------------------------
// Admin Operations (Role-Gated in UI & Firestore Rules)
// ---------------------------------------------------------------------------

export function subscribeAdminAllUsers(onData: (users: UserProfile[]) => void) {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => onData(snap.docs.map((d) => d.data() as UserProfile)),
    (err) => handleFirestoreError(err, OperationType.LIST, 'users')
  );
}

export function subscribeAdminVerificationRequests(
  onData: (reqs: VerificationRequest[]) => void
) {
  return onSnapshot(
    collection(db, 'verificationRequests'),
    (snap) => onData(sortByCreatedDesc(snap.docs.map((d) => d.data() as VerificationRequest))),
    (err) => handleFirestoreError(err, OperationType.LIST, 'verificationRequests')
  );
}

export function subscribeAdminAllEvents(onData: (events: DanceEvent[]) => void) {
  return onSnapshot(
    collection(db, 'events'),
    (snap) => onData(sortByCreatedDesc(snap.docs.map((d) => d.data() as DanceEvent))),
    (err) => handleFirestoreError(err, OperationType.LIST, 'events')
  );
}

export function subscribeAdminAllPosts(onData: (posts: CommunityPost[]) => void) {
  return onSnapshot(
    collection(db, 'posts'),
    (snap) => onData(sortByCreatedDesc(snap.docs.map((d) => d.data() as CommunityPost))),
    (err) => handleFirestoreError(err, OperationType.LIST, 'posts')
  );
}

export function subscribeAdminReports(onData: (reports: ModerationReport[]) => void) {
  return onSnapshot(
    collection(db, 'reports'),
    (snap) => onData(sortByCreatedDesc(snap.docs.map((d) => d.data() as ModerationReport))),
    (err) => handleFirestoreError(err, OperationType.LIST, 'reports')
  );
}

export async function adminReviewVerification(
  req: VerificationRequest,
  decision: 'approved' | 'rejected',
  adminNotes: string
) {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'verificationRequests', req.id), {
      status: decision,
      adminNotes: clampStr(adminNotes, 500),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'users', req.userId), {
      verificationStatus: decision === 'approved' ? 'verified' : 'rejected',
      role: decision === 'approved' ? req.requestedRole : 'dancer',
      updatedAt: serverTimestamp(),
    });
    const notifId = makeId('notif');
    batch.set(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: req.userId,
      title:
        decision === 'approved'
          ? 'Verification Request Approved'
          : 'Verification Request Update',
      message:
        decision === 'approved'
          ? `Your ${req.requestedRole} verification on NRITYA has been approved.`
          : `Your verification submission was not approved: ${clampStr(adminNotes, 200) || 'Please review credentials and resubmit.'}`,
      category: 'verification',
      read: false,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `verificationRequests/${req.id}`);
  }
}

export async function adminModerateEvent(
  event: DanceEvent,
  moderationStatus: 'approved' | 'rejected'
) {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'events', event.id), {
      moderationStatus,
      updatedAt: serverTimestamp(),
    });
    const notifId = makeId('notif');
    batch.set(doc(db, 'notifications', notifId), {
      id: notifId,
      userId: event.organizerId,
      title:
        moderationStatus === 'approved'
          ? 'Event Published on NRITYA'
          : 'Event Submission Not Published',
      message: `Your event "${clampStr(event.title, 80)}" is now ${moderationStatus}.`,
      category: 'event',
      read: false,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `events/${event.id}`);
  }
}

export async function adminUpdatePostModeration(
  postId: string,
  moderationStatus: 'published' | 'flagged' | 'hidden'
) {
  try {
    await updateDoc(doc(db, 'posts', postId), {
      moderationStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
  }
}

export async function adminUpdateUserControls(
  uid: string,
  updates: { isFeatured?: boolean; accountStatus?: 'active' | 'suspended' }
) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function adminResolveReport(
  reportId: string,
  status: 'resolved' | 'dismissed',
  adminNotes: string
) {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      adminNotes: clampStr(adminNotes, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
  }
}

export async function ensureSampleInteractiveCatalog(): Promise<{ seeded: boolean }> {
  try {
    const targets: Array<{ ref: ReturnType<typeof doc>; data: Record<string, any> }> = [
      ...SAMPLE_MASTERCLASSES.map((mc) => ({ ref: doc(db, 'masterclasses', mc.id), data: mc })),
      ...SAMPLE_EVENTS.map((ev) => ({ ref: doc(db, 'events', ev.id), data: ev })),
      ...SAMPLE_GATHERINGS.map((g) => ({ ref: doc(db, 'gatherings', g.id), data: g })),
    ];

    const snaps = await Promise.all(targets.map((t) => getDoc(t.ref)));
    const batch = writeBatch(db);
    let pendingCount = 0;

    targets.forEach((t, idx) => {
      if (!snaps[idx].exists()) {
        batch.set(t.ref, {
          ...t.data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pendingCount += 1;
      }
    });

    if (pendingCount === 0) {
      return { seeded: false };
    }
    await batch.commit();
    return { seeded: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'sample_interactive_catalog');
  }
}

export async function seedSampleCatalogToFirestore(force = false): Promise<{ seeded: boolean }> {
  try {
    if (!force) {
      const existingMasterclasses = await getDocs(
        query(collection(db, 'masterclasses'), where('status', 'in', ['scheduled', 'completed', 'cancelled']))
      );
      const existingPosts = await getDocs(
        query(collection(db, 'posts'), where('moderationStatus', '==', 'published'))
      );
      if (!existingMasterclasses.empty && !existingPosts.empty) {
        return { seeded: false };
      }
    }

    // Batch 1: Parent entities (users, posts, masterclasses, events, gatherings)
    // Only write missing documents so live registration/like counters are preserved.
    const parentTargets: Array<{ ref: ReturnType<typeof doc>; data: Record<string, any> }> = [
      ...SAMPLE_USERS.map((u) => ({ ref: doc(db, 'users', u.uid), data: u })),
      ...SAMPLE_POSTS.map((p) => ({ ref: doc(db, 'posts', p.id), data: p })),
      ...SAMPLE_MASTERCLASSES.map((mc) => ({ ref: doc(db, 'masterclasses', mc.id), data: mc })),
      ...SAMPLE_EVENTS.map((ev) => ({ ref: doc(db, 'events', ev.id), data: ev })),
      ...SAMPLE_GATHERINGS.map((g) => ({ ref: doc(db, 'gatherings', g.id), data: g })),
    ];

    const parentSnaps = await Promise.all(parentTargets.map((t) => getDoc(t.ref)));
    const batch1 = writeBatch(db);
    let parentWrites = 0;

    parentTargets.forEach((t, idx) => {
      if (!parentSnaps[idx].exists()) {
        batch1.set(t.ref, {
          ...t.data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        parentWrites += 1;
      }
    });

    if (parentWrites > 0) {
      await batch1.commit();
    }

    // Batch 2: Child/related entities referencing parent posts & gatherings
    // Must commit AFTER Batch 1 because security rules use get()/exists() on parent docs.
    const childTargets: Array<{ ref: ReturnType<typeof doc>; data: Record<string, any> }> = [
      {
        ref: doc(db, 'posts', 'sample_post_1', 'comments', 'sample_cmt_1'),
        data: {
          id: 'sample_cmt_1',
          postId: 'sample_post_1',
          authorId: 'sample_guru_meera',
          authorName: 'Meera Sundaram (Sample Guru)',
          authorPhoto: NRITYA_IMAGES.hero,
          content:
            'Sample comment: Breath alignment before tempo changes is essential across every classical form.',
        },
      },
      {
        ref: doc(db, 'posts', 'sample_post_2', 'comments', 'sample_cmt_2'),
        data: {
          id: 'sample_cmt_2',
          postId: 'sample_post_2',
          authorId: 'sample_dancer_kavya',
          authorName: 'Kavya Pattnaik (Sample Practitioner)',
          authorPhoto: NRITYA_IMAGES.dancerPortrait,
          content:
            'Sample comment: Speaking the sahitya aloud before rehearsing mudras made a tremendous difference in my pallavi work.',
        },
      },
      {
        ref: doc(db, 'gatheringReflections', 'sample_ref_1'),
        data: {
          id: 'sample_ref_1',
          gatheringId: 'sample_gathering_1',
          authorId: 'sample_dancer_kavya',
          authorName: 'Kavya Pattnaik (Sample Practitioner)',
          authorPhoto: NRITYA_IMAGES.dancerPortrait,
          reflectionType: 'Reflection',
          content:
            'Sample reflection: Setting aside twenty quiet minutes for adavu footwork before evening study keeps the body warm without burnout.',
        },
      },
    ];

    const childSnaps = await Promise.all(childTargets.map((t) => getDoc(t.ref)));
    const batch2 = writeBatch(db);
    let childWrites = 0;

    childTargets.forEach((t, idx) => {
      if (!childSnaps[idx].exists()) {
        batch2.set(t.ref, {
          ...t.data,
          createdAt: serverTimestamp(),
        });
        childWrites += 1;
      }
    });

    if (childWrites > 0) {
      await batch2.commit();
    }

    return { seeded: parentWrites > 0 || childWrites > 0 };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'sample_catalog_seed');
  }
}
