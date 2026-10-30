import { AppAccount, User, getUserAuthority } from '../types/auth';
import { 
  saveAccountToFirebase, 
  deleteAccountFromFirebase, 
  bulkUploadAccountsToFirebase,
  subscribeToAccounts 
} from '../lib/firebase';

export const ACCOUNTS_STORAGE_KEY = 'simrs_diklat_accounts_v2';
export const OTP_STORAGE_KEY = 'simrs_diklat_active_otps';
export const LATEST_OTP_KEY = 'simrs_diklat_latest_otp';

export interface OtpRecord {
  email: string;
  code: string;
  accountId: string;
  username: string;
  name: string;
  role: string;
  expiresAt: number; // timestamp in ms (10 minutes)
  createdAt: number;
}

export const DESIGNATED_RECOVERY_EMAILS = [
  {
    email: 'rawatinap.rsiaazahra@gmail.com',
    label: 'RSIA Az Zahra Palembang (Administrator)',
    username: 'admin',
    role: 'Administrator Diklat'
  },
  {
    email: 'adeirwanh4@gmail.com',
    label: 'Administrator Diklat',
    username: 'admin',
    role: 'Administrator Diklat'
  },
  {
    email: 'ci.palembang@bunda.co.id',
    label: 'Koordinator Preceptor / CI Bunda Palembang',
    username: 'preceptor',
    role: 'Koordinator Preceptor'
  }
];

export const DEFAULT_ACCOUNTS: AppAccount[] = [

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
    createdAt: '2026-01-01T08:00:00.000Z',
    isDefault: true
  },
  {
    id: 'usr-prec-02',
    username: 'preceptor',
    password: 'diklat2026',
    name: 'Ns. Siti Nurhaliza (CI Bunda Palembang)',
    role: 'Koordinator Preceptor',
    authority: 'Edit',
    nip: '19890621 201403 2 004',
    unit: 'Komite Keperawatan & Preceptor Academy RS Bunda',
    email: 'ci.palembang@bunda.co.id',
    createdAt: '2026-02-15T09:30:00.000Z',
    isDefault: true
  },
  {
    id: 'usr-inst-03',
    username: 'instruktur',
    password: 'diklat123',
    name: 'Ns. Budi Santoso, S.Kep, Ners',
    role: 'Instruktur Klinis',
    authority: 'Edit',
    nip: '19910512 201701 1 003',
    unit: 'Intensive Care & Emergency Unit',
    email: 'budi.santoso@hospital.corp.id',
    createdAt: '2026-03-10T10:00:00.000Z',
    isDefault: true
  },
  {
    id: 'usr-view-04',
    username: 'peserta',
    password: 'diklat2026',
    name: 'Ns. Ratna Sari, S.Kep',
    role: 'Peserta Diklat',
    authority: 'Melihat',
    nip: '19950812 202102 2 005',
    unit: 'Rawat Inap Bedah Dewasa',
    email: 'peserta.diklat@hospital.corp.id',
    createdAt: '2026-03-15T08:00:00.000Z',
    isDefault: true
  }
];


// Account real-time sync listeners
type AccountListener = (accounts: AppAccount[]) => void;
const accountListeners: Set<AccountListener> = new Set();

export function onAccountsSync(listener: AccountListener): () => void {
  accountListeners.add(listener);
  return () => {
    accountListeners.delete(listener);
  };
}

let hasStartedAccountSync = false;
export function startRealtimeAccountSync(): () => void {
  if (hasStartedAccountSync) return () => {};
  hasStartedAccountSync = true;

  return subscribeToAccounts(
    (remoteAccounts) => {
      if (remoteAccounts && remoteAccounts.length > 0) {
        saveStoredAccounts(remoteAccounts);
        accountListeners.forEach((fn) => {
          try {
            fn(remoteAccounts);
          } catch (e) {
            console.warn('Error in account sync listener:', e);
          }
        });
      }
    }
  );
}

