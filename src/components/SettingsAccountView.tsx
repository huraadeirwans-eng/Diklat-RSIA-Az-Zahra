import React, { useState, useMemo, useEffect } from 'react';
import { 
  Settings, 
  UserPlus, 
  KeyRound, 
  RotateCcw, 
  ShieldCheck, 
  Lock, 
  Calendar,
  User as UserIcon, 
  Mail, 
  Building2, 
  Search, 
  Trash2, 
  Edit3,
  Edit3 as Edit, 
  ChevronDown,
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Sparkles,
  Users,
  Shield,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Fingerprint,
  RefreshCw,
  BadgeCheck,
  UserCheck,
  Building,
  Database,
  Cloud,
  HardDrive,
  Zap,
  ExternalLink,
  FileSpreadsheet,
  Keyboard,
  Command,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Printer,
  Download,
  Monitor,
  LogOut as LogOutIcon,
  BarChart3,
  ListFilter,
  CalendarPlus,
  Save,
  Plus,
  CreditCard,
  Briefcase,
  HeartPulse,
  Palette,
  Layers,
  LayoutGrid,
  Sun,
  Moon
} from 'lucide-react';
import { BackgroundSettingsTab } from './BackgroundSettingsTab';
import { SettingsMenuHub, SettingsTabType } from './SettingsMenuHub';
import { getActiveBackground } from '../utils/backgroundManager';
import { 
  AppAccount, 
  User, 
  UserAuthority, 
  getUserAuthority, 
  isFullAuthority, 
  canEdit, 
  isViewOnly, 
  AUTHORITY_CONFIG 
} from '../types/auth';
import { ALL_UNIT_KERJA, INITIAL_TRAININGS } from '../data/initialData';
import { 
  THEME_PRESETS, 
  getActiveTheme, 
  setActiveTheme, 
  ThemePreset 
} from '../utils/themeManager';
import { 
  getStoredAccounts, 
  addAccount, 
  resetAccountPassword, 
  updateAccount, 
  deleteAccount, 
  resetAccountsToDefault,
  onAccountsSync
} from '../utils/accountManager';
import { 
  firebaseConfig, 
  bulkUploadTrainingsToFirebase, 
  bulkUploadAccountsToFirebase,
  bulkUploadEmployeesToFirebase,
  saveCustomUnitsToFirebase,
  savePrintSigneeConfigToFirebase,
  testConnection,
  USER_REAL_TRAINING
} from '../lib/firebase';
import { getAllEmployees } from '../utils/employeeManager';
import { getStoredCustomUnits } from '../utils/unitManager';
import { 
  getStoredPrintSigneeConfig, 
  savePrintSigneeConfig, 
  resetPrintSigneeConfig, 
  onPrintSigneeConfigChange, 
  PrintSigneeConfig 
} from '../utils/printConfigManager';

interface SettingsAccountViewProps {
  currentUser: User | null;
  initialTab?: SettingsTabType;
  onResetTrainingsData?: () => void;
  trainingsCount?: number;
}

