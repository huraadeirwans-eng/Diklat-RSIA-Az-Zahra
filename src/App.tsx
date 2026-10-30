/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Building2, 
  Award, 
  Search, 
  Clock, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  ListFilter,
  RotateCcw,
  Trash2,
  Check,
  AlertCircle,
  Printer,
  Download,
  CheckSquare
} from 'lucide-react';
import { Training, Participant } from './types/training';
import { INITIAL_TRAININGS } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CalendarGrid } from './components/CalendarGrid';
import { DateTrainingsDrawer } from './components/DateTrainingsDrawer';
import { TrainingDetailModal } from './components/TrainingDetailModal';
import { AddTrainingModal } from './components/AddTrainingModal';
import { AddParticipantModal } from './components/AddParticipantModal';
import { AgendaListView } from './components/AgendaListView';
import { UnitBreakdownView } from './components/UnitBreakdownView';
import { EmployeesDirectoryView } from './components/EmployeesDirectoryView';
import { TrainingTrendAnalytics } from './components/TrainingTrendAnalytics';
import { SettingsAccountView } from './components/SettingsAccountView';
import { LoginPage } from './components/LoginPage';
import { BatchDeleteModal } from './components/BatchDeleteModal';
import { PrintAttendanceModal } from './components/PrintAttendanceModal';
import { User, isFullAuthority, canEdit } from './types/auth';
import { requestFullscreenMode, exitFullscreenMode, toggleFullscreenMode } from './utils/fullscreen';
import { startRealtimeAccountSync } from './utils/accountManager';
import { startRealtimeCustomUnitsSync } from './utils/unitManager';
import { getAllEmployees, startRealtimeEmployeeSync, onEmployeesChange } from './utils/employeeManager';
import { startRealtimePrintSigneeSync } from './utils/printConfigManager';
import { exportCompleteAgendaToExcel } from './utils/excelExporter';
import { applyThemeToDOM, getActiveTheme, onThemeChange, startRealtimeThemeSync, ThemePreset } from './utils/themeManager';
import { 
  applyBackgroundToDOM, 
  getActiveBackground, 
  onBackgroundChange, 
  startRealtimeBackgroundSync,
  AppBackground 
} from './utils/backgroundManager';
import { 
  subscribeToTrainings, 
  saveTrainingToFirebase, 
  deleteTrainingFromFirebase, 
  bulkUploadTrainingsToFirebase, 
  bulkDeleteTrainingsFromFirebase,
  USER_REAL_TRAINING
} from './lib/firebase';

const STORAGE_KEY = 'aerotraining_database_v1';
const AUTH_USER_KEY = 'simrs_diklat_auth_user_v1';
const DATA_INITIALIZED_KEY = 'aerotraining_has_initialized_v1';

