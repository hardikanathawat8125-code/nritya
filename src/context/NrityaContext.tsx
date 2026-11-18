import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, testConnection } from '../firebase';
import {
  SAMPLE_EVENTS,
  SAMPLE_GATHERINGS,
  SAMPLE_MASTERCLASSES,
  SAMPLE_POSTS,
  SAMPLE_USERS,
} from '../data/sampleCatalog';
import {
  seedSampleCatalogToFirestore,
  subscribeApprovedEvents,
  subscribeGatherings,
  subscribeMasterclasses,
  subscribePublicUsers,
  subscribePublishedPosts,
  subscribeUserClassRegistrations,
  subscribeUserEventApplications,
  subscribeUserFollows,
  subscribeUserGatheringRegistrations,
  subscribeUserNotifications,
  subscribeUserPrivateAccount,
  subscribeUserSavedItems,
  subscribeUserVerificationRequests,
} from '../services/nrityaService';
import {
  AppPage,
  BOOTSTRAPPED_ADMIN_EMAIL,
  ClassRegistration,
  CommunityPost,
  DanceEvent,
  EventApplication,
  Gathering,
  GatheringRegistration,
  Masterclass,
  SavedItem,
  UserNotification,
  UserPrivateInfo,
  UserProfile,
  VerificationRequest,
} from '../types/nritya';

interface ToastMessage {
  id: string;
  text: string;
  tone: 'success' | 'error' | 'info';
}

interface NrityaContextValue {
  page: AppPage;
  navigate: (next: AppPage) => void;
  firebaseUser: FirebaseUser | null;
  authReady: boolean;
  isAdmin: boolean;
  isOffline: boolean;
  loadingCatalog: boolean;
  usingPreviewFallback: boolean;
  currentUserProfile: UserProfile | null;
  profileNeedsOnboarding: boolean;
  privateAccount: UserPrivateInfo | null;
  users: UserProfile[];
  posts: CommunityPost[];
  masterclasses: Masterclass[];
  events: DanceEvent[];
  gatherings: Gathering[];
  savedItems: SavedItem[];
  followingIds: string[];
  classRegistrations: ClassRegistration[];
  eventApplications: EventApplication[];
  gatheringRegistrations: GatheringRegistration[];
  notifications: UserNotification[];
  verificationRequests: VerificationRequest[];
  selectedDancerUid: string | null;
  setSelectedDancerUid: (uid: string | null) => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  showToast: (text: string, tone?: 'success' | 'error' | 'info') => void;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  openAuthModal: boolean;
  setOpenAuthModal: (open: boolean) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
}

const NrityaContext = createContext<NrityaContextValue | null>(null);

