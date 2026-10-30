import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Palette, 
  UserPlus, 
  KeyRound, 
  Printer, 
  Shield, 
  RotateCcw, 
  Keyboard, 
  ArrowRight, 
  Search, 
  X,
  Cog,
  Network
} from 'lucide-react';
import { User } from '../types/auth';

export type SettingsTabType = 
  | 'overview' 
  | 'backgrounds' 
  | 'themes' 
  | 'add' 
  | 'reset' 
  | 'signees' 
  | 'cloud' 
  | 'restore' 
  | 'shortcuts';

interface SettingsMenuHubProps {
  onSelectMenu: (tab: SettingsTabType) => void;
  currentUser?: User | null;
  activeBackgroundName: string;
  activeThemeName: string;
  totalAccounts: number;
  totalTrainings: number;
}

interface MenuCatalogItem {
  id: SettingsTabType;
  title: string;
  category: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBoxBg: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  watermarkColor: string;
  categoryColor: string;
  buttonGradient: string;
}

export const SettingsMenuHub: React.FC<SettingsMenuHubProps> = ({
  onSelectMenu,
  totalAccounts
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const menuItems: MenuCatalogItem[] = useMemo(() => [
    // 1. Ganti Background
    {
      id: 'backgrounds',
      title: 'Ganti Background',
      category: 'VISUAL',
      badge: '20 Wallpaper',
      description: '20 wallpaper tema rumah sakit, ruang operasi, neon, & kustom.',
      icon: Layers,
      iconBoxBg: 'bg-gradient-to-br from-[#00b4d8] to-[#0077b6] text-white shadow-cyan-500/30',
      cardBg: 'bg-[#061325]/95',
      cardBorder: 'border-[#00a6e0]/40 hover:border-[#00c8ff]',
      cardShadow: 'shadow-cyan-950/50 hover:shadow-cyan-500/15',
      watermarkColor: 'text-cyan-400',
      categoryColor: 'text-cyan-400',
      buttonGradient: 'bg-gradient-to-r from-[#0088ff] to-[#00c8ff] hover:from-[#0077ee] hover:to-[#00bbee] shadow-cyan-500/25'
    },
    // 2. Tema Website
    {
      id: 'themes',
      title: 'Tema Website',
      category: 'VISUAL',
      badge: '18 Palet',
      description: '18 tema aksen & gradasi harmonis (pilihan mode terang & gelap).',
      icon: Palette,
      iconBoxBg: 'bg-gradient-to-br from-[#5956e9] to-[#8b5cf6] text-white shadow-indigo-500/30',
      cardBg: 'bg-[#090b24]/95',
      cardBorder: 'border-[#4f46e5]/40 hover:border-[#818cf8]',
      cardShadow: 'shadow-indigo-950/50 hover:shadow-indigo-500/15',
      watermarkColor: 'text-indigo-400',
      categoryColor: 'text-sky-400',
      buttonGradient: 'bg-gradient-to-r from-[#5956e9] to-[#7b61ff] hover:from-[#4d4ae0] hover:to-[#6f54f5] shadow-indigo-500/25'
    },
    // 3. Tambah Akun Baru
    {
      id: 'add',
      title: 'Tambah Akun Baru',
      category: 'AKUN',
      badge: 'Pendaftaran',
      description: 'Buat akun personil baru, NIP, unit kerja, & otoritas akses.',
      icon: UserPlus,
      iconBoxBg: 'bg-gradient-to-br from-[#10b981] to-[#059669] text-white shadow-emerald-500/30',
      cardBg: 'bg-[#031514]/95',
      cardBorder: 'border-[#10b981]/40 hover:border-[#34d399]',
      cardShadow: 'shadow-emerald-950/50 hover:shadow-emerald-500/15',
      watermarkColor: 'text-emerald-400',
      categoryColor: 'text-emerald-400',
      buttonGradient: 'bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#04875b] hover:to-[#0ea572] shadow-emerald-500/25'
    },
    // 4. Daftar & Reset Akun
    {
      id: 'reset',
      title: 'Daftar & Reset Akun',
      category: 'AKUN',
      badge: `${totalAccounts || 4} Akun`,
      description: 'Direktori akun, ubah profil, intip kredensial, & reset sandi.',
      icon: KeyRound,
      iconBoxBg: 'bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white shadow-amber-500/30',
      cardBg: 'bg-[#150d03]/95',
      cardBorder: 'border-[#f59e0b]/40 hover:border-[#fbbf24]',
      cardShadow: 'shadow-amber-950/50 hover:shadow-amber-500/15',
      watermarkColor: 'text-amber-400',
      categoryColor: 'text-amber-400',
      buttonGradient: 'bg-gradient-to-r from-[#ea580c] to-[#f59e0b] hover:from-[#d94e07] hover:to-[#e59005] shadow-amber-500/25'
    },
    // 5. Format TTD Cetak
    {
      id: 'signees',
      title: 'Format TTD Cetak',
      category: 'DOKUMEN',
      badge: 'Format A4',
      description: 'Nama Pejabat TTD, gelar, NIK/NIP, keperawatan & SDM.',
      icon: Printer,
      iconBoxBg: 'bg-gradient-to-br from-[#c026d3] to-[#9333ea] text-white shadow-fuchsia-500/30',
      cardBg: 'bg-[#140620]/95',
      cardBorder: 'border-[#a855f7]/40 hover:border-[#c084fc]',
      cardShadow: 'shadow-purple-950/50 hover:shadow-purple-500/15',
      watermarkColor: 'text-purple-400',
      categoryColor: 'text-purple-400',
      buttonGradient: 'bg-gradient-to-r from-[#7c3aed] to-[#c026d3] hover:from-[#6d28d9] hover:to-[#a21caf] shadow-purple-500/25'
    },
    // 6. Firebase Cloud
    {
      id: 'cloud',
      title: 'Firebase Cloud',
      category: 'SISTEM',
      badge: 'Firestore',
      description: 'Konektivitas cloud Firestore, sinkronisasi real-time & backup.',
      icon: Shield,
      iconBoxBg: 'bg-gradient-to-br from-[#06b6d4] to-[#0d9488] text-white shadow-cyan-500/30',
      cardBg: 'bg-[#031418]/95',
      cardBorder: 'border-[#06b6d4]/40 hover:border-[#22d3ee]',
      cardShadow: 'shadow-cyan-950/50 hover:shadow-cyan-500/15',
      watermarkColor: 'text-teal-400',
      categoryColor: 'text-teal-400',
      buttonGradient: 'bg-gradient-to-r from-[#0d9488] to-[#06b6d4] hover:from-[#0f766e] hover:to-[#0891b2] shadow-cyan-500/25'
    },
    // 7. Pulihkan Data Standar
    {
      id: 'restore',
      title: 'Pulihkan Data Standar',
      category: 'SISTEM',
      badge: 'Reset Bawaan',
      description: 'Kembalikan seluruh agenda & akun ke standar awal pabrik.',
      icon: RotateCcw,
      iconBoxBg: 'bg-gradient-to-br from-[#f43f5e] to-[#e11d48] text-white shadow-rose-500/30',
      cardBg: 'bg-[#18040a]/95',
      cardBorder: 'border-[#f43f5e]/40 hover:border-[#fb7185]',
      cardShadow: 'shadow-rose-950/50 hover:shadow-rose-500/15',
      watermarkColor: 'text-rose-400',
      categoryColor: 'text-rose-400',
      buttonGradient: 'bg-gradient-to-r from-[#e11d48] to-[#f43f5e] hover:from-[#be123c] hover:to-[#e11d48] shadow-rose-500/25'
    },
    // 8. Daftar Shortcut
    {
      id: 'shortcuts',
      title: 'Daftar Shortcut',
      category: 'PRODUKTIVITAS',
      badge: 'Tombol Pintas',
      description: 'Pintasan navigasi 4-arah, layar penuh (F), & cetak presensi.',
      icon: Keyboard,
      iconBoxBg: 'bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white shadow-blue-500/30',
      cardBg: 'bg-[#040d21]/95',
      cardBorder: 'border-[#3b82f6]/40 hover:border-[#60a5fa]',
      cardShadow: 'shadow-blue-950/50 hover:shadow-blue-500/15',
      watermarkColor: 'text-blue-400',
      categoryColor: 'text-sky-400',
      buttonGradient: 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] hover:from-[#1d4ed8] hover:to-[#2563eb] shadow-blue-500/25'
    }
  ], [totalAccounts]);

  // Filter items by search
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return menuItems;
    return menuItems.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.badge.toLowerCase().includes(q)
    );
  }, [menuItems, searchQuery]);

  return (
    <div className="w-full h-full flex flex-col justify-between gap-2.5 sm:gap-3 overflow-y-auto sm:overflow-hidden animate-smooth-fade select-none p-1 sm:p-2">
      {/* 1. Sub-Header Banner: Pusat Pengaturan SNMRS Diktat */}
      <div className="px-4 py-2.5 sm:py-3 rounded-2xl bg-[#061325]/90 border border-cyan-500/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 shadow-lg shadow-cyan-950/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/90 border border-cyan-400/60 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm shadow-cyan-500/20">
            <Network className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex items-center gap-2.5 flex-wrap truncate">
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide truncate">
              Pusat Pengaturan SNMRS Diktat
            </h2>
            <span className="px-3 py-1 rounded-full bg-[#072444] border border-cyan-500/50 text-[10.5px] font-mono text-cyan-300 font-extrabold shrink-0 shadow-xs">
              8 MODUL PENGATURAN
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72 lg:w-80 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengaturan..."
            className="w-full bg-[#051020] border border-cyan-500/30 focus:border-cyan-400 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Section Sub-heading: KATALOG MENU PENGATURAN (8) */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
          <Cog className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
          <span>KATALOG MENU PENGATURAN ({filteredItems.length})</span>
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Klik modul untuk membuka isi menu
        </span>
      </div>

      {/* 3. Grid of 8 Cards (4 Columns x 2 Rows) - Matches Image Pixel-for-Pixel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 flex-1 min-h-0">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => onSelectMenu(item.id)}
              className={`group relative p-3.5 sm:p-4 rounded-2xl ${item.cardBg} border ${item.cardBorder} transition-all duration-150 cursor-pointer shadow-xl ${item.cardShadow} flex flex-col justify-between overflow-hidden active:scale-[0.985]`}
            >
              {/* Subtle Decorative Background Watermark Icon */}
              <div className={`absolute -right-3 -bottom-3 opacity-[0.04] group-hover:opacity-[0.08] group-hover:scale-110 transition-all pointer-events-none ${item.watermarkColor}`}>
                <Icon className="w-28 h-28 sm:w-32 sm:h-32 stroke-[1.2]" />
              </div>

              {/* Top Row: Left Icon Box + Right Pill Badge */}
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.iconBoxBg} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-white" />
                  </div>

                  <span className="px-3 py-1 rounded-full bg-slate-950/90 border border-slate-700/80 text-[11px] font-mono text-slate-200 font-semibold truncate max-w-[120px] shadow-xs">
                    {item.badge}
                  </span>
                </div>

                {/* Category & Title & Description */}
                <div className="space-y-1">
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider ${item.categoryColor} block leading-none`}>
                    {item.category}
                  </span>
                  <h4 className="text-sm sm:text-base font-extrabold text-white group-hover:text-cyan-200 transition-colors line-clamp-1 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[11.5px] text-slate-300/80 leading-relaxed pt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Full-Width Solid Colored Gradient Button "Buka →" as seen in user reference */}
              <div className="mt-3.5 pt-1 relative z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMenu(item.id);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl ${item.buttonGradient} text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer group-hover:brightness-110`}
                >
                  <span>Buka</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
