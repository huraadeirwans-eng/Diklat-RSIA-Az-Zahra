import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { Training } from '../types/training';
import { AppAccount } from '../types/auth';
import { EmployeeItem } from '../types/employee';
import { PrintSigneeConfig } from '../utils/printConfigManager';
import { DEFAULT_FIREBASE_CONFIG } from '../config/firebaseConfig';
import appletConfig from '../../firebase-applet-config.json';

/**
 * Operation types for standardized Firestore error reporting
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

/**
 * Recursively removes any undefined values to ensure Firestore setDoc/writeBatch
 * operations never fail due to unsupported undefined fields.
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Firebase Configuration for RSIA AZ Diklat & Preceptor Academy
 * Connected directly to Cloud Firestore database: ai-studio-kalenderpelatiha-170cc39b-8ea5-438a-b8f7-fec1a6eb47d7
 * under Google Cloud project: melodic-pattern-dpthm
 */
export const firebaseConfig = {
  apiKey: appletConfig.apiKey || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: appletConfig.authDomain || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: appletConfig.projectId || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: appletConfig.storageBucket || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: appletConfig.appId || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: appletConfig.measurementId || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID) || DEFAULT_FIREBASE_CONFIG.measurementId || '',
  firestoreDatabaseId: appletConfig.firestoreDatabaseId || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_DATABASE_ID) || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId
};

// Initialize Firebase App safely as a singleton
let appInstance: ReturnType<typeof initializeApp> | null = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;

try {
  appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  // Pass explicit database ID for enterprise/custom named instances, or default for standard instances
  const customDbId = firebaseConfig.firestoreDatabaseId;
  dbInstance = customDbId && customDbId !== '(default)'
    ? getFirestore(appInstance, customDbId)
    : getFirestore(appInstance);
} catch (e) {
  console.warn('Firebase initialization warning (running in offline fallback mode):', e);
}

export const app = appInstance as ReturnType<typeof initializeApp>;
export const db = dbInstance as ReturnType<typeof getFirestore>;

// Validate Connection to Firestore at startup
export async function testConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return false;
  }
}

// Trigger initial health check asynchronously
if (typeof window !== 'undefined') {
  testConnection().catch(() => {});
}

// Initialize Analytics safely (guarded against SSR or adblockers)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported && app) {
        analytics = getAnalytics(app);
      }
    })
    .catch((err) => {
      console.warn('Firebase Analytics not supported or blocked:', err);
    });
}

// Collection References
export const TRAININGS_COLLECTION = 'trainings';
export const ACCOUNTS_COLLECTION = 'accounts';
export const EMPLOYEES_COLLECTION = 'employees';
export const SETTINGS_COLLECTION = 'settings';
export const AUDIT_COLLECTION = 'audit_logs';
export const CUSTOM_UNITS_DOC = 'custom_units';
export const PRINT_SIGNEE_DOC = 'print_signee_config';

const DELETED_TRAININGS_KEY = 'aerotraining_deleted_ids_v1';

export function getDeletedTrainingIds(): Set<string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(DELETED_TRAININGS_KEY) : null;
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // ignore
  }
  return new Set();
}