export const NrityaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [page, setPage] = useState<AppPage>('home');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdminDoc, setIsAdminDoc] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [liveUsers, setLiveUsers] = useState<UserProfile[]>([]);
  const [livePosts, setLivePosts] = useState<CommunityPost[]>([]);
  const [liveMasterclasses, setLiveMasterclasses] = useState<Masterclass[]>([]);
  const [liveEvents, setLiveEvents] = useState<DanceEvent[]>([]);
  const [liveGatherings, setLiveGatherings] = useState<Gathering[]>([]);

  const [privateAccount, setPrivateAccount] = useState<UserPrivateInfo | null>(null);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [classRegistrations, setClassRegistrations] = useState<ClassRegistration[]>([]);
  const [eventApplications, setEventApplications] = useState<EventApplication[]>([]);
  const [gatheringRegistrations, setGatheringRegistrations] = useState<GatheringRegistration[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);

  const [selectedDancerUid, setSelectedDancerUid] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const showToast = (text: string, tone: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigate = (next: AppPage) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Boot connectivity check + Auth listener
  useEffect(() => {
    testConnection().then((res) => {
      if (res.offline) setIsOffline(true);
    });

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);

      if (user) {
        setOpenAuthModal(false);
        const isBootAdmin =
          user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() &&
          user.emailVerified;

        if (isBootAdmin) {
          setIsAdminDoc(true);
          seedSampleCatalogToFirestore(false).catch((err) => {
            console.warn('Sample catalog auto-seed note:', err);
          });
        } else {
          try {
            const adminSnap = await getDoc(doc(db, 'admins', user.uid));
            const adminExists = adminSnap.exists();
            setIsAdminDoc(adminExists);
            if (adminExists) {
              seedSampleCatalogToFirestore(false).catch((err) => {
                console.warn('Sample catalog auto-seed note:', err);
              });
            }
          } catch {
            setIsAdminDoc(false);
          }
        }
      } else {
        setIsAdminDoc(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // Public catalog streams (work both pre-auth and post-auth)
  useEffect(() => {
    const loadedKeys = new Set<string>();
    const markLoaded = (key: string) => {
      loadedKeys.add(key);
      if (loadedKeys.size >= 5) setLoadingCatalog(false);
    };

    const u1 = subscribePublicUsers(
      (data) => {
        setLiveUsers(data);
        markLoaded('users');
      },
      () => markLoaded('users')
    );
    const u2 = subscribePublishedPosts((data) => {
      setLivePosts(data);
      markLoaded('posts');
    });
    const u3 = subscribeMasterclasses((data) => {
      setLiveMasterclasses(data);
      markLoaded('masterclasses');
    });
    const u4 = subscribeApprovedEvents((data) => {
      setLiveEvents(data);
      markLoaded('events');
    });
    const u5 = subscribeGatherings((data) => {
      setLiveGatherings(data);
      markLoaded('gatherings');
    });

    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
    };
  }, []);

  // User-scoped streams
  useEffect(() => {
    if (!authReady || !firebaseUser) {
      setPrivateAccount(null);
      setSavedItems([]);
      setFollowingIds([]);
      setClassRegistrations([]);
      setEventApplications([]);
      setGatheringRegistrations([]);
      setNotifications([]);
      setVerificationRequests([]);
      return;
    }

    const uid = firebaseUser.uid;
    const unsubs = [
      subscribeUserPrivateAccount(uid, setPrivateAccount),
      subscribeUserSavedItems(uid, setSavedItems),
      subscribeUserFollows(uid, setFollowingIds),
      subscribeUserClassRegistrations(uid, setClassRegistrations),
      subscribeUserEventApplications(uid, setEventApplications),
      subscribeUserGatheringRegistrations(uid, setGatheringRegistrations),
      subscribeUserNotifications(uid, setNotifications),
      subscribeUserVerificationRequests(uid, setVerificationRequests),
    ];

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authReady, firebaseUser]);

  const currentUserProfile = useMemo(() => {
    if (!firebaseUser) return null;
    return liveUsers.find((u) => u.uid === firebaseUser.uid) || null;
  }, [firebaseUser, liveUsers]);

  const profileNeedsOnboarding = Boolean(
    authReady && firebaseUser && !loadingCatalog && !currentUserProfile
  );

  // If Firestore catalog hasn't been seeded by an admin yet, display clearly-labelled read-only sample previews
  const usingPreviewFallback =
    !loadingCatalog &&
    liveMasterclasses.length === 0 &&
    liveEvents.length === 0 &&
    liveGatherings.length === 0;

  const users = useMemo(() => {
    const hasSampleItems =
      usingPreviewFallback ||
      liveMasterclasses.some((m) => m.isSample) ||
      liveEvents.some((e) => e.isSample) ||
      liveGatherings.some((g) => g.isSample) ||
      livePosts.some((p) => p.isSample);

    if (liveUsers.length > 0 && !hasSampleItems) return liveUsers;

    const sampleFallback = SAMPLE_USERS.map((u) => ({
      ...u,
      createdAt: null,
      updatedAt: null,
    })) as UserProfile[];
    const merged = [...liveUsers];
    for (const s of sampleFallback) {
      if (!merged.some((u) => u.uid === s.uid)) merged.push(s);
    }
    return merged;
  }, [liveUsers, usingPreviewFallback, liveMasterclasses, liveEvents, liveGatherings, livePosts]);

  const posts = useMemo(() => {
    if (!usingPreviewFallback || livePosts.length > 0) return livePosts;
    return SAMPLE_POSTS.map((p) => ({ ...p, createdAt: null, updatedAt: null })) as CommunityPost[];
  }, [livePosts, usingPreviewFallback]);

  const masterclasses = useMemo(() => {
    if (!usingPreviewFallback) return liveMasterclasses;
    return SAMPLE_MASTERCLASSES.map((m) => ({
      ...m,
      createdAt: null,
      updatedAt: null,
    })) as Masterclass[];
  }, [liveMasterclasses, usingPreviewFallback]);

  const events = useMemo(() => {
    if (!usingPreviewFallback) return liveEvents;
    return SAMPLE_EVENTS.map((e) => ({ ...e, createdAt: null, updatedAt: null })) as DanceEvent[];
  }, [liveEvents, usingPreviewFallback]);

  const gatherings = useMemo(() => {
    if (!usingPreviewFallback) return liveGatherings;
    return SAMPLE_GATHERINGS.map((g) => ({
      ...g,
      createdAt: null,
      updatedAt: null,
    })) as Gathering[];
  }, [liveGatherings, usingPreviewFallback]);

  const isAdmin = useMemo(() => {
    if (!firebaseUser) return false;
    const bootMatch =
      firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() &&
      firebaseUser.emailVerified;
    return bootMatch || isAdminDoc;
  }, [firebaseUser, isAdminDoc]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Signed in with Google.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Sign-in was cancelled or failed.', 'error');
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setPage('home');
      showToast('Signed out of NRITYA.', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to sign out.', 'error');
    }
  };

  return (
    <NrityaContext.Provider
      value={{
        page,
        navigate,
        firebaseUser,
        authReady,
        isAdmin,
        isOffline,
        loadingCatalog,
        usingPreviewFallback,
        currentUserProfile,
        profileNeedsOnboarding,
        privateAccount,
        users,
        posts,
        masterclasses,
        events,
        gatherings,
        savedItems,
        followingIds,
        classRegistrations,
        eventApplications,
        gatheringRegistrations,
        notifications,
        verificationRequests,
        selectedDancerUid,
        setSelectedDancerUid,
        signInWithGoogle,
        signOutUser,
        showToast,
        toasts,
        dismissToast,
        openAuthModal,
        setOpenAuthModal,
        globalSearchQuery,
        setGlobalSearchQuery,
      }}
    >
      {children}
    </NrityaContext.Provider>
  );
};

export function useNritya() {
  const ctx = useContext(NrityaContext);
  if (!ctx) throw new Error('useNritya must be used inside NrityaProvider');
  return ctx;
}
