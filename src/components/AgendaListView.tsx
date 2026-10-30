import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Users, 
  Building2, 
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  Sparkles,
  ArrowDownUp,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Training } from '../types/training';
import { CATEGORY_COLORS, ALL_UNIT_KERJA } from '../data/initialData';
import { ForeignText } from '../utils/textFormatter';
import { calculateDurationDays, formatDateRangeIndonesian } from '../utils/dateUtils';
import { User as AuthUser, isFullAuthority } from '../types/auth';
import { BatchDeleteModal } from './BatchDeleteModal';
import { exportCompleteAgendaToExcel } from '../utils/excelExporter';
import { getAllKnownUnits } from '../utils/unitManager';

interface AgendaListViewProps {
  trainings: Training[];
  onSelectTraining: (training: Training) => void;
  onBatchDelete?: (trainingIds: string[]) => void;
  currentUser?: AuthUser | null;
}

export const AgendaListView: React.FC<AgendaListViewProps> = ({
  trainings,
  onSelectTraining,
  onBatchDelete,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState('ALL');

  // Multi-select batch deletion state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState<boolean>(false);
  const [deleteAlert, setDeleteAlert] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);


  // Dynamic container measuring ref to fill the entire working sheet without blank space
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [calculatedCapacity, setCalculatedCapacity] = useState<number>(8);
  const [userSelectedRows, setUserSelectedRows] = useState<'AUTO' | number>('AUTO');

  // Pagination current page state
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Measure container height dynamically to calculate how many items completely fill the workspace
  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;

    const measure = () => {
      const height = el.clientHeight;
      if (height <= 0) return;
      // Each card row is approximately 62px - 66px with gaps.
      // E.g. on 520px desktop view: 520 / 64 = 8 items fits completely and fills the page!
      const count = Math.max(3, Math.floor(height / 64));
      setCalculatedCapacity(count);
    };

    measure();

    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const itemsPerPage = userSelectedRows === 'AUTO' ? calculatedCapacity : userSelectedRows;

  // Seluruh unit kerja lengkap termasuk unit kustom
  const allUnits = useMemo(() => {
    return getAllKnownUnits(trainings);
  }, [trainings]);

  // Filtered trainings
  const filteredTrainings = useMemo(() => {
    return trainings.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Boolean(t.targetUnits && t.targetUnits.some((u) => u.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        t.participants.some(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.unitKerja.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
      const matchUnit =
        selectedUnit === 'ALL' ||
        Boolean(t.targetUnits && t.targetUnits.some((u) => u.trim().toLowerCase() === selectedUnit.trim().toLowerCase())) ||
        t.participants.some((p) => p.unitKerja && p.unitKerja.trim().toLowerCase() === selectedUnit.trim().toLowerCase());

      return matchSearch && matchCategory && matchUnit;
    });
  }, [trainings, searchQuery, selectedCategory, selectedUnit]);

  // Sort: TERBARU KE TERLAMA (Newest date first -> Descending) as requested by user
  const sortedTrainings = useMemo(() => {
    return [...filteredTrainings].sort((a, b) => {
      const dateComp = b.date.localeCompare(a.date);
      if (dateComp !== 0) return dateComp;
      return b.startTime.localeCompare(a.startTime);
    });
  }, [filteredTrainings]);

  // Active selected row index for keyboard navigation (Panah Atas / Bawah)
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Automatically reset to page 1 & selectedIndex 0 whenever search, filters, or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIndex(0);
  }, [searchQuery, selectedCategory, selectedUnit, itemsPerPage]);

  // Pagination computations
  const totalItems = sortedTrainings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrainings = useMemo(() => {
    return sortedTrainings.slice(startIndex, endIndex);
  }, [sortedTrainings, startIndex, endIndex]);

  // Navigation handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Keep selectedIndex within valid bounds of current page items
  useEffect(() => {
    if (currentTrainings.length > 0 && selectedIndex >= currentTrainings.length) {
      setSelectedIndex(currentTrainings.length - 1);
    }
  }, [currentTrainings.length, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    const el = rowRefs.current[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, safeCurrentPage]);

  const navigateList = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (currentTrainings.length === 0) return;

    if (direction === 'down') {
      setSelectedIndex((prev) => {
        if (prev < currentTrainings.length - 1) {
          return prev + 1;
        } else if (safeCurrentPage < totalPages) {
          setCurrentPage((p) => Math.min(p + 1, totalPages));
          return 0;
        }
        return prev;
      });
    } else if (direction === 'up') {
      setSelectedIndex((prev) => {
        if (prev > 0) {
          return prev - 1;
        } else if (safeCurrentPage > 1) {
          setCurrentPage((p) => Math.max(1, p - 1));
          return Math.max(0, itemsPerPage - 1);
        }
        return prev;
      });
    } else if (direction === 'left') {
      if (safeCurrentPage > 1) {
        setCurrentPage((p) => p - 1);
        setSelectedIndex(0);
      }
    } else if (direction === 'right') {
      if (safeCurrentPage < totalPages) {
        setCurrentPage((p) => p + 1);
        setSelectedIndex(0);
      }
    }
  };

  // Keyboard navigation listener (handled via centralized App.tsx events)
  useEffect(() => {
    const handleCustomNav = (e: Event) => {
      const customEvent = e as CustomEvent<{ direction: 'up' | 'down' | 'left' | 'right' }>;
      if (customEvent.detail?.direction) {
        navigateList(customEvent.detail.direction);
      }
    };

    const handleCustomOpen = () => {
      if (currentTrainings[selectedIndex]) {
        onSelectTraining(currentTrainings[selectedIndex]);
      }
    };

    const handleCustomExport = () => {
      exportCompleteAgendaToExcel(sortedTrainings);
    };

    const handleCustomDelete = () => {
      if (selectedIds.length > 0) {
        handleDeleteSelected();
      }
    };

    window.addEventListener('agenda-navigate-key', handleCustomNav);
    window.addEventListener('agenda-open-selected', handleCustomOpen);
    window.addEventListener('agenda-export-excel', handleCustomExport);
    window.addEventListener('agenda-delete-selected', handleCustomDelete);

    return () => {
      window.removeEventListener('agenda-navigate-key', handleCustomNav);
      window.removeEventListener('agenda-open-selected', handleCustomOpen);
      window.removeEventListener('agenda-export-excel', handleCustomExport);
      window.removeEventListener('agenda-delete-selected', handleCustomDelete);
    };
  }, [currentTrainings, selectedIndex, safeCurrentPage, totalPages, itemsPerPage, onSelectTraining, sortedTrainings, selectedIds]);

  // Multi-select batch handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllCurrentPageSelected = 
    currentTrainings.length > 0 && currentTrainings.every((t) => selectedIds.includes(t.id));

  const toggleSelectCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(currentTrainings.map((t) => t.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newIds = new Set(selectedIds);
      currentTrainings.forEach((t) => newIds.add(t.id));
      setSelectedIds(Array.from(newIds));
    }
  };

  const selectAllFiltered = () => {
    setSelectedIds(sortedTrainings.map((t) => t.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (!isFullAuthority(currentUser)) {
      setDeleteAlert('Hanya akun dengan Otoritas Penuh yang berwenang menghapus agenda pelatihan.');
      setTimeout(() => setDeleteAlert(null), 4000);
      return;
    }
    setShowBatchDeleteModal(true);
  };

  const handleConfirmBatchDelete = () => {
    if (onBatchDelete && selectedIds.length > 0) {
      const count = selectedIds.length;
      onBatchDelete(selectedIds);
      setSelectedIds([]);
      setShowBatchDeleteModal(false);
      setToastMessage(`Berhasil menghapus ${count} pelatihan terpilih.`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Keyboard shortcut for Delete key
  useEffect(() => {
    const handleListKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || Boolean(target?.isContentEditable);
      if (isInput) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0 && !showBatchDeleteModal) {
        e.preventDefault();
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleListKeyDown);
    return () => window.removeEventListener('keydown', handleListKeyDown);
  }, [selectedIds, showBatchDeleteModal, currentUser]);

  // Export Complete Agenda to Excel (.xlsx)
  const handleExportAllToExcel = () => {
    exportCompleteAgendaToExcel(sortedTrainings);
  };

  return (
    <div className="h-full w-full flex flex-col justify-between gap-2 overflow-hidden min-h-0 select-none">
      {/* Delete authorization warning alert */}
      {deleteAlert && (
        <div className="bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs px-3.5 py-2 rounded-xl flex items-center justify-between gap-2 shadow-lg animate-smooth-fade shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{deleteAlert}</span>
          </div>
          <button onClick={() => setDeleteAlert(null)} className="text-rose-400 hover:text-white p-0.5 cursor-pointer">✕</button>
        </div>
      )}

      {/* Success toast notification */}
      {toastMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-lg animate-smooth-fade shrink-0">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search and Filters Bar (Compact Header) */}
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 aero-border-gradient shrink-0">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, kode, instruktur, peserta, atau unit..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Filter Dropdowns & Sorting Indicator */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Master Select Checkbox Button */}
          <button
            type="button"
            onClick={toggleSelectCurrentPage}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 ${
              isAllCurrentPageSelected
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={isAllCurrentPageSelected ? "Batalkan pilihan halaman ini" : "Pilih semua pelatihan pada halaman ini"}
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
              isAllCurrentPageSelected ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
            }`}>
              {isAllCurrentPageSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span className="hidden sm:inline">Pilih Halaman</span>
          </button>

          {/* Keyboard Navigation Quick Hint */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 shadow-xs">
            <span className="text-slate-400">Pindah baris:</span>
            <kbd className="px-1.5 py-0.5 bg-slate-850 border border-slate-700 rounded text-cyan-300 font-bold font-mono text-[10px]">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-850 border border-slate-700 rounded text-cyan-300 font-bold font-mono text-[10px]">↓</kbd>
            <span className="text-slate-600">·</span>
            <kbd className="px-1.5 py-0.5 bg-slate-850 border border-slate-700 rounded text-cyan-300 font-bold font-mono text-[10px]">Enter</kbd>
            <span className="text-slate-400">Buka</span>
          </div>

          {/* Export to Excel Button */}
          <button
            type="button"
            onClick={handleExportAllToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-600/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Unduh seluruh rekap jadwal dan daftar peserta format Excel (.xlsx) [Ctrl + E]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Export Excel</span>
          </button>

          {/* Sorting Indicator Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-cyan-400 font-semibold shadow-xs">
            <ArrowDownUp className="w-3 h-3 text-cyan-400" />
            <span>Terbaru ke Terlama</span>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 pr-7 focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[130px] sm:max-w-[160px] truncate"
            >
              <option value="ALL">Semua Kategori</option>
              {Object.keys(CATEGORY_COLORS).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-2 pointer-events-none" />
          </div>

          {/* Unit Kerja Filter */}
          <div className="relative">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 pr-7 focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[130px] sm:max-w-[170px] truncate"
            >
              <option value="ALL">Semua Unit Kerja</option>
              {allUnits.map((u) => (
                <option key={u} value={u} className="bg-slate-900 text-white">
                  {u}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Floating / Docked Aero Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900/98 via-slate-850/98 to-slate-900/98 border border-cyan-500/60 rounded-2xl p-2 sm:p-2.5 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 shadow-2xl animate-smooth-slide-up shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-white">
              <span className="text-cyan-400 font-mono text-sm">{selectedIds.length}</span> Pelatihan Terpilih
            </span>
            <span className="hidden sm:inline text-slate-600">·</span>
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Pilih Semua ({sortedTrainings.length})
            </button>
            <span className="hidden sm:inline text-slate-600">·</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              Batalkan Pilihan
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={deselectAll}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleDeleteSelected}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-md shadow-rose-950/40 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Single-Page Workspace: Fills 100% of Available Vertical Height & Allows Arrow Navigation */}
      <div 
        ref={listContainerRef}
        className="flex-1 flex flex-col justify-start gap-1.5 sm:gap-2 min-h-0 overflow-y-auto w-full pr-1 select-none focus:outline-none"
        tabIndex={0}
      >
        {totalItems === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
            <Calendar className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-white">Tidak Ada Jadwal Pelatihan Ditemukan</p>
            <p className="text-xs text-slate-500 mt-0.5">Coba sesuaikan kata kunci pencarian atau ubah filter unit kerja.</p>
          </div>
        ) : (
          currentTrainings.map((trn, idx) => {
            const isSelected = idx === selectedIndex;
            const isSelectedInBatch = selectedIds.includes(trn.id);
            const catStyle = CATEGORY_COLORS[trn.category] || CATEGORY_COLORS['Teknologi & Digital'];
            const distinctUnits = Array.from(new Set(trn.participants.map((p) => p.unitKerja)));

            return (
              <div
                key={trn.id}
                ref={(el) => {
                  rowRefs.current[idx] = el;
                }}
                onClick={() => {
                  setSelectedIndex(idx);
                  onSelectTraining(trn);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`group w-full rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 overflow-hidden active:scale-[0.99] border shrink-0 ${
                  isSelectedInBatch
                    ? 'bg-slate-850/95 border-cyan-400 ring-2 ring-cyan-400/90 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                    : isSelected
                    ? 'bg-slate-800/95 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1.5 ring-cyan-400/90'
                    : 'bg-slate-900/70 hover:bg-slate-850/95 border-slate-800 hover:border-cyan-500/50 shadow-md hover:shadow-cyan-500/10'
                }`}
              >
                {/* Checkbox Selector for Multiple Selection */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(trn.id);
                  }}
                  title={isSelectedInBatch ? "Batalkan pilihan pelatihan ini" : "Pilih pelatihan ini untuk dihapus / dikelola"}
                  className="p-1 -ml-1 text-slate-400 hover:text-white cursor-pointer shrink-0 transition-transform active:scale-90"
                >
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                    isSelectedInBatch
                      ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)] font-bold'
                      : 'bg-slate-950/80 border-slate-700/80 hover:border-cyan-400 text-transparent'
                  }`}>
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelectedInBatch ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                </button>

                {/* Left Area: Date Capsule + Title & Meta */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">

                  {/* Compact Date Capsule */}
                  {(() => {
                    const isMulti = Boolean(trn.endDate && trn.endDate > trn.date);
                    const durationDays = isMulti ? calculateDurationDays(trn.date, trn.endDate) : 1;
                    return (
                      <div className={`border py-1 px-2 rounded-lg text-center min-w-[54px] shrink-0 ${
                        isMulti 
                          ? 'bg-amber-950/40 border-amber-500/50 shadow-sm shadow-amber-950/30' 
                          : 'bg-slate-950 border-slate-800/90'
                      }`}>
                        <span className="text-[9px] uppercase font-bold text-cyan-400 block leading-tight">
                          {new Date(trn.date).toLocaleDateString('id-ID', { month: 'short' })}
                        </span>
                        <span className="text-sm sm:text-base font-black text-white tabular-nums block leading-tight">
                          {isMulti ? `${trn.date.split('-')[2]}-${trn.endDate!.split('-')[2]}` : trn.date.split('-')[2]}
                        </span>
                        <span className={`text-[8px] block leading-none font-semibold ${isMulti ? 'text-amber-300' : 'text-slate-500'}`}>
                          {isMulti ? `${durationDays} Hari` : trn.date.split('-')[0]}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Main Details */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {/* Category & Scope & Code & Time Row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border flex items-center gap-1 ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                        <span className={`w-1 h-1 rounded-full ${catStyle.dot}`} />
                        <span>{trn.category}</span>
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        (trn.scope || 'Internal') === 'Internal'
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
                          : 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                      }`}>
                        {trn.scope || 'Internal'}
                      </span>
                      {trn.endDate && trn.endDate > trn.date && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-amber-950/80 text-amber-300 border-amber-800/80 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{calculateDurationDays(trn.date, trn.endDate)} Hari Pelatihan</span>
                        </span>
                      )}
                      {trn.certificateUrl && (
                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded border bg-amber-950/70 text-amber-300 border-amber-800/70 flex items-center gap-1" title="Sertifikat Resmi Terlampir">
                          <FileText className="w-2.5 h-2.5" />
                          <span>Sertifikat</span>
                        </span>
                      )}
                      {trn.posterUrl && (
                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded border bg-cyan-950/70 text-cyan-300 border-cyan-800/70 flex items-center gap-1" title="Poster / Brosur Acara Terlampir">
                          <ImageIcon className="w-2.5 h-2.5" />
                          <span>Poster</span>
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800/80">
                        {trn.code}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 tabular-nums">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{trn.startTime} - {trn.endTime} WIB</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      <ForeignText text={trn.title} />
                    </h3>

                    {/* Instructor & Location */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
                      <span className="flex items-center gap-1 truncate">
                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{trn.instructor.name}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate"><ForeignText text={trn.venue} /></span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Area: Counters & Action Button */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Participants & Unit Kerja Count */}
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
                      <Users className="w-3 h-3 text-cyan-400" />
                      <span className="tabular-nums">{trn.participants.length} Peserta</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                      <Building2 className="w-2.5 h-2.5 text-indigo-400" />
                      <span>{distinctUnits.length} Unit</span>
                    </div>
                  </div>

                  {/* Trigger Action Pill */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                      : 'text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 group-hover:bg-cyan-500 group-hover:text-slate-950'
                  }`}>
                    <span className="hidden xs:inline">{isSelected ? 'Buka (Enter)' : 'Lihat Peserta'}</span>
                    <ArrowRight className={`w-3 h-3 transition-transform ${isSelected ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer: Fully Occupies the Screen and Moves Excess Items to Page 2+ */}
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl px-3 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 aero-border-gradient">
        {/* Left: Summary Info */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            Menampilkan <strong className="text-white tabular-nums">{totalItems === 0 ? 0 : startIndex + 1}</strong> - <strong className="text-white tabular-nums">{Math.min(endIndex, totalItems)}</strong> dari <strong className="text-cyan-400 tabular-nums">{totalItems}</strong> Pelatihan
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-[11px] text-slate-400">
            Halaman {safeCurrentPage} dari {totalPages}
          </span>
        </div>

        {/* Center / Right: Items per Page Selector & Page Switchers */}
        <div className="flex items-center gap-3">
          {/* Items per Page (Default AUTO to fill 100% of the screen) */}
          <div className="hidden xs:flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Tampilan:</span>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setUserSelectedRows('AUTO')}
                title="Otomatis memenuhi 1 lembar kerja penuh"
                className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all cursor-pointer flex items-center gap-1 ${
                  userSelectedRows === 'AUTO'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>Penuh (Auto)</span>
              </button>
              {[6, 8, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setUserSelectedRows(num)}
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition-all cursor-pointer ${
                    userSelectedRows === num
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Page Buttons: First, Prev, Page Numbers, Next, Last (Active when totalPages > 1) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => handlePageChange(1)}
              title="Halaman Pertama"
              className={`p-1.5 rounded-lg border text-xs transition-all ${
                safeCurrentPage === 1
                  ? 'border-slate-800 text-slate-600 cursor-not-allowed bg-slate-950/40'
                  : 'border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer bg-slate-950'
              }`}
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              title="Halaman Sebelumnya"
              className={`p-1.5 rounded-lg border text-xs transition-all ${
                safeCurrentPage === 1
                  ? 'border-slate-800 text-slate-600 cursor-not-allowed bg-slate-950/40'
                  : 'border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer bg-slate-950'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Numeric page pills */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  return Math.abs(p - safeCurrentPage) <= 1 || p === 1 || p === totalPages;
                })
                .map((p, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsisBefore && (
                        <span className="text-[10px] text-slate-600 px-0.5">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePageChange(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          safeCurrentPage === p
                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              title="Halaman Berikutnya"
              className={`p-1.5 rounded-lg border text-xs transition-all ${
                safeCurrentPage === totalPages
                  ? 'border-slate-800 text-slate-600 cursor-not-allowed bg-slate-950/40'
                  : 'border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer bg-slate-950'
              }`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => handlePageChange(totalPages)}
              title="Halaman Terakhir"
              className={`p-1.5 rounded-lg border text-xs transition-all ${
                safeCurrentPage === totalPages
                  ? 'border-slate-800 text-slate-600 cursor-not-allowed bg-slate-950/40'
                  : 'border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer bg-slate-950'
              }`}
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Batch Delete Confirmation Modal */}
      <BatchDeleteModal
        isOpen={showBatchDeleteModal}
        onClose={() => setShowBatchDeleteModal(false)}
        onConfirm={handleConfirmBatchDelete}
        selectedTrainings={trainings.filter((t) => selectedIds.includes(t.id))}
      />
    </div>
  );
};