export function recordDeletedTrainingId(id: string): void {
  try {
    const set = getDeletedTrainingIds();
    set.add(id);
    localStorage.setItem(DELETED_TRAININGS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

/**
 * Real training entered by the user to use when cloud is fresh
 */
export const USER_REAL_TRAINING: Training = {
  id: 'trn-rsiaplg-6260-2026',
  code: 'RSIAPLG-6260-2026',
  title: 'Workshop 8 Non-Invasive Ventilation Support for Critically III Neonate to Avoid Intubation Angkatan 1',
  category: 'Teknologi & Digital',
  scope: 'Eksternal',
  date: '2026-10-24',
  startTime: '08:00',
  endTime: '16:00',
  locationType: 'Offline',
  venue: 'Auditorium Ruang Diklat Lt. 3',
  instructor: {
    name: 'dr. Indrayadi, Sp.A., K.',
    title: 'Konsultan Neonatologi / Dokter Spesialis Anak',
    organization: 'RSIA AZ & Neonatal Intensive Care Division'
  },
  capacity: 30,
  status: 'Terjadwal',
  description: 'Workshop klinis komprehensif penatalaksanaan ventilasi non-invasif pada neonatus kritis guna mencegah intubasi trakea serta komplikasi pernapasan berat.',
  learningObjectives: [
    'Prinsip non-invasive ventilation (NIV) pada neonatus kritis',
    'Pengaturan parameter CPAP, NIPPV, dan HFNC',
    'Monitoring klinis dan pencegahan kegagalan ekstubasi'
  ],
  sksHours: 8,
  colorTheme: 'cyan',
  certificateUrl: '/assets/images/certificate_sample_diklat.svg',
  certificateFileName: 'Sertifikat_Workshop_8_NIV_Neonatus.svg',
  posterUrl: '/assets/images/poster_sample_diklat.svg',
  posterFileName: 'Poster_Workshop_8_NIV_Neonatus.svg',
  targetUnits: [
    'Intensive Care'
  ],
  participants: [
    {
      id: 'p-niv-001',
      name: 'Ns. Siti Fatimah, S.Kep',
      nip: '19920815 201703 2 004',
      unitKerja: 'Intensive Care',
      jabatan: 'Perawat Primer NICU / PICU',
      email: 'siti.fatimah@rsia-az.co.id',
      phone: '+62 812-7788-9901',
      statusKehadiran: 'Hadir',
      registeredAt: '2026-10-18'
    }
  ]
};

/**
 * Firestore Real-time Subscriptions & CRUD with Cross-Device Cloud Persistence
 */
let initialCloudChecked = false;

export function subscribeToTrainings(
  onUpdate: (trainings: Training[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    return () => {};
  }
  try {
    const colRef = collection(db, TRAININGS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          initialCloudChecked = true;
          const remoteList: Training[] = [];
          snapshot.forEach((docSnap) => {
            remoteList.push({ ...(docSnap.data() as Training), id: docSnap.id });
          });
          onUpdate(remoteList);
          // Mark system as initialized so subsequent devices never resurrect demo data
          const metaDocRef = doc(db, SETTINGS_COLLECTION, 'system_seed_status');
          setDoc(metaDocRef, { trainingsSeeded: true }, { merge: true }).catch(() => {});
        } else {
          // If cloud collection is completely empty:
          if (!initialCloudChecked) {
            initialCloudChecked = true;
            // Verify if cloud was already initialized before deciding to seed
            const metaDocRef = doc(db, SETTINGS_COLLECTION, 'system_seed_status');
            getDocFromServer(metaDocRef)
              .then((snap) => {
                if (snap.exists() && snap.data()?.trainingsSeeded) {
                  // Legitimate empty state: user cleared all trainings
                  onUpdate([]);
                } else {
                  // Clean first-time initialization of brand new database
                  bulkUploadTrainingsToFirebase([USER_REAL_TRAINING]).catch(() => {});
                  setDoc(metaDocRef, { trainingsSeeded: true }, { merge: true }).catch(() => {});
                  onUpdate([USER_REAL_TRAINING]);
                }
              })
              .catch(() => {
                onUpdate([]);
              });
          } else {
            // Legitimate remote deletion of all records
            onUpdate([]);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, TRAININGS_COLLECTION);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, TRAININGS_COLLECTION);
    if (onError) onError(err);
    return () => {};
  }
}

export async function saveTrainingToFirebase(training: Training): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, TRAININGS_COLLECTION, training.id);
    const cleaned = cleanFirestoreData(training);
    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${TRAININGS_COLLECTION}/${training.id}`);
    return false;
  }
}

export async function deleteTrainingFromFirebase(trainingId: string): Promise<boolean> {
  recordDeletedTrainingId(trainingId);
  if (!db) return false;
  try {
    const docRef = doc(db, TRAININGS_COLLECTION, trainingId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${TRAININGS_COLLECTION}/${trainingId}`);
    return false;
  }
}

export async function bulkDeleteTrainingsFromFirebase(trainingIds: string[]): Promise<boolean> {
  trainingIds.forEach((id) => recordDeletedTrainingId(id));
  if (!db || trainingIds.length === 0) return true;
  try {
    const batch = writeBatch(db);
    trainingIds.forEach((id) => {
      const ref = doc(db, TRAININGS_COLLECTION, id);
      batch.delete(ref);
    });
    await batch.commit();
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, TRAININGS_COLLECTION);
    return false;
  }
}

