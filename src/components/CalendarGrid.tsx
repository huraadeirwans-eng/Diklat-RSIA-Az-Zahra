import React, { useMemo, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Building, 
  Sparkles, 
  CheckSquare, 
  Check, 
  Trash2,
  ChevronDown,
  CalendarPlus 
} from 'lucide-react';
import { Training } from '../types/training';
import { 
  INDONESIAN_DAYS_SHORT, 
  INDONESIAN_MONTHS, 
  getDaysInMonth, 
  getFirstDayOfMonth, 
  toISODate,
  formatDateToIndonesian,
  getDayNumberInTraining
} from '../utils/dateUtils';
import { CATEGORY_COLORS } from '../data/initialData';
import { ForeignText } from '../utils/textFormatter';
import { User, canEdit } from '../types/auth';

interface CalendarGridProps {
  currentYear: number;
  currentMonth: number; // 0-indexed (0 = Jan, 9 = Oct)
  selectedDate: string;
  trainings: Training[];
  onSelectDate: (dateString: string) => void;
  onSelectTraining: (training: Training) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onQuickAddForDate?: (dateString: string) => void;
  currentUser?: User | null;
  selectedTrainingIds?: string[];
  onToggleSelectTraining?: (trainingId: string) => void;
  isBatchMode?: boolean;
  onToggleBatchMode?: () => void;
  onSelectAllInMonth?: (monthTrainings: Training[]) => void;
  onSelectAllTrainings?: (allTrainings: Training[]) => void;
  onDeselectAll?: () => void;
  onBatchDelete?: (trainingIds: string[]) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentYear,
  currentMonth,
  selectedDate,
  trainings,
  onSelectDate,
  onSelectTraining,
  onPrevMonth,
  onNextMonth,
  onToday,
  onQuickAddForDate,
  currentUser,
  selectedTrainingIds = [],
  onToggleSelectTraining,
  isBatchMode = false,
  onToggleBatchMode,
  onSelectAllInMonth,
  onSelectAllTrainings,
  onDeselectAll,
  onBatchDelete
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const allowAdd = canEdit(currentUser);
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  // Pelatihan yang aktif pada bulan yang sedang ditampilkan
  const currentMonthTrainings = useMemo(() => {
    const monthStart = toISODate(currentYear, currentMonth, 1);
    const monthEnd = toISODate(currentYear, currentMonth, daysInMonth);
    return trainings.filter((t) => {
      const start = t.date;
      const end = t.endDate && t.endDate >= t.date ? t.endDate : t.date;
      return start <= monthEnd && end >= monthStart;
    });
  }, [trainings, currentYear, currentMonth, daysInMonth]);

  const firstDay = getFirstDayOfMonth(currentYear, currentMonth); // 0=Monday
  
