import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Calendar, 
  ArrowRight, 
  Award, 
  CheckCircle2, 
  ChevronRight, 
  User, 
  Search, 
  Sparkles, 
  Plus, 
  BookOpen, 
  Clock, 
  MapPin, 
  Check 
} from 'lucide-react';
import { Training, Participant } from '../types/training';
import { ALL_UNIT_KERJA } from '../data/initialData';
import { formatDateWithDay, formatDateToIndonesian } from '../utils/dateUtils';
import { ForeignText } from '../utils/textFormatter';
import { getAllKnownUnits, saveCustomUnit, onUnitsChange } from '../utils/unitManager';

interface UnitBreakdownViewProps {
  trainings: Training[];
  onSelectTraining: (training: Training) => void;
}

export const UnitBreakdownView: React.FC<UnitBreakdownViewProps> = ({
  trainings,
  onSelectTraining
}) => {
  const [unitSearch, setUnitSearch] = useState('');
  const [newUnitInput, setNewUnitInput] = useState('');
  const [showAddUnitInput, setShowAddUnitInput] = useState(false);
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [syncTick, setSyncTick] = useState(0);

  // Dengarkan perubahan unit kustom real-time
  useEffect(() => {
    return onUnitsChange(() => {
      setSyncTick(t => t + 1);
    });
  }, []);

  // Seluruh unit kerja lengkap (bawaan + kustom + data)
  const allKnownUnits = useMemo(() => {
    return getAllKnownUnits(trainings);
    // syncTick digunakan agar re-render saat custom unit bertambah
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainings, syncTick]);

  // Map of ALL units -> participants & targeted trainings across all trainings
  const allUnitStats = useMemo(() => {
    return allKnownUnits.map((unitName) => {
      const participants: { participant: Participant; training: Training }[] = [];
      const trainingIds = new Set<string>();
      const targetedTrainings: Training[] = [];

      trainings.forEach((t) => {
        const isTargeted = t.targetUnits && t.targetUnits.some(
          tu => tu.trim().toLowerCase() === unitName.trim().toLowerCase()
        );
        let hasParticipant = false;

        t.participants.forEach((p) => {
          if (p.unitKerja && p.unitKerja.trim().toLowerCase() === unitName.trim().toLowerCase()) {
            participants.push({ participant: p, training: t });
            trainingIds.add(t.id);
            hasParticipant = true;
          }
        });

        if (isTargeted || hasParticipant) {
          targetedTrainings.push(t);
          trainingIds.add(t.id);
        }
      });

      const hadirCount = participants.filter((item) => item.participant.statusKehadiran === 'Hadir').length;
      const isCustom = !ALL_UNIT_KERJA.some(u => u.toLowerCase() === unitName.toLowerCase());

      return {
        unitName,
        isCustom,
        totalParticipants: participants.length,
        totalTrainings: trainingIds.size,
        targetedTrainings,
        hadirCount,
        participants
      };
    });
  }, [allKnownUnits, trainings]);

  // Selected unit: prioritaskan unit yang pertama kali memiliki data aktif
  const [selectedUnit, setSelectedUnit] = useState<string>(() => {
    const firstActive = allKnownUnits.find(unitName => {
      return trainings.some(t => 
        t.targetUnits?.some(tu => tu.trim().toLowerCase() === unitName.trim().toLowerCase()) ||
        t.participants?.some(p => p.unitKerja?.trim().toLowerCase() === unitName.trim().toLowerCase())
      );
    });
    return firstActive || '';
  });

  // SESUAI PERMINTAAN PENGGUNA:
  // Yang tampil hanya unit kerja yang ada (aktif) saja. Jika tidak ada data, maka tidak ditampilkan.
  const unitStats = useMemo(() => {
    if (showAllUnits) return allUnitStats;
    const active = allUnitStats.filter(
      (u) => u.totalParticipants > 0 || u.totalTrainings > 0
    );
    return active;
  }, [allUnitStats, showAllUnits]);

  // Pastikan selectedUnit tetap sinkron dengan unit yang tersedia
  useEffect(() => {
    if (unitStats.length > 0) {
      const exists = unitStats.some(u => u.unitName === selectedUnit);
      if (!exists) {
        setSelectedUnit(unitStats[0].unitName);
      }
    } else {
      setSelectedUnit('');
    }
  }, [unitStats, selectedUnit]);

  // Handle tambah unit kerja kustom langsung dari halaman Distribusi Unit Kerja
  const handleCreateNewUnit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newUnitInput.trim();
    if (!clean) return;

    saveCustomUnit(clean);
    setNewUnitInput('');
    setSelectedUnit(clean);
    setShowAddUnitInput(false);
  };

  // Filter unit kerja berdasarkan pencarian
  const filteredUnitStats = useMemo(() => {
    if (!unitSearch.trim()) return unitStats;
    const q = unitSearch.toLowerCase();
    return unitStats.filter(u => u.unitName.toLowerCase().includes(q));
  }, [unitStats, unitSearch]);

  // Selected unit details
  const activeUnitStat = useMemo(() => {
    if (unitStats.length === 0) return null;
    return unitStats.find((u) => u.unitName === selectedUnit) || unitStats[0] || null;
  }, [unitStats, selectedUnit]);

  // Akumulasi total seluruh personil
  const totalEmployeesAcrossUnits = useMemo(() => {
    return trainings.reduce((acc, t) => acc + (t.participants?.length || 0), 0);
  }, [trainings]);

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden min-h-0">
      {/* Overview Header Strip */}
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-3.5 shrink-0 relative overflow-hidden aero-border-gradient">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">
              <Building2 className="w-3 h-3" />
              <span>Matriks Partisipasi Unit Kerja <span className="italic">Coorporate</span></span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Distribusi Partisipasi Pelatihan Lintas Unit Kerja</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold">
                {unitStats.length} UNIT AKTIF
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Pantau keterlibatan unit kerja sasaran, pelatihan yang ditugaskan, serta kehadiran seluruh personil klinis dan non-klinis.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 p-2 rounded-xl self-start md:self-auto shrink-0">
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-[9px] text-slate-400 uppercase font-semibold">Total Unit Terlibat</div>
              <div className="text-sm font-bold text-white tabular-nums flex items-center justify-center gap-1">
                <span>{unitStats.length}</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Unit Aktif
                </span>
              </div>
            </div>
            <div className="text-center px-3">
              <div className="text-[9px] text-slate-400 uppercase font-semibold">Total Peserta Terdaftar</div>
              <div className="text-sm font-bold text-cyan-400 tabular-nums">
                {totalEmployeesAcrossUnits} Personil
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left = List of Unit Cards, Right = Selected Unit Inspection */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-3 overflow-y-auto lg:overflow-hidden">
        {/* Left Column: Units list (5 cols on desktop, scrollable card tray on mobile) */}
        <div className="h-auto max-h-72 lg:max-h-none lg:h-full lg:col-span-5 flex flex-col gap-2 min-h-0">
          {/* Unit Search Bar & Add Button */}
          <div className="space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase text-slate-400 tracking-wider px-1">
              <span>Pilih Unit Kerja ({filteredUnitStats.length}):</span>
              <div className="flex items-center gap-2">
                {allUnitStats.length > unitStats.length && (
                  <button
                    type="button"
                    onClick={() => setShowAllUnits(!showAllUnits)}
                    className="text-[10px] text-slate-400 hover:text-cyan-300 font-semibold cursor-pointer transition-colors"
                    title="Tampilkan seluruh daftar unit master termasuk yang belum ada data"
                  >
                    {showAllUnits ? 'Hanya Unit Aktif' : `Tampilkan Semua (${allUnitStats.length})`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddUnitInput(!showAddUnitInput)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddUnitInput ? 'Tutup' : '+ Unit Bebas'}</span>
                </button>
              </div>
            </div>

            {/* Quick Add Custom Unit Input */}
            {showAddUnitInput && (
              <form onSubmit={handleCreateNewUnit} className="p-2 rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center gap-1.5 animate-in fade-in duration-200">
                <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />
                <input
                  type="text"
                  autoFocus
                  value={newUnitInput}
                  onChange={(e) => setNewUnitInput(e.target.value)}
                  placeholder="Ketik unit kerja baru (contoh: Poli Eksekutif)..."
                  className="flex-1 bg-transparent border-0 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newUnitInput.trim()}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 rounded-lg cursor-pointer transition-all shrink-0"
                >
                  Simpan
                </button>
              </form>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                placeholder="Cari unit kerja..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Scrollable Unit Cards */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-0">
            {filteredUnitStats.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2 flex flex-col items-center justify-center">
                <Building2 className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-300">
                  {unitSearch
                    ? `Tidak ada unit kerja yang cocok dengan pencarian "${unitSearch}"`
                    : 'Belum ada unit kerja yang terlibat dalam jadwal pelatihan'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Unit kerja akan otomatis muncul begitu ada pelatihan yang ditargetkan atau peserta yang ditugaskan.
                </p>
                {!showAllUnits && (
                  <button
                    type="button"
                    onClick={() => setShowAllUnits(true)}
                    className="mt-1 px-3 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg cursor-pointer transition-colors"
                  >
                    Tampilkan Seluruh Daftar Unit Bawaan ({allKnownUnits.length})
                  </button>
                )}
              </div>
            ) : (
              filteredUnitStats.map((stat) => {
                const isSelected = stat.unitName === selectedUnit;
                return (
                  <div
                    key={stat.unitName}
                    onClick={() => setSelectedUnit(stat.unitName)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none shrink-0 ${
                      isSelected
                        ? 'bg-slate-800/95 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/40'
                        : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                            : stat.isCustom
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-white' : 'text-slate-300'
                            }`}
                          >
                            {stat.unitName}
                          </h4>
                          {stat.isCustom && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/80 font-bold shrink-0">
                              BEBAS
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {stat.totalTrainings} Pelatihan Diikuti / Ditargetkan
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-cyan-400 tabular-nums">
                        {stat.totalParticipants} Peserta
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {stat.hadirCount > 0 ? (
                          <span className="text-emerald-400 font-semibold">{stat.hadirCount} Hadir</span>
                        ) : stat.totalParticipants > 0 ? (
                          <span>0 Hadir</span>
                        ) : (
                          <span className="text-slate-500">Belum ada peserta</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Drilldown for Selected Unit (7 cols) */}
        <div className="lg:col-span-7 h-full flex flex-col bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-hidden aero-border-gradient min-h-0">
          {!activeUnitStat ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center text-slate-600 shadow-inner">
                <Building2 className="w-7 h-7" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-300">
                Belum Ada Unit Kerja yang Memiliki Data
              </h4>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Unit kerja akan otomatis ditampilkan dan dapat ditinjau begitu ada jadwal pelatihan yang ditargetkan atau personil yang ditugaskan dari unit tersebut.
              </p>
              {allUnitStats.length > 0 && !showAllUnits && (
                <button
                  type="button"
                  onClick={() => setShowAllUnits(true)}
                  className="mt-2 px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl cursor-pointer transition-colors border border-slate-700"
                >
                  Tampilkan Seluruh Master Unit ({allUnitStats.length})
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Header of selected unit */}
              <div className="pb-3 mb-3 border-b border-slate-800 flex items-start justify-between gap-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>Rincian Penugasan Unit Kerja</span>
                    </span>
                    {activeUnitStat.isCustom && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80 font-bold">
                        Unit Free Teks Kustom
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                    {activeUnitStat.unitName}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 block uppercase font-semibold">Pelatihan Sasaran</span>
                    <span className="text-xs font-bold text-cyan-400 tabular-nums">
                      {activeUnitStat.targetedTrainings.length} Sesi
                    </span>
                  </div>
                  <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 block uppercase font-semibold">Total Personil</span>
                    <span className="text-xs font-bold text-white tabular-nums">
                      {activeUnitStat.totalParticipants} Pegawai
                    </span>
                  </div>
                </div>
              </div>

              {/* Drilldown Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">
                {/* Bagian 1: Pelatihan yang Menargetkan Unit Kerja Ini */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Pelatihan Sasaran Unit ({activeUnitStat.targetedTrainings.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Ditargetkan pada form penjadwalan
                    </span>
                  </div>

                  {activeUnitStat.targetedTrainings.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 text-center text-xs text-slate-400">
                      Belum ada sesi pelatihan yang ditargetkan untuk unit kerja ini.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeUnitStat.targetedTrainings.map((trn) => (
                        <div
                          key={trn.id}
                          className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                                {trn.code}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{formatDateToIndonesian(trn.date)}</span>
                                {trn.endDate && trn.endDate > trn.date && (
                                  <span> s/d {formatDateToIndonesian(trn.endDate)}</span>
                                )}
                              </span>
                            </div>
                            <h5 className="font-bold text-white text-xs truncate">
                              <ForeignText text={trn.title} />
                            </h5>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 flex-wrap">
                              <span>Instruktur: {trn.instructor.name}</span>
                              <span>·</span>
                              <span>Lokasi: {trn.venue}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onSelectTraining(trn)}
                            className="self-end sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/60 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
                          >
                            <span>Buka Sesi</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bagian 2: Daftar Personil / Delegasi & Presensi dari Unit Ini */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-200">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Daftar Delegasi Pegawai & Presensi ({activeUnitStat.participants.length})</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      {activeUnitStat.hadirCount} Hadir
                    </span>
                  </div>

                  {activeUnitStat.participants.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 text-center space-y-1">
                      <p className="text-xs text-slate-400">
                        Belum ada nama pegawai terdaftar dari unit kerja ini.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Personil dapat didaftarkan melalui tombol "Buka Sesi" pelatihan di atas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeUnitStat.participants.map(({ participant, training }, idx) => (
                        <div
                          key={`${participant.id}-${training.id}-${idx}`}
                          className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-3 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs truncate">
                                {participant.name}
                              </span>
                              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                                participant.statusKehadiran === 'Hadir'
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                  : participant.statusKehadiran === 'Konfirmasi'
                                  ? 'bg-cyan-950/60 text-cyan-400 border-cyan-800'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}>
                                {participant.statusKehadiran}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-slate-500">NIP: {participant.nip}</span>
                              <span>·</span>
                              <span className="text-slate-300">{participant.jabatan}</span>
                            </div>

                            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-cyan-400">
                              <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate text-slate-300">
                                <ForeignText text={training.title} />
                              </span>
                              <span className="text-slate-500 shrink-0">({formatDateToIndonesian(training.date)})</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onSelectTraining(training)}
                            className="self-end sm:self-center inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-lg transition-all border border-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <span>Lihat Sesi</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
