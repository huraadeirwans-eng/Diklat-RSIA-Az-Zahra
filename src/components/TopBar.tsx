import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Menu, 
  BarChart3, 
  User as UserIcon, 
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ShieldCheck,
  Check,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Cloud,
  Calendar,
  ListFilter,
  Building2,
  Users,
  Settings
} from 'lucide-react';
import { User, getUserAuthority, UserAuthority } from '../types/auth';

import { getStoredAccounts, resetAccountPassword, updateAccountAvatar } from '../utils/accountManager';
import { compressImageFile } from '../utils/imageCompressor';

interface TopBarProps {
  activeView: 'calendar' | 'agenda' | 'units' | 'employees' | 'analytics' | 'settings';
  onOpenMobileMenu: () => void;
  onOpenAddTraining?: () => void;
  onOpenAnalytics?: () => void;
  currentUser?: User | null;
  onUpdateUser?: (updated: User) => void;
  onLogout?: () => void;
  onLockScreen?: () => void;
}

// Koleksi preset avatar profesional (SVG data URI ringan & tajam)
const PRESET_AVATARS = [
  {
    id: 'preset-medical-lead',
    label: 'Dokter / Kepala Medis',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230e7490"/><circle cx="50" cy="38" r="20" fill="%23f8fafc"/><path d="M22 88c0-18 12-28 28-28s28 10 28 28" fill="%23f8fafc"/><path d="M42 60l8 14 8-14" fill="%2306b6d4"/><path d="M50 30v12M44 36h12" stroke="%230e7490" stroke-width="3" stroke-linecap="round"/></svg>'
  },
  {
    id: 'preset-clinical-nurse',
    label: 'Perawat Preceptor',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%234338ca"/><circle cx="50" cy="38" r="20" fill="%23fdf2f8"/><path d="M22 88c0-18 12-28 28-28s28 10 28 28" fill="%23ffffff"/><path d="M38 24h24v8H38z" fill="%23f43f5e"/><path d="M50 26v4M48 28h4" stroke="%23ffffff" stroke-width="1.5"/></svg>'
  },
  {
    id: 'preset-corp-exec',
    label: 'Eksekutif Corporate',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231e293b"/><circle cx="50" cy="38" r="20" fill="%23fed7aa"/><path d="M22 88c0-18 12-28 28-28s28 10 28 28" fill="%230f172a"/><path d="M45 60l5 18 5-18" fill="%2338bdf8"/><polygon points="50,60 46,74 54,74" fill="%230284c7"/></svg>'
  },
  {
    id: 'preset-corp-female',
    label: 'Manajer SDM / Diklat',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23047857"/><circle cx="50" cy="36" r="20" fill="%23fde68a"/><path d="M30 32c0-10 8-18 20-18s20 8 20 18v8H30z" fill="%2378350f"/><path d="M22 88c0-18 12-28 28-28s28 10 28 28" fill="%23ecfdf5"/></svg>'
  },
  {
    id: 'preset-simrs-admin',
    label: 'Administrator SIM-RS',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230369a1"/><circle cx="50" cy="38" r="20" fill="%23e0f2fe"/><path d="M22 88c0-18 12-28 28-28s28 10 28 28" fill="%23075985"/><circle cx="50" cy="38" r="10" fill="%230284c7"/><path d="M50 20v6M50 50v6M32 38h6M62 38h6" stroke="%23bae6fd" stroke-width="2.5" stroke-linecap="round"/></svg>'
  },
  {
    id: 'preset-golden-badge',
    label: 'Badge Spesialis Diklat',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23b45309"/><circle cx="50" cy="50" r="32" fill="%23fef3c7" stroke="%23fbbf24" stroke-width="4"/><path d="M50 26l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="%23f59e0b"/></svg>'
  }
];

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onOpenMobileMenu,
  onOpenAnalytics,
  currentUser,
  onUpdateUser,
  onLogout,
  onLockScreen
}) => {
  // Profile Modal State (Tabs: 'photo' | 'password')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<'photo' | 'password'>('password');

  // Avatar Upload / Selection State
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change Password Modal State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync avatar preview when modal opens
  useEffect(() => {
    if (isProfileModalOpen) {
      setAvatarPreview(currentUser?.avatarUrl || null);
    }
  }, [isProfileModalOpen, currentUser]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'Kosong', color: 'bg-slate-700', text: 'text-slate-500' };
    if (newPassword.length < 4) return { score: 1, label: 'Terlalu Pendek', color: 'bg-rose-500', text: 'text-rose-400' };
    if (newPassword.length < 6) return { score: 2, label: 'Cukup', color: 'bg-amber-500', text: 'text-amber-400' };
    const hasLetters = /[a-zA-Z]/.test(newPassword);
    const hasNumbers = /[0-9]/.test(newPassword);
    if (hasLetters && hasNumbers && newPassword.length >= 8) {
      return { score: 4, label: 'Sangat Kuat', color: 'bg-emerald-400', text: 'text-emerald-400' };
    }
    return { score: 3, label: 'Kuat', color: 'bg-cyan-400', text: 'text-cyan-400' };
  }, [newPassword]);

  // Generate random strong password
  const handleGenerateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let pass = 'rsiaplg';
    for (let i = 0; i < 5; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setConfirmPassword(pass);
    setShowNewPass(true);
    setShowConfirmPass(true);
  };

  const handleOpenPasswordModal = () => {
    setModalError(null);
    setModalSuccess(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
    setActiveModalTab('password');
    setIsProfileModalOpen(true);
  };

  const handleOpenPhotoModal = () => {
    setModalError(null);
    setModalSuccess(null);
    setAvatarPreview(currentUser?.avatarUrl || null);
    setActiveModalTab('photo');
    setIsProfileModalOpen(true);
  };

  // Handle local image file upload & compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModalError('Format file harus berupa gambar (JPG, PNG, WEBP, SVG).');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setModalError(null);
      // Compress image to crisp square avatar (max 320x320)
      const compressed = await compressImageFile(file, 320, 320, 0.86);
      setAvatarPreview(compressed.dataUrl);
    } catch (err) {
      console.error('Gagal kompresi foto:', err);
      setModalError('Gagal memproses gambar. Silakan coba file gambar lain.');
    } finally {
      setIsUploadingPhoto(false);
      // Reset input value so same file can be picked again if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle saving the chosen avatar photo
  const handleSaveAvatar = () => {
    if (!currentUser) return;
    setModalError(null);
    setModalSuccess(null);
    setIsSaving(true);

    try {
      const res = updateAccountAvatar(currentUser.id, avatarPreview || undefined);
      if (res.success) {
        const updatedUser: User = {
          ...currentUser,
          avatarUrl: avatarPreview || undefined
        };
        // Update user session in localStorage
        try {
          localStorage.setItem('simrs_diklat_auth_user_v1', JSON.stringify(updatedUser));
        } catch (e) {
          console.warn('Failed to update auth session:', e);
        }
        if (onUpdateUser) {
          onUpdateUser(updatedUser);
        }
        setModalSuccess('Foto profil berhasil diperbarui.');
        setTimeout(() => {
          setIsProfileModalOpen(false);
          setModalSuccess(null);
        }, 1200);
      } else {
        setModalError(res.message);
      }
    } catch (e) {
      console.error('Gagal menyimpan avatar:', e);
      setModalError('Terjadi kesalahan saat menyimpan foto profil.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle removing avatar back to default
  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    if (!currentUser) return;

    const accounts = getStoredAccounts();
    const targetAccount = accounts.find(
      (a) => a.id === currentUser.id || a.username.toLowerCase() === currentUser.username.toLowerCase()
    );

    if (!targetAccount) {
      setModalError('Akun pengguna tidak ditemukan di database.');
      return;
    }

    // Verify current password if provided
    if (currentPassword && currentPassword.trim() !== targetAccount.password) {
      setModalError('Kata sandi saat ini tidak cocok. Silakan periksa kembali.');
      return;
    }

    const cleanNewPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanNewPass || cleanNewPass.length < 4) {
      setModalError('Kata sandi baru minimal 4 karakter.');
      return;
    }

    if (cleanNewPass !== cleanConfirm) {
      setModalError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsSaving(true);
    try {
      const result = resetAccountPassword(targetAccount.id, cleanNewPass);
      if (result.success) {
        setModalSuccess('Kata sandi berhasil diperbarui.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsProfileModalOpen(false);
          setModalSuccess(null);
        }, 1500);
      } else {
        setModalError(result.message);
      }
    } catch (e) {
      console.error('Gagal memperbarui kata sandi:', e);
      setModalError('Terjadi kesalahan sistem saat menyimpan kata sandi.');
    } finally {
      setIsSaving(false);
    }
  };

  const viewInfo: Record<string, { title: string; subtitle: string; icon: React.ReactNode }> = {
    calendar: {
      title: 'Kalender Pelatihan',
      subtitle: 'Jadwal & Agenda Diklat RSIA Az Zahra',
      icon: <Calendar className="w-4 h-4 text-cyan-400" />
    },
    agenda: {
      title: 'Daftar Agenda Pelatihan',
      subtitle: 'Seluruh Pelatihan & Detail Sesi Terdaftar',
      icon: <ListFilter className="w-4 h-4 text-cyan-400" />
    },
    units: {
      title: 'Distribusi Unit Kerja',
      subtitle: 'Partisipasi Karyawan Lintas Ruangan & Bagian',
      icon: <Building2 className="w-4 h-4 text-cyan-400" />
    },
    employees: {
      title: 'Data Karyawan RSIA Az Zahra',
      subtitle: 'Direktori Resmi Perawat, Bidan & Nakes',
      icon: <Users className="w-4 h-4 text-cyan-400" />
    },
    analytics: {
      title: 'Tren & Grafik Kehadiran',
      subtitle: 'Analisis & Visualisasi Real-Time Presensi',
      icon: <BarChart3 className="w-4 h-4 text-cyan-400" />
    },
    settings: {
      title: 'Pengaturan Sistem & Akun',
      subtitle: 'Otoritas Akses, Backup Data & Kustomisasi',
      icon: <Settings className="w-4 h-4 text-cyan-400" />
    }
  };

  const currentView = viewInfo[activeView] || viewInfo.calendar;

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-950/95 border-b border-slate-800/80 shrink-0 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 min-h-[58px]">
          {/* Left: Mobile Toggle & Contextual View Header */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 lg:hidden cursor-pointer active:scale-95 transition-all"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center shadow-inner shrink-0 text-cyan-400">
                {currentView.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight truncate">
                    {currentView.title}
                  </h1>
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-800/80 text-[10px] font-bold text-cyan-300 shrink-0">
                    RSIA Az Zahra
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block truncate mt-0.5 font-medium">
                  {currentView.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Cloud Sync Icon, Lock Screen & Profile Avatar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Realtime Cloud Firestore Indicator: Icon Only */}
            <div 
              className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1.5 rounded-xl shadow-xs"
              title="Cloud Sync Aktif: Terhubung ke Cloud Firestore real-time."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            {/* User Profile Area: Avatar Button Only (Teks Nama & Otoritas disembunyikan sesuai permintaan) */}
            {currentUser && (() => {
              const authority = getUserAuthority(currentUser);
              const isAdmin = authority === 'Otoritas Penuh';

              return (
                <div className="flex items-center pl-0.5 sm:pl-1">
                  <div className="flex items-center">
                    {/* FOTO PROFIL BUTTON (Klik untuk Ganti Foto Profil & Ubah Password) */}
                    <button
                      type="button"
                      onClick={handleOpenPhotoModal}
                      className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-cyan-600 to-sky-500 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 shadow-sm border border-cyan-400/40 hover:border-cyan-300 hover:scale-105 transition-all cursor-pointer group"
                      title={`${isAdmin ? 'Administrator Diklat' : currentUser.name} (${authority}) - Klik untuk kelola profil & kata sandi`}
                      aria-label="Kelola Profil & Kata Sandi"
                    >
                      {currentUser.avatarUrl ? (
                        <img 
                          src={currentUser.avatarUrl} 
                          alt="Foto Profil" 
                          className="w-full h-full object-cover" 
                        />
                      ) : isAdmin ? (
                        <UserIcon className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                      ) : (
                        currentUser.name.charAt(0)
                      )}

                      {/* Camera Overlay on Hover */}
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="w-3.5 h-3.5 text-cyan-300" />
                      </div>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </header>

      {/* ========================================================
          MODAL: KELOLA PROFIL (GANTI FOTO PROFIL & UBAH PASWORD)
      ======================================================== */}
      {isProfileModalOpen && currentUser && (() => {
        const authority = getUserAuthority(currentUser);
        const isAdmin = authority === 'Otoritas Penuh';
        const authorityBadgeStyle = 
          authority === 'Otoritas Penuh'
            ? 'bg-emerald-950 border-emerald-500/80 text-emerald-300'
            : authority === 'Edit'
            ? 'bg-amber-950 border-amber-500/80 text-amber-300'
            : 'bg-sky-950 border-sky-500/80 text-sky-300';

        const authorityLabel = 
          authority === 'Otoritas Penuh'
            ? '3. Otoritas Penuh'
            : authority === 'Edit'
            ? '1. Edit'
            : '2. Melihat';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 animate-smooth-fade">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
              {/* Header Modal */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/80 flex items-center justify-center shrink-0">
                    {activeModalTab === 'photo' ? (
                      <Camera className="w-4 h-4" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                      {activeModalTab === 'photo' ? 'Ganti Foto Profil' : 'Ubah Kata Sandi Akun'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-slate-300 font-medium truncate">
                        {isAdmin ? 'Administrator Diklat' : currentUser.name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${authorityBadgeStyle}`}>
                        {authorityLabel}
                      </span>
                    </div>
                  </div>
                </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>


            {/* TAB SELECTOR: FOTO PROFIL vs UBAH PASWORD */}
            <div className="flex border-b border-slate-800 bg-slate-950/30 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab('photo');
                  setModalError(null);
                  setModalSuccess(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeModalTab === 'photo'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Ganti Foto Profil</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab('password');
                  setModalError(null);
                  setModalSuccess(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeModalTab === 'password'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Ubah Pasword</span>
              </button>
            </div>

            {/* Alerts */}
            {modalError && (
              <div className="mx-4 sm:mx-5 mt-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="mx-4 sm:mx-5 mt-4 p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {/* ========================================================
                TAB 1: GANTI FOTO PROFIL
            ======================================================== */}
            {activeModalTab === 'photo' && (
              <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Active Photo Preview */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 text-center">
                  <div className="relative mb-2">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-tr from-cyan-600 to-sky-500 border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="Pratinjau Foto Profil" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <UserIcon className="w-12 h-12 text-slate-950 stroke-[2]" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-bold text-white">
                    {currentUser.role || 'Administrator Diklat'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {avatarPreview ? 'Pratinjau foto profil baru' : 'Menggunakan avatar standar sistem'}
                  </p>
                </div>

                {/* Upload Button */}
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                    id="profile-avatar-upload-input"
                  />
                  <label
                    htmlFor="profile-avatar-upload-input"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-cyan-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-98 shadow-xs"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>
                      {isUploadingPhoto ? 'Memproses Foto...' : 'Unggah Foto dari Perangkat (JPG, PNG, WEBP)'}
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-400 text-center">
                    Foto otomatis dikompresi agar ringan, jernih, dan tidak membebani memori.
                  </p>
                </div>

                {/* Pilihan Preset Avatar Medis & Korporat */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    Atau Pilih Dari Preset Avatar Resmi:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected = avatarPreview === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setAvatarPreview(preset.url)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950/70 border-cyan-400 shadow-sm shadow-cyan-500/30'
                              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700">
                            <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] text-slate-300 font-medium text-center line-clamp-1">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions Footer for Photo */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                    title="Gunakan ikon default sistem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset Icon</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsProfileModalOpen(false)}
                      className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAvatar}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Menyimpan...' : 'Simpan Foto'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                TAB 2: UBAH PASWORD
            ======================================================== */}
            {activeModalTab === 'password' && (
              <form onSubmit={handleSavePassword} className="p-4 sm:p-5 space-y-4">
                {/* Current Password Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kata Sandi Saat Ini <span className="text-slate-500 font-normal">(opsional verifikasi)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama jika ada"
                      className="w-full pl-9 pr-10 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Kata Sandi Baru <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomPassword}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Buat kata sandi acak yang aman"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Acak Sandi Kuat</span>
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 4 karakter"
                      required
                      className="w-full pl-9 pr-10 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Kekuatan Sandi:</span>
                        <span className={`font-semibold ${passwordStrength.text}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-800'}`} />
                        <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-800'}`} />
                        <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-800'}`} />
                        <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-slate-800'}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Konfirmasi Kata Sandi Baru <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      required
                      className="w-full pl-9 pr-10 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Kata Sandi'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        );
      })()}
    </>
  );
};