export function getStoredAccounts(): AppAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure designated emails, administrator names, and explicit authorities are synchronized
        let hasChanges = false;
        const synced = parsed.map((acc: AppAccount) => {
          let updatedAcc = { ...acc };
          if (!updatedAcc.authority) {
            updatedAcc.authority = getUserAuthority(updatedAcc);
            hasChanges = true;
          }
          if (updatedAcc.username === 'admin' || updatedAcc.role === 'Administrator Diklat') {
            if (!updatedAcc.email || updatedAcc.email.includes('hospital.corp.id') || updatedAcc.name !== 'Administrator Diklat' || updatedAcc.authority !== 'Otoritas Penuh') {
              hasChanges = true;
              updatedAcc = { ...updatedAcc, email: 'adeirwanh4@gmail.com', name: 'Administrator Diklat', authority: 'Otoritas Penuh' };
            }
          }
          if (updatedAcc.username === 'preceptor' && (!updatedAcc.email || updatedAcc.email.includes('hospital.corp.id'))) {
            hasChanges = true;
            updatedAcc = { ...updatedAcc, email: 'ci.palembang@bunda.co.id' };
          }
          return updatedAcc;
        });
        if (hasChanges) {
          saveStoredAccounts(synced);
        }
        return synced;
      }

    }
  } catch (err) {
    console.error('Failed to load accounts from storage:', err);
  }
  // Initialize storage with defaults
  saveStoredAccounts(DEFAULT_ACCOUNTS);
  return DEFAULT_ACCOUNTS;
}

export function saveStoredAccounts(accounts: AppAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save accounts to storage:', err);
  }
}

export function addAccount(
  accountData: Omit<AppAccount, 'id' | 'createdAt'>
): { success: boolean; message: string; account?: AppAccount } {
  const accounts = getStoredAccounts();
  const normalizedUsername = accountData.username.trim().toLowerCase();

  if (!normalizedUsername) {
    return { success: false, message: 'Username tidak boleh kosong.' };
  }

  // Check username uniqueness
  const exists = accounts.some(
    (acc) => acc.username.trim().toLowerCase() === normalizedUsername
  );
  if (exists) {
    return { success: false, message: `Username "${accountData.username}" sudah digunakan. Gunakan username lain.` };
  }

  if (!accountData.password || accountData.password.length < 4) {
    return { success: false, message: 'Kata sandi minimal 4 karakter.' };
  }

  if (!accountData.name.trim()) {
    return { success: false, message: 'Nama lengkap wajib diisi.' };
  }

  const newAccount: AppAccount = {
    ...accountData,
    authority: accountData.authority || getUserAuthority(accountData as any),
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    username: normalizedUsername,
    createdAt: new Date().toISOString(),
    isDefault: false
  };

  const updatedAccounts = [newAccount, ...accounts];
  saveStoredAccounts(updatedAccounts);
  // Asynchronously sync to Firebase backend
  saveAccountToFirebase(newAccount).catch(() => {});

  return {
    success: true,
    message: `Akun baru @${newAccount.username} berhasil didaftarkan.`,
    account: newAccount
  };
}

export function updateAccount(
  id: string,
  updates: Partial<Omit<AppAccount, 'id' | 'createdAt'>>
): { success: boolean; message: string; account?: AppAccount } {
  const accounts = getStoredAccounts();
  const index = accounts.findIndex((a) => a.id === id);

  if (index === -1) {
    return { success: false, message: 'Akun tidak ditemukan.' };
  }

  const current = accounts[index];

  // If changing username, check uniqueness
  if (updates.username && updates.username.trim().toLowerCase() !== current.username.toLowerCase()) {
    const norm = updates.username.trim().toLowerCase();
    const collision = accounts.some((a) => a.id !== id && a.username.toLowerCase() === norm);
    if (collision) {
      return { success: false, message: `Username "${updates.username}" sudah digunakan oleh akun lain.` };
    }
  }

  const updated: AppAccount = {
    ...current,
    ...updates,
    authority: updates.authority !== undefined ? updates.authority : (current.authority || getUserAuthority(current)),
    username: updates.username ? updates.username.trim().toLowerCase() : current.username
  };

  accounts[index] = updated;
  saveStoredAccounts(accounts);
  saveAccountToFirebase(updated).catch(() => {});

  return { success: true, message: `Data akun @${updated.username} berhasil diperbarui.`, account: updated };
}

