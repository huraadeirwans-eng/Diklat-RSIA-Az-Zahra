import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  Users, 
  Building2, 
  ArrowRight, 
  Plus, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Trash2,
  Check
} from 'lucide-react';
import { Training } from '../types/training';
import { formatDateWithDay, getDayNumberInTraining, formatDateToIndonesian } from '../utils/dateUtils';
import { CATEGORY_COLORS } from '../data/initialData';
import { ForeignText } from '../utils/textFormatter';
import { User, canEdit, isFullAuthority } from '../types/auth';

interface DateTrainingsDrawerProps {
  selectedDate: string;
  trainings: Training[];
  onSelectTraining: (training: Training) => void;
  onAddNewTrainingForDate: (date: string) => void;
  onBackToCalendar?: () => void;
  currentUser?: User | null;
  selectedTrainingIds?: string[];
  onToggleSelectTraining?: (trainingId: string) => void;
  onSelectAllForDate?: (trainings: Training[]) => void;
  onDeselectAllForDate?: (trainings: Training[]) => void;
  onBatchDelete?: (trainingIds: string[]) => void;
}

export const DateTrainingsDrawer: React.FC<DateTrainingsDrawerProps> = ({
  selectedDate,
  trainings,
  onSelectTraining,
  onAddNewTrainingForDate,
  onBackToCalendar,
  currentUser,
  selectedTrainingIds = [],
  onToggleSelectTraining,
  onSelectAllForDate,
  onDeselectAllForDate,
  onBatchDelete
}) => {
  const allowAdd = canEdit(currentUser);
  const dateFormatted = formatDateWithDay(selectedDate);
  const totalParticipants = trainings.reduce((acc, t) => acc + t.participants.length, 0);

  // Collect distinct unit kerja involved on this day
  const distinctUnitKerja = new Set<string>();
  trainings.forEach(t => {
    t.participants.forEach(p => distinctUnitKerja.add(p.unitKerja));
  });

  const selectedOnThisDate = trainings.filter(t => selectedTrainingIds.includes(t.id)).map(t => t.id);
  const isAllDateSelected = trainings.length > 0 && selectedOnThisDate.length === trainings.length;

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 shadow-xl relative overflow-hidden flex flex-col h-full aero-border-gradient min-h-0">
      {/* Decorative top accent glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.14)_0%,transparent_70%)] pointer-events-none" />

      {/* Date Header */}
      <div className="relative z-10 pb-2.5 mb-2 border-b border-slate-800/80 shrink-0">
        {onBackToCalendar && (
          <button
            onClick={onBackToCalendar}
            className="lg:hidden inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 mb-1.5 cursor-pointer active:scale-95"
          >
            <span>← Kembali ke Tampilan Kalender</span>
          </button>
        )}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-cyan-400 uppercase tracking-wider">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Jadwal Pelatihan Tanggal Terpilih</span>
          </div>
          <span className="text-xs font-semibold text-slate-400 tabular-nums">
            {trainings.length} Sesi Terjadwal
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
          {dateFormatted}
        </h3>

        {/* Quick summary stats strip */}
        {trainings.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-750 text-xs shadow-xs">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-white tabular-nums">{totalParticipants}</span>
              <span className="text-slate-400">Peserta</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-750 text-xs shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold text-white tabular-nums">{distinctUnitKerja.size}</span>
              <span className="text-slate-400">Unit Terlibat</span>
            </span>
          </div>
        )}

        {/* Batch Selection Toolbar on this Date */}
        {trainings.length > 0 && onToggleSelectTraining && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                if (isAllDateSelected) {
                  onDeselectAllForDate?.(trainings);
                } else {
                  onSelectAllForDate?.(trainings);
                }
              }}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                isAllDateSelected
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                isAllDateSelected ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
              }`}>
                {isAllDateSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <span>{isAllDateSelected ? 'Batalkan Tanggal Ini' : `Pilih Semua Sesi (${trainings.length})`}</span>
            </button>

            {selectedOnThisDate.length > 0 && onBatchDelete && (
              <button
                type="button"
                onClick={() => onBatchDelete(selectedOnThisDate)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-md shadow-rose-950/40 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus ({selectedOnThisDate.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* List of Trainings on this Date */}
      <div className="relative z-10 flex-1 overflow-y-auto pr-1 space-y-3.5">
        {trainings.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              Tidak Ada Pelatihan Terjadwal
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mb-5">
              Belum ada agenda pelatihan untuk tanggal ini.
            </p>
            {allowAdd ? (
              <button
                onClick={() => onAddNewTrainingForDate(selectedDate)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tambah Jadwal Pada Tanggal Ini</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-500 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                Mode Melihat (Hanya Baca)
              </span>
            )}
          </div>
        ) : (
          trainings.map((trn) => {
            const catStyle = CATEGORY_COLORS[trn.category] || CATEGORY_COLORS['Teknologi & Digital'];
            const isSelectedInBatch = selectedTrainingIds.includes(trn.id);
            
            // Unique departments for this single training
            const deptsInTrn = Array.from(new Set(trn.participants.map(p => p.unitKerja)));

            return (
              <div
                key={trn.id}
                onClick={() => onSelectTraining(trn)}
                className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg flex flex-col gap-3 border ${
                  isSelectedInBatch
                    ? 'bg-slate-850/95 border-cyan-400 ring-2 ring-cyan-400/90 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                    : 'bg-slate-950/70 hover:bg-slate-800/80 border-slate-800 hover:border-cyan-500/50 hover:shadow-cyan-500/10'
                }`}
              >
                {/* Header row: Category, Scope, Time, and Checkbox Selector */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                      <span>{trn.category}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      (trn.scope || 'Internal') === 'Internal'
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
                        : 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                    }`}>
                      {trn.scope || 'Internal'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{trn.startTime} - {trn.endTime} WIB</span>
                    </div>

                    {/* Batch Selection Checkbox Button */}
                    {onToggleSelectTraining && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelectTraining(trn.id);
                        }}
                        title={isSelectedInBatch ? "Batalkan pilihan sesi ini" : "Pilih sesi pelatihan ini untuk dihapus"}
                        className={`p-1 rounded-lg border transition-all active:scale-90 cursor-pointer ${
                          isSelectedInBatch
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-sm shadow-cyan-500/40'
                            : 'bg-slate-900 border-slate-700 text-transparent hover:border-cyan-400'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelectedInBatch ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Training Title (Clickable) */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    <ForeignText text={trn.title} />
                  </h4>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                    <span className="font-mono text-[11px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                      {trn.code}
                    </span>
                    <span>·</span>
                    <span className="text-slate-400">{trn.sksHours} Jam Pelajaran (JP)/hari</span>
                    {trn.endDate && trn.endDate > trn.date && (
                      <>
                        <span>·</span>
                        <span className="text-amber-300 font-medium">
                          Pelatihan Berkelanjutan
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Multi-Day Status Badge */}
                {trn.endDate && trn.endDate > trn.date && (() => {
                  const dayPos = getDayNumberInTraining(trn.date, trn.endDate, selectedDate);
                  const todayItem = trn.dailySchedules?.find(ds => ds.date === selectedDate);
                  return (
                    <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-2 space-y-1">
                      <div className="flex items-center justify-between gap-1 flex-wrap text-[11px] font-bold text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pelatihan Multi-Hari: Hari ke-{dayPos?.dayNumber || 1} dari {dayPos?.totalDays || 1} Hari</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          {formatDateToIndonesian(trn.date)} s/d {formatDateToIndonesian(trn.endDate)}
                        </span>
                      </div>
                      {todayItem?.topic && (
                        <div className="text-[11px] text-slate-300 pl-5">
                          <strong className="text-amber-200">Agenda Hari Ini:</strong> {todayItem.topic}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Dokumen Pelatihan Eksternal Indicator */}
                {(trn.certificateUrl || trn.posterUrl) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {trn.certificateUrl && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/70 border border-amber-800/70 px-2 py-0.5 rounded-md">
                        <FileText className="w-3 h-3 text-amber-400" />
                        <span>Sertifikat Terlampir</span>
                      </span>
                    )}
                    {trn.posterUrl && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-300 bg-cyan-950/70 border border-cyan-800/70 px-2 py-0.5 rounded-md">
                        <ImageIcon className="w-3 h-3 text-cyan-400" />
                        <span>Poster Terlampir</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Venue & Instructor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/70">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1 text-slate-300"><ForeignText text={trn.venue} /></span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1 text-slate-300">{trn.instructor.name}</span>
                  </div>
                </div>

                {/* Unit Kerja & Peserta highlights */}
                <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white tabular-nums flex items-center gap-1.5">
                        <span>{trn.participants.length} Peserta Terdaftar</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          / {trn.capacity} kuota
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span>{deptsInTrn.length} Unit Kerja</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary prompt button */}
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all whitespace-nowrap">
                    <span>Lihat Peserta</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Department chips preview */}
                <div className="flex flex-wrap gap-1">
                  {deptsInTrn.slice(0, 3).map((dept) => (
                    <span
                      key={dept}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/50 text-slate-300 border border-slate-700/40 truncate max-w-[180px] italic"
                    >
                      <ForeignText text={dept} />
                    </span>
                  ))}
                  {deptsInTrn.length > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 text-slate-400 font-medium">
                      +{deptsInTrn.length - 3} unit
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer bottom quick add action */}
      {trainings.length > 0 && (
        <div className="relative z-10 pt-3 mt-3 border-t border-slate-800/80">
          <button
            onClick={() => onAddNewTrainingForDate(selectedDate)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tambah Pelatihan Lain di Tanggal Ini</span>
          </button>
        </div>
      )}
    </div>
  );
};
