import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  Search, 
  UserPlus,
  Download, 
  Upload, 
  Printer, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  X,
  FileDown,
  FileSpreadsheet,
  Sliders,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Cloud,
  CheckSquare,
  Square
} from 'lucide-react';
import { EmployeeItem } from '../types/employee';
import { Training } from '../types/training';
import { User, isFullAuthority, canEdit } from '../types/auth';
import { 
  getAllEmployees, 
  deleteEmployee, 
  bulkDeleteEmployees,
  onEmployeesChange, 
  exportEmployeesToExcel, 
  downloadEmployeeExcelTemplate,
  bulkSaveEmployees, 
  resetEmployeesToDefault,
  forceSyncEmployeesWithCloud,
  DEFAULT_EMPLOYEES
} from '../utils/employeeManager';
import { getAllKnownUnits } from '../utils/unitManager';
import { 
  getStoredPrintSigneeConfig, 
  savePrintSigneeConfig, 
  resetPrintSigneeConfig, 
  onPrintSigneeConfigChange, 
  PrintSigneeConfig 
} from '../utils/printConfigManager';
import { AddEditEmployeeModal } from './AddEditEmployeeModal';
import * as XLSX from 'xlsx';

interface EmployeesDirectoryViewProps {
  trainings: Training[];
  currentUser?: User | null;
}

