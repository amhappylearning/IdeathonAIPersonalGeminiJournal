import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { JournalEntry, UserProfile, MonthlyReminderConfig } from '../types';

// Fallback config if JSON is missing
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || '',
  authDomain: firebaseConfigJson.authDomain || '',
  projectId: firebaseConfigJson.projectId || '',
  storageBucket: firebaseConfigJson.storageBucket || '',
  messagingSenderId: firebaseConfigJson.messagingSenderId || '',
  appId: firebaseConfigJson.appId || '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use the specific firestoreDatabaseId if configured in the applet config
const firestoreDbId = (firebaseConfigJson as any).firestoreDatabaseId;
export const db = firestoreDbId && firestoreDbId !== '(default)'
  ? getFirestore(app, firestoreDbId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
// Workspace Gmail scope for sending monthly strategic journal reminders
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');

// In-memory token cache (never stored in localStorage)
let cachedGoogleAccessToken: string | null = null;

export function setCachedGoogleAccessToken(token: string | null) {
  cachedGoogleAccessToken = token;
}

export function getCachedGoogleAccessToken(): string | null {
  return cachedGoogleAccessToken;
}

export async function signInWithGoogle(): Promise<{ user: FirebaseUser; accessToken?: string }> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    setCachedGoogleAccessToken(credential.accessToken);
  }
  return { user: result.user, accessToken: credential?.accessToken };
}

export function mapFirebaseUser(user: FirebaseUser | null): UserProfile | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || (user.isAnonymous ? 'Guest Explorer' : user.email?.split('@')[0] || 'Journaler'),
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
  };
}

/**
 * Deterministic multi-tenant Firestore path helper
 * Guarantees that ALL data operations strictly live in /users/{userId}/...
 */
export function getUserJournalsCollection(userId: string) {
  if (!userId) throw new Error('Security Error: userId required for Firestore tenant scoping');
  return collection(db, 'users', userId, 'journals');
}

export function getUserJournalDoc(userId: string, journalId: string) {
  if (!userId || !journalId) throw new Error('Security Error: userId & journalId required');
  return doc(db, 'users', userId, 'journals', journalId);
}

/**
 * Real-time subscription to user's private journals
 */
export function subscribeToUserJournals(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const journalsRef = getUserJournalsCollection(userId);
  const q = query(journalsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        entries.push({
          id: docSnap.id,
          userId,
          title: data.title || 'Untitled Reflection',
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          persona: data.persona || 'reflective',
          messages: data.messages || [],
          synthesis: data.synthesis || undefined,
          isVaultEncrypted: data.isVaultEncrypted || false,
          encryptedPayload: data.encryptedPayload || undefined,
          tags: data.tags || [],
          favorite: data.favorite || false,
          wordCount: data.wordCount || 0,
          actionItemsCompleted: data.actionItemsCompleted || {},
        });
      });
      onUpdate(entries);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Persist or update a user journal in Cloud Firestore
 */
export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  if (!entry.userId) throw new Error('Unauthorized: User ID is required');
  const docRef = getUserJournalDoc(entry.userId, entry.id);

  // Compute word count
  const wordCount = entry.messages.reduce(
    (acc, m) => acc + (m.content ? m.content.trim().split(/\s+/).length : 0),
    0
  );

  const cleanData: any = {
    id: entry.id,
    userId: entry.userId,
    title: entry.title || 'Untitled Reflection',
    createdAt: entry.createdAt || Date.now(),
    updatedAt: Date.now(),
    persona: entry.persona || 'reflective',
    messages: entry.messages || [],
    tags: entry.tags || [],
    favorite: entry.favorite || false,
    isVaultEncrypted: Boolean(entry.isVaultEncrypted),
    wordCount,
    lastSavedAt: serverTimestamp(),
  };

  if (entry.synthesis) {
    cleanData.synthesis = entry.synthesis;
  }
  if (entry.encryptedPayload) {
    cleanData.encryptedPayload = entry.encryptedPayload;
  }
  if (entry.actionItemsCompleted) {
    cleanData.actionItemsCompleted = entry.actionItemsCompleted;
  }

  await setDoc(docRef, cleanData, { merge: true });
}

/**
 * Delete a user journal in Cloud Firestore
 */
export async function deleteJournalEntry(userId: string, journalId: string): Promise<void> {
  if (!userId || !journalId) throw new Error('Unauthorized');
  const docRef = getUserJournalDoc(userId, journalId);
  await deleteDoc(docRef);
}

/**
 * Toggle favorite status
 */
export async function toggleFavoriteJournal(userId: string, journalId: string, currentStatus: boolean): Promise<void> {
  const docRef = getUserJournalDoc(userId, journalId);
  await setDoc(docRef, { favorite: !currentStatus, updatedAt: Date.now() }, { merge: true });
}

/**
 * Get user's monthly reminder configuration
 * Falls back seamlessly to localStorage if Firestore is unavailable or client is offline
 */
export async function getReminderConfig(userId: string): Promise<MonthlyReminderConfig | null> {
  if (!userId) return null;

  // Retrieve cached local config first
  let localConfig: MonthlyReminderConfig | null = null;
  try {
    const raw = localStorage.getItem(`reminder_config_${userId}`) || localStorage.getItem('local_monthly_reminder_config');
    if (raw) {
      localConfig = JSON.parse(raw);
    }
  } catch {}

  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists() && snap.data()?.monthlyReminder) {
      const remoteConfig = snap.data().monthlyReminder as MonthlyReminderConfig;
      try {
        localStorage.setItem(`reminder_config_${userId}`, JSON.stringify(remoteConfig));
      } catch {}
      return remoteConfig;
    }
    return localConfig;
  } catch (err: any) {
    // Graceful fallback for offline client or permission boundary
    console.warn('Notice: operating in resilient offline mode for reminder preferences:', err?.message || err);
    return localConfig;
  }
}

/**
 * Save user's monthly reminder configuration
 * Saves to localStorage immediately and attempts Firestore sync
 */
export async function saveReminderConfig(userId: string, config: MonthlyReminderConfig): Promise<void> {
  if (!userId) throw new Error('Unauthorized');

  // Save to local storage immediately
  try {
    localStorage.setItem(`reminder_config_${userId}`, JSON.stringify(config));
    localStorage.setItem('local_monthly_reminder_config', JSON.stringify(config));
  } catch {}

  if (userId.startsWith('local-guest-') || userId === 'guest-local') {
    return;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { monthlyReminder: config, updatedAt: Date.now() }, { merge: true });
  } catch (err: any) {
    console.warn('Notice: Reminder saved locally. Firestore sync will occur when connection resumes:', err?.message || err);
  }
}

export async function signOutUser(): Promise<void> {
  setCachedGoogleAccessToken(null);
  await signOut(auth);
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
};