export function updateAccountAvatar(
  userId: string,
  avatarUrl: string | undefined
): { success: boolean; message: string; account?: AppAccount } {
  const accounts = getStoredAccounts();
  const index = accounts.findIndex(
    (a) => a.id === userId || a.username.toLowerCase() === userId.toLowerCase()
  );
  if (index === -1) {
    return { success: false, message: 'Akun tidak ditemukan.' };
  }
  const updated: AppAccount = {
    ...accounts[index],
    avatarUrl: avatarUrl || undefined
  };
  accounts[index] = updated;
  saveStoredAccounts(accounts);
  saveAccountToFirebase(updated).catch(() => {});
  return { success: true, message: 'Foto profil berhasil diperbarui.', account: updated };
}

export function resetAccountPassword(
  id: string,
  newPassword: string
): { success: boolean; message: string } {
  if (!newPassword || newPassword.length < 4) {
    return { success: false, message: 'Kata sandi baru minimal 4 karakter.' };
  }

  const accounts = getStoredAccounts();
  const index = accounts.findIndex((a) => a.id === id);

  if (index === -1) {
    return { success: false, message: 'Akun tidak ditemukan.' };
  }

  accounts[index].password = newPassword;
  saveStoredAccounts(accounts);
  saveAccountToFirebase(accounts[index]).catch(() => {});

  return {
    success: true,
    message: `Kata sandi akun @${accounts[index].username} berhasil di-reset menjadi "${newPassword}".`
  };
}

export function deleteAccount(id: string): { success: boolean; message: string } {
  const accounts = getStoredAccounts();
  const account = accounts.find((a) => a.id === id);

  if (!account) {
    return { success: false, message: 'Akun tidak ditemukan.' };
  }

  if (account.username === 'admin') {
    return { success: false, message: 'Akun super admin utama tidak dapat dihapus demi keamanan sistem.' };
  }

  const filtered = accounts.filter((a) => a.id !== id);
  saveStoredAccounts(filtered);
  deleteAccountFromFirebase(id).catch(() => {});

  return { success: true, message: `Akun @${account.username} berhasil dihapus dari sistem.` };
}

export function resetAccountsToDefault(): AppAccount[] {
  saveStoredAccounts(DEFAULT_ACCOUNTS);
  bulkUploadAccountsToFirebase(DEFAULT_ACCOUNTS).catch(() => {});
  return DEFAULT_ACCOUNTS;
}

export function authenticate(
  rawUsername: string,
  rawPassword: string
): { success: boolean; user?: User; message?: string } {
  const username = rawUsername.trim().toLowerCase();
  const password = rawPassword;

  if (!username) {
    return {
      success: false,
      message: 'Silakan masukkan Username atau NIP.'
    };
  }

  if (!password) {
    return {
      success: false,
      message: 'Silakan masukkan kata sandi Anda.'
    };
  }

  const accounts = getStoredAccounts();

  // Find account by matching username, NIP (with or without spaces), or email
  const cleanDigits = username.replace(/[\s.-]/g, '');
  const found = accounts.find((acc) => {
    const accUser = acc.username.toLowerCase();
    const accEmail = (acc.email || '').toLowerCase();
    const accNipClean = (acc.nip || '').replace(/[\s.-]/g, '').toLowerCase();

    return accUser === username || (accEmail && accEmail === username) || (accNipClean && accNipClean === cleanDigits);
  });

  // Account does NOT exist in registered database
  if (!found) {
    return {
      success: false,
      message: 'Username atau NIP tidak terdaftar dalam sistem Diklat RSIA Az Zahra.'
    };
  }

  // Strictly verify password against stored account password
  if (found.password !== password) {
    return {
      success: false,
      message: 'Kata sandi tidak sesuai. Silakan periksa kembali atau gunakan Lupa Password.'
    };
  }

  // Authenticated successfully
  const user: User = {
    id: found.id,
    username: found.username,
    name: found.name,
    role: found.role,
    authority: found.authority || getUserAuthority(found),
    nip: found.nip,
    unit: found.unit,
    email: found.email,
    avatarUrl: found.avatarUrl
  };

  return { success: true, user };
}

// ==========================================
// OTP (ONE-TIME-PASSWORD) & RECOVERY ENGINE
// ==========================================