export async function bulkUploadTrainingsToFirebase(trainings: Training[]): Promise<boolean> {
  if (!db || trainings.length === 0) return true;
  try {
    const BATCH_LIMIT = 400;
    for (let i = 0; i < trainings.length; i += BATCH_LIMIT) {
      const chunk = trainings.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      chunk.forEach((t) => {
        const ref = doc(db, TRAININGS_COLLECTION, t.id);
        const cleaned = cleanFirestoreData(t);
        batch.set(ref, cleaned, { merge: true });
      });
      await batch.commit();
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, TRAININGS_COLLECTION);
    return false;
  }
}

export const DELETED_ACCOUNTS_DOC = 'deleted_accounts';
export const DELETED_ACCOUNTS_KEY = 'rsia_diklat_deleted_accounts_v1';

export function getDeletedAccountTombstones(): { ids: Set<string>; usernames: Set<string> } {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(DELETED_ACCOUNTS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ids: new Set(Array.isArray(parsed?.ids) ? parsed.ids : []),
        usernames: new Set(
          Array.isArray(parsed?.usernames) 
            ? parsed.usernames.map((u: string) => String(u).trim().toLowerCase()) 
            : []
        )
      };
    }
  } catch {
    // ignore
  }
  return { ids: new Set(), usernames: new Set() };
}

export function saveDeletedAccountTombstonesLocally(ids: Set<string>, usernames: Set<string>): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        DELETED_ACCOUNTS_KEY,
        JSON.stringify({
          ids: Array.from(ids),
          usernames: Array.from(usernames)
        })
      );
    }
  } catch {
    // ignore
  }
}

export async function markAccountsAsDeletedInFirebase(ids: string[], usernames: string[] = []): Promise<void> {
  const current = getDeletedAccountTombstones();
  ids.forEach((id) => {
    if (id) current.ids.add(id);
  });
  usernames.forEach((u) => {
    if (u) current.usernames.add(String(u).trim().toLowerCase());
  });
  saveDeletedAccountTombstonesLocally(current.ids, current.usernames);

  if (!db) return;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, DELETED_ACCOUNTS_DOC);
    await setDoc(
      docRef,
      {
        ids: Array.from(current.ids),
        usernames: Array.from(current.usernames),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${SETTINGS_COLLECTION}/${DELETED_ACCOUNTS_DOC}`);
  }
}

export async function removeAccountsFromDeletedTombstones(ids: string[], usernames: string[] = []): Promise<void> {
  const current = getDeletedAccountTombstones();
  ids.forEach((id) => current.ids.delete(id));
  usernames.forEach((u) => current.usernames.delete(String(u).trim().toLowerCase()));
  saveDeletedAccountTombstonesLocally(current.ids, current.usernames);

  if (!db) return;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, DELETED_ACCOUNTS_DOC);
    await setDoc(
      docRef,
      {
        ids: Array.from(current.ids),
        usernames: Array.from(current.usernames),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${SETTINGS_COLLECTION}/${DELETED_ACCOUNTS_DOC}`);
  }
}

export async function clearDeletedAccountsTracking(): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DELETED_ACCOUNTS_KEY);
    }
    if (db) {
      const docRef = doc(db, SETTINGS_COLLECTION, DELETED_ACCOUNTS_DOC);
      await deleteDoc(docRef);
    }
  } catch {
    // ignore
  }
}

/**
 * Firestore Account Management with Real-Time Multi-Device Persistence
 */
let initialAccountsCloudChecked = false;

