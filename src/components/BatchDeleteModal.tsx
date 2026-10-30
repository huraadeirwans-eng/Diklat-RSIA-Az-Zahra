import React from 'react';
import { Trash2, AlertTriangle, X, Calendar, Users, Building2 } from 'lucide-react';
import { Training } from '../types/training';
import { ForeignText } from '../utils/textFormatter';
import { formatDateToIndonesian } from '../utils/dateUtils';

interface BatchDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedTrainings: Training[];
  isDeleting?: boolean;
}

export const BatchDeleteModal: React.FC<BatchDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedTrainings,
  isDeleting = false
}) => {
  if (!isOpen || selectedTrainings.length === 0) return null;

  const totalParticipants = selectedTrainings.reduce(
    (acc, t) => acc + (t.participants?.length || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-smooth-fade">
      <div 
        className="w-full max-w-xl bg-slate-900/95 border border-rose-500/40 rounded-3xl shadow-2xl overflow-hidden aero-border-gradient flex flex-col max-h-[90vh] animate-smooth-slide-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-rose-950/50 via-slate-900 to-slate-950 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-950/90 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-md shadow-rose-950/50 shrink-0">
              <Trash2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Hapus {selectedTrainings.length} Pelatihan Terpilih</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                  BANYAK
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Konfirmasi penghapusan massal jadwal pelatihan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Callout */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-300">
                Peringatan: Tindakan ini permanen dan tidak dapat dibatalkan!
              </p>
              <p className="text-[11px] text-rose-200/80 leading-relaxed">
                Menghapus {selectedTrainings.length} pelatihan ini akan mencabut seluruh data sesi, catatan kehadiran untuk <strong>{totalParticipants} peserta</strong>, jam pelajaran, dan dokumen terkait dari memori sistem dan basis data Cloud Firebase.
              </p>
            </div>
          </div>

          {/* List of Selected Trainings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 px-1">
              <span>Daftar Pelatihan yang Akan Dihapus ({selectedTrainings.length}):</span>
              <span className="text-[11px] text-slate-400 font-mono">Total {totalParticipants} Peserta</span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 rounded-2xl border border-slate-800 bg-slate-950/60 p-2">
              {selectedTrainings.map((trn, idx) => (
                <div
                  key={trn.id}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/80 font-bold">
                        {trn.code}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-sans">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{formatDateToIndonesian(trn.date)}</span>
                        {trn.endDate && trn.endDate > trn.date && (
                          <span> s/d {formatDateToIndonesian(trn.endDate)}</span>
                        )}
                      </span>
                    </div>
                    <h5 className="font-bold text-white text-xs mt-1 truncate">
                      <ForeignText text={trn.title} />
                    </h5>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Instruktur: {trn.instructor.name} · Ruangan: {trn.venue}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                    <Users className="w-3 h-3 text-cyan-400" />
                    <span className="font-semibold text-white tabular-nums">{trn.participants?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            Batal (Esc)
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-xl shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {isDeleting
                ? 'Sedang Menghapus...'
                : `Ya, Hapus ${selectedTrainings.length} Pelatihan Terpilih`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