export function getStoredOTPs(): OtpRecord[] {
  try {
    const raw = localStorage.getItem(OTP_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        // Filter out expired records
        const now = Date.now();
        const active = list.filter((item: OtpRecord) => item.expiresAt > now);
        if (active.length !== list.length) {
          saveStoredOTPs(active);
        }
        return active;
      }
    }
  } catch (err) {
    console.error('Failed to parse OTPs:', err);
  }
  return [];
}

export function saveStoredOTPs(otps: OtpRecord[]): void {
  try {
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
  } catch (err) {
    console.error('Failed to save OTPs:', err);
  }
}

export function getLatestActiveOTP(emailFilter?: string): OtpRecord | null {
  const otps = getStoredOTPs();
  if (otps.length === 0) return null;
  const now = Date.now();
  const valid = otps.filter((o) => o.expiresAt > now);
  if (emailFilter) {
    const norm = emailFilter.trim().toLowerCase();
    const match = valid.find(
      (o) => o.email.toLowerCase() === norm || o.username.toLowerCase() === norm
    );
    return match || null;
  }
  return valid[valid.length - 1] || null;
}

/**
 * Request 6-digit OTP via Email
 * Recognizes designated hospital emails:
 * - adeirwanh4@gmail.com
 * - ci.palembang@bunda.co.id
 * Or any registered username/email
 */
export function requestPasswordResetOTP(identifier: string): {
  success: boolean;
  message: string;
  otp?: string;
  email?: string;
  account?: AppAccount;
  expiresAt?: number;
} {
  const norm = identifier.trim().toLowerCase();
  if (!norm) {
    return { success: false, message: 'Silakan masukkan alamat email atau username Anda.' };
  }

  const accounts = getStoredAccounts();

  // Find matching account
  let target = accounts.find(
    (acc) =>
      acc.email.toLowerCase() === norm ||
      acc.username.toLowerCase() === norm ||
      acc.nip.replace(/\s+/g, '') === norm.replace(/\s+/g, '')
  );

  // Fallback match for designated emails
  if (!target) {
    if (norm === 'rawatinap.rsiaazahra@gmail.com' || norm.includes('rawatinap') || norm.includes('rsiaazahra')) {
      target = accounts.find((a) => a.username === 'admin');
      if (target) {
        target.email = 'rawatinap.rsiaazahra@gmail.com';
        saveStoredAccounts(accounts);
      }
    } else if (norm === 'adeirwanh4@gmail.com' || norm.includes('adeirwan')) {
      target = accounts.find((a) => a.username === 'admin');
      if (target) {
        target.email = 'adeirwanh4@gmail.com';
        target.name = target.name || 'Ns. Ade Irwan H., S.Kep';
        saveStoredAccounts(accounts);
      }
    } else if (norm === 'ci.palembang@bunda.co.id' || norm.includes('bunda.co.id')) {
      target = accounts.find((a) => a.username === 'preceptor');
      if (target) {
        target.email = 'ci.palembang@bunda.co.id';
        target.name = target.name || 'Ns. Siti Nurhaliza (CI Bunda Palembang)';
        saveStoredAccounts(accounts);
      }
    }
  }

  if (!target) {
    return {
      success: false,
      message: `Email/Username "${identifier}" tidak terdaftar dalam sistem. Gunakan email resmi (misal: rawatinap.rsiaazahra@gmail.com atau adeirwanh4@gmail.com).`
    };
  }

  // Generate 6-digit cryptographic-style random OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  const newOtp: OtpRecord = {
    email: target.email,
    code,
    accountId: target.id,
    username: target.username,
    name: target.name,
    role: target.role,
    expiresAt,
    createdAt: Date.now()
  };

  const existingOTPs = getStoredOTPs().filter(
    (o) => o.email.toLowerCase() !== target!.email.toLowerCase()
  );
  saveStoredOTPs([...existingOTPs, newOtp]);

  // Save latest OTP for instant simulated email alert
  try {
    sessionStorage.setItem(LATEST_OTP_KEY, JSON.stringify(newOtp));
    window.dispatchEvent(new CustomEvent('simrs:otp-dispatched', { detail: newOtp }));
  } catch (e) {
    console.warn('Dispatch notification warning:', e);
  }

  return {
    success: true,
    message: `Kode OTP verifikasi telah berhasil dikirimkan ke email ${target.email}`,
    otp: code,
    email: target.email,
    account: target,
    expiresAt
  };
}