export function subscribeToAccounts(
  onUpdate: (accounts: AppAccount[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    return () => {};
  }
  try {
    // 1. Subscribe to remote tombstones so all devices immediately know about deleted accounts
    const tombstoneDocRef = doc(db, SETTINGS_COLLECTION, DELETED_ACCOUNTS_DOC);
    const unsubTombstone = onSnapshot(
      tombstoneDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const cloudIds: string[] = Array.isArray(data?.ids) ? data.ids : [];
          const cloudUsers: string[] = Array.isArray(data?.usernames) ? data.usernames : [];
          const current = getDeletedAccountTombstones();
          cloudIds.forEach((id) => current.ids.add(id));
          cloudUsers.forEach((u) => current.usernames.add(String(u).trim().toLowerCase()));
          saveDeletedAccountTombstonesLocally(current.ids, current.usernames);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/${DELETED_ACCOUNTS_DOC}`);
      }
    );

    // 2. Subscribe to accounts collection
    const colRef = collection(db, ACCOUNTS_COLLECTION);
    const unsubAccounts = onSnapshot(
      colRef,
      (snapshot) => {
        const { ids: deletedIds, usernames: deletedUsernames } = getDeletedAccountTombstones();

        if (!snapshot.empty) {
          initialAccountsCloudChecked = true;
          const remoteList: AppAccount[] = [];
          
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as AppAccount;
            const docId = docSnap.id;
            const accId = data.id || docId;
            const normUser = (data.username || '').trim().toLowerCase();

            // Strictly filter out any account that was deleted on any device
            if (deletedIds.has(docId) || deletedIds.has(accId) || deletedUsernames.has(normUser)) {
              return;
            }

            remoteList.push({ ...data, id: docId });
          });

          onUpdate(remoteList);
        } else {
          // If remote accounts collection is completely empty:
          if (!initialAccountsCloudChecked && deletedIds.size === 0 && deletedUsernames.size === 0) {
            initialAccountsCloudChecked = true;
            // Clean initial seed only when system has never had accounts or deletions
            bulkUploadAccountsToFirebase([
              {
                id: 'usr-admin-01',
                username: 'admin',
                password: 'admin123',
                name: 'Administrator Diklat',
                role: 'Administrator Diklat',
                authority: 'Otoritas Penuh',
                nip: '19840315 200912 1 002',
                unit: 'Bagian Pendidikan & Pelatihan (Diklat)',
                email: 'adeirwanh4@gmail.com',
                createdAt: new Date().toISOString(),
                isDefault: true
              }
            ]).catch(() => {});
          } else {
            onUpdate([]);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, ACCOUNTS_COLLECTION);
        if (onError) onError(error);
      }
    );

    return () => {
      unsubTombstone();
      unsubAccounts();
    };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, ACCOUNTS_COLLECTION);
    if (onError) onError(err);
    return () => {};
  }
}

export async function saveAccountToFirebase(account: AppAccount): Promise<boolean> {
  // If re-saving an account, remove it from tombstones so it stays alive
  await removeAccountsFromDeletedTombstones([account.id], [account.username]);
  if (!db) return false;
  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, account.id);
    const cleaned = cleanFirestoreData(account);
    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${ACCOUNTS_COLLECTION}/${account.id}`);
    return false;
  }
}

export async function deleteAccountFromFirebase(accountId: string, username?: string): Promise<boolean> {
  // 1. Record persistent tombstone across cloud and local storage
  await markAccountsAsDeletedInFirebase([accountId], username ? [username] : []);
  if (!db) return true;
  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${ACCOUNTS_COLLECTION}/${accountId}`);
    return false;
  }
}

export async function bulkDeleteAccountsFromFirebase(accountIds: string[], usernames: string[] = []): Promise<boolean> {
  if (!accountIds || accountIds.length === 0) return true;
  // 1. Record persistent tombstone across cloud and local storage
  await markAccountsAsDeletedInFirebase(accountIds, usernames);
  if (!db) return true;
  try {
    const BATCH_LIMIT = 400;
    for (let i = 0; i < accountIds.length; i += BATCH_LIMIT) {
      const chunk = accountIds.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        const ref = doc(db, ACCOUNTS_COLLECTION, id);
        batch.delete(ref);
      });
      await batch.commit();
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, ACCOUNTS_COLLECTION);
    return false;
  }
}

export async function bulkUploadAccountsToFirebase(accounts: AppAccount[]): Promise<boolean> {
  if (!db || accounts.length === 0) return true;
  try {
    const ids = accounts.map((a) => a.id);
    const usernames = accounts.map((a) => a.username);
    await removeAccountsFromDeletedTombstones(ids, usernames);

    const BATCH_LIMIT = 400;
    for (let i = 0; i < accounts.length; i += BATCH_LIMIT) {
      const chunk = accounts.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      chunk.forEach((acc) => {
        const ref = doc(db, ACCOUNTS_COLLECTION, acc.id);
        const cleaned = cleanFirestoreData(acc);
        batch.set(ref, cleaned, { merge: true });
      });
      await batch.commit();
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, ACCOUNTS_COLLECTION);
    return false;
  }
}

/**
 * Custom Units (Free Text) Cross-Device Cloud Sync
 */
export function subscribeToCustomUnits(
  onUpdate: (units: string[]) => void
): () => void {
  if (!db) return () => {};
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CUSTOM_UNITS_DOC);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.units)) {
            onUpdate(data.units);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `${SETTINGS_COLLECTION}/${CUSTOM_UNITS_DOC}`);
      }
    );
  } catch {
    return () => {};
  }
}

export async function saveCustomUnitsToFirebase(units: string[]): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CUSTOM_UNITS_DOC);
    await setDoc(docRef, { units, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Global Print Signee Config (Format TTD Cetak) Cross-Device Cloud Sync
 */
export function subscribeToPrintSigneeConfig(
  onUpdate: (config: PrintSigneeConfig) => void
): () => void {
  if (!db) return () => {};
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PRINT_SIGNEE_DOC);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as PrintSigneeConfig;
          if (data && data.leftName && data.rightName) {
            onUpdate(data);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `${SETTINGS_COLLECTION}/${PRINT_SIGNEE_DOC}`);
      }
    );
  } catch {
    return () => {};
  }
}

export async function savePrintSigneeConfigToFirebase(config: PrintSigneeConfig): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PRINT_SIGNEE_DOC);
    const cleaned = cleanFirestoreData(config);
    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Global Theme Preset Cross-Device Cloud Sync
 */
export const THEME_CONFIG_DOC = 'app_theme_config';

export function subscribeToThemeConfig(onUpdate: (themeId: string) => void): () => void {
  if (!db) return () => {};
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, THEME_CONFIG_DOC);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.themeId && typeof data.themeId === 'string') {
            onUpdate(data.themeId);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `${SETTINGS_COLLECTION}/${THEME_CONFIG_DOC}`);
      }
    );
  } catch {
    return () => {};
  }
}

export async function saveThemeConfigToFirebase(themeId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, THEME_CONFIG_DOC);
    await setDoc(docRef, { themeId, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Global Dynamic Background Wallpaper Cross-Device Cloud Sync
 */
export const BACKGROUND_CONFIG_DOC = 'app_background_config';

export interface RemoteBackgroundConfig {
  id: string;
  name: string;
  category: string;
  type: string;
  cssValue: string;
  thumbnailUrl?: string;
  overlayOpacity?: number;
  blur?: number;
  updatedAt?: string;
}

export function subscribeToBackgroundConfig(onUpdate: (bg: RemoteBackgroundConfig) => void): () => void {
  if (!db) return () => {};
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, BACKGROUND_CONFIG_DOC);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as RemoteBackgroundConfig;
          if (data && data.id && data.cssValue) {
            onUpdate(data);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `${SETTINGS_COLLECTION}/${BACKGROUND_CONFIG_DOC}`);
      }
    );
  } catch {
    return () => {};
  }
}

export async function saveBackgroundConfigToFirebase(bg: RemoteBackgroundConfig): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, BACKGROUND_CONFIG_DOC);
    const cleaned = cleanFirestoreData({
      ...bg,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export const DELETED_EMPLOYEES_KEY = 'rsia_az_zahra_deleted_employees_v1';
export const DELETED_EMPLOYEES_DOC = 'deleted_employees';

export function getDeletedEmployeeIds(): Set<string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(DELETED_EMPLOYEES_KEY) : null;
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // ignore
  }
  return new Set();
}

export function saveDeletedEmployeeIdsLocally(ids: Set<string>): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DELETED_EMPLOYEES_KEY, JSON.stringify(Array.from(ids)));
    }
  } catch {
    // ignore
  }
}

export function markEmployeesAsDeleted(ids: string[]): void {
  try {
    const set = getDeletedEmployeeIds();
    ids.forEach((id) => set.add(id));
    saveDeletedEmployeeIdsLocally(set);

    if (db) {
      const docRef = doc(db, SETTINGS_COLLECTION, DELETED_EMPLOYEES_DOC);
      setDoc(
        docRef,
        {
          ids: Array.from(set),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      ).catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function clearDeletedEmployeeTracking(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DELETED_EMPLOYEES_KEY);
    }
    if (db) {
      const docRef = doc(db, SETTINGS_COLLECTION, DELETED_EMPLOYEES_DOC);
      deleteDoc(docRef).catch(() => {});
    }
  } catch {
    // ignore
  }
}

/**
 * Employees (Master Data Perawat & Bidan) Cross-Device Cloud Sync
 */
let initialEmployeesCloudChecked = false;

export function subscribeToEmployees(
  onUpdate: (employees: EmployeeItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    return () => {};
  }
  try {
    // 1. Subscribe to remote tombstones so all devices immediately know about deleted employees
    const tombstoneDocRef = doc(db, SETTINGS_COLLECTION, DELETED_EMPLOYEES_DOC);
    const unsubTombstone = onSnapshot(
      tombstoneDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const cloudIds: string[] = Array.isArray(data?.ids) ? data.ids : [];
          const current = getDeletedEmployeeIds();
          cloudIds.forEach((id) => current.add(id));
          saveDeletedEmployeeIdsLocally(current);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/${DELETED_EMPLOYEES_DOC}`);
      }
    );

    // 2. Subscribe to employees collection
    const colRef = collection(db, EMPLOYEES_COLLECTION);
    const unsubEmployees = onSnapshot(
      colRef,
      (snapshot) => {
        const deletedIds = getDeletedEmployeeIds();

        if (!snapshot.empty) {
          initialEmployeesCloudChecked = true;
          const remoteList: EmployeeItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as EmployeeItem;
            const docId = docSnap.id;
            const dataId = data.id;
            if (!deletedIds.has(docId) && (!dataId || !deletedIds.has(dataId))) {
              remoteList.push({ ...data, id: docId });
            }
          });

          onUpdate(remoteList);
          const metaDocRef = doc(db, SETTINGS_COLLECTION, 'system_seed_status');
          setDoc(metaDocRef, { employeesSeeded: true }, { merge: true }).catch(() => {});
        } else {
          // If cloud collection is completely empty:
          if (!initialEmployeesCloudChecked) {
            initialEmployeesCloudChecked = true;
            const metaDocRef = doc(db, SETTINGS_COLLECTION, 'system_seed_status');
            getDocFromServer(metaDocRef)
              .then((snap) => {
                if (snap.exists() && snap.data()?.employeesSeeded) {
                  onUpdate([]);
                } else {
                  import('../utils/employeeManager').then(({ DEFAULT_EMPLOYEES }) => {
                    bulkUploadEmployeesToFirebase(DEFAULT_EMPLOYEES).catch(() => {});
                    setDoc(metaDocRef, { employeesSeeded: true }, { merge: true }).catch(() => {});
                    onUpdate(DEFAULT_EMPLOYEES);
                  }).catch(() => {
                    onUpdate([]);
                  });
                }
              })
              .catch(() => {
                onUpdate([]);
              });
          } else {
            onUpdate([]);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, EMPLOYEES_COLLECTION);
        if (onError) onError(error);
      }
    );
    return () => {
      unsubTombstone();
      unsubEmployees();
    };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, EMPLOYEES_COLLECTION);
    if (onError) onError(err);
    return () => {};
  }
}