export default function App() {
  // Visual Theme state
  const [activeTheme, setActiveTheme] = useState<ThemePreset>(getActiveTheme);
  // Dynamic Background Wallpaper state
  const [activeBg, setActiveBg] = useState<AppBackground>(getActiveBackground);

  // Screen lock state (defaults to true on launch so BMHS lock screen is shown with animations)
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(() => {
    try {
      const isUnlocked = sessionStorage.getItem('simrs_session_unlocked_v1');
      return isUnlocked !== 'true';
    } catch {
      return true;
    }
  });

  // Authentication session state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      if (saved) {
        const u = JSON.parse(saved);
        if (u && (u.username === 'admin' || u.role?.toLowerCase().includes('admin'))) {
          if (u.name && (u.name.includes('Ade Irwan') || u.name !== 'Administrator Diklat')) {
            u.name = 'Administrator Diklat';
            try {
              localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
            } catch (err) {
              // ignore
            }
          }
        }
        return u;
      }
      return null;
    } catch (e) {
      console.error('Failed to parse auth user:', e);
      return null;
    }
  });

  const handleLoginSuccess = (user: User) => {
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      sessionStorage.setItem('simrs_session_unlocked_v1', 'true');
    } catch (e) {
      console.error('Failed to save auth user session:', e);
    }
    // Automatically trigger fullscreen mode after user logs in
    requestFullscreenMode();
    setCurrentUser(user);
    setIsScreenLocked(false);
  };

  const handleLockScreen = () => {
    try {
      sessionStorage.removeItem('simrs_session_unlocked_v1');
    } catch {
      // ignore
    }
    setIsScreenLocked(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_USER_KEY);
      sessionStorage.removeItem('simrs_session_unlocked_v1');
    } catch (e) {
      console.error('Failed to remove auth user session:', e);
    }
    exitFullscreenMode();
    setCurrentUser(null);
    setIsScreenLocked(true);
  };

  const handleUpdateCurrentUser = (updated: User) => {
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save updated auth user session:', e);
    }
    setCurrentUser(updated);
  };

  // Load initial data from localStorage if available (Preserving user input & deletions)
  const [trainings, setTrainings] = useState<Training[]>(() => {
    try {
      const isInitialized = localStorage.getItem(DATA_INITIALIZED_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((t: Training) => {
            const defItem = INITIAL_TRAININGS.find(it => it.id === t.id);
            const code = t.code ? (t.code.startsWith('NPA-') ? t.code.replace(/^NPA-/i, 'RSIAPLG-') : t.code) : t.code;
            const participants = (t.participants || []).map(p => ({
              ...p,
              unitKerja: p.unitKerja?.trim()?.toUpperCase() === 'HRD' ? 'HC' : p.unitKerja
            }));
            const targetUnits = (t.targetUnits || []).map(u => u?.trim()?.toUpperCase() === 'HRD' ? 'HC' : u);
            return {
              ...t,
              code,
              participants,
              targetUnits,
              scope: t.scope || (t.id === 'trn-001' || t.id === 'trn-003' || t.id === 'trn-004' || t.id === 'trn-007' || t.id === 'trn-008' ? 'Eksternal' : 'Internal'),
              endDate: t.endDate || defItem?.endDate,
              dailySchedules: t.dailySchedules || defItem?.dailySchedules,
              certificateUrl: t.certificateUrl || defItem?.certificateUrl,
              certificateFileName: t.certificateFileName || defItem?.certificateFileName,
              posterUrl: t.posterUrl || defItem?.posterUrl,
              posterFileName: t.posterFileName || defItem?.posterFileName
            };
          });
        }
      }

      // If user has already initialized before, but deleted all data or modified:
      if (isInitialized === 'true') {
        return [];
      }
    } catch (e) {
      console.error('Failed to parse stored trainings:', e);
    }
    
    // First time visit on a clean browser:
    try {
      localStorage.setItem(DATA_INITIALIZED_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify([USER_REAL_TRAINING]));
    } catch (err) {
      // ignore
    }
    return [USER_REAL_TRAINING];
  });

  // Save to localStorage whenever trainings change
  useEffect(() => {
    try {
      localStorage.setItem(DATA_INITIALIZED_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trainings));
    } catch (e) {
      console.error('Failed to save trainings to storage:', e);
    }
  }, [trainings]);

  // Subscribe to real-time Firebase Firestore updates for trainings, accounts, and custom units
  useEffect(() => {
    // Apply user selected visual theme preset to DOM
    applyThemeToDOM();
    const unsubTheme = onThemeChange((theme) => {
      setActiveTheme(theme);
    });

    // Apply active background and listen for background changes
    applyBackgroundToDOM();
    const unsubBg = onBackgroundChange((bg) => {
      setActiveBg(bg);
    });

    const unsubTrainings = subscribeToTrainings(
      (remoteTrainings) => {
        if (Array.isArray(remoteTrainings)) {
          const normalized = remoteTrainings.map((t) => ({
            ...t,
            code: t.code ? (t.code.startsWith('NPA-') ? t.code.replace(/^NPA-/i, 'RSIAPLG-') : t.code) : t.code,
            participants: (t.participants || []).map((p) => ({
              ...p,
              unitKerja: p.unitKerja?.trim()?.toUpperCase() === 'HRD' ? 'HC' : p.unitKerja
            })),
            targetUnits: (t.targetUnits || []).map((u) => u?.trim()?.toUpperCase() === 'HRD' ? 'HC' : u)
          }));
          // Stable sort by date desc for consistent multi-device view
          const sorted = [...normalized].sort((a, b) => b.date.localeCompare(a.date));
          setTrainings(sorted);
          // Keep active detail modal in sync across devices in real-time
          setSelectedTraining((prev) => {
            if (!prev) return null;
            const updated = sorted.find((t) => t.id === prev.id);
            return updated || null;
          });
        }
      }
    );

    const unsubAccounts = startRealtimeAccountSync();
    const unsubUnits = startRealtimeCustomUnitsSync();
    const unsubEmployees = startRealtimeEmployeeSync();
    const unsubPrintSignee = startRealtimePrintSigneeSync();
    const unsubThemeSync = startRealtimeThemeSync();
    const unsubBgSync = startRealtimeBackgroundSync();

    return () => {
      unsubTheme();
      unsubBg();
      unsubTrainings();
      if (unsubAccounts) unsubAccounts();
      if (unsubUnits) unsubUnits();
      if (unsubEmployees) unsubEmployees();
      if (unsubPrintSignee) unsubPrintSignee();
      if (unsubThemeSync) unsubThemeSync();
      if (unsubBgSync) unsubBgSync();
    };
  }, []);

  // Real-time Employee Count state synced across all devices
  const [totalEmployeesCount, setTotalEmployeesCount] = useState<number>(() => getAllEmployees().length);

  useEffect(() => {
    return onEmployeesChange((list) => {
      setTotalEmployeesCount(Array.isArray(list) ? list.length : getAllEmployees().length);
    });
  }, []);

  // Current calendar viewing month and year (Default to October 2026)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 0-indexed: 9 = Oktober

  // Selected date (Defaults to 2026-10-25)
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-25');

  // Currently selected training for detailed participant & unit kerja inspection modal
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);

  // Calendar Multi-select Batch Deletion state
  const [calendarSelectedIds, setCalendarSelectedIds] = useState<string[]>([]);
  const [isCalendarBatchMode, setIsCalendarBatchMode] = useState<boolean>(false);
  const [showCalendarBatchDeleteModal, setShowCalendarBatchDeleteModal] = useState<boolean>(false);

  // Print attendance modal state (for Ctrl+P shortcut & quick printing)
  const [printingTraining, setPrintingTraining] = useState<Training | null>(null);

  // Global Alerts & Toasts feedback
  const [globalAlert, setGlobalAlert] = useState<string | null>(null);
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  // Add training modal state
  const [showAddTraining, setShowAddTraining] = useState<boolean>(false);
  const [addTrainingInitialDate, setAddTrainingInitialDate] = useState<string>('2026-10-25');
  const [showResetDataModal, setShowResetDataModal] = useState<boolean>(false);
  // Otomatis buka dialog tambah peserta untuk jadwal yang baru dibuat
  const [trainingForNewParticipant, setTrainingForNewParticipant] = useState<Training | null>(null);

  // Navigation View: 'calendar' | 'agenda' | 'units' | 'employees' | 'analytics' | 'settings'
  const [activeView, setActiveView] = useState<'calendar' | 'agenda' | 'units' | 'employees' | 'analytics' | 'settings'>('calendar');
  const [settingsTab, setSettingsTab] = useState<'overview' | 'add' | 'reset' | 'restore' | 'cloud' | 'shortcuts' | 'themes' | 'signees' | 'backgrounds'>('overview');

  const handleViewChange = (view: 'calendar' | 'agenda' | 'units' | 'employees' | 'analytics' | 'settings', tab?: 'overview' | 'add' | 'reset' | 'restore' | 'cloud' | 'shortcuts' | 'themes' | 'signees' | 'backgrounds') => {
    setActiveView(view);
    setSettingsTab(tab || 'overview');
  };

  // Synchronize document.title dynamically for clean, elegant window title bar in installed PWA & browser
  useEffect(() => {
    const titles: Record<string, string> = {
      calendar: 'Kalender Pelatihan',
      agenda: 'Daftar Agenda Pelatihan',
      units: 'Distribusi Unit Kerja',
      employees: 'Data Karyawan RSIA',
      analytics: 'Grafik & Tren Kehadiran',
      settings: 'Pengaturan Sistem'
    };
    if (!currentUser) {
      document.title = 'Login Diklat · RSIA Az Zahra';
    } else {
      const activeLabel = titles[activeView] || 'Kalender Pelatihan';
      document.title = `${activeLabel} · Diklat RSIA Az Zahra`;
    }
  }, [activeView, currentUser]);

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Mobile calendar view tab state: 'calendar' | 'drawer'
  const [mobileCalendarTab, setMobileCalendarTab] = useState<'calendar' | 'drawer'>('calendar');

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const dStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(dStr);
  };

  // Add new training handler (synced to Firebase)
  const handleAddTraining = (newTraining: Training) => {
    setTrainings((prev) => [newTraining, ...prev]);
    setSelectedDate(newTraining.date);
    // Switch to month of the newly added training
    const [y, m] = newTraining.date.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);
    // Asynchronously push to Firebase Firestore
    saveTrainingToFirebase(newTraining).catch(() => {});

    // Sesuai permintaan pengguna: Setelah Simpan & Terbitkan Jadwal maka Akan Muncul kotak dialog tambah peserta
    setTrainingForNewParticipant(newTraining);
  };

  // Handler tambah peserta otomatis untuk jadwal pelatihan yang baru diterbitkan
  const handleAddParticipantToNewTraining = (newParticipant: Participant, andAddMore?: boolean) => {
    if (!trainingForNewParticipant) return;

    // Ambil versi pelatihan terkini dari state trainings (jika sebelumnya sudah menambah peserta di sesi yang sama)
    const currentTraining = trainings.find((t) => t.id === trainingForNewParticipant.id) || trainingForNewParticipant;

    const updatedParticipants = [...(currentTraining.participants || []), newParticipant];
    const existingUnits = currentTraining.targetUnits || [];
    const updatedUnits = existingUnits.includes(newParticipant.unitKerja)
      ? existingUnits
      : [...existingUnits, newParticipant.unitKerja];

    const updatedTraining: Training = {
      ...currentTraining,
      participants: updatedParticipants,
      targetUnits: updatedUnits
    };

    handleUpdateTraining(updatedTraining);

    if (andAddMore) {
      setTrainingForNewParticipant(updatedTraining);
      setGlobalToast(`Peserta "${newParticipant.name}" ditambahkan! Silakan input atau pilih peserta berikutnya.`);
      setTimeout(() => setGlobalToast(null), 3000);
    } else {
      setTrainingForNewParticipant(null);
      setGlobalToast(`Peserta "${newParticipant.name}" berhasil ditambahkan ke jadwal pelatihan!`);
      setTimeout(() => setGlobalToast(null), 4000);
    }
  };

  // Handler tambah banyak peserta sekaligus dari data karyawan
  const handleAddParticipantsToNewTraining = (newParticipants: Participant[]) => {
    if (!trainingForNewParticipant || newParticipants.length === 0) return;

    const currentTraining = trainings.find((t) => t.id === trainingForNewParticipant.id) || trainingForNewParticipant;
    const updatedParticipants = [...(currentTraining.participants || []), ...newParticipants];
    const existingUnits = currentTraining.targetUnits || [];
    const newUnits = newParticipants.map((p) => p.unitKerja).filter((u) => u && !existingUnits.includes(u));
    const updatedUnits = [...existingUnits, ...Array.from(new Set(newUnits))];

    const updatedTraining: Training = {
      ...currentTraining,
      participants: updatedParticipants,
      targetUnits: updatedUnits
    };

    handleUpdateTraining(updatedTraining);
    setTrainingForNewParticipant(null);
    setGlobalToast(`${newParticipants.length} peserta dari Data Karyawan berhasil ditambahkan ke jadwal pelatihan!`);
    setTimeout(() => setGlobalToast(null), 4000);
  };

  // Update existing training (e.g. after adding participant or changing attendance)
  const handleUpdateTraining = (updated: Training) => {
    setTrainings((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    // Keep modal in sync
    setSelectedTraining(updated);
    // Asynchronously push to Firebase Firestore
    saveTrainingToFirebase(updated).catch(() => {});
  };

  // Delete single training handler (Restricted for view-only users)
  const handleDeleteTraining = (trainingId: string) => {
    if (!canEdit(currentUser)) {
      setGlobalAlert('Akun dengan akses peninjau (Melihat) tidak berwenang menghapus agenda pelatihan.');
      setTimeout(() => setGlobalAlert(null), 4000);
      return;
    }
    setTrainings((prev) => prev.filter((t) => t.id !== trainingId));
    if (selectedTraining?.id === trainingId) {
      setSelectedTraining(null);
    }
    setCalendarSelectedIds((prev) => prev.filter((id) => id !== trainingId));
    // Asynchronously delete from Firebase Firestore
    deleteTrainingFromFirebase(trainingId).catch(() => {});
  };

  // Batch delete trainings handler (Restricted for view-only users)
  const handleBatchDeleteTrainings = (trainingIds: string[]) => {
    if (!canEdit(currentUser)) {
      setGlobalAlert('Akun dengan akses peninjau (Melihat) tidak berwenang menghapus agenda pelatihan.');
      setTimeout(() => setGlobalAlert(null), 4000);
      return;
    }
    if (trainingIds.length === 0) return;

    setTrainings((prev) => prev.filter((t) => !trainingIds.includes(t.id)));
    if (selectedTraining && trainingIds.includes(selectedTraining.id)) {
      setSelectedTraining(null);
    }
    setCalendarSelectedIds((prev) => prev.filter((id) => !trainingIds.includes(id)));
    setShowCalendarBatchDeleteModal(false);

    // Asynchronously delete from Firebase Firestore
    bulkDeleteTrainingsFromFirebase(trainingIds).catch(() => {});

    setGlobalToast(`Berhasil menghapus ${trainingIds.length} pelatihan terpilih.`);
    setTimeout(() => setGlobalToast(null), 3500);
  };

  // Calendar multi-select helpers
  const handleToggleSelectCalendarTraining = (id: string) => {
    setCalendarSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllForDate = (dateTrainings: Training[]) => {
    const ids = dateTrainings.map((t) => t.id);
    setCalendarSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleDeselectAllForDate = (dateTrainings: Training[]) => {
    const ids = new Set(dateTrainings.map((t) => t.id));
    setCalendarSelectedIds((prev) => prev.filter((id) => !ids.has(id)));
  };

  const handleSelectAllInCurrentMonth = (specificMonthTrainings?: Training[] | unknown) => {
    if (Array.isArray(specificMonthTrainings) && specificMonthTrainings.length > 0) {
      setCalendarSelectedIds(specificMonthTrainings.map((t) => t.id));
      setIsCalendarBatchMode(true);
      return;
    }
    const monthTrainings = trainings.filter((t) => {
      const [y, m] = t.date.split('-').map(Number);
      if (y === currentYear && m === currentMonth + 1) return true;
      if (t.endDate && t.endDate > t.date) {
        const [ey, em] = t.endDate.split('-').map(Number);
        if (ey === currentYear && em === currentMonth + 1) return true;
      }
      return false;
    });
    setCalendarSelectedIds(monthTrainings.map((t) => t.id));
    setIsCalendarBatchMode(true);
  };


  // Reset data to standard default handler (Only Otoritas Penuh)
  const handleResetData = () => {
    const isFull = isFullAuthority(currentUser);
    if (!isFull) {
      alert('Hanya akun dengan Otoritas Penuh yang berwenang memulihkan data standar.');
      return;
    }
    setShowResetDataModal(true);
  };

  const handleConfirmResetData = () => {
    const isFull = isFullAuthority(currentUser);
    if (!isFull) {
      setShowResetDataModal(false);
      return;
    }
    localStorage.setItem(DATA_INITIALIZED_KEY, 'true');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TRAININGS));
    setTrainings(INITIAL_TRAININGS);
    setSelectedDate('2026-10-25');
    setShowResetDataModal(false);
    // Bulk sync default data to Firebase Firestore
    bulkUploadTrainingsToFirebase(INITIAL_TRAININGS).catch(() => {});
  };

  // =========================================================================
  // 4-Way Arrow Key & Screen Navigation (Atas, Bawah, Kiri, Kanan)
  // =========================================================================
  const [activeNavDirection, setActiveNavDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  // Helper to shift selected date by N days
  const shiftSelectedDate = (deltaDays: number) => {
    const parts = selectedDate.split('-').map(Number);
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    dateObj.setDate(dateObj.getDate() + deltaDays);

    const newY = dateObj.getFullYear();
    const newM = dateObj.getMonth();
    const newD = dateObj.getDate();
    const newDStr = `${newY}-${String(newM + 1).padStart(2, '0')}-${String(newD).padStart(2, '0')}`;

    setSelectedDate(newDStr);

    if (newY !== currentYear || newM !== currentMonth) {
      setCurrentYear(newY);
      setCurrentMonth(newM);
    }
  };

  // Helper to smoothly scroll the active viewport or scrollable container
  const scrollActiveViewport = (deltaY: number, deltaX: number = 0) => {
    const scrollables = Array.from(
      document.querySelectorAll<HTMLElement>('.overflow-y-auto, .overflow-auto, main, section')
    );
    const target = scrollables.find((el) => {
      const style = window.getComputedStyle(el);
      const canY = (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
      const canX = (style.overflowX === 'auto' || style.overflowX === 'scroll') && el.scrollWidth > el.clientWidth;
      return (deltaY !== 0 && canY) || (deltaX !== 0 && canX);
    });

    if (target) {
      target.scrollBy({ top: deltaY, left: deltaX, behavior: 'smooth' });
    } else {
      window.scrollBy({ top: deltaY, left: deltaX, behavior: 'smooth' });
    }
  };

  const handleNavigate = (direction: 'up' | 'down' | 'left' | 'right') => {
    setActiveNavDirection(direction);
    setTimeout(() => setActiveNavDirection(null), 250);

    if (activeView === 'calendar') {
      if (direction === 'up') {
        shiftSelectedDate(-7); // Move 1 week up in calendar
        scrollActiveViewport(-140, 0);
      } else if (direction === 'down') {
        shiftSelectedDate(7); // Move 1 week down in calendar
        scrollActiveViewport(140, 0);
      } else if (direction === 'left') {
        shiftSelectedDate(-1); // Move 1 day back
        scrollActiveViewport(0, -140);
      } else if (direction === 'right') {
        shiftSelectedDate(1); // Move 1 day forward
        scrollActiveViewport(0, 140);
      }
    } else if (activeView === 'agenda') {
      // In Agenda: emit event to navigate item from top to bottom
      window.dispatchEvent(new CustomEvent('agenda-navigate-key', { detail: { direction } }));
    } else {
      // In Units, Analytics, Settings views: smoothly scroll page
      if (direction === 'up') {
        scrollActiveViewport(-200, 0);
      } else if (direction === 'down') {
        scrollActiveViewport(200, 0);
      } else if (direction === 'left') {
        scrollActiveViewport(0, -200);
      } else if (direction === 'right') {
        scrollActiveViewport(0, 200);
      }
    }
  };

  // Get trainings scheduled on the currently selected date (mendukung pelatihan multi-hari / rentang tanggal)
  const selectedDateTrainings = useMemo(() => {
    return trainings.filter((t) => {
      if (t.endDate && t.endDate > t.date) {
        return selectedDate >= t.date && selectedDate <= t.endDate;
      }
      return t.date === selectedDate;
    });
  }, [trainings, selectedDate]);

  // Global Keyboard Shortcuts & Navigation Listener
  // 1. Exit / Log Out: Ctrl + W (atau Cmd + W, Ctrl + Q, Alt + L)
  // 2. Layar Penuh: Tombol F (di luar kolom input/textarea)
  // 3. Cheatsheet Shortcut: Tombol '?' (atau Shift + /)
  // 4. Navigasi Cepat View: Tombol 1 - 5 & Tombol T (Hari Ini)
  // 5. Cetak Presensi: Ctrl + P / Cmd + P
  // 6. Ekspor Excel: Ctrl + E / Cmd + E
  // 7. Buka Agenda: Enter (di Kalender maupun Daftar Pelatihan)
  // 8. Jadwalkan Baru: Tombol N / Alt + N (khusus Otoritas Edit/Penuh)
  // 9. Hapus Massal: Tombol Delete / Backspace saat item terpilih
  // 10. Navigasi 4-Arah: Panah Atas, Bawah, Kiri, Kanan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Kunci Layar: Alt + L
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        handleLockScreen();
        return;
      }

      // 1b. Exit / Log Out: Tombol Ctrl + W / Cmd + W atau Ctrl + Q
      if (
        (e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W' || e.key === 'q' || e.key === 'Q')
      ) {
        e.preventDefault();
        if (currentUser) {
          handleLogout();
        }
        return;
      }

      // Periksa apakah user sedang mengetik di input, textarea, select, atau editable element
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || Boolean(target?.isContentEditable);

      // Cetak Lembar Presensi / Hadir: Ctrl + P / Cmd + P
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        if (selectedTraining) {
          setPrintingTraining(selectedTraining);
          return;
        }
        if (activeView === 'calendar') {
          if (selectedDateTrainings.length > 0) {
            setPrintingTraining(selectedDateTrainings[0]);
          } else if (trainings.length > 0) {
            setPrintingTraining(trainings[0]);
          }
          return;
        }
        if (trainings.length > 0) {
          setPrintingTraining(trainings[0]);
        }
        return;
      }

      // Ekspor Seluruh Agenda ke Excel: Ctrl + E / Cmd + E
      if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        exportCompleteAgendaToExcel(trainings);
        setGlobalToast('Mengunduh rekap lengkap agenda pelatihan (.xlsx)...');
        setTimeout(() => setGlobalToast(null), 3000);
        return;
      }

      // Esc untuk menutup modal, drawer, membatalkan seleksi massal
      if (e.key === 'Escape') {
        if (printingTraining) {
          e.preventDefault();
          setPrintingTraining(null);
          return;
        }
        if (showCalendarBatchDeleteModal) {
          e.preventDefault();
          setShowCalendarBatchDeleteModal(false);
          return;
        }
        if (calendarSelectedIds.length > 0) {
          e.preventDefault();
          setCalendarSelectedIds([]);
          setIsCalendarBatchMode(false);
          return;
        }
        if (selectedTraining) {
          e.preventDefault();
          setSelectedTraining(null);
          return;
        }
        if (showAddTraining) {
          e.preventDefault();
          setShowAddTraining(false);
          return;
        }
        if (showResetDataModal) {
          e.preventDefault();
          setShowResetDataModal(false);
          return;
        }
        if (isMobileSidebarOpen) {
          e.preventDefault();
          setIsMobileSidebarOpen(false);
          return;
        }
      }

      // 2. Layar Penuh / Full Layer: Tombol F
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (!isInput) {
          e.preventDefault();
          toggleFullscreenMode();
          return;
        }
      }

      // Shortcut Buka Daftar Shortcut: Tombol '?' (atau Shift + /)
      if (e.key === '?' && !isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        handleViewChange('settings', 'shortcuts');
        return;
      }

      // Shortcut Navigasi View Cepat 1 - 5 (hanya jika tidak sedang mengetik dan tidak ada modal)
      if (!isInput && !selectedTraining && !showAddTraining && !showResetDataModal && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          handleViewChange('calendar');
          return;
        } else if (e.key === '2') {
          e.preventDefault();
          handleViewChange('agenda');
          return;
        } else if (e.key === '3') {
          e.preventDefault();
          handleViewChange('units');
          return;
        } else if (e.key === '4') {
          e.preventDefault();
          handleViewChange('analytics');
          return;
        } else if (e.key === '5') {
          e.preventDefault();
          handleViewChange('settings');
          return;
        } else if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          handleToday();
          return;
        }
      }

      // Shortcut Jadwalkan Pelatihan Baru: Tombol 'N' atau Alt + N
      if (!isInput && !selectedTraining && !showAddTraining && !showResetDataModal) {
        if (
          ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) ||
          (e.altKey && (e.key === 'n' || e.key === 'N'))
        ) {
          if (canEdit(currentUser)) {
            e.preventDefault();
            setAddTrainingInitialDate(selectedDate);
            setShowAddTraining(true);
            return;
          }
        }
      }

      // Shortcut Hapus Massal: Tombol Delete / Backspace di Kalender jika ada item terpilih
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput && activeView === 'calendar' && calendarSelectedIds.length > 0 && !showCalendarBatchDeleteModal) {
        e.preventDefault();
        if (!isFullAuthority(currentUser)) {
          setGlobalAlert('Hanya akun dengan Otoritas Penuh yang berwenang menghapus agenda pelatihan.');
          setTimeout(() => setGlobalAlert(null), 4000);
          return;
        }
        setShowCalendarBatchDeleteModal(true);
        return;
      }

      // Enter untuk membuka pelatihan yang sedang dipilih di Daftar Pelatihan atau Kalender
      if (e.key === 'Enter' && !isInput && !selectedTraining && !showAddTraining) {
        if (activeView === 'agenda') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('agenda-open-selected'));
          return;
        }
        if (activeView === 'calendar') {
          if (selectedDateTrainings.length > 0) {
            e.preventDefault();
            setSelectedTraining(selectedDateTrainings[0]);
            return;
          }
        }
      }

      // Navigasi panah hanya aktif jika user sudah login, tidak sedang mengetik, dan tidak ada modal aktif
      if (!currentUser || isInput || selectedTraining || showAddTraining) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleNavigate('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNavigate('down');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNavigate('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNavigate('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser, activeView, selectedDate, currentYear, currentMonth, selectedTraining, showAddTraining, showResetDataModal, isMobileSidebarOpen, printingTraining, calendarSelectedIds, showCalendarBatchDeleteModal, selectedDateTrainings, trainings]);

  // Executive Top Metrics
  const metrics = useMemo(() => {
    const totalTrainings = trainings.length;
    const totalParticipants = trainings.reduce((acc, t) => acc + t.participants.length, 0);
    const unitSet = new Set<string>();
    let totalHadir = 0;

    trainings.forEach((t) => {
      t.targetUnits?.forEach((u) => unitSet.add(u));
      t.participants.forEach((p) => {
        unitSet.add(p.unitKerja);
        if (p.statusKehadiran === 'Hadir') totalHadir++;
      });
    });

    const avgAttendance = totalParticipants > 0 ? Math.round((totalHadir / totalParticipants) * 100) : 0;

    return {
      totalTrainings,
      totalParticipants,
      totalUnits: unitSet.size,
      avgAttendance
    };
  }, [trainings]);

  // Selected date selection handler with automatic mobile drawer view switch
  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileCalendarTab('drawer');
    }
  };

  // If screen is locked or user is not authenticated, show opening Hospital Lock / LoginPage
  if (isScreenLocked || !currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess} 
        initialUsername={currentUser?.username || ''} 
      />
    );
  }

  return (
    <div 
      className="min-h-[100dvh] lg:h-screen w-full app-root-bg text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden lg:overflow-hidden relative"
      style={{ backgroundColor: activeTheme.bgDark }}
    >
      {/* Dynamic Wallpaper & Background Layer */}
      <div className="app-dynamic-bg-wrapper" aria-hidden="true">
        <div className="app-dynamic-bg-layer" />
        <div className="app-dynamic-bg-overlay" />
      </div>

      {/* Left Vertical Sidebar (Menu navigasi ke bawah di samping kiri) */}
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        onOpenAddTraining={() => {
          setAddTrainingInitialDate(selectedDate);
          setShowAddTraining(true);
        }}
        totalTrainings={metrics.totalTrainings}
        totalUnits={metrics.totalUnits}
        totalEmployees={totalEmployeesCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onLockScreen={handleLockScreen}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 w-full overflow-y-auto lg:overflow-hidden relative z-1">
        {/* Contextual Top Bar */}
        <TopBar
          activeView={activeView}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenAddTraining={() => {
            setAddTrainingInitialDate(selectedDate);
            setShowAddTraining(true);
          }}
          onOpenAnalytics={() => setActiveView('analytics')}
          currentUser={currentUser}
          onUpdateUser={handleUpdateCurrentUser}
          onLogout={handleLogout}
          onLockScreen={handleLockScreen}
        />

        {/* Main Viewport Content Container - dynamically adjusts for Android & fits 100vh on Desktop */}
        <main className="flex-1 w-full px-2.5 sm:px-4 py-2 flex flex-col gap-2 min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* KPI Strip: Executive Aerodynamic Overview - Hanya terlihat di menu tren & grafik kehadiran sesuai preferensi */}
          {activeView === 'analytics' && (
            <section aria-label="Statistik Pelatihan" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveView('agenda')}
                className="bg-slate-900/95 hover:bg-slate-900 hover:border-cyan-500/50 transition-all cursor-pointer text-left border border-slate-800 rounded-xl p-3 flex items-center justify-between group active:scale-98 shadow-sm"
                title="Klik untuk melihat Daftar Agenda Pelatihan"
              >
                <div>
                  <p className="text-[10.5px] font-semibold text-slate-400 group-hover:text-cyan-300 transition-colors uppercase tracking-wider">
                    Total Agenda
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-white tabular-nums tracking-tight mt-0.5">
                    {metrics.totalTrainings}
                  </h3>
                  <p className="text-[10px] text-cyan-400 font-medium flex items-center gap-1 mt-0.5">
                    <span>Sesi Terdaftar</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px]">→</span>
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400/80 group-hover:scale-105 transition-all shadow-inner">
                  <CalendarIcon className="w-4 h-4" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('units')}
                className="bg-slate-900/95 hover:bg-slate-900 hover:border-sky-500/50 transition-all cursor-pointer text-left border border-slate-800 rounded-xl p-3 flex items-center justify-between group active:scale-98 shadow-sm"
                title="Klik untuk melihat Distribusi Unit Kerja & Peserta"
              >
                <div>
                  <p className="text-[10.5px] font-semibold text-slate-400 group-hover:text-sky-300 transition-colors uppercase tracking-wider">
                    Total Peserta
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-white tabular-nums tracking-tight mt-0.5">
                    {metrics.totalParticipants}
                  </h3>
                  <p className="text-[10px] text-sky-400 font-medium flex items-center gap-1 mt-0.5">
                    <span>Pegawai Ditugaskan</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px]">→</span>
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400 group-hover:border-sky-400/80 group-hover:scale-105 transition-all shadow-inner">
                  <Users className="w-4 h-4" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('units')}
                className="bg-slate-900/95 hover:bg-slate-900 hover:border-indigo-500/50 transition-all cursor-pointer text-left border border-slate-800 rounded-xl p-3 flex items-center justify-between group active:scale-98 shadow-sm"
                title="Klik untuk melihat Unit Kerja Terlibat"
              >
                <div>
                  <p className="text-[10.5px] font-semibold text-slate-400 group-hover:text-indigo-300 transition-colors uppercase tracking-wider">
                    Unit Kerja Terlibat
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-white tabular-nums tracking-tight mt-0.5">
                    {metrics.totalUnits}
                  </h3>
                  <p className="text-[10px] text-indigo-400 font-medium flex items-center gap-1 mt-0.5">
                    <span>Divisi & Departemen</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px]">→</span>
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 group-hover:border-indigo-400/80 group-hover:scale-105 transition-all shadow-inner">
                  <Building2 className="w-4 h-4" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('analytics')}
                className="bg-slate-900/95 hover:bg-slate-900 hover:border-emerald-500/50 transition-all cursor-pointer text-left border border-slate-800 rounded-xl p-3 flex items-center justify-between group active:scale-98 shadow-sm"
                title="Klik untuk melihat Visualisasi Tren Pelatihan & Kehadiran (Recharts)"
              >
                <div>
                  <p className="text-[10.5px] font-semibold text-slate-400 group-hover:text-emerald-300 transition-colors uppercase tracking-wider">
                    Kehadiran Personil
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-emerald-400 tabular-nums tracking-tight mt-0.5">
                    {metrics.avgAttendance}%
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                    <span>Rata-Rata Presensi</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px]">→</span>
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400/80 group-hover:scale-105 transition-all shadow-inner">
                  <Award className="w-4 h-4" />
                </div>
              </button>
            </section>
          )}

          {/* View Switching - Responsive & Adaptive */}
          <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
            {activeView === 'calendar' && (
              <section aria-label="Tampilan Kalender Pelatihan" className="h-full flex flex-col lg:grid lg:grid-cols-12 gap-3 min-h-0">
                {/* Mobile Segment Switcher (Active on Android & small screens) */}
                <div className="lg:hidden flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setMobileCalendarTab('calendar')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      mobileCalendarTab === 'calendar'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Kalender Bulan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileCalendarTab('drawer')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      mobileCalendarTab === 'drawer'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Sesi Tanggal ({selectedDateTrainings.length})</span>
                  </button>
                </div>

                {/* Calendar Main Grid (7 cols on large desktop, toggleable on mobile) */}
                <div className={`lg:col-span-7 h-full min-h-0 overflow-hidden ${mobileCalendarTab === 'calendar' ? 'block' : 'hidden lg:block'}`}>
                  <CalendarGrid
                    currentYear={currentYear}
                    currentMonth={currentMonth}
                    selectedDate={selectedDate}
                    trainings={trainings}
                    onSelectDate={handleSelectDate}
                    onSelectTraining={(training) => setSelectedTraining(training)}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onToday={handleToday}
                    onQuickAddForDate={(dStr) => {
                      setAddTrainingInitialDate(dStr);
                      setShowAddTraining(true);
                    }}
                    currentUser={currentUser}
                    selectedTrainingIds={calendarSelectedIds}
                    onToggleSelectTraining={handleToggleSelectCalendarTraining}
                    isBatchMode={isCalendarBatchMode}
                    onToggleBatchMode={() => setIsCalendarBatchMode((prev) => !prev)}
                    onSelectAllInMonth={handleSelectAllInCurrentMonth}
                    onSelectAllTrainings={(all) => {
                      setCalendarSelectedIds(all.map((t) => t.id));
                      setIsCalendarBatchMode(true);
                    }}
                    onDeselectAll={() => {
                      setCalendarSelectedIds([]);
                      setIsCalendarBatchMode(false);
                    }}
                    onBatchDelete={(ids) => {
                      if (!canEdit(currentUser)) {
                        setGlobalAlert('Akun dengan akses peninjau (Melihat) tidak berwenang menghapus agenda pelatihan.');
                        setTimeout(() => setGlobalAlert(null), 4000);
                        return;
                      }
                      setCalendarSelectedIds(ids);
                      setShowCalendarBatchDeleteModal(true);
                    }}
                  />
                </div>

                {/* Side Cockpit Drawer: Trainings on the Clicked Date (5 cols on large desktop, toggleable on mobile) */}
                <div className={`lg:col-span-5 h-full min-h-0 overflow-hidden ${mobileCalendarTab === 'drawer' ? 'block' : 'hidden lg:block'}`}>
                  <DateTrainingsDrawer
                    selectedDate={selectedDate}
                    trainings={selectedDateTrainings}
                    onSelectTraining={(training) => setSelectedTraining(training)}
                    onAddNewTrainingForDate={(date) => {
                      setAddTrainingInitialDate(date);
                      setShowAddTraining(true);
                    }}
                    onBackToCalendar={() => setMobileCalendarTab('calendar')}
                    currentUser={currentUser}
                    selectedTrainingIds={calendarSelectedIds}
                    onToggleSelectTraining={handleToggleSelectCalendarTraining}
                    onSelectAllForDate={handleSelectAllForDate}
                    onDeselectAllForDate={handleDeselectAllForDate}
                    onBatchDelete={(ids) => {
                      if (!isFullAuthority(currentUser)) {
                        setGlobalAlert('Hanya akun dengan Otoritas Penuh yang berwenang menghapus agenda pelatihan.');
                        setTimeout(() => setGlobalAlert(null), 4000);
                        return;
                      }
                      setCalendarSelectedIds(ids);
                      setShowCalendarBatchDeleteModal(true);
                    }}
                  />
                </div>

                {/* Floating Batch Bar for Calendar View */}
                {calendarSelectedIds.length > 0 && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-slate-900/98 via-slate-850/98 to-slate-900/98 border border-cyan-500/60 rounded-2xl p-2.5 px-4 flex items-center justify-between gap-3 shadow-2xl animate-smooth-slide-up max-w-xl w-[92%] sm:w-auto">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                      <span className="text-xs font-bold text-white whitespace-nowrap">
                        <span className="text-cyan-400 font-mono text-sm">{calendarSelectedIds.length}</span> Pelatihan Terpilih di Kalender
                      </span>
                      <span className="hidden sm:inline text-slate-600">·</span>
                      <button
                        type="button"
                        onClick={() => handleSelectAllInCurrentMonth()}
                        className="hidden sm:inline text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                      >
                        Pilih Semua Bulan Ini
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCalendarSelectedIds([]);
                          setIsCalendarBatchMode(false);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!isFullAuthority(currentUser)) {
                            setGlobalAlert('Hanya akun dengan Otoritas Penuh yang berwenang menghapus agenda pelatihan.');
                            setTimeout(() => setGlobalAlert(null), 4000);
                            return;
                          }
                          setShowCalendarBatchDeleteModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-md shadow-rose-950/40 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus ({calendarSelectedIds.length})</span>
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeView === 'agenda' && (
              <section aria-label="Daftar Agenda Pelatihan" className="h-full min-h-0 overflow-hidden">
                <AgendaListView
                  trainings={trainings}
                  onSelectTraining={(training) => setSelectedTraining(training)}
                  onBatchDelete={handleBatchDeleteTrainings}
                  currentUser={currentUser}
                />
              </section>
            )}


            {activeView === 'units' && (
              <section aria-label="Distribusi Unit Kerja" className="h-full min-h-0 overflow-hidden">
                <UnitBreakdownView
                  trainings={trainings}
                  onSelectTraining={(training) => setSelectedTraining(training)}
                />
              </section>
            )}

            {activeView === 'employees' && (
              <section aria-label="Data Karyawan RSIA Az Zahra" className="h-full min-h-0 overflow-hidden">
                <EmployeesDirectoryView
                  trainings={trainings}
                  currentUser={currentUser}
                />
              </section>
            )}

            {activeView === 'analytics' && (
              <section aria-label="Visualisasi Tren Pelatihan & Kehadiran" className="h-full min-h-0 flex flex-col overflow-y-auto">
                <TrainingTrendAnalytics
                  trainings={trainings}
                  onSelectTraining={(training) => setSelectedTraining(training)}
                />
              </section>
            )}

            {activeView === 'settings' && (
              <section aria-label="Pengaturan Akun & Akses Pengguna" className="h-full min-h-0 overflow-hidden">
                <SettingsAccountView
                  key={settingsTab}
                  currentUser={currentUser}
                  initialTab={settingsTab}
                  onResetTrainingsData={handleConfirmResetData}
                  trainingsCount={trainings.length}
                />
              </section>
            )}
          </div>
        </main>

        {/* Dynamic Responsive Footer */}
        <footer className="shrink-0 py-2 sm:py-2.5 border-t border-slate-800/80 bg-slate-950 px-3 sm:px-4 text-xs text-slate-300 flex items-center justify-center text-center">
          <p>© 2026 <span className="font-bold text-slate-200">Kalender Diklat RSIA Az Zahra</span> · Sistem Informasi Kalender Pelatihan &amp; Manajemen Partisipasi Unit Kerja.</p>
        </footer>
      </div>

      {/* MODAL: Training Detail (Shows Participant Names & Unit Kerja) */}
      {selectedTraining && (
        <TrainingDetailModal
          training={selectedTraining}
          onClose={() => setSelectedTraining(null)}
          onUpdateTraining={handleUpdateTraining}
          onDeleteTraining={handleDeleteTraining}
          currentUser={currentUser}
        />
      )}

      {/* MODAL: Add Training */}
      {showAddTraining && (
        <AddTrainingModal
          initialDate={addTrainingInitialDate}
          onClose={() => setShowAddTraining(false)}
          onAddTraining={handleAddTraining}
        />
      )}

      {/* MODAL: Tambah Peserta Otomatis Setelah Simpan & Terbitkan Jadwal Baru */}
      {trainingForNewParticipant && (
        <AddParticipantModal
          trainingTitle={trainingForNewParticipant.title}
          defaultUnit={trainingForNewParticipant.targetUnits?.[0]}
          existingParticipants={trainingForNewParticipant.participants}
          onClose={() => setTrainingForNewParticipant(null)}
          onAddParticipant={handleAddParticipantToNewTraining}
          onAddParticipants={handleAddParticipantsToNewTraining}
        />
      )}

      {/* MODAL: Reset Training Data Confirmation */}
      {showResetDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowResetDataModal(false)}
            className="fixed inset-0 bg-slate-950/85"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-rose-800/80 p-6 shadow-2xl text-slate-100 z-10 space-y-4">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950 flex items-center justify-center border border-rose-800/60 shrink-0">
                <RotateCcw className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pulihkan Data Pelatihan</h3>
                <p className="text-xs text-rose-300">Kembalikan ke agenda & presensi default</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda ingin memulihkan seluruh agenda pelatihan dan presensi ke data standar (default)? Data kustom yang telah diinput akan dihapus.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetDataModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetData}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer shadow-lg shadow-rose-950 active:scale-95"
              >
                Ya, Pulihkan Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Calendar Batch Deletion Confirmation */}
      {showCalendarBatchDeleteModal && (
        <BatchDeleteModal
          isOpen={showCalendarBatchDeleteModal}
          selectedTrainings={trainings.filter((t) => calendarSelectedIds.includes(t.id))}
          onConfirm={() => handleBatchDeleteTrainings(calendarSelectedIds)}
          onClose={() => setShowCalendarBatchDeleteModal(false)}
        />
      )}

      {/* MODAL: Global Print Attendance Sheet (Ctrl + P) */}
      {printingTraining && (
        <PrintAttendanceModal
          training={printingTraining}
          onClose={() => setPrintingTraining(null)}
        />
      )}

      {/* GLOBAL ALERT NOTIFICATION */}
      {globalAlert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-950/98 border border-rose-500/60 shadow-2xl text-rose-100">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
              {globalAlert}
            </div>
            <button
              onClick={() => setGlobalAlert(null)}
              className="text-rose-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL TOAST NOTIFICATION */}
      {globalToast && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-950/98 border border-emerald-500/60 shadow-2xl text-emerald-100">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold flex-1">{globalToast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