export const EmployeesDirectoryView: React.FC<EmployeesDirectoryViewProps> = ({
  trainings,
  currentUser
}) => {
  const [employees, setEmployees] = useState<EmployeeItem[]>(() => getAllEmployees());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<EmployeeItem | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print Worksheet Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printConfig, setPrintConfig] = useState<PrintSigneeConfig>(() => getStoredPrintSigneeConfig());
  const [showEditSignee, setShowEditSignee] = useState<boolean>(false);
  const [signeeSavedToast, setSigneeSavedToast] = useState<boolean>(false);

  const hasEditAccess = canEdit(currentUser);
  const hasFullAccess = isFullAuthority(currentUser);

  // Sync print signee config on change across the app
  useEffect(() => {
    return onPrintSigneeConfigChange((newCfg) => {
      setPrintConfig(newCfg);
    });
  }, []);

  const handleUpdateSigneeField = (field: keyof PrintSigneeConfig, value: string) => {
    const updated = { ...printConfig, [field]: value };
    setPrintConfig(updated);
    savePrintSigneeConfig(updated);
    setSigneeSavedToast(true);
    setTimeout(() => setSigneeSavedToast(false), 2200);
  };

  const handleResetSigneeDefaults = () => {
    const def = resetPrintSigneeConfig();
    setPrintConfig(def);
    setSigneeSavedToast(true);
    setTimeout(() => setSigneeSavedToast(false), 2200);
  };

  // Sync employees on external changes or updates
  useEffect(() => {
    // Initial fetch from cloud in background to guarantee freshest data on other devices
    forceSyncEmployeesWithCloud().catch(() => {});

    return onEmployeesChange((updatedList) => {
      if (Array.isArray(updatedList)) {
        setEmployees(updatedList);
      } else {
        setEmployees(getAllEmployees());
      }
    });
  }, []);

  // Filtered employees based on search & unit filter
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = searchQuery.toLowerCase().trim();
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
  }, [employees, searchQuery, selectedUnitFilter]);

  // List of distinct units currently present in employees
  const employeeUnits = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.unitKerja && e.unitKerja.trim()) set.add(e.unitKerja.trim());
    });
    getAllKnownUnits().forEach((u) => set.add(u));
    return Array.from(set).sort();
  }, [employees]);

  // Delete employee handler
  const handleConfirmDelete = async () => {
    if (!showDeleteConfirm) return;
    const toDeleteId = showDeleteConfirm.id;
    const toDeleteName = showDeleteConfirm.name;
    setShowDeleteConfirm(null);

    // 1. Instantly update local state so row disappears with 0ms delay
    setEmployees((prev) => prev.filter((e) => e.id !== toDeleteId));
    setSelectedEmployeeIds((prev) => prev.filter((id) => id !== toDeleteId));
    setToastMsg(`Data karyawan "${toDeleteName}" berhasil dihapus.`);
    setTimeout(() => setToastMsg(null), 3000);

    // 2. Persist deletion in localStorage and Firestore
    await deleteEmployee(toDeleteId);
  };

  // Toggle single employee selection
  const handleToggleSelectEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all filtered employees
  const handleToggleSelectAll = () => {
    const filteredIds = filteredEmployees.map((e) => e.id);
    if (filteredIds.length === 0) return;
    const isAllSelected = filteredIds.every((id) => selectedEmployeeIds.includes(id));
    if (isAllSelected) {
      setSelectedEmployeeIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedEmployeeIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Batch delete confirmed handler
  const handleConfirmBatchDelete = async () => {
    if (selectedEmployeeIds.length === 0) return;
    const idsToDelete = [...selectedEmployeeIds];
    const count = idsToDelete.length;
    setShowBatchDeleteConfirm(false);
    setSelectedEmployeeIds([]);

    // 1. Instantly update local state so rows disappear with 0ms delay
    setEmployees((prev) => prev.filter((e) => !idsToDelete.includes(e.id)));
    setToastMsg(`Berhasil menghapus ${count} data karyawan sekaligus dari sistem.`);
    setTimeout(() => setToastMsg(null), 3500);

    // 2. Persist batch deletion in localStorage and Firestore
    await bulkDeleteEmployees(idsToDelete);
  };

  // Reset to default
  const handleConfirmReset = () => {
    resetEmployeesToDefault();
    setEmployees(DEFAULT_EMPLOYEES);
    setSelectedEmployeeIds([]);
    setShowResetConfirm(false);
    setToastMsg('Daftar data karyawan berhasil dipulihkan ke default RSIA Az Zahra.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Manual Cloud Sync handler
  const handleManualSync = async () => {
    setIsSyncing(true);
    setToastMsg('Menyinkronkan data karyawan dengan Cloud Firestore...');
    try {
      const res = await forceSyncEmployeesWithCloud();
      setToastMsg(`Sinkronisasi Cloud sukses! ${res.count} data karyawan termutakhir aktif.`);
    } catch (e) {
      setToastMsg('Sinkronisasi cloud selesai.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  // Excel file upload handler
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          alert('File Excel kosong atau format tidak sesuai.');
          return;
        }

        const newItems: Omit<EmployeeItem, 'id'>[] = [];
        rawJson.forEach((row) => {
          const getVal = (candidates: string[]) => {
            for (const key of Object.keys(row)) {
              const clean = key.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (candidates.some((c) => clean.includes(c))) {
                return String(row[key] || '').trim();
              }
            }
            return '';
          };

          const nameVal = getVal(['namalengkap', 'nama', 'peserta']);
          const idVal = getVal(['idkaryawan', 'id', 'nip', 'nik']);
          const jabatanVal = getVal(['jabatan', 'posisi', 'profesi']);
          const unitVal = getVal(['unitkerja', 'unit', 'departemen', 'divisi']);

          if (nameVal) {
            newItems.push({
              name: nameVal,
              idKaryawan: idVal || `199${Math.floor(100000000000 + Math.random() * 900000000000)}`,
              jabatan: jabatanVal || 'Staff Pelaksana',
              unitKerja: unitVal || 'Inpatient'
            });
          }
        });

        if (newItems.length > 0) {
          setIsSyncing(true);
          setToastMsg(`Membaca ${newItems.length} karyawan & menyinkronkan ke Cloud Firestore...`);
          try {
            const res = await bulkSaveEmployees(newItems);
            setToastMsg(
              res.cloudSynced
                ? `Berhasil mengimpor ${res.count} data karyawan & tersinkronisasi ke Cloud Firestore!`
                : `Berhasil mengimpor ${res.count} data karyawan (tersimpan di perangkat)!`
            );
          } catch (err) {
            console.error('Failed to bulk save employees:', err);
            setToastMsg(`Berhasil mengimpor ${newItems.length} data karyawan.`);
          } finally {
            setIsSyncing(false);
            setTimeout(() => setToastMsg(null), 4000);
          }
        } else {
          alert('Tidak ditemukan baris nama karyawan yang valid pada file Excel.');
        }
      } catch (err) {
        console.error('Failed to import Excel:', err);
        alert('Gagal membaca file Excel. Pastikan file valid.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden min-h-0">
      {/* Screen Header Strip */}
      <div className="print:hidden bg-slate-900/95 border border-slate-800/90 rounded-2xl p-3.5 shrink-0 relative overflow-hidden aero-border-gradient">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">
              <Users className="w-3 h-3" />
              <span>Direktori Kepegawaian RSIA Az Zahra</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
              <span>NAMA - NAMA PERAWAT DAN BIDAN RSIA AZ ZAHRA</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold">
                {employees.length} KARYAWAN
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Daftar resmi data perawat, bidan, dan tenaga kesehatan RSIA Az Zahra. Dilengkapi fitur pencarian, filter unit kerja, ekspor Excel, dan cetak dokumen resmi.
            </p>
          </div>

          {/* Action Toolbar: Simbol / Logo Saja */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {hasEditAccess && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="p-2 sm:p-2.5 rounded-xl text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                title="Tambah Karyawan Baru"
                aria-label="Tambah Karyawan Baru"
              >
                <UserPlus className="w-4 h-4 stroke-[2.2]" />
              </button>
            )}

            <button
              type="button"
              onClick={downloadEmployeeExcelTemplate}
              className="p-2 sm:p-2.5 rounded-xl text-emerald-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              title="Unduh Template Excel Data Karyawan (No | NAMA LENGKAP | nik | JABATAN | UNIT KERJA)"
              aria-label="Unduh Template Excel Data Karyawan"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              type="button"
              onClick={() => exportEmployeesToExcel(filteredEmployees)}
              className="p-2 sm:p-2.5 rounded-xl text-cyan-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              title="Ekspor Data Karyawan ke Excel (.xlsx)"
              aria-label="Ekspor Excel"
            >
              <Download className="w-4 h-4 text-cyan-400" />
            </button>

            {hasEditAccess && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 sm:p-2.5 rounded-xl text-emerald-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                  title="Impor Data Karyawan dari File Excel"
                  aria-label="Impor Excel"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                isSyncing 
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-md shadow-cyan-500/20' 
                  : 'text-sky-400 hover:text-white bg-slate-900 hover:bg-slate-800 border-slate-700/80'
              }`}
              title="Sinkronisasi Cloud Real-Time (Ambil/Kirim Data Karyawan Antar-Perangkat)"
              aria-label="Sinkronisasi Cloud Data Karyawan"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-cyan-300' : 'text-sky-400'}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              title="Cetak Dokumen Data Karyawan"
              aria-label="Cetak Dokumen"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Screen Search & Filter Toolbar */}
      <div className="print:hidden bg-slate-900/95 border border-slate-800/80 rounded-2xl p-2.5 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan Nama Lengkap, NIK (Nomor Induk Karyawan), Jabatan, atau Unit Kerja..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={selectedUnitFilter}
              onChange={(e) => setSelectedUnitFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 pr-8 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">Semua Unit Kerja ({employees.length})</option>
              {employeeUnits.map((u) => (
                <option key={u} value={u} className="bg-slate-900 text-white">
                  {u}
                </option>
              ))}
            </select>
          </div>

          {hasFullAccess && (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
              title="Pulihkan data karyawan ke bawaan RSIA Az Zahra"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Action Toolbar for Batch Multi-Delete */}
      {hasEditAccess && selectedEmployeeIds.length > 0 && (
        <div className="print:hidden bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-rose-950/80 border border-rose-500/40 rounded-2xl px-4 py-2.5 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-lg shadow-rose-950/40 animate-smooth-fade">
          <div className="flex items-center gap-2.5 text-xs text-rose-200">
            <span className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {selectedEmployeeIds.length}
            </span>
            <span>
              <strong className="text-white font-bold">{selectedEmployeeIds.length}</strong> data karyawan dipilih untuk dihapus
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedEmployeeIds([])}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer transition-colors"
            >
              Batal Pilih
            </button>
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-3 py-1.5 text-xs text-cyan-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-cyan-800/60 rounded-xl cursor-pointer transition-colors"
            >
              {filteredEmployees.length > 0 && filteredEmployees.every((e) => selectedEmployeeIds.includes(e.id))
                ? 'Batal Pilih Semua'
                : `Pilih Semua (${filteredEmployees.length})`}
            </button>
            <button
              type="button"
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedEmployeeIds.length}) Karyawan Terpilih</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container: Menampilkan seluruh karyawan secara langsung */}
      <div className="flex-1 min-h-0 bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl aero-border-gradient flex flex-col">
        {/* Scrollable table viewport */}
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full border-collapse text-xs sm:text-sm table-auto">
            <thead>
              <tr className="bg-slate-950 text-slate-200 uppercase tracking-wider text-[11px] font-bold border-b-2 border-slate-700 sticky top-0 z-10 shadow-sm">
                <th className="w-14 sm:w-16 py-2.5 px-3 text-center border-r border-slate-800 font-serif">
                  No
                </th>
                <th className="py-2.5 px-4 text-center border-r border-slate-800 font-serif min-w-[200px] break-words whitespace-normal">
                  Nama Lengkap
                </th>
                <th className="py-2.5 px-4 text-center border-r border-slate-800 font-serif min-w-[200px] break-words whitespace-normal">
                  NIK (Nomor Induk Karyawan)
                </th>
                <th className="py-2.5 px-4 text-center border-r border-slate-800 font-serif min-w-[180px] break-words whitespace-normal">
                  Jabatan
                </th>
                <th className="py-2.5 px-4 text-center border-r border-slate-800 font-serif min-w-[160px] break-words whitespace-normal">
                  Unit Kerja
                </th>
                {hasEditAccess && (
                  <th className="w-32 sm:w-36 py-2.5 px-2 text-center text-[10px] text-slate-400 font-sans">
                    <div className="flex items-center justify-center gap-2">
                      {filteredEmployees.length > 0 && (
                        <input
                          type="checkbox"
                          checked={
                            filteredEmployees.length > 0 &&
                            filteredEmployees.every((e) => selectedEmployeeIds.includes(e.id))
                          }
                          onChange={handleToggleSelectAll}
                          title={
                            filteredEmployees.every((e) => selectedEmployeeIds.includes(e.id))
                              ? 'Batalkan Pilih Semua Karyawan'
                              : 'Pilih Semua Karyawan untuk Hapus Lebih Dari 1'
                          }
                          className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-rose-500 cursor-pointer accent-rose-500"
                        />
                      )}
                      <span>Aksi</span>
                      {selectedEmployeeIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowBatchDeleteConfirm(true)}
                          className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow transition-transform active:scale-95 cursor-pointer"
                          title={`Klik untuk hapus ${selectedEmployeeIds.length} karyawan terpilih`}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{selectedEmployeeIds.length}</span>
                        </button>
                      )}
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={hasEditAccess ? 6 : 5}
                    className="py-14 px-4 text-center text-xs text-slate-400 bg-slate-950/40"
                  >
                    <div className="space-y-2 max-w-sm mx-auto">
                      <Users className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-semibold text-slate-300">
                        {searchQuery
                          ? `Tidak ditemukan karyawan yang sesuai dengan kata kunci "${searchQuery}"`
                          : 'Belum ada data karyawan'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Gunakan tombol "+ Tambah Karyawan" atau "Impor Excel" di atas untuk menambahkan data baru.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => {
                  const rowNo = index + 1;
                  const isSelected = selectedEmployeeIds.includes(emp.id);
                  return (
                    <tr
                      key={emp.id}
                      className={`transition-colors group border-b border-slate-800/60 ${
                        isSelected 
                          ? 'bg-rose-950/30 hover:bg-rose-950/40 border-rose-900/60' 
                          : 'hover:bg-slate-800/60'
                      }`}
                    >
                      {/* No Urut */}
                      <td className="py-2.5 sm:py-3 px-3 text-center border-r border-slate-800/80 font-medium text-slate-400 tabular-nums align-middle">
                        {rowNo}
                      </td>

                      {/* Nama Lengkap */}
                      <td className="py-2.5 sm:py-3 px-4 text-left border-r border-slate-800/80 font-semibold text-white break-words whitespace-normal leading-snug align-middle">
                        <span>{emp.name}</span>
                      </td>

                      {/* NIK (Nomor Induk Karyawan) */}
                      <td className="py-2.5 sm:py-3 px-4 text-center border-r border-slate-800/80 font-mono text-[11px] sm:text-xs text-cyan-300 break-words whitespace-normal align-middle">
                        {emp.idKaryawan}
                      </td>

                      {/* Jabatan */}
                      <td className="py-2.5 sm:py-3 px-4 text-left border-r border-slate-800/80 text-slate-300 break-words whitespace-normal leading-snug align-middle">
                        {emp.jabatan}
                      </td>

                      {/* Unit Kerja */}
                      <td className="py-2.5 sm:py-3 px-4 text-center border-r border-slate-800/80 break-words whitespace-normal leading-snug align-middle">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-800/90 text-cyan-300 text-[11px] border border-slate-700 font-medium">
                          {emp.unitKerja}
                        </span>
                      </td>

                      {/* Action buttons & Multi-Delete Checkbox */}
                      {hasEditAccess && (
                        <td className="py-2 px-2 text-center whitespace-nowrap align-middle">
                          <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectEmployee(emp.id)}
                              title={`Pilih "${emp.name}" untuk dihapus (bisa lebih dari 1)`}
                              className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-rose-500 cursor-pointer accent-rose-500"
                            />
                            <button
                              type="button"
                              onClick={() => setEditingEmployee(emp)}
                              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Ubah data karyawan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDeleteConfirm(emp)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Hapus data karyawan ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Clean, Sleek Bottom Status Bar (Tanpa teks pemotongan halaman / lembar kerja ganda) */}
        <div className="print:hidden bg-slate-950/90 border-t border-slate-800 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400">Total Karyawan:</span>
            <span className="font-mono font-bold text-cyan-300 text-sm">
              {filteredEmployees.length}
            </span>
            <span>Personil</span>
            {(searchQuery || selectedUnitFilter !== 'ALL') && (
              <span className="text-[11px] text-slate-400">
                (difilter dari total <span className="font-bold text-white">{employees.length}</span> personil)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span>RSIA Az Zahra Palembang</span>
            <span>•</span>
            <span>Direktori Kepegawaian &amp; Diklat</span>
          </div>
        </div>
      </div>

      {/* MODAL: PRATINJAU CETAK DOKUMEN RESMI A4 */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:fixed print:inset-0 print:p-0 print:bg-white print:z-[99999] print-container">
          <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-4 sm:p-8 flex flex-col print:max-h-none print:overflow-visible print:shadow-none print:border-none print:p-0 print:rounded-none">
            {/* Modal Controls (Hidden during print) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight">
                    Cetak Dokumen Data Karyawan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Format resmi cetak A4 RSIA Az Zahra
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowEditSignee(!showEditSignee)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    showEditSignee
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                  title="Ubah pejabat penandatangan, gelar, dan NIK/NIP"
                >
                  <Sliders className="w-4 h-4 text-cyan-600" />
                  <span>{showEditSignee ? 'Tutup Form TTD' : 'Ubah Pejabat TTD'}</span>
                  {showEditSignee ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-cyan-600/20 transition-all cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak (<span className="italic">Print / PDF</span>)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* EXPANDABLE SIGNEE EDITOR PANEL (Screen only, hidden on print) */}
            {showEditSignee && (
              <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 print:hidden space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center text-xs">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Pengaturan Pejabat Penandatangan (Tanda Tangan Dokumen)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Perubahan di sini tersimpan otomatis dan berlaku ke seluruh fitur cetak (Global).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {signeeSavedToast && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                        <Check className="w-3.5 h-3.5" /> Tersimpan ke Sistem
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleResetSigneeDefaults}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Standar</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pihak Kiri (Pemeriksa / Atasan) */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wide">
                        Pihak Kiri (Pemeriksa / Keperawatan)
                      </span>
                      <span className="text-[10px] bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded font-medium border border-cyan-200">
                        Kolom Kiri
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                          Teks Pengantar
                        </label>
                        <input
                          type="text"
                          value={printConfig.leftPrefix}
                          onChange={(e) => handleUpdateSigneeField('leftPrefix', e.target.value)}
                          placeholder="Mengetahui,"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                          Jabatan Penandatangan
                        </label>
                        <input
                          type="text"
                          value={printConfig.leftRole}
                          onChange={(e) => handleUpdateSigneeField('leftRole', e.target.value)}
                          placeholder="Kepala Bidang Keperawatan"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                        Nama Lengkap &amp; Gelar
                      </label>
                      <input
                        type="text"
                        value={printConfig.leftName}
                        onChange={(e) => handleUpdateSigneeField('leftName', e.target.value)}
                        placeholder="Ns. Siti Rahmawati, S.Kep."
                        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                          Tipe Nomor
                        </label>
                        <select
                          value={printConfig.leftNipLabel}
                          onChange={(e) => handleUpdateSigneeField('leftNipLabel', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="NIK">NIK</option>
                          <option value="NIP">NIP</option>
                          <option value="ID">ID Karyawan</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                          Nomor Identitas
                        </label>
                        <input
                          type="text"
                          value={printConfig.leftNip}
                          onChange={(e) => handleUpdateSigneeField('leftNip', e.target.value)}
                          placeholder="19920315 201601 2 001"
                          className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pihak Kanan (HC & SDM / Pengesah) */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wide">
                        Pihak Kanan (HC &amp; SDM / Pengesah)
                      </span>
                      <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-medium border border-sky-200">
                        Kolom Kanan
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                          Lokasi / Kota
                        </label>
                        <input
                          type="text"
                          value={printConfig.rightCity}
                          onChange={(e) => handleUpdateSigneeField('rightCity', e.target.value)}
                          placeholder="Palembang"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                          Tanggal Cetak (Opsional)
                        </label>
                        <input
                          type="text"
                          value={printConfig.rightCustomDate}
                          onChange={(e) => handleUpdateSigneeField('rightCustomDate', e.target.value)}
                          placeholder="Kosong = Tanggal Hari Ini"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                          Jabatan Penandatangan
                        </label>
                        <input
                          type="text"
                          value={printConfig.rightRole}
                          onChange={(e) => handleUpdateSigneeField('rightRole', e.target.value)}
                          placeholder="Ka. Subag Kepegawaian & SDM"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                          Nama Lengkap &amp; Gelar
                        </label>
                        <input
                          type="text"
                          value={printConfig.rightName}
                          onChange={(e) => handleUpdateSigneeField('rightName', e.target.value)}
                          placeholder="Ratna Kusuma Dewi, S.Psi., M.M."
                          className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                          Tipe Nomor
                        </label>
                        <select
                          value={printConfig.rightNipLabel}
                          onChange={(e) => handleUpdateSigneeField('rightNipLabel', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="NIK">NIK</option>
                          <option value="NIP">NIP</option>
                          <option value="ID">ID Karyawan</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                          Nomor Identitas
                        </label>
                        <input
                          type="text"
                          value={printConfig.rightNip}
                          onChange={(e) => handleUpdateSigneeField('rightNip', e.target.value)}
                          placeholder="19870914 201102 2 001"
                          className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRINTABLE CONTENT SHEET (Exact A4 Styling) */}
            <div className="space-y-6 print:space-y-0 print:p-0 bg-white">
              {/* Header */}
              <div className="border-b-2 border-black pb-3 text-center mb-4">
                <h1 className="text-lg sm:text-xl font-bold tracking-wider uppercase text-black font-serif">
                  {printConfig.documentHeader || 'NAMA - NAMA PERAWAT DAN BIDAN RSIA AZ ZAHRA'}
                </h1>
                <div className="flex items-center justify-between text-xs text-slate-700 mt-1 font-mono">
                  <span>
                    Tanggal Cetak: {printConfig.rightCustomDate || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="font-bold">Total: {filteredEmployees.length} Personil</span>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left text-xs border border-black border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-black font-serif font-bold border-b border-black">
                    <th className="p-2 border-r border-black text-center w-12">No</th>
                    <th className="p-2 border-r border-black text-center">Nama Lengkap</th>
                    <th className="p-2 border-r border-black text-center w-48">NIK (Nomor Induk Karyawan)</th>
                    <th className="p-2 border-r border-black text-center">Jabatan</th>
                    <th className="p-2 text-center w-36">Unit Kerja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {filteredEmployees.map((emp, idx) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-black text-center tabular-nums font-mono">
                        {idx + 1}
                      </td>
                      <td className="p-2 border-r border-black font-semibold text-black">
                        {emp.name}
                      </td>
                      <td className="p-2 border-r border-black text-center font-mono text-[11px]">
                        {emp.idKaryawan}
                      </td>
                      <td className="p-2 border-r border-black text-slate-800">
                        {emp.jabatan}
                      </td>
                      <td className="p-2 text-center text-slate-800 font-medium">
                        {emp.unitKerja}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Dynamic Signature block as requested */}
              <div className="mt-8 pt-4 grid grid-cols-2 text-xs text-center border-t border-slate-300">
                <div>
                  <p className="font-medium text-slate-600 mb-14">
                    {printConfig.leftPrefix}<br />
                    {printConfig.leftRole}
                  </p>
                  <p className="font-bold text-black uppercase underline">
                    {printConfig.leftName}
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono">
                    {printConfig.leftNipLabel}: {printConfig.leftNip}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-600 mb-14">
                    {printConfig.rightCity}, {printConfig.rightCustomDate || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                    {printConfig.rightRole}
                  </p>
                  <p className="font-bold text-black uppercase underline">
                    {printConfig.rightName}
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono">
                    {printConfig.rightNipLabel}: {printConfig.rightNip}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Employee */}
      {(showAddModal || editingEmployee) && (
        <AddEditEmployeeModal
          employee={editingEmployee}
          onClose={() => {
            setShowAddModal(false);
            setEditingEmployee(null);
          }}
          onSaved={(saved) => {
            setToastMsg(`Data karyawan "${saved.name}" berhasil disimpan.`);
            setTimeout(() => setToastMsg(null), 3000);
          }}
        />
      )}

      {/* MODAL: Delete Employee Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Hapus Data Karyawan?</h4>
                <p className="text-xs text-slate-400 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-4 space-y-1">
              <p className="text-xs font-semibold text-white">{showDeleteConfirm.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">{showDeleteConfirm.idKaryawan}</p>
              <p className="text-[11px] text-cyan-400">{showDeleteConfirm.jabatan} · {showDeleteConfirm.unitKerja}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow cursor-pointer"
              >
                Hapus Karyawan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Batch Delete Employees Confirmation (Hapus Lebih Dari 1) */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-smooth-fade">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Hapus {selectedEmployeeIds.length} Data Karyawan?</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/80 font-bold">
                    {selectedEmployeeIds.length} Terpilih
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Tindakan ini akan menghapus seluruh data karyawan terpilih secara permanen dari sistem dan Cloud Firestore. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            {/* List Preview of Selected Employees to be Deleted */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 mb-4 space-y-1.5 max-h-56 overflow-y-auto">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pb-1 border-b border-slate-800/80 uppercase tracking-wider">
                <span>Nama Karyawan</span>
                <span>NIK / Unit Kerja</span>
              </div>
              {employees
                .filter((emp) => selectedEmployeeIds.includes(emp.id))
                .map((emp, i) => (
                  <div 
                    key={emp.id} 
                    className="flex items-center justify-between gap-3 text-xs py-1.5 px-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 hover:border-rose-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-rose-950/80 text-rose-400 border border-rose-900/60 flex items-center justify-center text-[10px] font-mono shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-white truncate">
                        {emp.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-[11px] text-cyan-400 font-medium">
                        {emp.idKaryawan}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {emp.unitKerja}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus {selectedEmployeeIds.length} Karyawan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reset to Default Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Pulihkan Data Default?</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kembalikan daftar karyawan ke 12 perawat &amp; bidan bawaan RSIA Az Zahra.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl font-bold cursor-pointer"
              >
                Ya, Pulihkan Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-emerald-300 border border-emerald-500/50 rounded-2xl shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="ml-2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