export async function getEmployeesFromFirebase(): Promise<EmployeeItem[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, EMPLOYEES_COLLECTION);
    const snap = await getDocs(colRef);
    const list: EmployeeItem[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...(docSnap.data() as EmployeeItem), id: docSnap.id });
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, EMPLOYEES_COLLECTION);
    return [];
  }
}

export async function saveEmployeeToFirebase(emp: EmployeeItem): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, EMPLOYEES_COLLECTION, emp.id);
    const cleaned = cleanFirestoreData(emp);
    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${EMPLOYEES_COLLECTION}/${emp.id}`);
    return false;
  }
}

export async function deleteEmployeeFromFirebase(empId: string): Promise<boolean> {
  markEmployeesAsDeleted([empId]);
  if (!db) return false;
  try {
    const docRef = doc(db, EMPLOYEES_COLLECTION, empId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${EMPLOYEES_COLLECTION}/${empId}`);
    return false;
  }
}

export async function bulkUploadEmployeesToFirebase(employees: EmployeeItem[]): Promise<boolean> {
  if (!db || employees.length === 0) return true;
  try {
    const BATCH_LIMIT = 400;
    for (let i = 0; i < employees.length; i += BATCH_LIMIT) {
      const chunk = employees.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      chunk.forEach((emp) => {
        const ref = doc(db, EMPLOYEES_COLLECTION, emp.id);
        const cleaned = cleanFirestoreData(emp);
        batch.set(ref, cleaned, { merge: true });
      });
      await batch.commit();
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, EMPLOYEES_COLLECTION);
    return false;
  }
}

export async function bulkDeleteEmployeesFromFirebase(empIds: string[]): Promise<boolean> {
  if (!empIds || empIds.length === 0) return true;
  markEmployeesAsDeleted(empIds);
  if (!db) return true;
  try {
    const BATCH_LIMIT = 400;
    for (let i = 0; i < empIds.length; i += BATCH_LIMIT) {
      const chunk = empIds.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        const ref = doc(db, EMPLOYEES_COLLECTION, id);
        batch.delete(ref);
      });
      await batch.commit();
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, EMPLOYEES_COLLECTION);
    return false;
  }
}

