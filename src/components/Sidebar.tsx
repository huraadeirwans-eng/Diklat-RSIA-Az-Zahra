import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ListFilter, 
  Building2, 
  Plus, 
  Layers, 
  X, 
  ShieldCheck,
  ChevronDown,
  CalendarPlus,
  BarChart3,
  Settings,
  UserPlus,
  KeyRound,
  RotateCcw,
  Cloud,
  Keyboard,
  Users,
  Printer,
  Palette,
  LayoutGrid,
  HeartPulse,
  LogOut
} from 'lucide-react';
import { User, getUserAuthority } from '../types/auth';


interface SidebarProps {
  activeView: 'calendar' | 'agenda' | 'units' | 'employees' | 'analytics' | 'settings';
  onViewChange: (view: 'calendar' | 'agenda' | 'units' | 'employees' | 'analytics' | 'settings', tab?: 'overview' | 'add' | 'reset' | 'restore' | 'cloud' | 'shortcuts' | 'themes' | 'signees' | 'backgrounds') => void;
  onOpenAddTraining: () => void;
  totalTrainings: number;
  totalUnits: number;
  totalEmployees?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
  onLockScreen?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  onOpenAddTraining,
  totalTrainings,
  totalUnits,
  totalEmployees,
  isOpenMobile,
  onCloseMobile,
  currentUser,
  onLogout,
  onLockScreen
}) => {
  // Collapsible dropdown state for Pengaturan sub-menu
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    if (activeView === 'settings') {
      setIsSettingsDropdownOpen(true);
    }
  }, [activeView]);

  const handleItemClick = (view: 'calendar' | 'agenda' | 'units' | 'employees' | 'analytics' | 'settings', tab?: 'overview' | 'add' | 'reset' | 'restore' | 'cloud' | 'shortcuts' | 'themes' | 'signees' | 'backgrounds') => {
    onViewChange(view, tab);
    onCloseMobile();
  };

  const handleOpenAdd = () => {
    onOpenAddTraining();
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/90 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-76 sm:w-80 lg:w-[320px] bg-slate-950/98 border-r border-slate-800/90 flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 lg:static lg:h-screen shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Wordmark Area */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-[15px] font-extrabold tracking-tight text-white block leading-snug">
                Diklat <span className="text-cyan-400">RSIA Az Zahra</span>
              </span>
              <span className="text-[11px] font-medium text-slate-400 block -mt-0.5 tracking-tight flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                <span>Kalender &amp; Presensi Kehadiran</span>
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden cursor-pointer active:scale-95"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vertical Navigation Menu Section (Menu di samping kiri ke bawah) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Menu Navigasi
              </span>
            </div>

            <nav className="space-y-1">
              {/* 1. Menu: Tren & Grafik Kehadiran (Recharts Visualisasi) */}
              <button
                onClick={() => handleItemClick('analytics')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer relative ${
                  activeView === 'analytics'
                    ? 'bg-slate-900/90 text-white border border-cyan-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                {activeView === 'analytics' && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full" />
                )}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeView === 'analytics'
                        ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-xs'
                        : 'bg-slate-900/70 border border-slate-800/70 text-slate-400 group-hover:text-cyan-300 group-hover:border-slate-700'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs sm:text-[13px] font-semibold block leading-tight truncate ${
                        activeView === 'analytics' ? 'text-white font-bold' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      Tren &amp; Grafik Kehadiran
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight mt-0.5 truncate">
                      Visualisasi grafik bulanan
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-medium shrink-0 ml-2 ${
                    activeView === 'analytics'
                      ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800/60 group-hover:text-slate-300'
                  }`}
                >
                  Grafik
                </span>
              </button>

              {/* 2. Menu: Kalender Pelatihan */}
              <button
                onClick={() => handleItemClick('calendar')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer relative ${
                  activeView === 'calendar'
                    ? 'bg-slate-900/90 text-white border border-cyan-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                {activeView === 'calendar' && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full" />
                )}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeView === 'calendar'
                        ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-xs'
                        : 'bg-slate-900/70 border border-slate-800/70 text-slate-400 group-hover:text-cyan-300 group-hover:border-slate-700'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs sm:text-[13px] font-semibold block leading-tight truncate ${
                        activeView === 'calendar' ? 'text-white font-bold' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      Kalender Pelatihan
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight mt-0.5 truncate">
                      Format kalender bulanan &amp; harian
                    </span>
                  </div>
                </div>
              </button>

              {/* 3. Menu: Jadwalkan Pelatihan */}
              {(() => {
                const authority = getUserAuthority(currentUser);
                const isViewOnly = authority === 'Melihat';

                if (isViewOnly) {
                  return (
                    <div
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left border border-slate-800/50 bg-slate-900/30 opacity-60 cursor-not-allowed select-none"
                      title="Otoritas Melihat: Pembuatan jadwal dinonaktifkan."
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-slate-800/80 text-slate-500 flex items-center justify-center shrink-0">
                          <CalendarPlus className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-[13px] font-medium text-slate-400 block leading-tight truncate">
                            Jadwalkan Pelatihan
                          </span>
                          <span className="text-[10px] text-slate-400 block leading-tight mt-0.5 truncate">
                            Mode Melihat (Terkunci)
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono text-slate-400 bg-slate-800/60 border border-slate-700/60 shrink-0 ml-2">
                        Melihat
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    onClick={handleOpenAdd}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-900/80 hover:from-cyan-900/50 hover:to-slate-900 text-slate-200 hover:text-white hover:border-cyan-400/50 shadow-xs active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-sky-500 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                        <CalendarPlus className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs sm:text-[13px] font-bold text-white group-hover:text-cyan-300 transition-colors block leading-tight truncate">
                          Jadwalkan Pelatihan
                        </span>
                        <span className="text-[10px] text-slate-400 block leading-tight mt-0.5 truncate">
                          Buat &amp; daftarkan sesi baru
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-md font-medium shrink-0 ml-2 bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 flex items-center gap-1">
                      <Plus className="w-3 h-3 text-cyan-400" />
                      <span>Sesi Baru</span>
                    </span>
                  </button>
                );
              })()}

              {/* 4. Menu: Daftar Pelatihan */}
              <button
                onClick={() => handleItemClick('agenda')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer relative ${
                  activeView === 'agenda'
                    ? 'bg-slate-900/90 text-white border border-cyan-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                {activeView === 'agenda' && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full" />
                )}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeView === 'agenda'
                        ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-xs'
                        : 'bg-slate-900/70 border border-slate-800/70 text-slate-400 group-hover:text-cyan-300 group-hover:border-slate-700'
                    }`}
                  >
                    <ListFilter className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs sm:text-[13px] font-semibold block leading-tight truncate ${
                        activeView === 'agenda' ? 'text-white font-bold' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      Daftar Pelatihan
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight mt-0.5 truncate">
                      Daftar jadwal &amp; agenda lengkap
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-medium shrink-0 ml-2 ${
                    activeView === 'agenda'
                      ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800/60 group-hover:text-slate-300'
                  }`}
                >
                  {totalTrainings} Sesi
                </span>
              </button>

              {/* 5. Menu: Distribusi Unit Kerja */}
              <button
                onClick={() => handleItemClick('units')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer relative ${
                  activeView === 'units'
                    ? 'bg-slate-900/90 text-white border border-cyan-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                {activeView === 'units' && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full" />
                )}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeView === 'units'
                        ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-xs'
                        : 'bg-slate-900/70 border border-slate-800/70 text-slate-400 group-hover:text-cyan-300 group-hover:border-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs sm:text-[13px] font-semibold block leading-tight truncate ${
                        activeView === 'units' ? 'text-white font-bold' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      Distribusi Unit Kerja
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight mt-0.5 truncate">
                      Partisipasi personil lintas divisi
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-medium shrink-0 ml-2 ${
                    activeView === 'units'
                      ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800/60 group-hover:text-slate-300'
                  }`}
                >
                  {totalUnits} Unit
                </span>
              </button>

              {/* 5b. Menu: Data Karyawan */}
              <button
                onClick={() => handleItemClick('employees')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer relative ${
                  activeView === 'employees'
                    ? 'bg-slate-900/90 text-white border border-cyan-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                {activeView === 'employees' && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full" />
                )}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeView === 'employees'
                        ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-xs'
                        : 'bg-slate-900/70 border border-slate-800/70 text-slate-400 group-hover:text-cyan-300 group-hover:border-slate-700'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs sm:text-[13px] font-semibold block leading-tight truncate ${
                        activeView === 'employees' ? 'text-white font-bold' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      Data Karyawan
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight mt-0.5 truncate">
                      Perawat &amp; Bidan RSIA Az Zahra
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-medium shrink-0 ml-2 ${
                    activeView === 'employees'
                      ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800/60 group-hover:text-slate-300'
                  }`}
                >
                  {totalEmployees !== undefined ? `${totalEmployees} Karyawan` : 'Direktori'}
                </span>
              </button>

              {/* 6. Menu: Pengaturan */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleItemClick('settings', 'overview');
                    setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer relative ${
                    activeView === 'settings'
                      ? 'bg-slate-900/90 text-white border border-cyan-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent'
                  }`}
                >
                  {activeView === 'settings' && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full" />
                  )}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        activeView === 'settings'
                          ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-xs'
                          : 'bg-slate-900/70 border border-slate-800/70 text-slate-400 group-hover:text-cyan-300 group-hover:border-slate-700'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs sm:text-[13px] font-semibold block leading-tight truncate ${
                          activeView === 'settings' ? 'text-white font-bold' : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        Pengaturan
                      </span>
                      <span className="text-[10px] text-slate-400 block leading-tight mt-0.5 truncate">
                        {(() => {
                          const authority = getUserAuthority(currentUser);
                          if (authority === 'Otoritas Penuh') return 'Kelola Akun & Reset (Otoritas Penuh)';
                          if (authority === 'Edit') return 'Pengaturan Akun (Edit)';
                          return 'Daftar Akun (Melihat)';
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center shrink-0 ml-2">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isSettingsDropdownOpen ? 'rotate-180 text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    />
                  </div>
                </button>

                {/* Collapsible Dropdown Sub-menu */}
                {isSettingsDropdownOpen && (() => {
                  const authority = getUserAuthority(currentUser);
                  const isFull = authority === 'Otoritas Penuh';
                  const isEdit = authority === 'Edit';
                  return (
                    <div className="ml-5 pl-4 mt-1 border-l-2 border-slate-800/80 space-y-1 transition-all duration-200">
                      {!isFull && (
                        <div className={`p-2 mb-1.5 rounded-xl border text-[10px] ${
                          isEdit 
                            ? 'bg-amber-950/40 border-amber-800/50 text-amber-300' 
                            : 'bg-sky-950/40 border-sky-800/50 text-sky-300'
                        }`}>
                          <span className="font-bold block text-white flex items-center gap-1">
                            <span>{isEdit ? 'Otoritas: Edit' : 'Otoritas: Melihat'}</span>
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {isEdit 
                              ? 'Tambah personil, reset sandi, & hapus akun memerlukan Otoritas Penuh.' 
                              : 'Pengaturan akun hanya dapat dimodifikasi oleh Administrator Diklat.'}
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleItemClick('settings', 'overview')}
                        className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-left text-xs font-bold text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-800/70 transition-colors cursor-pointer group mb-1.5"
                      >
                        <LayoutGrid className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span className="truncate">Menu Pengaturan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemClick('settings', 'add')}
                        className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-left text-xs font-semibold text-slate-400 hover:text-cyan-300 hover:bg-slate-900/60 transition-colors cursor-pointer group"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-cyan-400/80 group-hover:scale-110 transition-transform" />
                        <span className="truncate">Add Akun</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemClick('settings', 'reset')}
                        className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-left text-xs font-semibold text-slate-400 hover:text-cyan-300 hover:bg-slate-900/60 transition-colors cursor-pointer group"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-sky-400/80 group-hover:scale-110 transition-transform" />
                        <span className="truncate">Resset Akun</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemClick('settings', 'restore')}
                        className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-left text-xs font-semibold text-rose-400/90 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer group"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-400 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="truncate">Pulihkan Data Standar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemClick('settings', 'cloud')}
                        className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-left text-xs font-semibold text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-950/30 transition-colors cursor-pointer group"
                      >
                        <Cloud className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="truncate">Firebase Cloud</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemClick('settings', 'signees')}
                        className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-left text-xs font-semibold text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/30 transition-colors cursor-pointer group"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span className="truncate">Format TTD Cetak</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemClick('settings', 'backgrounds')}
                        className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-left text-xs font-semibold text-cyan-400/90 hover:text-cyan-300 hover:bg-cyan-950/30 transition-colors cursor-pointer group"
                      >
                        <Layers className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span className="truncate">Ganti Background (20)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemClick('settings', 'themes')}
                        className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-left text-xs font-semibold text-sky-400/90 hover:text-sky-300 hover:bg-sky-950/30 transition-colors cursor-pointer group"
                      >
                        <Palette className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                        <span className="truncate">Tema Website (12)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemClick('settings', 'shortcuts')}
                        className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-left text-xs font-semibold text-purple-400/90 hover:text-purple-300 hover:bg-purple-950/30 transition-colors cursor-pointer group"
                      >
                        <Keyboard className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span className="truncate">Daftar Shortcut</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </nav>
          </div>

          {/* Quick Info Box in Sidebar */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Standar Corporate</span>
            </div>
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              Seluruh pelatihan terintegrasi dengan validasi daftar hadir dan pemenuhan sertifikasi Jam Pembelajaran (JP).
            </p>
          </div>
        </div>

        {/* Sidebar Footer: Institutional Brand & Executive User Profile */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/95 shrink-0 space-y-2.5">
          {/* Institutional Brand Header */}
          <div className="flex items-center gap-2.5 px-0.5">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 flex flex-col items-center justify-center shadow-xs">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[7px] font-black tracking-wider text-emerald-300 font-mono -mt-0.5">
                  RSIA
                </span>
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-bold text-slate-100 tracking-tight truncate leading-tight">
                Nursing Preceptor Academy
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                <span className="font-semibold text-emerald-400 tracking-wide text-[9px]">RSIA PLG</span>
                <span className="text-slate-600">·</span>
                <span className="font-mono text-slate-400">SIM-Diklat 2026</span>
              </div>
            </div>
          </div>

          {/* Executive User Card (No truncated text!) */}
          {currentUser && (() => {
            const authority = getUserAuthority(currentUser);
            const isAdmin = authority === 'Otoritas Penuh';
            const badgeStyle = 
              authority === 'Otoritas Penuh'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                : authority === 'Edit'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                : 'bg-sky-500/10 text-sky-300 border-sky-500/25';

            const badgeLabel = 
              authority === 'Otoritas Penuh'
                ? 'Otoritas Penuh'
                : authority === 'Edit'
                ? 'Akses Edit'
                : 'Viewer';

            return (
              <div className="bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                    ) : isAdmin ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="text-xs font-bold text-emerald-300">{currentUser.name.charAt(0)}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[12px] font-semibold text-white truncate leading-tight">
                        {isAdmin ? 'Administrator Diklat' : currentUser.name}
                      </span>
                      <span 
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border shrink-0 ${badgeStyle}`}
                        title={`Tingkat Otoritas: ${authority}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>{badgeLabel}</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {currentUser.unit || 'Bagian Diklat & Litbang'}
                    </div>

                    {/* Action button: Keluar */}
                    {onLogout && (
                      <div className="flex items-center mt-2 pt-1.5 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={onLogout}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-all cursor-pointer active:scale-95"
                          title="Keluar dari Akun"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-400" />
                          <span>Keluar dari Akun</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

      </aside>
    </>
  );
};
