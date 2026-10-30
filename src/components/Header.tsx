import React from 'react';
import { Calendar, Plus, Sparkles, Building2, ListFilter, BarChart3 } from 'lucide-react';

interface HeaderProps {
  activeView: 'calendar' | 'agenda' | 'units';
  onViewChange: (view: 'calendar' | 'agenda' | 'units') => void;
  onOpenAddTraining: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onViewChange,
  onOpenAddTraining
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Calendar className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white">
                Calender <span className="text-cyan-400">Training</span>
              </span>
              <span className="text-slate-500 text-xs ml-2 hidden lg:inline-block font-normal">
                Sistem Jadwal Pelatihan & Unit Kerja
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <button
              onClick={() => onViewChange('calendar')}
              className={`flex items-center gap-2 hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'calendar' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Kalender Pelatihan</span>
            </button>
            <button
              onClick={() => onViewChange('agenda')}
              className={`flex items-center gap-2 hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'agenda' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Daftar Pelatihan</span>
            </button>
            <button
              onClick={() => onViewChange('units')}
              className={`flex items-center gap-2 hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'units' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Distribusi Unit Kerja</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenAddTraining}
              className="group relative inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-sky-600 rounded-xl hover:from-cyan-400 hover:to-sky-500 transition-all shadow-md shadow-cyan-500/25 active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Jadwalkan Pelatihan</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