/**
 * Verify OTP Code
 */
export function verifyOTP(
  identifier: string,
  rawCode: string
): { success: boolean; message: string; account?: AppAccount; user?: User } {
  const norm = identifier.trim().toLowerCase();
  const cleanCode = rawCode.trim().replace(/\s+/g, '');

  if (!cleanCode) {
    return { success: false, message: 'Masukkan 6-digit kode OTP yang diterima melalui email.' };
  }

  if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
    return { success: false, message: 'Format kode OTP harus berupa 6 digit angka.' };
  }

  const otps = getStoredOTPs();
  const now = Date.now();

  // Find matching active OTP
  const match = otps.find(
    (o) =>
      o.expiresAt > now &&
      o.code === cleanCode &&
      (norm ? o.email.toLowerCase() === norm || o.username.toLowerCase() === norm : true)
  );

  if (!match) {
    // Check if OTP expired
    const expiredMatch = otps.find(
      (o) =>
        o.code === cleanCode &&
        (norm ? o.email.toLowerCase() === norm || o.username.toLowerCase() === norm : true)
    );
    if (expiredMatch && expiredMatch.expiresAt <= now) {
      return { success: false, message: 'Kode OTP telah kedaluwarsa (berlaku 10 menit). Silakan minta kode baru.' };
    }
    return { success: false, message: 'Kode OTP yang Anda masukkan salah atau tidak sesuai. Periksa email Anda.' };
  }

  const accounts = getStoredAccounts();
  const account = accounts.find((a) => a.id === match.accountId || a.username === match.username);

  if (!account) {
    return { success: false, message: 'Akun terkait OTP tidak ditemukan dalam sistem.' };
  }

  const user: User = {
    id: account.id,
    username: account.username,
    name: account.name,
    role: account.role,
    authority: account.authority || getUserAuthority(account),
    nip: account.nip,
    unit: account.unit,
    email: account.email,
    avatarUrl: account.avatarUrl
  };


  return {
    success: true,
    message: 'Verifikasi kode OTP berhasil.',
    account,
    user
  };
}

/**
 * Direct Login with OTP
 * Allows immediate authentication into the system using the OTP code received via email
 */
export function loginWithOTP(
  identifier: string,
  rawCode: string
): { success: boolean; message: string; user?: User; account?: AppAccount } {
  const result = verifyOTP(identifier, rawCode);
  if (!result.success || !result.user || !result.account) {
    return result;
  }

  // Consume used OTP so it cannot be re-used
  const otps = getStoredOTPs();
  const remaining = otps.filter(
    (o) => o.code !== rawCode.trim().replace(/\s+/g, '')
  );
  saveStoredOTPs(remaining);
  try {
    sessionStorage.removeItem(LATEST_OTP_KEY);
  } catch {
    // ignore
  }

  return {
    success: true,
    message: `Autentikasi OTP berhasil. Selamat datang kembali, ${result.user.name}!`,
    user: result.user,
    account: result.account
  };
}

/**
 * Reset Password using verified OTP
 */
export function resetPasswordWithOTP(
  identifier: string,
  rawCode: string,
  newPassword: string
): { success: boolean; message: string; user?: User; account?: AppAccount } {
  const result = verifyOTP(identifier, rawCode);
  if (!result.success || !result.account || !result.user) {
    return result;
  }

  if (!newPassword || newPassword.length < 4) {
    return { success: false, message: 'Kata sandi baru minimal 4 karakter.' };
  }

  // Update password in stored accounts
  const accounts = getStoredAccounts();
  const idx = accounts.findIndex((a) => a.id === result.account!.id);
  if (idx !== -1) {
    accounts[idx].password = newPassword;
    saveStoredAccounts(accounts);
  }

  // Consume used OTP
  const otps = getStoredOTPs();
  const remaining = otps.filter((o) => o.code !== rawCode.trim().replace(/\s+/g, ''));
  saveStoredOTPs(remaining);

  return {
    success: true,
    message: `Kata sandi baru untuk @${result.account.username} berhasil disimpan. Anda dapat langsung login.`,
    user: result.user,
    account: accounts[idx] || result.account
  };
}