  // Previous month trailing days
  const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonthIndex);

  // Map of date string -> Training[] (Mendukung Pelatihan Multi-Hari / 2 Hari atau Lebih)
  const trainingsByDate = useMemo(() => {
    const map: Record<string, Training[]> = {};
    trainings.forEach((t) => {
      if (t.endDate && t.endDate > t.date) {
        const start = new Date(t.date + 'T00:00:00');
        const end = new Date(t.endDate + 'T00:00:00');
        const current = new Date(start);
        while (current <= end) {
          const y = current.getFullYear();
          const m = String(current.getMonth() + 1).padStart(2, '0');
          const d = String(current.getDate()).padStart(2, '0');
          const dStr = `${y}-${m}-${d}`;
          if (!map[dStr]) map[dStr] = [];
          if (!map[dStr].some(item => item.id === t.id)) {
            map[dStr].push(t);
          }
          current.setDate(current.getDate() + 1);
        }
      } else {
        if (!map[t.date]) {
          map[t.date] = [];
        }
        if (!map[t.date].some(item => item.id === t.id)) {
          map[t.date].push(t);
        }
      }
    });
    return map;
  }, [trainings]);

  // Today in YYYY-MM-DD
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Build grid cells
  const calendarCells = useMemo(() => {
    const cells: {
      day: number;
      dateString: string;
      isCurrentMonth: boolean;
      trainings: Training[];
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    // 1. Leading days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const dStr = toISODate(prevMonthYear, prevMonthIndex, dayNum);
      cells.push({
        day: dayNum,
        dateString: dStr,
        isCurrentMonth: false,
        trainings: trainingsByDate[dStr] || [],
        isToday: dStr === todayString,
        isSelected: dStr === selectedDate
      });
    }

    // 2. Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = toISODate(currentYear, currentMonth, d);
      cells.push({
        day: d,
        dateString: dStr,
        isCurrentMonth: true,
        trainings: trainingsByDate[dStr] || [],
        isToday: dStr === todayString,
        isSelected: dStr === selectedDate
      });
    }

    // 3. Trailing days for next month to complete standard 35 or 42 grid
    const totalCellsSoFar = cells.length;
    const remainingCells = totalCellsSoFar <= 35 ? 35 - totalCellsSoFar : 42 - totalCellsSoFar;
    const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    for (let d = 1; d <= remainingCells; d++) {
      const dStr = toISODate(nextMonthYear, nextMonthIndex, d);
      cells.push({
        day: d,
        dateString: dStr,
        isCurrentMonth: false,
        trainings: trainingsByDate[dStr] || [],
        isToday: dStr === todayString,
        isSelected: dStr === selectedDate
      });
    }

    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDay, daysInPrevMonth, prevMonthIndex, prevMonthYear, trainingsByDate, todayString, selectedDate]);

  return (
    <div className="h-full flex flex-col justify-between bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-xl relative overflow-hidden aero-border-gradient min-h-0">
      {/* Decorative Aerodynamic Light Streaks */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-[radial-gradient(circle,rgba(6,182,212,0.12)_0%,transparent_70%)] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[radial-gradient(circle,rgba(99,102,241,0.10)_0%,transparent_70%)] rounded-full pointer-events-none" />

      {/* Calendar Header Controls */}
      <div className="relative z-30 flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80 shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-cyan-400 font-semibold">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Kalender Akademik Pelatihan</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
            {INDONESIAN_MONTHS[currentMonth]} <span className="text-cyan-400 tabular-nums">{currentYear}</span>
          </h2>
        </div>

        {/* Aerodynamic Month Navigation Controls & Batch Delete Suite */}
        <div className="flex items-center gap-2">
          {selectedTrainingIds.length > 0 ? (
            <div className="flex items-center gap-1.5 animate-smooth-fade">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-cyan-500/60 bg-cyan-950/90 text-cyan-300 shadow-sm shadow-cyan-500/30 flex items-center gap-1.5 cursor-pointer hover:bg-cyan-900/90 transition-all shrink-0"
                title="Pilihan seleksi"
              >
                <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Terpilih ({selectedTrainingIds.length})</span>
                <ChevronDown className="w-3 h-3 text-cyan-400" />
              </button>

              {onBatchDelete && (
                <button
                  type="button"
                  onClick={() => onBatchDelete(selectedTrainingIds)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-rose-500/80 bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                  title={`Hapus ${selectedTrainingIds.length} pelatihan terpilih`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus ({selectedTrainingIds.length})</span>
                </button>
              )}

              {onDeselectAll && (
                <button
                  type="button"
                  onClick={onDeselectAll}
                  className="px-2 py-1 text-[11px] font-medium rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all cursor-pointer shrink-0"
                  title="Batalkan pilihan"
                >
                  Batal
                </button>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  isBatchMode
                    ? 'border-cyan-400 bg-cyan-950 text-cyan-200 ring-1 ring-cyan-400'
                    : 'border-cyan-700/60 bg-slate-800/90 hover:bg-slate-700 text-cyan-300 hover:text-white'
                }`}
                title="Buka menu opsi seleksi dan penghapusan massal jadwal pelatihan"
              >
                <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="hidden sm:inline">Opsi Pilih &amp; Hapus Pelatihan</span>
                <span className="sm:hidden">Pilih &amp; Hapus</span>
                <ChevronDown className={`w-3 h-3 text-cyan-400 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu when 0 selected */}
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-slate-950/40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-slate-950 border-2 border-cyan-500/70 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-2 space-y-1.5 text-xs animate-smooth-slide-up">
                    <div className="px-3 py-2 text-[11px] font-extrabold uppercase text-cyan-300 tracking-wider border-b border-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Opsi Pilih &amp; Hapus Pelatihan</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-mono font-bold">
                        Menu
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onSelectAllInMonth?.(currentMonthTrainings);
                      }}
                      disabled={currentMonthTrainings.length === 0}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-cyan-950/90 text-white hover:text-cyan-200 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Pilih Semua Bulan Ini</span>
                      </span>
                      <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-md border border-cyan-800/80 font-bold">
                        {currentMonthTrainings.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        if (currentMonthTrainings.length > 0 && onBatchDelete) {
                          onBatchDelete(currentMonthTrainings.map(t => t.id));
                        }
                      }}
                      disabled={currentMonthTrainings.length === 0}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/90 text-rose-200 hover:text-white border border-rose-900/80 hover:border-rose-500 flex items-center justify-between transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Hapus Semua Bulan Ini</span>
                      </span>
                      <span className="text-[11px] font-mono text-rose-200 bg-rose-950 px-2 py-0.5 rounded-md border border-rose-800/80 font-bold">
                        {currentMonthTrainings.length}
                      </span>
                    </button>

                    {trainings.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          if (onBatchDelete) {
                            onBatchDelete(trainings.map(t => t.id));
                          }
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/90 text-rose-200 hover:text-white border border-rose-900/80 hover:border-rose-500 flex items-center justify-between transition-all cursor-pointer shadow-xs"
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>Hapus Semua Seluruh Jadwal</span>
                        </span>
                        <span className="text-[11px] font-mono text-rose-200 bg-rose-950 px-2 py-0.5 rounded-md border border-rose-800/80 font-bold">
                          {trainings.length}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onToggleBatchMode?.();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-xs font-medium"
                    >
                      <CheckSquare className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{isBatchMode ? 'Nonaktifkan Mode Pilih' : 'Mode Pilih Manual (Satu Per Satu)'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Dropdown Menu when items are selected */}
          {selectedTrainingIds.length > 0 && dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-slate-950/40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-slate-950 border-2 border-cyan-500/70 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-2 space-y-1.5 text-xs animate-smooth-slide-up">
                <div className="px-3 py-2 text-[11px] font-extrabold uppercase text-cyan-300 tracking-wider border-b border-slate-800 flex items-center justify-between">
                  <span>Aksi Seleksi ({selectedTrainingIds.length} Terpilih)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-mono font-bold">
                    {selectedTrainingIds.length} Item
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onSelectAllInMonth?.(currentMonthTrainings);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-cyan-950/90 text-white hover:text-cyan-200 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between transition-all cursor-pointer shadow-xs"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Pilih Semua Bulan Ini</span>
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-md border border-cyan-800/80 font-bold">
                    {currentMonthTrainings.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onSelectAllTrainings?.(trainings);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-cyan-950/90 text-white hover:text-cyan-200 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between transition-all cursor-pointer shadow-xs"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Pilih Semua Seluruh Jadwal</span>
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-md border border-cyan-800/80 font-bold">
                    {trainings.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onDeselectAll?.();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-xs font-medium"
                >
                  <span>✕ Batalkan Pilihan</span>
                </button>
              </div>
            </>
          )}

          <button
            onClick={onToday}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            Hari Ini
          </button>
          <div className="flex items-center p-0.5 rounded-lg border border-slate-700/60 bg-slate-800/40">
            <button
              onClick={onPrevMonth}
              aria-label="Bulan Sebelumnya"
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-slate-700 mx-1" />
            <button
              onClick={onNextMonth}
              aria-label="Bulan Berikutnya"
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>


      {/* Weekday Labels Header */}
      <div className="relative z-10 grid grid-cols-7 gap-1.5 mb-1.5 shrink-0">
        {INDONESIAN_DAYS_SHORT.map((day, idx) => (
          <div
            key={day}
            className={`py-1 text-center text-[10.5px] font-bold uppercase tracking-wider rounded-lg bg-slate-900/60 border border-slate-800/60 ${
              idx >= 5 ? 'text-rose-400/90' : 'text-slate-300'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid Cells - Dynamic Rows Stretch To Fill 100% Height */}
      <div 
        className="relative z-10 grid grid-cols-7 gap-1.5 flex-1 min-h-0"
        style={{
          gridTemplateRows: `repeat(${Math.ceil(calendarCells.length / 7)}, minmax(0, 1fr))`
        }}
      >
        {calendarCells.map((cell) => {
          const hasTrainings = cell.trainings.length > 0;
          const totalParticipants = cell.trainings.reduce(
            (acc, t) => acc + t.participants.length,
            0
          );

          return (
            <div
              key={cell.dateString}
              onClick={() => onSelectDate(cell.dateString)}
              className={`p-1.5 rounded-xl transition-all duration-100 cursor-pointer flex flex-col justify-between relative group overflow-hidden h-full min-h-0 active:scale-[0.98] ${
                cell.isCurrentMonth
                  ? 'bg-slate-900/90 hover:bg-slate-850 text-slate-200'
                  : 'bg-slate-950/40 text-slate-600 hover:text-slate-400'
              } ${
                cell.isSelected
                  ? 'ring-2 ring-cyan-400/90 bg-slate-850/95 shadow-[0_0_15px_rgba(6,182,212,0.22)] border-transparent'
                  : 'border border-slate-800/70 hover:border-slate-700'
              }`}
            >
              {/* Day Number and Badges */}
              <div className="flex items-center justify-between gap-1 shrink-0">
                <span
                  className={`text-xs font-semibold tabular-nums inline-flex items-center justify-center min-w-[24px] h-[24px] rounded-lg ${
                    cell.isToday
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/40'
                      : cell.isSelected
                      ? 'text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-800/60'
                      : 'text-slate-300'
                  }`}
                >
                  {cell.day}
                </span>

                <div className="flex items-center gap-1">
                  {/* Quick Add Button on Hover (Khusus Edit & Otoritas Penuh) */}
                  {onQuickAddForDate && allowAdd && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAddForDate(cell.dateString);
                      }}
                      title={`Jadwalkan pelatihan pada ${cell.dateString}`}
                      className="opacity-0 group-hover:opacity-100 hover:bg-cyan-500 hover:text-slate-950 text-slate-400 p-0.5 rounded transition-all cursor-pointer"
                    >
                      <CalendarPlus className="w-3 h-3 text-cyan-400 group-hover:text-slate-950" />
                    </button>
                  )}

                  {/* Training Count Pill */}
                  {hasTrainings && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-medium text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-1 py-0.2 rounded tabular-nums">
                      <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                      <span>{cell.trainings.length}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Training Previews inside cell (Display up to 2 items) */}
              <div className="space-y-0.5 flex-1 overflow-hidden my-0.5">
                {cell.trainings.slice(0, 2).map((trn) => {
                  const style = CATEGORY_COLORS[trn.category] || CATEGORY_COLORS['Teknologi & Digital'];
                  const isMulti = Boolean(trn.endDate && trn.endDate > trn.date);
                  const dayPos = isMulti ? getDayNumberInTraining(trn.date, trn.endDate, cell.dateString) : null;
                  const isSelectedInBatch = selectedTrainingIds.includes(trn.id);
                  const titleTooltip = isBatchMode
                    ? `${trn.title} - Klik untuk memilih / membatalkan pilihan hapus`
                    : dayPos 
                    ? `${trn.title} (${trn.startTime}-${trn.endTime}) - Hari ke-${dayPos.dayNumber} dari ${dayPos.totalDays} Hari - Klik untuk rincian`
                    : `${trn.title} (${trn.startTime}-${trn.endTime}) - Klik untuk buka rincian peserta`;

                  return (
                    <div
                      key={trn.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isBatchMode && onToggleSelectTraining) {
                          onToggleSelectTraining(trn.id);
                        } else {
                          onSelectTraining(trn);
                        }
                      }}
                      title={titleTooltip}
                      className={`text-[9px] leading-tight px-1 py-0.5 rounded border font-medium truncate transition-all duration-150 flex items-center gap-1 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                        isSelectedInBatch
                          ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200 ring-1.5 ring-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] font-bold'
                          : `${style.bg} ${style.text} ${style.border}`
                      }`}
                    >
                      {isSelectedInBatch ? (
                        <Check className="w-2.5 h-2.5 text-cyan-400 shrink-0 stroke-[3]" />
                      ) : (
                        <span className={`w-1 h-1 rounded-full shrink-0 ${style.dot}`} />
                      )}
                      <ForeignText text={trn.title} className="truncate min-w-0 flex-1" />
                      {dayPos && (
                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-slate-950/80 border border-slate-700/60 font-bold shrink-0 text-amber-300">
                          H{dayPos.dayNumber}/{dayPos.totalDays}
                        </span>
                      )}
                    </div>
                  );
                })}

                {cell.trainings.length > 2 && (
                  <div className="text-[9px] text-slate-400 px-0.5 font-medium truncate flex items-center gap-1">
                    <span className="text-cyan-400">❖</span>
                    <span>{cell.trainings.length - 2} sesi lainnya</span>
                  </div>
                )}
              </div>

              {/* Bottom Micro Meta: Total Participants on that day */}
              {hasTrainings && (
                <div className="pt-0.5 border-t border-slate-800/40 flex items-center justify-between text-[9px] text-slate-400 shrink-0">
                  <span className="flex items-center gap-1">
                    <Users className="w-2 h-2 text-slate-500" />
                    <span className="tabular-nums font-semibold text-slate-300">
                      {totalParticipants}
                    </span>
                  </span>
                  <span className="text-cyan-400 text-[8px] group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendar Legend / Category indicators */}
      <div className="relative z-10 mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-semibold text-slate-300">Kategori:</span>
          {Object.entries(CATEGORY_COLORS).map(([catName, color]) => (
            <div key={catName} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
              <span className="text-slate-300">{catName}</span>
            </div>
          ))}
        </div>
        <div className="text-slate-400 text-[10px] hidden xl:inline">
          Klik tanggal untuk jadwal, klik nama pelatihan untuk data peserta.
        </div>
      </div>
    </div>
  );
};
