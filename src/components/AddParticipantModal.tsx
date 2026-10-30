import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  UserPlus, 
  Building2, 
  User, 
  Briefcase, 
  Hash, 
  CheckCircle2, 
  Plus, 
  Search, 
  CheckSquare, 
  Square, 
  Check, 
  Users, 
  Sparkles,
  Filter,
  AlertCircle
} from 'lucide-react';
import { Participant, AttendanceStatus } from '../types/training';
import { EmployeeItem } from '../types/employee';
import { ALL_UNIT_KERJA } from '../data/initialData';
import { ForeignText } from '../utils/textFormatter';
import { getAllKnownUnits, saveCustomUnit } from '../utils/unitManager';
import { getAllEmployees } from '../utils/employeeManager';
import { getDeterministicPretestScore, getRandomPretestScore } from '../utils/evaluationHelper';

interface AddParticipantModalProps {
  trainingTitle: string;
  defaultUnit?: string;
  existingParticipants?: Participant[];
  onClose: () => void;
  onAddParticipant: (participant: Participant, andAddMore?: boolean) => void;
  onAddParticipants?: (participants: Participant[]) => void;
}

export const AddParticipantModal: React.FC<AddParticipantModalProps> = ({
  trainingTitle,
  defaultUnit,
  existingParticipants = [],
  onClose,
  onAddParticipant,
  onAddParticipants
}) => {
  // Tabs: 'directory' (Pilih Banyak dari Data Karyawan) | 'manual' (Input Form & Autocomplete)
  const [activeTab, setActiveTab] = useState<'directory' | 'manual'>('directory');

  // Load all employees from Data Karyawan
  const [employees, setEmployees] = useState<EmployeeItem[]>(() => getAllEmployees());

  // Search & filter state for Tab 1 (Directory)
  const [searchEmp, setSearchEmp] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<string>>(new Set());
  const [statusKehadiranMulti, setStatusKehadiranMulti] = useState<AttendanceStatus>('Terdaftar');

  // State for Tab 2 (Manual Form with Autocomplete)
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [unitKerja, setUnitKerja] = useState(defaultUnit || ALL_UNIT_KERJA[0]);
  const [customUnit, setCustomUnit] = useState('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [jabatan, setJabatan] = useState('');
  const [statusKehadiran, setStatusKehadiran] = useState<AttendanceStatus>('Terdaftar');
  const [autoFilledFromEmp, setAutoFilledFromEmp] = useState<string | null>(null);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  // Success Feedback Banner
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);

  const nameInputWrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (nameInputWrapperRef.current && !nameInputWrapperRef.current.contains(e.target as Node)) {
        setShowNameSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set of names/NIPs already enrolled in this training
  const enrolledKeys = useMemo(() => {
    const set = new Set<string>();
    existingParticipants.forEach((p) => {
      if (p.name) set.add(p.name.toLowerCase().trim());
      if (p.nip && p.nip !== '-') set.add(p.nip.toLowerCase().trim());
    });
    return set;
  }, [existingParticipants]);

  // Distinct units for filter in Directory tab
  const availableUnits = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.unitKerja && e.unitKerja.trim()) set.add(e.unitKerja.trim());
    });
    getAllKnownUnits().forEach((u) => set.add(u));
    return Array.from(set).sort();
  }, [employees]);

  // Filtered employees for directory multi-select tab
  const filteredEmployees = useMemo(() => {
    const q = searchEmp.toLowerCase().trim();
    return employees.filter((emp) => {
      const matchSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.idKaryawan.toLowerCase().includes(q) ||
        emp.jabatan.toLowerCase().includes(q) ||
        emp.unitKerja.toLowerCase().includes(q);

      const matchUnit =
        selectedUnitFilter === 'ALL' ||
        emp.unitKerja.toLowerCase().trim() === selectedUnitFilter.toLowerCase().trim();

      return matchSearch && matchUnit;
    });
  }, [employees, searchEmp, selectedUnitFilter]);

  // Suggestions for autocomplete when typing in manual form
  const nameSuggestions = useMemo(() => {
    const q = name.toLowerCase().trim();
    if (!q) return employees.slice(0, 6);
    return employees
      .filter((emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.idKaryawan.toLowerCase().includes(q) ||
        emp.unitKerja.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [employees, name]);

  // Check if an employee is already enrolled
  const isEmployeeEnrolled = (emp: EmployeeItem) => {
    const nameMatch = enrolledKeys.has(emp.name.toLowerCase().trim());
    const nipMatch = emp.idKaryawan && emp.idKaryawan !== '-' && enrolledKeys.has(emp.idKaryawan.toLowerCase().trim());
    return nameMatch || nipMatch;
  };

  // Toggle selection for an employee in Tab 1
  const toggleSelectEmployee = (empId: string) => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) {
        next.delete(empId);
      } else {
        next.add(empId);
      }
      return next;
    });
  };

  // Select all currently filtered employees that aren't already enrolled
  const handleSelectAllFiltered = () => {
    const eligible = filteredEmployees.filter((emp) => !isEmployeeEnrolled(emp));
    const allSelected = eligible.length > 0 && eligible.every((emp) => selectedEmpIds.has(emp.id));

    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        eligible.forEach((emp) => next.delete(emp.id));
      } else {
        eligible.forEach((emp) => next.add(emp.id));
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedEmpIds(new Set());
  };

  // Submit batch selected employees from Tab 1
  const handleSaveBatchEmployees = () => {
    if (selectedEmpIds.size === 0) return;

    const selectedList = employees.filter((emp) => selectedEmpIds.has(emp.id));
    const newParticipants: Participant[] = selectedList.map((emp, idx) => ({
      id: `p-${Date.now()}-${idx}-${Math.floor(Math.random() * 10000)}`,
      name: emp.name.trim(),
      nip: emp.idKaryawan?.trim() || `199${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      unitKerja: emp.unitKerja?.trim() || defaultUnit || 'Umum',
      jabatan: emp.jabatan?.trim() || 'Staff Pelaksana',
      statusKehadiran: statusKehadiranMulti,
      nilaiPretest: getDeterministicPretestScore(emp.idKaryawan || emp.name),
      nilaiPosttest: 100,
      registeredAt: new Date().toISOString().split('T')[0]
    }));

    if (onAddParticipants) {
      onAddParticipants(newParticipants);
    } else {
      newParticipants.forEach((p, index) => {
        onAddParticipant(p, index < newParticipants.length - 1);
      });
    }

    onClose();
  };

  // When clicking an employee from autocomplete suggestions in Tab 2
  const handleSelectSuggestedEmployee = (emp: EmployeeItem) => {
    setName(emp.name);
    setNip(emp.idKaryawan || '');
    setJabatan(emp.jabatan || '');
    setUnitKerja(emp.unitKerja || defaultUnit || ALL_UNIT_KERJA[0]);
    setIsCustomUnit(false);
    setAutoFilledFromEmp(emp.name);
    setShowNameSuggestions(false);
  };

  // Submit single participant from Tab 2
  const handleSaveSingle = (andAddMore: boolean) => {
    if (!name.trim()) return;

    const finalUnit = isCustomUnit && customUnit.trim() ? customUnit.trim() : unitKerja;
    if (isCustomUnit && customUnit.trim()) {
      saveCustomUnit(finalUnit);
    }

    const newParticipant: Participant = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: name.trim(),
      nip: nip.trim() || `199${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      unitKerja: finalUnit,
      jabatan: jabatan.trim() || 'Staff Pelaksana',
      statusKehadiran,
      nilaiPretest: getRandomPretestScore(),
      nilaiPosttest: 100,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    onAddParticipant(newParticipant, andAddMore);

    if (andAddMore) {
      setAddedCount((c) => c + 1);
      setSuccessBanner(`Peserta "${name.trim()}" berhasil ditambahkan! Silakan input atau pilih peserta berikutnya.`);
      setName('');
      setNip('');
      setJabatan('');
      setAutoFilledFromEmp(null);
    } else {
      onClose();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveSingle(false);
  };

  // Total eligible filtered in Tab 1
  const eligibleFiltered = filteredEmployees.filter((emp) => !isEmployeeEnrolled(emp));
  const isAllEligibleSelected =
    eligibleFiltered.length > 0 && eligibleFiltered.every((emp) => selectedEmpIds.has(emp.id));

  // Count of selected items
  const selectedCount = selectedEmpIds.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[95dvh] flex flex-col shadow-2xl relative aero-border-gradient overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    Tambah Peserta Pelatihan
                  </h3>
                  {addedCount > 0 && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                      +{addedCount} Ditambahkan
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate">
                  <ForeignText text={trainingTitle} />
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-2 mt-4 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Tarik dari Data Karyawan</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activeTab === 'directory' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}>
                Pilih Banyak
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Input Satuan / Otomatis</span>
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div className="mx-4 sm:mx-6 mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{successBanner}</span>
            <button
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab 1: TARIK DARI DATA KARYAWAN (PILIH BANYAK) */}
        {activeTab === 'directory' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4 sm:p-6 space-y-3">
            {/* Search & Unit Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 shrink-0">
              <div className="sm:col-span-7 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchEmp}
                  onChange={(e) => setSearchEmp(e.target.value)}
                  placeholder="Cari nama karyawan, NIK, jabatan..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                {searchEmp && (
                  <button
                    type="button"
                    onClick={() => setSearchEmp('')}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="sm:col-span-5 relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  value={selectedUnitFilter}
                  onChange={(e) => setSelectedUnitFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none cursor-pointer appearance-none truncate"
                >
                  <option value="ALL">Semua Unit Kerja ({employees.length})</option>
                  {availableUnits.map((u) => (
                    <option key={u} value={u} className="bg-slate-900 text-white">
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Actions & Status Kehadiran Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 shrink-0 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition-colors cursor-pointer font-medium"
                >
                  {isAllEligibleSelected ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Batal Pilih Semua</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pilih Semua ({eligibleFiltered.length})</span>
                    </>
                  )}
                </button>

                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-[11px] text-slate-400 hover:text-rose-400 underline cursor-pointer"
                  >
                    Kosongkan Pilihan
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Status Awal:</span>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  {(['Terdaftar', 'Konfirmasi', 'Hadir', 'Izin'] as AttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusKehadiranMulti(st)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                        statusKehadiranMulti === st
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Summary Pill Bar */}
            {selectedCount > 0 && (
              <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl shrink-0 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                  <span className="text-xs font-bold text-cyan-300 whitespace-nowrap">
                    {selectedCount} Karyawan Terpilih:
                  </span>
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    {employees
                      .filter((e) => selectedEmpIds.has(e.id))
                      .slice(0, 5)
                      .map((e) => (
                        <span
                          key={e.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/40 text-[11px] text-cyan-200 whitespace-nowrap"
                        >
                          <span className="truncate max-w-[130px]">{e.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleSelectEmployee(e.id)}
                            className="text-cyan-400 hover:text-rose-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    {selectedCount > 5 && (
                      <span className="text-[11px] text-cyan-400 font-mono whitespace-nowrap">
                        +{selectedCount - 5} lainnya
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Employee List Table / Cards with Scroll */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 border border-slate-800 rounded-xl p-1 bg-slate-950/50">
              {filteredEmployees.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Tidak ada karyawan yang sesuai dengan kata kunci &quot;{searchEmp}&quot;.
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelected = selectedEmpIds.has(emp.id);
                  const isEnrolled = isEmployeeEnrolled(emp);

                  return (
                    <div
                      key={emp.id}
                      onClick={() => {
                        if (!isEnrolled) {
                          toggleSelectEmployee(emp.id);
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isEnrolled
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-cyan-950/50 border-cyan-500/60 shadow-sm shadow-cyan-950'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox */}
                        <div className="shrink-0">
                          {isEnrolled ? (
                            <div className="w-5 h-5 rounded-md bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : isSelected ? (
                            <div className="w-5 h-5 rounded-md bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-md border border-slate-600 bg-slate-950" />
                          )}
                        </div>

                        {/* Name & Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white truncate">
                              {emp.name}
                            </span>
                            {isEnrolled && (
                              <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/40 shrink-0">
                                Sudah Terdaftar
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate mt-0.5">
                            <span className="font-mono text-cyan-300/90">{emp.idKaryawan || '-'}</span>
                            <span>•</span>
                            <span className="text-slate-300 truncate">{emp.jabatan}</span>
                          </div>
                        </div>
                      </div>

                      {/* Unit Badge */}
                      <div className="shrink-0 ml-2">
                        <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-slate-850 text-slate-300 border border-slate-700/80">
                          {emp.unitKerja}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions for Tab 1 */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={handleSaveBatchEmployees}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-98 rounded-xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {selectedCount > 0
                    ? `Tambahkan ${selectedCount} Peserta Terpilih`
                    : 'Pilih Peserta untuk Menambahkan'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: INPUT FORMULIR DENGAN AUTOCOMPLETE DATA KARYAWAN */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Nama Lengkap with Autocomplete */}
            <div ref={nameInputWrapperRef} className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Nama Lengkap Peserta *
                </label>
                <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3" />
                  Ketik nama untuk auto-fill dari Data Karyawan
                </span>
              </div>

              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onFocus={() => setShowNameSuggestions(true)}
                  onChange={(e) => {
                    setName(e.target.value);
                    setAutoFilledFromEmp(null);
                    setShowNameSuggestions(true);
                  }}
                  placeholder="Ketik nama karyawan (misal: Siti, Nur, Tri)..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {showNameSuggestions && nameSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-cyan-500/40 rounded-xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                  <div className="p-2 bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Saran dari Data Karyawan (Klik untuk Isi Otomatis)</span>
                    <button
                      type="button"
                      onClick={() => setShowNameSuggestions(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {nameSuggestions.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => handleSelectSuggestedEmployee(emp)}
                      className="p-2.5 hover:bg-cyan-950/60 border-b border-slate-800/50 last:border-none cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{emp.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">{emp.idKaryawan}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{emp.jabatan}</span>
                        <span>•</span>
                        <span className="text-slate-300 font-semibold">{emp.unitKerja}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Auto-filled notification badge */}
              {autoFilledFromEmp && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-lg px-2.5 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Data NIK, Jabatan & Unit Kerja otomatis terisi dari Data Karyawan ({autoFilledFromEmp})
                  </span>
                </div>
              )}
            </div>

            {/* NIK & Jabatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  NIK (Nomor Induk Karyawan)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="19920412 201601 1 002"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jabatan / Posisi
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="Supervisor / Staff"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Unit Kerja Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Unit Kerja / Departemen *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomUnit(!isCustomUnit)}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                >
                  {isCustomUnit ? 'Pilih dari Daftar Unit' : '✨ Masukkan Unit Lain'}
                </button>
              </div>
              {isCustomUnit ? (
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="Tuliskan nama unit kerja..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              ) : (
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <select
                    value={unitKerja}
                    onChange={(e) => setUnitKerja(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 appearance-none cursor-pointer"
                  >
                    {getAllKnownUnits().map((unit) => (
                      <option key={unit} value={unit} className="bg-slate-900 text-white">
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Initial Attendance Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status Kehadiran Awal
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Terdaftar', 'Konfirmasi', 'Hadir', 'Izin'] as AttendanceStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusKehadiran(st)}
                    className={`py-1.5 px-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                      statusKehadiran === st
                        ? 'bg-cyan-500 text-slate-950 font-semibold border-cyan-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Hint to switch to multi-select */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                Ingin memilih lebih dari 1 peserta sekaligus?
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                Buka Pilihan Massal →
              </button>
            </div>

            {/* Bottom Actions for Tab 2 */}
            <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {addedCount > 0 ? 'Selesai' : 'Batal'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!name.trim()}
                  onClick={() => handleSaveSingle(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-800/80 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Simpan &amp; Tambah Lagi</span>
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-all shadow-md shadow-cyan-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan Peserta
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
