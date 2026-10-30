export type UserAuthority = 'Edit' | 'Melihat' | 'Otoritas Penuh';

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'Administrator Diklat' | 'Koordinator Preceptor' | 'Instruktur Klinis' | 'Nursing Struktural' | 'Peserta Diklat' | string;
  authority?: UserAuthority;
  nip: string;
  unit: string;
  email: string;
  avatarUrl?: string;
}

export interface AppAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'Administrator Diklat' | 'Koordinator Preceptor' | 'Instruktur Klinis' | 'Nursing Struktural' | 'Peserta Diklat' | string;
  authority?: UserAuthority;
  nip: string;
  unit: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  isDefault?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token?: string;
}

/**
 * Resolves user authority level across 3 explicit tiers:
 * 1. 'Edit' - Dapat menambah & mengedit jadwal, peserta, status kehadiran, nilai pre/post-test.
 * 2. 'Melihat' - Akses peninjau / peserta: hanya melihat jadwal, peserta, presensi & cetak laporan.
 * 3. 'Otoritas Penuh' - Super Admin: semua wewenang + hapus pelatihan/peserta, kelola akun, reset sistem.
 */
export function getUserAuthority(user?: User | AppAccount | null): UserAuthority {
  if (!user) return 'Melihat';
  if (user.authority && (user.authority === 'Edit' || user.authority === 'Melihat' || user.authority === 'Otoritas Penuh')) {
    return user.authority;
  }

  const roleLower = (user.role || '').toLowerCase();
  const usernameLower = (user.username || '').toLowerCase();

  if (roleLower.includes('admin') || usernameLower === 'admin' || roleLower.includes('penuh')) {
    return 'Otoritas Penuh';
  }
  if (roleLower.includes('peserta') || roleLower.includes('lihat') || roleLower.includes('view') || roleLower.includes('peninjau')) {
    return 'Melihat';
  }
  return 'Edit';
}

export function isFullAuthority(user?: User | AppAccount | null): boolean {
  return getUserAuthority(user) === 'Otoritas Penuh';
}

export function canEdit(user?: User | AppAccount | null): boolean {
  const auth = getUserAuthority(user);
  return auth === 'Otoritas Penuh' || auth === 'Edit';
}

export function isViewOnly(user?: User | AppAccount | null): boolean {
  return getUserAuthority(user) === 'Melihat';
}

export const AUTHORITY_CONFIG: Record<UserAuthority, {
  label: UserAuthority;
  description: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconName: string;
  permissions: {
    canAddTraining: boolean;
    canEditTraining: boolean;
    canDeleteTraining: boolean;
    canAddParticipant: boolean;
    canDeleteParticipant: boolean;
    canUpdateAttendance: boolean;
    canEditScores: boolean;
    canManageAccounts: boolean;
    canResetSystem: boolean;
    canExportAndPrint: boolean;
  };
}> = {
  'Edit': {
    label: 'Edit',
    description: 'Dapat menjadwalkan pelatihan, mengubah rincian, menambah peserta, checklist presensi, dan input nilai ujian.',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-500/60',
    badgeText: 'text-amber-300',
    iconName: 'Pencil',
    permissions: {
      canAddTraining: true,
      canEditTraining: true,
      canDeleteTraining: false,
      canAddParticipant: true,
      canDeleteParticipant: false,
      canUpdateAttendance: true,
      canEditScores: true,
      canManageAccounts: false,
      canResetSystem: false,
      canExportAndPrint: true
    }
  },
  'Melihat': {
    label: 'Melihat',
    description: 'Akses peninjauan (hanya baca). Dapat melihat kalender, rincian pelatihan, daftar peserta, dan mencetak presensi.',
    badgeBg: 'bg-sky-950/80',
    badgeBorder: 'border-sky-500/60',
    badgeText: 'text-sky-300',
    iconName: 'Eye',
    permissions: {
      canAddTraining: false,
      canEditTraining: false,
      canDeleteTraining: false,
      canAddParticipant: false,
      canDeleteParticipant: false,
      canUpdateAttendance: false,
      canEditScores: false,
      canManageAccounts: false,
      canResetSystem: false,
      canExportAndPrint: true
    }
  },
  'Otoritas Penuh': {
    label: 'Otoritas Penuh',
    description: 'Hak akses tertinggi / Administrator Penuh. Memiliki seluruh kontrol termasuk hapus data, kelola akun, dan reset sistem.',
    badgeBg: 'bg-emerald-950/80',
    badgeBorder: 'border-emerald-500/60',
    badgeText: 'text-emerald-300',
    iconName: 'ShieldCheck',
    permissions: {
      canAddTraining: true,
      canEditTraining: true,
      canDeleteTraining: true,
      canAddParticipant: true,
      canDeleteParticipant: true,
      canUpdateAttendance: true,
      canEditScores: true,
      canManageAccounts: true,
      canResetSystem: true,
      canExportAndPrint: true
    }
  }
};