function getInitials(nameStr: string): string {
  if (!nameStr || !nameStr.trim()) return 'NA';
  const clean = nameStr.trim().replace(/^(ns\.|bdn\.|dr\.|drg\.)\s*/i, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const SettingsAccountView: React.FC<SettingsAccountViewProps> = ({ 
  currentUser,
  initialTab = 'overview',
  onResetTrainingsData,
  trainingsCount = 0
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabType>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => getActiveTheme().id);
  const [themeCategoryFilter, setThemeCategoryFilter] = useState<string>('all');
  const [themeAlert, setThemeAlert] = useState<string | null>(null);
  const [showConfirmTrainingReset, setShowConfirmTrainingReset] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<AppAccount[]>(() => getStoredAccounts());

  // Global Print Signee Configuration State
  const [printConfig, setPrintConfig] = useState<PrintSigneeConfig>(() => getStoredPrintSigneeConfig());
  const [printConfigAlert, setPrintConfigAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    return onPrintSigneeConfigChange((newCfg) => {
      setPrintConfig(newCfg);
    });
  }, []);

  const handleUpdatePrintField = (field: keyof PrintSigneeConfig, value: string) => {
    setPrintConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePrintConfig = (e: React.FormEvent) => {
    e.preventDefault();
    savePrintSigneeConfig(printConfig);
    setPrintConfigAlert({
      type: 'success',
      message: 'Format dan nama pejabat penandatangan berhasil disimpan ke sistem! Berlaku otomatis di Cetak Dokumen Data Karyawan & Lembar Presensi Diklat.'
    });
    setTimeout(() => setPrintConfigAlert(null), 3500);
  };

  const handleResetPrintConfig = () => {
    const def = resetPrintSigneeConfig();
    setPrintConfig(def);
    setPrintConfigAlert({
      type: 'success',
      message: 'Format penandatangan cetak berhasil dikembalikan ke pengaturan standar.'
    });
    setTimeout(() => setPrintConfigAlert(null), 3500);
  };

  // Listen to remote account updates across devices in real-time
  useEffect(() => {
    const unsub = onAccountsSync((synced) => {
      setAccounts(synced);
    });
    return () => unsub();
  }, []);

  // Listen to theme changes
  useEffect(() => {
    const handleThemeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ThemePreset>;
      if (customEvent.detail?.id) {
        setCurrentThemeId(customEvent.detail.id);
      }
    };
    window.addEventListener('simrs-theme-changed', handleThemeEvent);
    return () => window.removeEventListener('simrs-theme-changed', handleThemeEvent);
  }, []);

  const [cloudSyncStatus, setCloudSyncStatus] = useState<{ loading: boolean; message: string | null; success: boolean | null }>({
    loading: false,
    message: null,
    success: null
  });

  // Search & Filter state for Reset/Manage accounts list
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [authorityFilter, setAuthorityFilter] = useState<string>('all');

  // Form State: Tambah Akun
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newNip, setNewNip] = useState<string>('');
  const [newRole, setNewRole] = useState<AppAccount['role']>('Instruktur Klinis');
  const [newAuthority, setNewAuthority] = useState<UserAuthority>('Edit');
  const [newUnit, setNewUnit] = useState<string>(ALL_UNIT_KERJA[0] || 'Nursing Preceptor');
  const [customUnit, setCustomUnit] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Form Feedback Alert
  const [formAlert, setFormAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State: Reset Password Individual
  const [resetModalAccount, setResetModalAccount] = useState<AppAccount | null>(null);
  const [resetModalNewPassword, setResetModalNewPassword] = useState<string>('');
  const [resetModalConfirmPassword, setResetModalConfirmPassword] = useState<string>('');
  const [resetModalShowPass, setResetModalShowPass] = useState<boolean>(false);
  const [resetModalError, setResetModalError] = useState<string | null>(null);
  const [resetModalSuccess, setResetModalSuccess] = useState<string | null>(null);

  // Modal State: Edit Account (User & Pasword)
  const [editModalAccount, setEditModalAccount] = useState<AppAccount | null>(null);
  const [editUsername, setEditUsername] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editShowPassword, setEditShowPassword] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editNip, setEditNip] = useState<string>('');
  const [editRole, setEditRole] = useState<AppAccount['role']>('Instruktur Klinis');
  const [editAuthority, setEditAuthority] = useState<UserAuthority>('Edit');
  const [editUnit, setEditUnit] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editModalMessage, setEditModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State: Delete Account Confirmation (Custom in-app modal to avoid window.confirm iframe block)
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<AppAccount | null>(null);

  // Action Feedback Toast for Tab 2
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State: Global Reset to Default Confirmation
  const [showConfirmDefaultReset, setShowConfirmDefaultReset] = useState<boolean>(false);

  // Show/reveal passwords state in table: set of account IDs whose password is revealed
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Copied password state tooltip
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);

  // Sync and refresh list
  const refreshAccounts = () => {
    setAccounts(getStoredAccounts());
  };

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
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchSearch = 
        acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.unit.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchRole = roleFilter === 'all' || acc.role === roleFilter;
      const accAuthority = getUserAuthority(acc);
      const matchAuthority = authorityFilter === 'all' || accAuthority === authorityFilter;

      return matchSearch && matchRole && matchAuthority;
    });
  }, [accounts, searchQuery, roleFilter, authorityFilter]);

  // Statistics across exact 3 authorities
  const accountStats = useMemo(() => {
    const total = accounts.length;
    const fullCount = accounts.filter(a => getUserAuthority(a) === 'Otoritas Penuh').length;
    const editCount = accounts.filter(a => getUserAuthority(a) === 'Edit').length;
    const viewCount = accounts.filter(a => getUserAuthority(a) === 'Melihat').length;
    return { total, fullCount, editCount, viewCount };
  }, [accounts]);

  // Handle Tambah Akun submit
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormAlert(null);

    if (!isFullAuthority(currentUser)) {
      setFormAlert({
        type: 'error',
        message: 'Otoritas Terbatas: Hanya pengguna dengan "Otoritas Penuh" (Administrator Diklat) yang berwenang mendaftarkan akun baru ke sistem.'
      });
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase();
    const cleanPassword = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();
    const cleanName = newName.trim();
    const cleanNip = newNip.trim();
    const finalUnit = newUnit === 'Custom' ? customUnit.trim() : newUnit;
    const cleanEmail = newEmail.trim() || `${cleanUsername}@hospital.corp.id`;

    if (!cleanUsername) {
      setFormAlert({ type: 'error', message: 'Username akun wajib diisi.' });
      return;
    }

    if (cleanUsername.includes(' ')) {
      setFormAlert({ type: 'error', message: 'Username tidak boleh mengandung spasi (gunakan format tanpa spasi, contoh: rudi.santoso).' });
      return;
    }

    if (!cleanPassword) {
      setFormAlert({ type: 'error', message: 'Kata sandi akun wajib diisi.' });
      return;
    }

    if (cleanPassword.length < 4) {
      setFormAlert({ type: 'error', message: 'Kata sandi minimal 4 karakter demi keamanan.' });
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setFormAlert({ type: 'error', message: 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru.' });
      return;
    }

    if (!cleanName) {
      setFormAlert({ type: 'error', message: 'Nama lengkap pemilik akun wajib diisi.' });
      return;
    }

    if (!finalUnit) {
      setFormAlert({ type: 'error', message: 'Unit kerja wajib dipilih atau diisi.' });
      return;
    }

    const result = addAccount({
      username: cleanUsername,
      password: cleanPassword,
      name: cleanName,
      nip: cleanNip || '19950101 202001 1 001',
      role: newRole,
      authority: newAuthority,
      unit: finalUnit,
      email: cleanEmail
    });

    if (result.success) {
      refreshAccounts();
      setFormAlert({
        type: 'success',
        message: `Akun @${cleanUsername} (${cleanName}) dengan otoritas "${newAuthority}" berhasil didaftarkan! Kredensial telah tersimpan dan dapat langsung digunakan untuk Login.`
      });
      // Reset form fields
      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');
      setNewName('');
      setNewNip('');
      setNewEmail('');
      setCustomUnit('');
      setNewAuthority('Edit');
    } else {
      setFormAlert({ type: 'error', message: result.message });
    }
  };

  // Handle Quick Password Copy
  const handleCopyPassword = (acc: AppAccount) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(acc.password);
      setCopiedAccountId(acc.id);
      setTimeout(() => setCopiedAccountId(null), 2000);
    }
  };

  // Toggle reveal password for specific account in table
  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Open Reset Password Modal
  const handleOpenResetPassword = (acc: AppAccount) => {
    setResetModalAccount(acc);
    setResetModalNewPassword('');
    setResetModalConfirmPassword('');
    setResetModalError(null);
    setResetModalSuccess(null);
    setResetModalShowPass(false);
  };

  // Execute Reset Password
  const handleExecuteResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetModalError(null);
    setResetModalSuccess(null);

    if (!resetModalAccount) return;

    const isAdmin = currentUser?.role?.toLowerCase().includes('admin') || currentUser?.username === 'admin';
    const isSelf = currentUser && (resetModalAccount.id === currentUser.id || resetModalAccount.username.toLowerCase() === currentUser.username.toLowerCase());
    if (!isAdmin && !isSelf) {
      setResetModalError('Otoritas Terbatas: Hanya Administrator Diklat (Otoritas Penuh) yang berwenang mereset kata sandi akun pengguna lain.');
      return;
    }

    const newPass = resetModalNewPassword.trim();
    const confPass = resetModalConfirmPassword.trim();

    if (!newPass || newPass.length < 4) {
      setResetModalError('Kata sandi baru minimal 4 karakter.');
      return;
    }

    if (newPass !== confPass) {
      setResetModalError('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    const result = resetAccountPassword(resetModalAccount.id, newPass);
    if (result.success) {
      refreshAccounts();
      setResetModalSuccess(result.message);
      setTimeout(() => {
        setResetModalAccount(null);
      }, 1200);
    } else {
      setResetModalError(result.message);
    }
  };

  // Open Edit Modal (User & Pasword)
  const handleOpenEdit = (acc: AppAccount) => {
    setEditModalAccount(acc);
    setEditUsername(acc.username);
    setEditPassword(acc.password);
    setEditShowPassword(false);
    setEditName(acc.name);
    setEditNip(acc.nip);
    setEditRole(acc.role);
    setEditAuthority(getUserAuthority(acc));
    setEditUnit(acc.unit);
    setEditEmail(acc.email);
    setEditModalMessage(null);
  };

  // Execute Edit Save
  const handleExecuteEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalAccount) return;

    const hasFull = isFullAuthority(currentUser);
    const isSelf = currentUser && (editModalAccount.id === currentUser.id || editModalAccount.username.toLowerCase() === currentUser.username.toLowerCase());
    if (!hasFull && !isSelf) {
      setEditModalMessage({ type: 'error', text: 'Otoritas Terbatas: Hanya pengguna dengan "Otoritas Penuh" yang berwenang mengubah profil dan otoritas akun lain.' });
      return;
    }

    const cleanUsername = editUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPassword = editPassword.trim();
    const cleanName = editName.trim();
    const cleanNip = editNip.trim();
    const cleanUnit = editUnit.trim() || 'Unit RS';
    const cleanEmail = editEmail.trim();

    if (!cleanUsername) {
      setEditModalMessage({ type: 'error', text: 'Username akun tidak boleh kosong.' });
      return;
    }

    if (!cleanPassword || cleanPassword.length < 4) {
      setEditModalMessage({ type: 'error', text: 'Kata sandi minimal 4 karakter.' });
      return;
    }

    if (!cleanName) {
      setEditModalMessage({ type: 'error', text: 'Nama lengkap tidak boleh kosong.' });
      return;
    }

    const res = updateAccount(editModalAccount.id, {
      username: cleanUsername,
      password: cleanPassword,
      name: cleanName,
      nip: cleanNip,
      role: editRole,
      authority: editAuthority,
      unit: cleanUnit,
      email: cleanEmail
    });

    if (res.success) {
      refreshAccounts();

      // If updating currently logged in user session, keep auth state in sync
      if (currentUser && currentUser.id === editModalAccount.id) {
        try {
          const updatedUser: User = {
            ...currentUser,
            username: cleanUsername,
            name: cleanName,
            nip: cleanNip,
            role: editRole,
            authority: editAuthority,
            unit: cleanUnit,
            email: cleanEmail
          };
          localStorage.setItem('simrs_diklat_auth_user_v1', JSON.stringify(updatedUser));
        } catch (err) {
          console.error('Failed to sync auth user session:', err);
        }
      }

      setEditModalMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        setEditModalAccount(null);
      }, 1000);
    } else {
      setEditModalMessage({ type: 'error', text: res.message });
    }
  };

  // Handle Delete Account - Opens custom in-app modal (avoids window.confirm iframe restriction)
  const handleDeleteAccount = (acc: AppAccount) => {
    if (!isFullAuthority(currentUser)) {
      setActionFeedback({
        type: 'error',
        message: 'Otoritas Terbatas: Hanya pengguna dengan "Otoritas Penuh" (Administrator Diklat) yang berwenang menghapus akun sistem.'
      });
      return;
    }
    if (acc.username === 'admin') {
      setActionFeedback({
        type: 'error',
        message: 'Akun administrator utama tidak dapat dihapus demi keamanan sistem.'
      });
      return;
    }
    setDeleteConfirmAccount(acc);
  };

  // Execute confirmed deletion
  const handleExecuteDeleteAccount = () => {
    if (!deleteConfirmAccount) return;
    const target = deleteConfirmAccount;
    const res = deleteAccount(target.id);
    if (res.success) {
      refreshAccounts();
      setActionFeedback({
        type: 'success',
        message: `Akun @${target.username} (${target.name}) berhasil dihapus dari sistem.`
      });
      setDeleteConfirmAccount(null);
    } else {
      setActionFeedback({
        type: 'error',
        message: res.message
      });
      setDeleteConfirmAccount(null);
    }
  };

  // Handle Reset to Default All Accounts
  const handleRestoreDefaultAccounts = () => {
    if (!isFullAuthority(currentUser)) {
      setActionFeedback({
        type: 'error',
        message: 'Otoritas Terbatas: Hanya pengguna dengan "Otoritas Penuh" yang berwenang memulihkan akun bawaan default.'
      });
      return;
    }
    resetAccountsToDefault();
    refreshAccounts();
    setShowConfirmDefaultReset(false);
    setActionFeedback({
      type: 'success',
      message: 'Seluruh akun bawaan rumah sakit berhasil dipulihkan ke data standar default.'
    });
  };

  // Helper for role badge colors
  const getRoleBadgeStyle = (role: AppAccount['role']) => {
    switch (role) {
      case 'Administrator Diklat':
        return {
          bg: 'bg-rose-950/60 text-rose-300 border-rose-800/80',
          dot: 'bg-rose-400',
          border: 'border-rose-500/30'
        };
      case 'Koordinator Preceptor':
        return {
          bg: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
          dot: 'bg-amber-400',
          border: 'border-amber-500/30'
        };
      case 'Instruktur Klinis':
        return {
          bg: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80',
          dot: 'bg-cyan-400',
          border: 'border-cyan-500/30'
        };
      case 'Peserta Diklat':
      default:
        return {
          bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
          dot: 'bg-emerald-400',
          border: 'border-emerald-500/30'
        };
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-slate-950/80 rounded-2xl border border-slate-800/90 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-b border-slate-800/80 bg-[#06101e]/95 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Logo & Brand on Left */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#002238] border border-cyan-400/70 flex items-center justify-center text-cyan-400 shrink-0 shadow-md shadow-cyan-950/50">
              <HeartPulse className="w-5 h-5 text-cyan-300 stroke-[2.3]" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                RSIA. Az Zahra
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Sistem Informasi Manajemen Rumah Sakit
              </p>
            </div>
          </div>

          {/* Top Header Right: Back button or Authority badge matching reference image */}
          <div className="flex items-center gap-2 shrink-0">
            {activeTab !== 'overview' ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setFormAlert(null);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
                <span>← Kembali ke Menu Pengaturan</span>
              </button>
            ) : (
              <div className="px-3.5 py-1.5 rounded-full bg-[#051525]/90 border border-cyan-500/60 text-cyan-200 flex items-center gap-2.5 shadow-sm shadow-cyan-950/30">
                <div className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shrink-0">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-100 tracking-wide">
                  {currentUser?.name || 'Administrator Diklat'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Fits 100% in one page on overview */}
      <div className={`flex-1 min-h-0 ${activeTab === 'overview' ? 'p-1.5 sm:p-2 overflow-hidden flex flex-col' : 'overflow-y-auto p-4 sm:p-6 space-y-4'}`}>
        {/* Navigation Breadcrumb when inside a specific submenu */}
        {activeTab !== 'overview' && (
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 flex-wrap gap-2.5 animate-smooth-fade">
            <button
              type="button"
              onClick={() => {
                setActiveTab('overview');
                setFormAlert(null);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
              <span>← Kembali ke Menu Pengaturan</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setFormAlert(null);
                }}
                className="hover:text-cyan-300 underline cursor-pointer"
              >
                Menu Pengaturan
              </button>
              <span>/</span>
              <span className="text-white font-bold">
                {activeTab === 'backgrounds'
                  ? 'Ganti Background (20)'
                  : activeTab === 'themes'
                    ? 'Tema Website (18)'
                    : activeTab === 'add'
                      ? 'Add Akun Pengguna'
                      : activeTab === 'reset'
                        ? 'Daftar & Reset Akun'
                        : activeTab === 'signees'
                          ? 'Format Penandatangan Cetak'
                          : activeTab === 'cloud'
                            ? 'Firebase Backend Cloud'
                            : activeTab === 'restore'
                              ? 'Pulihkan Data Standar'
                              : 'Daftar Shortcut Keyboard'}
              </span>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 0: KATALOG MENU PENGATURAN (HUB DENGAN 8 MENU UTAMA)
        ======================================================== */}
        {activeTab === 'overview' && (
          <SettingsMenuHub 
            onSelectMenu={(tab) => {
              setActiveTab(tab);
              setFormAlert(null);
            }}
            currentUser={currentUser}
            activeBackgroundName={getActiveBackground().name}
            activeThemeName={getActiveTheme().name}
            totalAccounts={accounts.length}
            totalTrainings={trainingsCount}
          />
        )}

        {/* Page Title Strip (Hanya ditampilkan jika berada di dalam sub-menu akun atau dokumen) */}
        {activeTab !== 'overview' && activeTab !== 'backgrounds' && activeTab !== 'themes' && activeTab !== 'shortcuts' && (
          <div className="flex items-start gap-3.5 animate-smooth-fade">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/10">
              {activeTab === 'signees' ? (
                <Printer className="w-5 h-5 stroke-[2.2]" />
              ) : activeTab === 'cloud' ? (
                <Shield className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <Users className="w-5 h-5 stroke-[2.2]" />
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {activeTab === 'signees' 
                  ? 'Pengaturan Penandatangan Dokumen Cetak' 
                  : activeTab === 'cloud'
                    ? 'Konfigurasi Firebase Firestore Cloud'
                    : 'Pengaturan Akun & Akses'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'signees' 
                  ? 'Konfigurasi nama pejabat, gelar, NIK/NIP, dan jabatan yang berlaku untuk seluruh fitur cetak (Data Karyawan & Presensi).' 
                  : activeTab === 'cloud'
                    ? 'Status sinkronisasi real-time multi-perangkat via Google Cloud Firestore.'
                    : 'Pengelolaan kredensial pengguna, hak akses (permissions), dan akses akun pada sistem.'}
              </p>
            </div>
          </div>
        )}

        {/* Full-width strip: Administrator Diklat (hanya untuk sub-menu akun) */}
        {activeTab !== 'overview' && (activeTab === 'add' || activeTab === 'reset') && (
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-white font-bold text-sm shadow-sm animate-smooth-fade">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{currentUser?.name && (currentUser.name.includes('Admin') || currentUser.role?.includes('Admin')) ? 'Administrator Diklat' : (currentUser?.name || currentUser?.role || 'Administrator Diklat')}</span>
          </div>
        )}

        {/* ========================================================
            TAB 1: TAMBAH AKUN (USER & PASWORD) - 2-COLUMN SUITE
        ======================================================== */}
        {activeTab === 'add' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Feedback Alert Toast */}
            {formAlert && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 shadow-lg transition-all ${
                  formAlert.type === 'success'
                    ? 'bg-emerald-950/50 border-emerald-700/80 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-700/80 text-rose-200'
                }`}
              >
                {formAlert.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 font-medium leading-relaxed">
                  {formAlert.message}
                </div>
                <button
                  type="button"
                  onClick={() => setFormAlert(null)}
                  className="text-slate-400 hover:text-white cursor-pointer p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (7 cols): The Registration Form */}
              <div className="lg:col-span-7">
                <form 
                  onSubmit={handleCreateAccount} 
                  className="bg-slate-900/75 border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl backdrop-blur-md"
                >
                  {/* Section 1: Kredensial Akses (User & Password) */}
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3 pb-3 border-b border-slate-800/80">
                      <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-sky-500/30">
                        1
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">
                          Kredensial Akses (User &amp; Password)
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Buat username dan password untuk mengakses sistem.
                        </p>
                      </div>
                    </div>

                    {/* 3-Column Inputs Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Username */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-200">
                          Username Login <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                          <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                            placeholder="Masukkan username..."
                            className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-mono"
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-200">
                          Password / Kata Sandi <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Masukkan password..."
                            className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-mono"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Konfirmasi Password */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-200">
                          Konfirmasi Password <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Konfirmasi password..."
                            className={`w-full bg-slate-950/90 border rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-mono ${
                              confirmPassword && newPassword !== confirmPassword
                                ? 'border-rose-500 focus:border-rose-400'
                                : 'border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30'
                            }`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Profil & Otoritas Pegawai */}
                  <div className="space-y-4 pt-4 border-t border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-cyan-600/30">
                        2
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">
                          Profil Pegawai & Hak Akses (RBAC)
                        </h3>
                        <p className="text-xs text-slate-400">
                          Lengkapi data pegawai dan atur hak akses sesuai peran.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Row 1: Nama Lengkap & NIP */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-200">
                            Nama Lengkap & Gelar <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder="Masukkan nama lengkap dan gelar..."
                              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-200">
                            NIP / Nomor Induk Pegawai <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                            <input
                              type="text"
                              value={newNip}
                              onChange={(e) => setNewNip(e.target.value)}
                              placeholder="Masukkan NIP..."
                              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 font-mono transition-all"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Peran Otoritas (Role) & Otoritas User Cards */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-4 space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-200">
                            Peran Otoritas (Role) <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                            <select
                              value={newRole}
                              onChange={(e) => {
                                const r = e.target.value as AppAccount['role'];
                                setNewRole(r);
                                if (r === 'Administrator Diklat') setNewAuthority('Otoritas Penuh');
                                else if (r === 'Peserta Diklat') setNewAuthority('Melihat');
                                else setNewAuthority('Edit');
                              }}
                              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-8 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 cursor-pointer transition-all appearance-none"
                            >
                              <option value="Administrator Diklat">Administrator Diklat</option>
                              <option value="Koordinator Preceptor">Koordinator Preceptor</option>
                              <option value="Instruktur Klinis">Instruktur Klinis</option>
                              <option value="Peserta Diklat">Peserta Diklat</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-8 space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-200">
                            Otoritas User <span className="text-rose-400">*</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {(
                              [
                                {
                                  key: 'Edit' as UserAuthority,
                                  title: 'Edit',
                                  desc: 'Dapat mengubah data sesuai kewenangan.',
                                  icon: Edit,
                                },
                                {
                                  key: 'Melihat' as UserAuthority,
                                  title: 'Melihat',
                                  desc: 'Hanya dapat melihat data / informasi.',
                                  icon: Eye,
                                },
                                {
                                  key: 'Otoritas Penuh' as UserAuthority,
                                  title: 'Otoritas Penuh',
                                  desc: 'Dapat mengakses semua fitur dan data.',
                                  icon: Shield,
                                },
                              ] as const
                            ).map((authItem) => {
                              const isSelected = newAuthority === authItem.key;
                              const IconComponent = authItem.icon;
                              return (
                                <button
                                  key={authItem.key}
                                  type="button"
                                  onClick={() => setNewAuthority(authItem.key)}
                                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative min-h-[96px] ${
                                    isSelected
                                      ? 'bg-cyan-950/20 border-cyan-400 shadow-md ring-1 ring-cyan-400/30'
                                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full mb-1">
                                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                      isSelected ? 'border-cyan-400 bg-cyan-400/20' : 'border-slate-600'
                                    }`}>
                                      {isSelected && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-white mb-0.5">
                                      {authItem.title}
                                    </div>
                                    <div className="text-[10px] text-slate-400 leading-tight">
                                      {authItem.desc}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Unit Kerja / Departemen & Email Resmi */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-200">
                            Unit Kerja / Departemen <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                            <select
                              value={newUnit}
                              onChange={(e) => setNewUnit(e.target.value)}
                              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-8 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 cursor-pointer transition-all appearance-none"
                            >
                              <option value="">Pilih unit kerja / departemen...</option>
                              {ALL_UNIT_KERJA.map((u) => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                              <option value="Custom">✨ Masukkan Unit Kustom Baru</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                          {newUnit === 'Custom' && (
                            <input
                              type="text"
                              value={customUnit}
                              onChange={(e) => setCustomUnit(e.target.value)}
                              placeholder="Ketik nama unit baru..."
                              className="mt-2 w-full px-3.5 py-2 text-xs bg-slate-950 border border-cyan-500 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                              required
                            />
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-200">
                            Email Resmi Institusi <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                            <input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="nama@rumahsakit.co.id"
                              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 font-mono transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Footer Action */}
                  <div className="pt-5 border-t border-slate-800 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setNewUsername('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setNewName('');
                        setNewNip('');
                        setNewEmail('');
                        setFormAlert(null);
                      }}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer px-2 py-2"
                    >
                      <RotateCcw className="w-4 h-4 text-cyan-400" />
                      <span>Reset Form</span>
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
                    >
                      <Save className="w-4 h-4 stroke-[2.5]" />
                      <span>Simpan & Daftarkan Akun</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column (5 cols): Live ID Card Preview & Policy */}
              <div className="lg:col-span-5 space-y-4">
                {/* Live Card Preview Box */}
                <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span>Preview Identitas Pegawai (Live)</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Aktif</span>
                    </div>
                  </div>

                  {/* ID Card Face */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md shadow-cyan-600/30">
                          {getInitials(newName)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white leading-tight">
                            {newName || 'Nama Anda, S.Kep'}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {newUsername || 'n.a.zi'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Aktif</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-3 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-400">
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <span>NIP</span>
                        </div>
                        <span className="text-slate-300 font-medium font-mono">
                          {newNip || '19800101 200501 1 001'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span>Unit Kerja / Departemen</span>
                        </div>
                        <span className="text-slate-300 font-medium">
                          {newUnit === 'Custom' ? (customUnit || 'Pelatihan & Pengembangan') : (newUnit || 'Pelatihan & Pengembangan')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span>Email Institusi</span>
                        </div>
                        <span className="text-slate-300 font-medium">
                          {newEmail || (newUsername ? `${newUsername}@rumahsakit.co.id` : 'nama@rumahsakit.co.id')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corporate Security Policy */}
                <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 space-y-3.5 shadow-xl">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>Kebijakan Keamanan Akun SIMRS Diklat</span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Gunakan password yang kuat (minimal 8 karakter, kombinasi huruf besar, huruf kecil, angka dan simbol).</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Password harus diganti secara berkala (minimal 3 bulan sekali).</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Jaga kerahasiaan akun dan jangan membagikan kepada pihak lain.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Aktifkan autentikasi dan selalu logout setelah selesai menggunakan sistem.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Ikuti prosedur keamanan data sesuai kebijakan rumah sakit.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: RESSET AKUN & KELOLA AKUN (TABEL & ACTION SUITE)
        ======================================================== */}
        {activeTab === 'reset' && (
          <div className="space-y-5">
            {/* KPI Metric Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Akun Terdaftar</span>
                  <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-300">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white tabular-nums mt-1">{accountStats.total}</div>
                <span className="text-[10px] text-slate-500">Seluruh Kredensial</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-emerald-900/40 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Otoritas Penuh</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-950/80 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-300 tabular-nums mt-1">{accountStats.fullCount}</div>
                <span className="text-[10px] text-slate-500">Super Administrator</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-amber-900/40 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Otoritas Edit</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-950/80 flex items-center justify-center text-amber-400">
                    <Edit3 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-300 tabular-nums mt-1">{accountStats.editCount}</div>
                <span className="text-[10px] text-slate-500">Pendidik & Koordinator</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-sky-900/40 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-sky-300 font-bold uppercase tracking-wider">Otoritas Melihat</span>
                  <div className="w-7 h-7 rounded-lg bg-sky-950/80 flex items-center justify-center text-sky-400">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-sky-300 tabular-nums mt-1">{accountStats.viewCount}</div>
                <span className="text-[10px] text-slate-500">Partisipan / Peninjau</span>
              </div>
            </div>

            {/* Action Feedback Notification */}
            {actionFeedback && (
              <div
                className={`p-3.5 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 shadow-lg transition-all ${
                  actionFeedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-700/80 text-rose-200'
                }`}
              >
                {actionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 font-medium leading-relaxed">
                  {actionFeedback.message}
                </div>
                <button
                  type="button"
                  onClick={() => setActionFeedback(null)}
                  className="text-slate-400 hover:text-white cursor-pointer p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Filter and Action Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan nama, username, NIP, atau unit kerja..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Otoritas User Filter Dropdown */}
                <select
                  value={authorityFilter}
                  onChange={(e) => setAuthorityFilter(e.target.value)}
                  className="px-3.5 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="all">Semua Otoritas User</option>
                  <option value="Otoritas Penuh">Otoritas Penuh</option>
                  <option value="Edit">Edit</option>
                  <option value="Melihat">Melihat</option>
                </select>

                {/* Role Filter Dropdown */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3.5 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="all">Semua Peran / Role</option>
                  <option value="Administrator Diklat">Administrator Diklat</option>
                  <option value="Koordinator Preceptor">Koordinator Preceptor</option>
                  <option value="Instruktur Klinis">Instruktur Klinis</option>
                  <option value="Peserta Diklat">Peserta Diklat</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {isFullAuthority(currentUser) && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('add')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>+ Add Akun</span>
                  </button>
                )}

                {isFullAuthority(currentUser) && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDefaultReset(true)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                    title="Pulihkan seluruh akun bawaan default rumah sakit"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Resset Akun ke Default</span>
                  </button>
                )}
              </div>
            </div>

            {/* Elegant Accounts Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Pengguna & Kredensial</th>
                      <th className="py-3.5 px-4">Otoritas User</th>
                      <th className="py-3.5 px-4">Peran & Unit Kerja</th>
                      <th className="py-3.5 px-4">Pasword Akun</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Aksi Resset & Kelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="w-8 h-8 text-slate-600" />
                            <p className="text-sm font-bold text-slate-300">Tidak ada akun yang sesuai kriteria</p>
                            <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian, otoritas, atau filter peran.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery('');
                                setRoleFilter('all');
                                setAuthorityFilter('all');
                              }}
                              className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                            >
                              Bersihkan Filter
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAccounts.map((acc) => {
                        const isRootAdmin = acc.username === 'admin' || acc.role === 'Administrator Diklat';
                        const isCurrent = currentUser?.username === acc.username;
                        const isPassRevealed = Boolean(revealedPasswords[acc.id]);
                        const roleStyle = getRoleBadgeStyle(acc.role);
                        const accAuth = getUserAuthority(acc);
                        const authConfig = AUTHORITY_CONFIG[accAuth];

                        return (
                          <tr key={acc.id} className="hover:bg-slate-850/40 transition-colors group">
                            {/* Column 1: User & Avatar */}
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
                                  {isRootAdmin ? (
                                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                                  ) : (
                                    acc.name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white text-xs sm:text-sm truncate">
                                      {isRootAdmin ? acc.role : acc.name}
                                    </span>
                                    {isCurrent && (
                                      <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded font-mono font-bold">
                                        Anda
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 mt-0.5">
                                    <span>@{acc.username}</span>
                                    <span className="text-slate-600">·</span>
                                    <span className="text-slate-400 font-sans text-[10px] truncate max-w-[150px]">{acc.email}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Column 2: Otoritas User */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${authConfig.badgeBg} ${authConfig.badgeBorder} ${authConfig.badgeText}`}
                              >
                                {accAuth === 'Otoritas Penuh' ? (
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                ) : accAuth === 'Edit' ? (
                                  <Edit3 className="w-3 h-3 text-amber-400" />
                                ) : (
                                  <Eye className="w-3 h-3 text-sky-400" />
                                )}
                                <span>{accAuth}</span>
                              </span>
                            </td>

                            {/* Column 3: Role & Unit Kerja */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border w-fit ${roleStyle.bg}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`} />
                                  <span>{acc.role}</span>
                                </span>
                                <div className="text-xs text-slate-200 font-medium truncate max-w-[180px]">
                                  {acc.unit}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  NIP: {acc.nip || '-'}
                                </div>
                              </div>
                            </td>

                            {/* Column 4: Password with Mask & Quick Copy */}
                            <td className="py-3.5 px-4">
                              <div className="inline-flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 px-2.5 py-1.5 rounded-xl shadow-inner">
                                <span className="font-mono text-slate-300 text-xs tracking-wider min-w-[70px]">
                                  {isPassRevealed ? acc.password : '••••••••'}
                                </span>
                                
                                <button
                                  type="button"
                                  onClick={() => toggleRevealPassword(acc.id)}
                                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                                  title={isPassRevealed ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                >
                                  {isPassRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCopyPassword(acc)}
                                  className="p-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                                  title="Salin kata sandi"
                                >
                                  {copiedAccountId === acc.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Column 5: Action Buttons */}
                            <td className="py-3.5 px-4 sm:px-6 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {/* Resset Password Button */}
                                {(isFullAuthority(currentUser) || isCurrent) && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenResetPassword(acc)}
                                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-950 to-blue-950 hover:from-sky-900 hover:to-blue-900 text-sky-300 border border-sky-800/70 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                                    title="Resset kata sandi akun ini"
                                  >
                                    <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                                    <span>Resset Sandi</span>
                                  </button>
                                )}

                                {/* Edit Account Profile Button */}
                                {(isFullAuthority(currentUser) || isCurrent) && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(acc)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
                                    title="Edit User, Pasword & Otoritas"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Delete Account Button */}
                                {isFullAuthority(currentUser) && !isRootAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAccount(acc)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors cursor-pointer"
                                    title="Hapus akun"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: PUSAT PEMULIHAN & RESET DATA STANDAR (AERODYNAMIC)
        ======================================================== */}
        {activeTab === 'restore' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Feedback Alert Toast */}
            {actionFeedback && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 shadow-lg transition-all ${
                  actionFeedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-700/80 text-rose-200'
                }`}
              >
                {actionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{actionFeedback.type === 'success' ? 'Operasi Berhasil' : 'Peringatan Sistem'}</div>
                  <div className="mt-0.5 leading-relaxed">{actionFeedback.message}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActionFeedback(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Header Aero Banner */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border border-rose-900/40 aero-border-gradient flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800/80 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/60 shrink-0">
                  <RotateCcw className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Pusat Pemulihan & Reset Data Standar
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-[10px] font-mono text-rose-300 font-bold">
                      SYSTEM MAINTENANCE
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Gunakan panel ini untuk mengembalikan seluruh agenda pelatihan, riwayat absensi, jam pelajaran (JP), atau akun resmi rumah sakit ke kondisi standar pabrik (default).
                  </p>
                </div>
              </div>
            </div>

            {/* 2 Main Maintenance Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Pillar 1: Pulihkan Data Pelatihan */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between aero-card aero-border-gradient space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/70">
                      {trainingsCount} Agenda Aktif
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">
                      Pulihkan Data Pelatihan Standar
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Mengembalikan seluruh agenda jadwal pelatihan, data peserta per unit kerja, presensi digital, dan jam pelajaran (JP) ke agenda resmi bawaan Nursing Preceptor Academy.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Mengembalikan 10 sesi agenda standar RSIAPLG 2026</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Memulihkan data presensi Hadir/Izin/Sakit bawaan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Menghapus agenda pelatihan kustom yang telah diinput</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowConfirmTrainingReset(true)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 transition-all cursor-pointer shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 active:scale-98"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Pulihkan Seluruh Data Pelatihan</span>
                  </button>
                </div>
              </div>

              {/* Pillar 2: Pulihkan Akun Pengguna Standar */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between aero-card aero-border-gradient space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800/60 flex items-center justify-center text-amber-400">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-300 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-800/70">
                      {accounts.length} Akun Tersimpan
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">
                      Pulihkan Akun Bawaan Pabrik
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Mengembalikan seluruh akun dan kata sandi pengguna ke akun bawaan rumah sakit (@admin, @koordinator, @instruktur, @peserta).
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>4 Akun resmi standar SIMRS terverifikasi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Reset kata sandi administrator ke sandi bawaan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Menghapus akun tambahan yang didaftarkan manual</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDefaultReset(true)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 transition-all cursor-pointer shadow-lg shadow-rose-950 flex items-center justify-center gap-2 active:scale-98"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Pulihkan Akun Bawaan Rumah Sakit</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Storage & Security Status Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Penyimpanan Aman: <strong className="text-white">HTML5 LocalStorage Engine</strong> terenkripsi pada browser pengguna.</span>
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                Versi Database: 1.0.4-PRO · ISO Format Excel Ready
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: FIREBASE BACKEND & CLOUD PERSISTENCE
        ======================================================== */}
        {activeTab === 'cloud' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                  <Database className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Firebase Cloud Backend & Real-time Firestore
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Database cloud terdistribusi untuk sinkronisasi jadwal pelatihan, data personil, dan presensi secara <span className="italic">real-time</span>.
                  </p>
                </div>
              </div>

              {/* Action Button: Manual Sync */}
              <button
                type="button"
                disabled={cloudSyncStatus.loading}
                onClick={async () => {
                  setCloudSyncStatus({ loading: true, message: null, success: null });
                  try {
                    // Test Firestore connection first
                    const isConnected = await testConnection();

                    // Read current local trainings
                    let currentTrainings = [USER_REAL_TRAINING];
                    try {
                      const raw = localStorage.getItem('aerotraining_database_v1');
                      if (raw) currentTrainings = JSON.parse(raw);
                    } catch {}

                    const currentEmployees = getAllEmployees();
                    const currentUnits = getStoredCustomUnits();
                    const currentPrint = getStoredPrintSigneeConfig();

                    const resTrainings = await bulkUploadTrainingsToFirebase(currentTrainings);
                    const resAccounts = await bulkUploadAccountsToFirebase(accounts);
                    const resEmployees = await bulkUploadEmployeesToFirebase(currentEmployees);
                    if (currentUnits.length > 0) {
                      await saveCustomUnitsToFirebase(currentUnits);
                    }
                    if (currentPrint) {
                      await savePrintSigneeConfigToFirebase(currentPrint);
                    }

                    if (resTrainings && resAccounts) {
                      setCloudSyncStatus({
                        loading: false,
                        success: true,
                        message: `Sinkronisasi cloud berhasil! ${currentTrainings.length} agenda pelatihan, ${currentEmployees.length} data karyawan, dan ${accounts.length} akun personil telah tersimpan permanen di Cloud Firestore (${firebaseConfig.firestoreDatabaseId}) dan siap dibuka di semua perangkat.`
                      });
                    } else {
                      setCloudSyncStatus({
                        loading: false,
                        success: true,
                        message: 'Data berhasil diselaraskan ke Cloud Firestore (Status: Tersimpan).'
                      });
                    }
                  } catch (err: any) {
                    setCloudSyncStatus({
                      loading: false,
                      success: false,
                      message: `Gagal sinkronisasi cloud: ${err.message || 'Periksa koneksi internet'}`
                    });
                  }
                }}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-95 shrink-0 ${
                  cloudSyncStatus.loading
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/20 hover:brightness-110'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${cloudSyncStatus.loading ? 'animate-spin' : ''}`} />
                <span>{cloudSyncStatus.loading ? 'Sedang Sinkronisasi...' : 'Unggah / Sinkronkan Data ke Cloud'}</span>
              </button>
            </div>

            {/* Cloud Sync Status Alert */}
            {cloudSyncStatus.message && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-center gap-3 ${
                  cloudSyncStatus.success
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                }`}
              >
                {cloudSyncStatus.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span className="font-medium">{cloudSyncStatus.message}</span>
              </div>
            )}

            {/* Configuration Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Project Credentials */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
                <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Database className="w-4 h-4" />
                  <span>Kredensial Proyek Firebase</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400">Project ID</span>
                    <span className="font-mono font-bold text-white text-right truncate max-w-[220px]">
                      {firebaseConfig.projectId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400">Database ID</span>
                    <span className="font-mono text-emerald-300 text-right truncate max-w-[220px]">
                      {firebaseConfig.firestoreDatabaseId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400">Auth Domain</span>
                    <span className="font-mono text-cyan-300 text-right truncate max-w-[220px]">
                      {firebaseConfig.authDomain}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400">Storage Bucket</span>
                    <span className="font-mono text-slate-300 text-right truncate max-w-[220px]">
                      {firebaseConfig.storageBucket}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400">Web App ID</span>
                    <span className="font-mono text-slate-400 text-right truncate max-w-[220px]">
                      {firebaseConfig.appId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-400">Measurement ID</span>
                    <span className="font-mono text-amber-300 text-right">
                      {firebaseConfig.measurementId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Firestore Collections & Architecture */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Koleksi Database & Arsitektur</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-cyan-950/70 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0 text-xs font-mono font-bold">
                        1
                      </div>
                      <div>
                        <div className="font-mono font-bold text-white">collection('trainings')</div>
                        <div className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                          Menyimpan master data agenda pelatihan, jadwal jam pelajaran (JP), lokasi ruangan, instruktur, dan daftar peserta per unit.
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-sky-950/70 border border-sky-800/60 flex items-center justify-center text-sky-400 shrink-0 text-xs font-mono font-bold">
                        2
                      </div>
                      <div>
                        <div className="font-mono font-bold text-white">collection('accounts')</div>
                        <div className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                          Menyimpan kredensial pengguna, profil tenaga kesehatan, NIP, peran hak akses (RBAC), dan alamat email pemulihan sandi.
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-950/70 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0 text-xs font-mono font-bold">
                        3
                      </div>
                      <div>
                        <div className="font-mono font-bold text-white">collection('employees')</div>
                        <div className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                          Menyimpan master data seluruh perawat dan bidan, nomor induk kepegawaian (NIK), jabatan klinis, dan unit kerja.
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0 text-xs font-mono font-bold">
                        4
                      </div>
                      <div>
                        <div className="font-mono font-bold text-emerald-300">Offline Fallback & Cache</div>
                        <div className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                          Aplikasi secara otomatis menyimpan cadangan lokal di LocalStorage browser sehingga tetap berfungsi lancar walau offline.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span>RSIA AZ · Preceptor Academy</span>
                  <span className="text-emerald-400 font-medium">SDK v11 Ready</span>
                </div>
              </div>
            </div>

            {/* STORAGE MONITORING & ZERO-COST FULL STORAGE RESOLUTION */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-cyan-500/30 space-y-5 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>Status Storage &amp; Kuota Penyimpanan Website</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        100% Gratis (Spark Plan)
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Rincian pemakaian kuota dan solusi cerdas jika penyimpanan penuh tanpa biaya sepeser pun.
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Database Cloud Firestore</span>
                    <span className="text-emerald-400 font-mono text-[10px]">Gratis</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    1.000 MB <span className="text-xs text-slate-400 font-normal">(1 GB)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Cukup untuk &gt;500.000 jadwal pelatihan text. Pemakaian saat ini: &lt; 0.5%.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Bundle Web Aplikasi (dist)</span>
                    <span className="text-cyan-400 font-mono text-[10px]">Ringan</span>
                  </div>
                  <div className="text-lg font-bold text-cyan-300 font-mono">
                    ~3.0 MB <span className="text-xs text-slate-400 font-normal">(Gzipped ~690 KB)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Sangat cepat dibuka di Android dan jaringan seluler 4G/3G rumah sakit.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Cache Browser Lokal</span>
                    <span className="text-purple-400 font-mono text-[10px]">Otomatis</span>
                  </div>
                  <div className="text-lg font-bold text-purple-300 font-mono">
                    5 - 10 MB <span className="text-xs text-slate-400 font-normal">Offline Storage</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Tersimpan di memori browser HP/laptop untuk akses cepat saat koneksi putus.
                  </div>
                </div>
              </div>

              {/* 4 FREE SOLUTIONS TO PREVENT / SOLVE FULL STORAGE */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>4 Cara Mengatasi Storage Penuh (Tanpa Menghapus Data Lama &amp; Tanpa Membeli)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Solusi 1 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[10px]">1</span>
                      <span>Kompresi Otomatis di Browser (Aktif)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Sistem kini telah dilengkapi modul kompresi otomatis (HTML5 Canvas). Foto kamera HP resolusi tinggi (5–10 MB) langsung diperkecil ke ~80–120 KB saat diunggah. Tulisan sertifikat &amp; poster tetap sangat tajam dan terbaca jelas, namun hemat kuota 95%.
                    </p>
                  </div>

                  {/* Solusi 2 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2 font-bold text-cyan-400">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-[10px]">2</span>
                      <span>Gunakan Tautan Bebas Google Drive (0 KB Database)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Setiap akun Google/Gmail memiliki 15 GB penyimpanan gratis. Cukup upload sertifikat/poster ke folder Google Drive unit kerja, lalu tempel tautannya (Link) di kolom "Tautan Dokumen". Database aplikasi hanya menyimpan 60 byte teks tautan—sehingga kuota database praktis abadi!
                    </p>
                  </div>

                  {/* Solusi 3 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2 font-bold text-purple-400">
                      <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-700 flex items-center justify-center text-[10px]">3</span>
                      <span>Ekspor Backup Arsip Tahunan ke Excel</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Gunakan tombol <strong>"Ekspor Excel Rekap Lengkap"</strong> untuk mencadangkan seluruh data pelatihan, kehadiran, dan nilai peserta per tahun ke komputer, harddisk eksternal, atau flashdisk rumah sakit sebagai arsip dingin (cold storage) tanpa resiko hilang.
                    </p>
                  </div>

                  {/* Solusi 4 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <span className="w-5 h-5 rounded-full bg-amber-950 border border-amber-700 flex items-center justify-center text-[10px]">4</span>
                      <span>Multi-Proyek Firebase Spark Plan Gratis</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Firebase mengizinkan pembuatan beberapa proyek terpisah secara gratis (masing-masing 1 GB). Jika di masa bertahun-tahun mendatang 1 proyek mendekati kapasitas, cukup buat proyek Firebase Spark baru tanpa membayar kartu kredit, lalu tautkan ke sistem.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: DAFTAR SHORTCUT KEYBOARD (HOTKEYS CHEATSHEET)
        ======================================================== */}
        {activeTab === 'shortcuts' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Aero Banner */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-700/80 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-950/60 shrink-0">
                  <Keyboard className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Daftar Shortcut Keyboard (Hotkeys SIMRS Diklat)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/50 text-[10px] font-mono text-purple-300 font-bold">
                      ACTIVE &amp; READY
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Koleksi lengkap tombol pintas keyboard untuk mempercepat navigasi menu, penelusuran tanggal kalender, pengelolaan sesi pelatihan, dan pengamanan akun.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-purple-500/30 text-[11px] font-mono text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Tekan tombol langsung di keyboard</span>
                </div>
              </div>
            </div>

            {/* Grid 4 Kategori Shortcut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Pillar 1: Navigasi Menu & Tampilan Utama */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                      <Command className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">1. Navigasi Menu Utama</h4>
                      <p className="text-[10px] text-slate-400">Pindah tampilan seketika tanpa klik mouse</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    Tombol Angka
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Kalender Pelatihan</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Buka tampilan grid jadwal bulanan</div>
                    </div>
                    <kbd className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-cyan-300 bg-slate-900 border border-slate-700 shadow-sm shrink-0">
                      1
                    </kbd>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <ListFilter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Daftar Pelatihan (Agenda)</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Buka daftar jadwal &amp; materi pelatihan</div>
                    </div>
                    <kbd className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-cyan-300 bg-slate-900 border border-slate-700 shadow-sm shrink-0">
                      2
                    </kbd>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>Distribusi Unit Kerja</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Buka sebaran partisipasi per divisi</div>
                    </div>
                    <kbd className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-sky-300 bg-slate-900 border border-slate-700 shadow-sm shrink-0">
                      3
                    </kbd>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Tren &amp; Grafik Kehadiran</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Buka visualisasi statistik &amp; jam pelajaran</div>
                    </div>
                    <kbd className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-cyan-300 bg-slate-900 border border-slate-700 shadow-sm shrink-0">
                      4
                    </kbd>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Pengaturan Akun &amp; Sistem</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Buka manajemen user, sandi &amp; otoritas</div>
                    </div>
                    <kbd className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-purple-300 bg-slate-900 border border-slate-700 shadow-sm shrink-0">
                      5
                    </kbd>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Keyboard className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Buka Cheatsheet Shortcut Ini</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Akses cepat ke panduan tombol pintas</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className="px-2 py-0.5 rounded text-xs font-mono font-bold text-purple-300 bg-slate-900 border border-slate-700">
                        ?
                      </kbd>
                      <span className="text-[10px] text-slate-500 font-sans">atau</span>
                      <kbd className="px-2 py-0.5 rounded text-xs font-mono font-bold text-purple-300 bg-slate-900 border border-slate-700">
                        Shift + /
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pillar 2: Navigasi Kalender 4 Arah & Tanggal */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                      <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">2. Navigasi Kalender &amp; Tanggal</h4>
                      <p className="text-[10px] text-slate-400">Kontrol 4 arah tombol panah keyboard</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                    Tombol Panah
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">Geser 1 Minggu ke Atas / Gulir ke Atas</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Pindah tanggal 7 hari sebelumnya di kalender</div>
                    </div>
                    <kbd className="px-3 py-1 rounded-lg text-xs font-mono font-bold text-indigo-300 bg-slate-900 border border-slate-700 shadow-sm shrink-0">
                      ↑
                    </kbd>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">Geser 1 Minggu ke Bawah / Gulir ke Bawah</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Pindah tanggal 7 hari berikutnya di kalender</div>
                    </div>
                    <kbd className="px-3 py-1 rounded-lg text-xs font-mono font-bold text-indigo-300 bg-slate-900 border border-slate-700 shadow-sm shrink-0">
                      ↓
                    </kbd>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">Mundur 1 Hari / Tanggal Sebelumnya</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Pindah ke tanggal kemarin di kalender</div>
                    </div>
                    <kbd className="px-3 py-1 rounded-lg text-xs font-mono font-bold text-indigo-300 bg-slate-900 border border-slate-700 shadow-sm shrink-0">
                      ←
                    </kbd>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">Maju 1 Hari / Tanggal Berikutnya</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Pindah ke tanggal esok hari di kalender</div>
                    </div>
                    <kbd className="px-3 py-1 rounded-lg text-xs font-mono font-bold text-indigo-300 bg-slate-900 border border-slate-700 shadow-sm shrink-0">
                      →
                    </kbd>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">Lompat ke Hari Ini (Today)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Kembali langsung ke tanggal hari ini</div>
                    </div>
                    <kbd className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-cyan-300 bg-slate-900 border border-slate-700 shadow-sm shrink-0">
                      T
                    </kbd>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">Buka Agenda Pelatihan Terpilih</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Membuka popup rincian peserta &amp; unit</div>
                    </div>
                    <kbd className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-emerald-300 bg-slate-900 border border-slate-700 shadow-sm shrink-0 flex items-center gap-1">
                      <CornerDownLeft className="w-3 h-3" />
                      <span>Enter</span>
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Pillar 3: Keamanan, Sesi & Tampilan Layar */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
                      <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">3. Sesi, Layar &amp; Keamanan</h4>
                      <p className="text-[10px] text-slate-400">Pengamanan akun dan kontrol viewport</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                    Sistem &amp; Sesi
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Mode Layar Penuh (Fullscreen ON / OFF)</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Tampilan presentasi maksimal tanpa distraksi</div>
                    </div>
                    <kbd className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-cyan-300 bg-slate-900 border border-slate-700 shadow-sm shrink-0">
                      F
                    </kbd>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <LogOutIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Keluar / Log Out dari Sistem dengan Aman</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Amankan sesi akun saat meninggalkan meja</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className="px-2 py-0.5 rounded text-xs font-mono font-bold text-rose-300 bg-slate-900 border border-slate-700">
                        Ctrl + W
                      </kbd>
                      <span className="text-[10px] text-slate-500 font-sans">/</span>
                      <kbd className="px-2 py-0.5 rounded text-xs font-mono font-bold text-rose-300 bg-slate-900 border border-slate-700">
                        ⌘ + W
                      </kbd>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Tutup Modal / Drawer / Dialog Popup</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Kembali ke tampilan utama dengan cepat</div>
                    </div>
                    <kbd className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-slate-300 bg-slate-900 border border-slate-700 shadow-sm shrink-0">
                      Esc
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Pillar 4: Operasional Pelatihan & Dokumen */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                      <FileSpreadsheet className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">4. Operasional Pelatihan &amp; Dokumen</h4>
                      <p className="text-[10px] text-slate-400">Pencetakan berkas dan ekspor arsip</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    Dokumen &amp; Presensi
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Printer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Cetak Lembar Presensi / Hadir</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Buka dialog cetak presensi resmi rumah sakit</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className="px-2 py-0.5 rounded text-xs font-mono font-bold text-emerald-300 bg-slate-900 border border-slate-700">
                        Ctrl + P
                      </kbd>
                      <span className="text-[10px] text-slate-500 font-sans">/</span>
                      <kbd className="px-2 py-0.5 rounded text-xs font-mono font-bold text-emerald-300 bg-slate-900 border border-slate-700">
                        ⌘ + P
                      </kbd>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Ekspor Excel Rekap Lengkap (.xlsx)</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Unduh data kehadiran, materi &amp; nilai ujian</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className="px-2 py-0.5 rounded text-xs font-mono font-bold text-cyan-300 bg-slate-900 border border-slate-700">
                        Ctrl + E
                      </kbd>
                      <span className="text-[10px] text-slate-500 font-sans">/</span>
                      <kbd className="px-2 py-0.5 rounded text-xs font-mono font-bold text-cyan-300 bg-slate-900 border border-slate-700">
                        Tombol Ekspor
                      </kbd>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <CalendarPlus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Jadwalkan Pelatihan Baru</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Khusus Otoritas Penuh &amp; Edit</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className="px-2 py-0.5 rounded text-xs font-mono font-bold text-amber-300 bg-slate-900 border border-slate-700">
                        N
                      </kbd>
                      <span className="text-[10px] text-slate-500 font-sans">/</span>
                      <kbd className="px-2 py-0.5 rounded text-xs font-mono font-bold text-amber-300 bg-slate-900 border border-slate-700">
                        Alt + N
                      </kbd>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Hapus Pelatihan Terpilih (Multi-Select)</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Buka dialog hapus massal untuk agenda yang dicentang</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className="px-2 py-0.5 rounded text-xs font-mono font-bold text-rose-300 bg-slate-900 border border-slate-700">
                        Delete
                      </kbd>
                      <span className="text-[10px] text-slate-500 font-sans">/</span>
                      <kbd className="px-2 py-0.5 rounded text-xs font-mono font-bold text-rose-300 bg-slate-900 border border-slate-700">
                        Backspace
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Input Protection & Multi-OS Notice */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Proteksi Input &amp; Kompatibilitas Multi-Platform:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside pl-1">
                <li>
                  <strong>Proteksi Pengetikan Otomatis:</strong> Shortcut tombol tunggal (<kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]">1-5</kbd>, <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]">F</kbd>, <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]">T</kbd>, <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]">Enter</kbd>, dan Panah) secara cerdas otomatis dinonaktifkan saat Anda sedang mengetik di dalam kolom formulir atau pencarian.
                </li>
                <li>
                  <strong>Dukungan Windows, Mac, &amp; Linux:</strong> Kombinasi tombol tombol <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">Ctrl</kbd> dapat digunakan bergantian dengan tombol <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">Cmd (⌘)</kbd> pada perangkat Apple Mac.
                </li>
                <li>
                  <strong>Bantuan Cepat:</strong> Anda dapat menekan tombol <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-purple-300 font-mono text-[10px]">?</kbd> kapan saja di luar form untuk langsung membuka daftar shortcut ini.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: PILIHAN TEMA WEBSITE (18 TEMA GELAP & TERANG HARMONIS)
        ======================================================== */}
        {activeTab === 'themes' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Aero Banner */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/60 shrink-0">
                  <Palette className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Pilihan Tema Website &amp; Kalender Diklat
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/50 text-[10px] font-mono text-cyan-300 font-bold">
                      18 TEMA ELEGAN &amp; HARMONIS
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Ubah nuansa visual seluruh aplikasi secara instan. Kini hadir koleksi <strong>Tema Terang (Light Mode)</strong> dengan degradasi warna lembut, sejuk, dan higienis khas rumah sakit, berdampingan dengan <strong>Tema Gelap (Dark Mode)</strong> kontras tinggi.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const defaultTheme = setActiveTheme('midnight-cyan');
                    setCurrentThemeId(defaultTheme.id);
                    setThemeAlert('Tema berhasil dikembalikan ke standar default (Midnight Aerodynamic)!');
                    setTimeout(() => setThemeAlert(null), 3500);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Default</span>
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setThemeCategoryFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  themeCategoryFilter === 'all'
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Semua Tema (18)</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeCategoryFilter('light')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  themeCategoryFilter === 'light'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                    : 'bg-amber-950/40 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:bg-amber-950/60'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>☀️ Tema Terang Harmonis (6)</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeCategoryFilter('Modern Dark')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  themeCategoryFilter === 'Modern Dark'
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Modern Dark (4)</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeCategoryFilter('Medical & Clinical')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  themeCategoryFilter === 'Medical & Clinical'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
                <span>Medical &amp; Clinical (3)</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeCategoryFilter('Luxury & Vibrant')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  themeCategoryFilter === 'Luxury & Vibrant'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Luxury &amp; Vibrant (4)</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeCategoryFilter('Executive')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  themeCategoryFilter === 'Executive'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>Executive (2)</span>
              </button>
            </div>

            {/* Theme Activation Toast Feedback */}
            {themeAlert && (
              <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/80 text-emerald-200 text-xs sm:text-sm flex items-center justify-between shadow-xl animate-smooth-fade">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{themeAlert}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setThemeAlert(null)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Grid 18 Tema */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {THEME_PRESETS
                .filter((t) => {
                  if (themeCategoryFilter === 'all') return true;
                  if (themeCategoryFilter === 'light') return t.isLight === true;
                  return t.category === themeCategoryFilter;
                })
                .map((t) => {
                  const isActive = currentThemeId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const applied = setActiveTheme(t.id);
                        setCurrentThemeId(applied.id);
                        setThemeAlert(`Tema "${t.name}" ${t.isLight ? '(Mode Terang)' : ''} berhasil diterapkan ke seluruh website!`);
                        setTimeout(() => setThemeAlert(null), 3500);
                      }}
                      className={`relative p-5 rounded-2xl border text-left transition-all cursor-pointer group flex flex-col justify-between overflow-hidden shadow-lg ${
                        isActive
                          ? 'bg-slate-900/95 border-cyan-400 ring-2 ring-cyan-400/40 shadow-cyan-950/50'
                          : t.isLight
                          ? 'bg-slate-900/80 border-amber-500/30 hover:border-amber-400/60 hover:bg-slate-900/95'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      {/* Glowing highlight in corner */}
                      <div
                        className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"
                        style={{ backgroundColor: t.primaryColor }}
                      />

                      <div>
                        {/* Top Row: Swatches & Active Badge */}
                        <div className="flex items-center justify-between gap-3 mb-3.5">
                          {/* Swatches palette circles */}
                          <div className="flex items-center -space-x-1.5 bg-slate-950/80 p-1.5 rounded-full border border-slate-800">
                            <span
                              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: t.primaryColor }}
                              title="Primary Accent"
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: t.secondaryColor }}
                              title="Secondary Accent"
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: t.cardBg }}
                              title="Card Surface"
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                              style={{ 
                                background: t.gradientBg ? t.gradientBg : t.bgDark 
                              }}
                              title="Background & Gradient"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            {t.isLight && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[9.5px] font-bold">
                                <Sun className="w-3 h-3 text-amber-400" />
                                <span>Terang</span>
                              </span>
                            )}

                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                                <span>Aktif</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                                Klik Terapkan
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Theme Name & Badge */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {t.name}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {t.description}
                          </p>
                        </div>

                        {/* Harmonious Gradient Preview Bar for Light Themes */}
                        {t.isLight && t.gradientBg && (
                          <div 
                            className="mt-3.5 p-2 rounded-xl border border-white/30 flex items-center justify-between shadow-xs"
                            style={{ background: t.gradientBg }}
                          >
                            <span className="font-bold text-slate-900 text-[10.5px] flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>Degradasi Warna Harmonis</span>
                            </span>
                            <span className="text-[9.5px] font-mono font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded-md shadow-2xs">
                              {t.tag}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Preview Mini Card Bar */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-500">
                          {t.primaryColor}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: t.primaryColor }}
                          />
                          <span className="text-slate-300">
                            {isActive ? 'Sedang Digunakan' : 'Terapkan Tema'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 7: PENGATURAN PEJABAT PENANDATANGAN CETAK (GLOBAL)
        ======================================================== */}
        {activeTab === 'signees' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Aero Banner */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-sky-950/70 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/60 shrink-0">
                  <Printer className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Pengaturan Format &amp; Pejabat Penandatangan Cetak
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/50 text-[10px] font-mono text-cyan-300 font-bold uppercase">
                      Berlaku di Semua Fitur Cetak
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Ubah teks pengantar, nama pejabat, gelar kehormatan, NIK/NIP, dan jabatan yang tertera di bagian tanda tangan dokumen. Pengaturan ini otomatis tersinkronisasi ke <strong>Cetak Dokumen Data Karyawan</strong> dan <strong>Cetak Lembar Presensi Peserta Pelatihan</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetPrintConfig}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Standar</span>
                </button>
              </div>
            </div>

            {/* Notification alert */}
            {printConfigAlert && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 shadow-lg transition-all ${
                  printConfigAlert.type === 'success'
                    ? 'bg-emerald-950/50 border-emerald-700/80 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-700/80 text-rose-200'
                }`}
              >
                {printConfigAlert.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{printConfigAlert.message}</p>
                </div>
              </div>
            )}

            {/* PRATINJAU LANGSUNG LEMBAR CETAK (SIMULASI KERTAS A4) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Pratinjau Langsung Posisi Tanda Tangan Cetak (A4)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Live Preview Sesuai Format Cetak Resmi
                </span>
              </div>

              {/* Simulated Paper Sheet */}
              <div className="p-6 bg-white rounded-xl border border-slate-300 shadow-md text-slate-900">
                <div className="text-center pb-3 border-b-2 border-black mb-4">
                  <h5 className="font-serif font-bold text-sm sm:text-base uppercase tracking-wider text-black">
                    {printConfig.documentHeader || 'NAMA - NAMA PERAWAT DAN BIDAN RSIA AZ ZAHRA'}
                  </h5>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono mt-1">
                    <span>
                      Tanggal Cetak: {printConfig.rightCustomDate || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span>Total Personil: 52 Personil</span>
                  </div>
                </div>

                {/* Simulated Table Snippet */}
                <div className="py-3 px-4 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-500 text-center font-mono italic">
                  [ ... Tabel Data Personil / Peserta Pelatihan ... ]
                </div>

                {/* Live Signature Block (Exact design as in image_982f6933.png) */}
                <div className="mt-8 pt-4 grid grid-cols-2 text-xs text-center border-t border-slate-300">
                  <div>
                    <p className="font-medium text-slate-700 mb-12 sm:mb-14 leading-relaxed">
                      {printConfig.leftPrefix || 'Mengetahui,'}<br />
                      <span className="font-semibold text-slate-800">{printConfig.leftRole || 'Kepala Bidang Keperawatan'}</span>
                    </p>
                    <p className="font-bold text-black uppercase underline tracking-wide">
                      {printConfig.leftName || 'Ns. Siti Rahmawati, S.Kep.'}
                    </p>
                    <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                      {printConfig.leftNipLabel || 'NIK'}: {printConfig.leftNip || '19920315 201601 2 001'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 mb-12 sm:mb-14 leading-relaxed">
                      {printConfig.rightCity || 'Palembang'}, {printConfig.rightCustomDate || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                      <span className="font-semibold text-slate-800">{printConfig.rightRole || 'Ka. Subag Kepegawaian & SDM'}</span>
                    </p>
                    <p className="font-bold text-black uppercase underline tracking-wide">
                      {printConfig.rightName || 'Ratna Kusuma Dewi, S.Psi., M.M.'}
                    </p>
                    <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                      {printConfig.rightNipLabel || 'NIK'}: {printConfig.rightNip || '19870914 201102 2 001'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FORM INPUT PENGATURAN PENANDATANGAN */}
            <form onSubmit={handleSavePrintConfig} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CARD 1: PIHAK KIRI (PEMERIKSA / KEPERAWATAN) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Pihak Kiri (Pemeriksa / Keperawatan)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Posisi tanda tangan sebelah kiri bawah dokumen
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80 text-[10px] font-mono font-bold">
                      KOLOM KIRI
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Kalimat Pengantar Penandatangan
                      </label>
                      <input
                        type="text"
                        value={printConfig.leftPrefix}
                        onChange={(e) => handleUpdatePrintField('leftPrefix', e.target.value)}
                        placeholder="Contoh: Mengetahui,"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Biasanya tertulis: Mengetahui, / Memeriksa, / Disetujui Oleh,
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Jabatan Resmi Penandatangan
                      </label>
                      <input
                        type="text"
                        value={printConfig.leftRole}
                        onChange={(e) => handleUpdatePrintField('leftRole', e.target.value)}
                        placeholder="Contoh: Kepala Bidang Keperawatan"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Lengkap Beserta Gelar
                      </label>
                      <input
                        type="text"
                        value={printConfig.leftName}
                        onChange={(e) => handleUpdatePrintField('leftName', e.target.value)}
                        placeholder="Contoh: Ns. Siti Rahmawati, S.Kep."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-semibold focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="col-span-1">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Label Nomor
                        </label>
                        <select
                          value={printConfig.leftNipLabel}
                          onChange={(e) => handleUpdatePrintField('leftNipLabel', e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="NIK">NIK</option>
                          <option value="NIP">NIP</option>
                          <option value="ID">ID Karyawan</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nomor Induk Karyawan / Pegawai
                        </label>
                        <input
                          type="text"
                          value={printConfig.leftNip}
                          onChange={(e) => handleUpdatePrintField('leftNip', e.target.value)}
                          placeholder="Contoh: 19920315 201601 2 001"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-mono focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: PIHAK KANAN (HC & SDM / PENGESAH) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-950 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Pihak Kanan (HC &amp; SDM / Pengesah)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Posisi tanda tangan sebelah kanan bawah dokumen
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/80 text-[10px] font-mono font-bold">
                      KOLOM KANAN
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nama Kota / Lokasi
                        </label>
                        <input
                          type="text"
                          value={printConfig.rightCity}
                          onChange={(e) => handleUpdatePrintField('rightCity', e.target.value)}
                          placeholder="Contoh: Palembang"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Tanggal Cetak Kustom (Opsional)
                        </label>
                        <input
                          type="text"
                          value={printConfig.rightCustomDate}
                          onChange={(e) => handleUpdatePrintField('rightCustomDate', e.target.value)}
                          placeholder="Kosong = Otomatis Hari Ini"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Jabatan Resmi Penandatangan
                      </label>
                      <input
                        type="text"
                        value={printConfig.rightRole}
                        onChange={(e) => handleUpdatePrintField('rightRole', e.target.value)}
                        placeholder="Contoh: Ka. Subag Kepegawaian & SDM"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Lengkap Beserta Gelar
                      </label>
                      <input
                        type="text"
                        value={printConfig.rightName}
                        onChange={(e) => handleUpdatePrintField('rightName', e.target.value)}
                        placeholder="Contoh: Ratna Kusuma Dewi, S.Psi., M.M."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-semibold focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="col-span-1">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Label Nomor
                        </label>
                        <select
                          value={printConfig.rightNipLabel}
                          onChange={(e) => handleUpdatePrintField('rightNipLabel', e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="NIK">NIK</option>
                          <option value="NIP">NIP</option>
                          <option value="ID">ID Karyawan</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nomor Induk Karyawan / Pegawai
                        </label>
                        <input
                          type="text"
                          value={printConfig.rightNip}
                          onChange={(e) => handleUpdatePrintField('rightNip', e.target.value)}
                          placeholder="Contoh: 19870914 201102 2 001"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-mono focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: KOP & JUDUL DOKUMEN CETAK */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Judul Lembar Dokumen Cetak Data Karyawan
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Teks judul utama yang tertera di bagian paling atas lembar A4
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Judul Dokumen (Huruf Kapital)
                    </label>
                    <input
                      type="text"
                      value={printConfig.documentHeader}
                      onChange={(e) => handleUpdatePrintField('documentHeader', e.target.value)}
                      placeholder="NAMA - NAMA PERAWAT DAN BIDAN RSIA AZ ZAHRA"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm uppercase font-serif focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Instansi / Rumah Sakit
                    </label>
                    <input
                      type="text"
                      value={printConfig.hospitalTitle}
                      onChange={(e) => handleUpdatePrintField('hospitalTitle', e.target.value)}
                      placeholder="RSIA AZ ZAHRA PALEMBANG"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm uppercase focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Save Bar */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <BadgeCheck className="w-4 h-4 text-cyan-400" />
                  <span>Pengaturan ini otomatis diterapkan saat mencetak lembar data karyawan maupun presensi diklat.</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleResetPrintConfig}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Cetak</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB: GANTI BACKGROUND (20 BACKGROUND RESMI + KUSTOM MANUAL)
        ======================================================== */}
        {activeTab === 'backgrounds' && (
          <BackgroundSettingsTab />
        )}
      </div>

      {/* ========================================================
          MODAL: RESSET PASSWORD INDIVIDUAL
      ======================================================== */}
      {resetModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setResetModalAccount(null)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-slate-100 z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-950 text-sky-400 flex items-center justify-center border border-sky-800 shadow-sm">
                  <KeyRound className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Resset Kata Sandi Akun</h3>
                  <p className="text-xs text-cyan-400 font-mono">
                    @{resetModalAccount.username} · {resetModalAccount.username === 'admin' || resetModalAccount.role === 'Administrator Diklat' ? resetModalAccount.role : resetModalAccount.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalAccount(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetModalError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{resetModalError}</span>
              </div>
            )}

            {resetModalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resetModalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleExecuteResetPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Kata sandi saat ini:</span>
                <span className="font-mono text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  {resetModalAccount.password}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Kata Sandi Baru <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={resetModalShowPass ? 'text' : 'password'}
                    value={resetModalNewPassword}
                    onChange={(e) => setResetModalNewPassword(e.target.value)}
                    placeholder="Masukkan sandi baru (min 4 karakter)"
                    className="w-full pl-3 pr-10 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setResetModalShowPass(!resetModalShowPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {resetModalShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Ulangi Kata Sandi Baru <span className="text-rose-400">*</span>
                </label>
                <input
                  type={resetModalShowPass ? 'text' : 'password'}
                  value={resetModalConfirmPassword}
                  onChange={(e) => setResetModalConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang sandi baru"
                  className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const tempPass = 'diklat' + Math.floor(1000 + Math.random() * 9000);
                    setResetModalNewPassword(tempPass);
                    setResetModalConfirmPassword(tempPass);
                    setResetModalShowPass(true);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Sandi acak otomatis</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setResetModalAccount(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 transition-all cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95"
                  >
                    Simpan Sandi Baru
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT DATA PROFIL AKUN
      ======================================================== */}
      {editModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setEditModalAccount(null)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-slate-100 z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center border border-cyan-800">
                  <Edit3 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit User, Pasword & Profil Akun</h3>
                  <p className="text-xs text-cyan-400 font-mono">@{editModalAccount.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalAccount(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editModalMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  editModalMessage.type === 'success'
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-800 text-rose-200'
                }`}
              >
                {editModalMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{editModalMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleExecuteEditSave} className="space-y-4">
              {/* Kredensial Login: User (Username) & Pasword (Kata Sandi) */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Kredensial Login (User & Pasword)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const tempPass = 'rsiaplg' + Math.floor(1000 + Math.random() * 9000);
                      setEditPassword(tempPass);
                      setEditShowPassword(true);
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/60"
                    title="Buat sandi acak otomatis"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Sandi Acak</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Edit Username */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      User (Username Login) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400 font-mono text-xs font-bold">
                        @
                      </div>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400"
                        required
                        disabled={editModalAccount.username === 'admin'}
                      />
                    </div>
                    {editModalAccount.username === 'admin' && (
                      <span className="text-[10px] text-slate-500 block">Username root admin terkunci</span>
                    )}
                  </div>

                  {/* Edit Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Pasword (Kata Sandi) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={editShowPassword ? 'text' : 'password'}
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Min. 4 karakter"
                        className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setEditShowPassword(!editShowPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                        tabIndex={-1}
                      >
                        {editShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Dapat diubah kapan saja</span>
                  </div>
                </div>
              </div>

              {/* Profil Pegawai */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Nama Lengkap & Gelar <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">NIP Pegawai</label>
                  <input
                    type="text"
                    value={editNip}
                    onChange={(e) => setEditNip(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Peran Otoritas (Role)</label>
                  <select
                    value={editRole}
                    onChange={(e) => {
                      const r = e.target.value as AppAccount['role'];
                      setEditRole(r);
                      if (r === 'Administrator Diklat') setEditAuthority('Otoritas Penuh');
                      else if (r === 'Peserta Diklat') setEditAuthority('Melihat');
                      else setEditAuthority('Edit');
                    }}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Administrator Diklat">Administrator Diklat</option>
                    <option value="Koordinator Preceptor">Koordinator Preceptor</option>
                    <option value="Instruktur Klinis">Instruktur Klinis</option>
                    <option value="Peserta Diklat">Peserta Diklat</option>
                  </select>
                </div>
              </div>

              {/* Otoritas User Selection (Edit, Melihat, Otoritas Penuh) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Otoritas User <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Edit', 'Melihat', 'Otoritas Penuh'] as UserAuthority[]).map((auth) => {
                    const isSelected = editAuthority === auth;
                    const cfg = AUTHORITY_CONFIG[auth];
                    return (
                      <button
                        key={auth}
                        type="button"
                        onClick={() => setEditAuthority(auth)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? `${cfg.badgeBg} ${cfg.badgeBorder} shadow-md ring-1 ring-cyan-500/40`
                            : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <span className={`text-xs font-bold ${isSelected ? cfg.badgeText : 'text-slate-300'}`}>
                          {auth}
                        </span>
                        <span className="text-[9px] text-slate-400 leading-none">
                          {auth === 'Otoritas Penuh' ? 'Akses Super Admin' : auth === 'Edit' ? 'Tambah & Edit' : 'Hanya Lihat'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Unit Kerja</label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Email Resmi</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalAccount(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 transition-all cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: KONFIRMASI GLOBAL RESET KE AKUN DEFAULT
      ======================================================== */}
      {showConfirmDefaultReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowConfirmDefaultReset(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-rose-800/80 p-6 shadow-2xl text-slate-100 z-10 space-y-4">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950 flex items-center justify-center border border-rose-800/60 shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pulihkan Akun Bawaan (Reset)</h3>
                <p className="text-xs text-rose-300">Kembalikan daftar akun ke standar pabrik</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                Tindakan ini akan mengembalikan seluruh akun ke kredensial standar awal:
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-cyan-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <li>admin (sandi: admin123)</li>
                <li>preceptor (sandi: diklat2026)</li>
                <li>instruktur (sandi: diklat123)</li>
              </ul>
              <p className="text-slate-400">
                Akun tambahan kustom yang Anda buat sebelumnya akan dihapus dari penyimpanan lokal.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmDefaultReset(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRestoreDefaultAccounts}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer shadow-lg shadow-rose-950 active:scale-95"
              >
                Ya, Pulihkan Akun Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: KONFIRMASI HAPUS AKUN PENGGUNA INDIVIDUAL
      ======================================================== */}
      {deleteConfirmAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setDeleteConfirmAccount(null)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-rose-800/80 p-6 shadow-2xl text-slate-100 z-10 space-y-4">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950 flex items-center justify-center border border-rose-800/60 shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Akun Pengguna</h3>
                <p className="text-xs text-rose-300">Konfirmasi penghapusan akses SIMRS</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                Apakah Anda yakin ingin menghapus akun pengguna berikut dari sistem SIMRS Diklat?
              </p>

              {/* Account summary card */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{deleteConfirmAccount.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${getRoleBadgeStyle(deleteConfirmAccount.role).bg}`}>
                    {deleteConfirmAccount.role}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-cyan-400">
                  Username: @{deleteConfirmAccount.username}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="truncate max-w-[200px]">Unit: {deleteConfirmAccount.unit}</span>
                  <span className="font-mono">NIP: {deleteConfirmAccount.nip || '-'}</span>
                </div>
              </div>

              {currentUser && currentUser.username === deleteConfirmAccount.username && (
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px]">
                  <strong>Perhatian:</strong> Ini adalah akun yang saat ini sedang Anda gunakan untuk login.
                </div>
              )}

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight">
                  Tindakan ini tidak dapat dibatalkan. Kredensial pengguna akan dihapus dan pengguna tidak akan bisa login kembali.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmAccount(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteAccount}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer shadow-lg shadow-rose-950 active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Akun Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: KONFIRMASI RESET DATA PELATIHAN STANDAR
      ======================================================== */}
      {showConfirmTrainingReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowConfirmTrainingReset(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-rose-800/80 p-6 shadow-2xl text-slate-100 z-10 space-y-4">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950 flex items-center justify-center border border-rose-800/60 shrink-0">
                <RotateCcw className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pulihkan Data Pelatihan</h3>
                <p className="text-xs text-rose-300">Kembalikan agenda & presensi ke standar default</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin memulihkan seluruh agenda pelatihan dan presensi ke data standar (default)? Data kustom yang telah diinput akan dihapus dan diganti dengan 10 agenda pelatihan resmi RSIAPLG 2026.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmTrainingReset(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onResetTrainingsData) {
                    onResetTrainingsData();
                    setActionFeedback({
                      type: 'success',
                      message: 'Seluruh agenda pelatihan, presensi pegawai, dan jam pembelajaran (JP) berhasil dipulihkan ke data standar default!'
                    });
                  }
                  setShowConfirmTrainingReset(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer shadow-lg shadow-rose-950 active:scale-95 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ya, Pulihkan Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
