import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Award, 
  Building2, 
  Filter, 
  ChevronDown, 
  BarChart3, 
  Percent, 
  Layers, 
  ArrowUpRight, 
  ShieldCheck, 
  Globe, 
  Sparkles,
  CalendarRange,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  ListFilter,
  LayoutGrid,
  Table
} from 'lucide-react';
import { Training, TrainingScope } from '../types/training';
import { INDONESIAN_MONTHS, INDONESIAN_MONTHS_SHORT, formatDateToIndonesian } from '../utils/dateUtils';
import { CATEGORY_COLORS } from '../data/initialData';

interface TrainingTrendAnalyticsProps {
  trainings: Training[];
  onSelectTraining?: (training: Training) => void;
}

export const TrainingTrendAnalytics: React.FC<TrainingTrendAnalyticsProps> = ({
  trainings,
  onSelectTraining
}) => {
  // Mobile and screen dimension detection to guarantee chart visibility on Android & small viewports
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    const handleResize = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
      setIsMobile(w < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Find min & max dates from dataset
  const { minDate, maxDate } = useMemo(() => {
    if (!trainings.length) return { minDate: '2026-01-01', maxDate: '2026-12-31' };
    const dates = trainings.map(t => t.date).filter(Boolean).sort();
    return {
      minDate: dates[0] || '2026-01-01',
      maxDate: dates[dates.length - 1] || '2026-12-31'
    };
  }, [trainings]);

  // Date Range filter state: Dari Tanggal X ke Tanggal Y (Default to full year 2026)
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');

  // Category & Scope filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedScope, setSelectedScope] = useState<'ALL' | 'Internal' | 'Eksternal'>('ALL');
  
  // View mode for chart
  const [viewMode, setViewMode] = useState<'comparison' | 'combined' | 'trainings' | 'attendance'>('comparison');

  // Format tampilan Rincian Interval Rentang: 'grid' (Kartu Penuh Lebar) atau 'table' (Tabel Dinamis Penuh)
  const [intervalViewFormat, setIntervalViewFormat] = useState<'grid' | 'table'>('grid');

  // Granularity / Aggregation: 'auto' | 'monthly' | 'daily'
  const [aggregationType, setAggregationType] = useState<'auto' | 'monthly' | 'daily'>('auto');

  // Calculate day difference between start and end date
  const dateDiffDays = useMemo(() => {
    if (!startDate || !endDate) return 365;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    return diff >= 0 ? diff + 1 : 0;
  }, [startDate, endDate]);

  // Determine active aggregation (if auto: <= 45 days -> daily, > 45 days -> monthly)
  const effectiveAggregation = useMemo(() => {
    if (aggregationType !== 'auto') return aggregationType;
    return dateDiffDays <= 45 ? 'daily' : 'monthly';
  }, [aggregationType, dateDiffDays]);

  // Quick Preset Handlers
  const handlePreset = (type: 'all' | 'october' | 'q4' | 'year2026' | 'last30') => {
    switch (type) {
      case 'all':
        setStartDate(minDate);
        setEndDate(maxDate);
        break;
      case 'october':
        setStartDate('2026-10-01');
        setEndDate('2026-10-31');
        break;
      case 'q4':
        setStartDate('2026-10-01');
        setEndDate('2026-12-31');
        break;
      case 'year2026':
        setStartDate('2026-01-01');
        setEndDate('2026-12-31');
        break;
      case 'last30':
        setStartDate('2026-10-01');
        setEndDate('2026-10-31');
        break;
    }
  };

  const handleResetFilters = () => {
    setStartDate('2026-01-01');
    setEndDate('2026-12-31');
    setSelectedCategory('ALL');
    setSelectedScope('ALL');
    setAggregationType('auto');
  };

  // Filtered trainings based on the selected date range, category, and scope
  const filteredTrainings = useMemo(() => {
    return trainings.filter((t) => {
      const matchDate = (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
      const matchCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
      const currentScope: TrainingScope = t.scope || 'Internal';
      const matchScope = selectedScope === 'ALL' || currentScope === selectedScope;
      return matchDate && matchCategory && matchScope;
    });
  }, [trainings, startDate, endDate, selectedCategory, selectedScope]);

  // Aggregated Chart Data based on effectiveAggregation
  const chartData = useMemo(() => {
    if (effectiveAggregation === 'daily') {
      // Group by distinct dates within the selected range
      // Find all unique dates that either have trainings or span the range
      const dateMap = new Map<string, {
        label: string;
        date: string;
        internalCount: number;
        externalCount: number;
        internalParticipants: number;
        externalParticipants: number;
        totalParticipants: number;
        totalHadir: number;
        totalSksHours: number;
        trainingsCount: number;
        attendanceRate: number;
        trainings: Training[];
      }>();

      // If span is short (<= 35 days), populate every day in the range
      if (dateDiffDays <= 35 && startDate && endDate) {
        const cur = new Date(startDate);
        const end = new Date(endDate);
        while (cur <= end) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const d = String(cur.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;
          const dayName = cur.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

          dateMap.set(dateStr, {
            label: dayName,
            date: dateStr,
            internalCount: 0,
            externalCount: 0,
            internalParticipants: 0,
            externalParticipants: 0,
            totalParticipants: 0,
            totalHadir: 0,
            totalSksHours: 0,
            trainingsCount: 0,
            attendanceRate: 0,
            trainings: []
          });
          cur.setDate(cur.getDate() + 1);
        }
      }

      // Populate with actual trainings in range
      filteredTrainings.forEach((t) => {
        let entry = dateMap.get(t.date);
        if (!entry) {
          const parts = t.date.split('-');
          const label = parts.length === 3 ? `${parseInt(parts[2], 10)} ${INDONESIAN_MONTHS_SHORT[parseInt(parts[1], 10) - 1]}` : t.date;
          entry = {
            label,
            date: t.date,
            internalCount: 0,
            externalCount: 0,
            internalParticipants: 0,
            externalParticipants: 0,
            totalParticipants: 0,
            totalHadir: 0,
            totalSksHours: 0,
            trainingsCount: 0,
            attendanceRate: 0,
            trainings: []
          };
          dateMap.set(t.date, entry);
        }

        const currentScope: TrainingScope = t.scope || 'Internal';
        if (currentScope === 'Eksternal') {
          entry.externalCount++;
          entry.externalParticipants += t.participants.length;
        } else {
          entry.internalCount++;
          entry.internalParticipants += t.participants.length;
        }

        entry.totalParticipants += t.participants.length;
        entry.totalSksHours += t.sksHours || 0;
        entry.trainingsCount++;
        entry.trainings.push(t);

        t.participants.forEach((p) => {
          if (p.statusKehadiran === 'Hadir') {
            entry!.totalHadir++;
          }
        });
      });

      // Calculate attendance rate and sort by date
      const result = Array.from(dateMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => ({
          ...entry,
          attendanceRate: entry.totalParticipants > 0 
            ? Math.round((entry.totalHadir / entry.totalParticipants) * 100) 
            : (entry.trainingsCount > 0 ? 85 : 0)
        }));

      return result;
    } else {
      // Monthly aggregation
      // Determine which months exist in range
      const startYear = parseInt(startDate.split('-')[0] || '2026', 10);
      const endYear = parseInt(endDate.split('-')[0] || '2026', 10);
      const startMonth = parseInt(startDate.split('-')[1] || '1', 10);
      const endMonth = parseInt(endDate.split('-')[1] || '12', 10);

      const monthsList: Array<{
        key: string;
        label: string;
        fullLabel: string;
        year: number;
        monthIndex: number;
      }> = [];

      for (let y = startYear; y <= endYear; y++) {
        const mStart = (y === startYear) ? startMonth : 1;
        const mEnd = (y === endYear) ? endMonth : 12;
        for (let m = mStart; m <= mEnd; m++) {
          const monthIndex = m - 1;
          const monthKey = `${y}-${String(m).padStart(2, '0')}`;
          const isMultiYear = startYear !== endYear;
          const label = isMultiYear 
            ? `${INDONESIAN_MONTHS_SHORT[monthIndex]} '${String(y).slice(-2)}` 
            : INDONESIAN_MONTHS_SHORT[monthIndex];
          const fullLabel = `${INDONESIAN_MONTHS[monthIndex]} ${y}`;

          monthsList.push({
            key: monthKey,
            label,
            fullLabel,
            year: y,
            monthIndex
          });
        }
      }

      return monthsList.map((mObj) => {
        const monthTrainings = filteredTrainings.filter((t) => t.date.startsWith(mObj.key));
        
        let internalCount = 0;
        let externalCount = 0;
        let internalParticipants = 0;
        let externalParticipants = 0;
        let totalParticipants = 0;
        let totalHadir = 0;
        let totalSksHours = 0;

        monthTrainings.forEach((t) => {
          const currentScope: TrainingScope = t.scope || 'Internal';
          if (currentScope === 'Eksternal') {
            externalCount++;
            externalParticipants += t.participants.length;
          } else {
            internalCount++;
            internalParticipants += t.participants.length;
          }

          totalParticipants += t.participants.length;
          totalSksHours += t.sksHours || 0;
          t.participants.forEach((p) => {
            if (p.statusKehadiran === 'Hadir') {
              totalHadir++;
            }
          });
        });

        const attendanceRate = totalParticipants > 0 
          ? Math.round((totalHadir / totalParticipants) * 100) 
          : (monthTrainings.length > 0 ? 85 : 0);

        return {
          label: mObj.label,
          fullLabel: mObj.fullLabel,
          date: mObj.key,
          internalCount,
          externalCount,
          internalParticipants,
          externalParticipants,
          totalParticipants,
          totalHadir,
          attendanceRate,
          totalSksHours,
          trainingsCount: monthTrainings.length,
          trainings: monthTrainings
        };
      });
    }
  }, [filteredTrainings, effectiveAggregation, dateDiffDays, startDate, endDate]);

  // Executive KPI summary calculated specifically from filtered trainings
  const summaryMetrics = useMemo(() => {
    const totalTrainings = filteredTrainings.length;
    let totalInternal = 0;
    let totalExternal = 0;
    let totalParticipants = 0;
    let totalHadir = 0;
    let totalJp = 0;

    filteredTrainings.forEach((t) => {
      const currentScope: TrainingScope = t.scope || 'Internal';
      if (currentScope === 'Eksternal') {
        totalExternal++;
      } else {
        totalInternal++;
      }
      totalParticipants += t.participants.length;
      totalJp += t.sksHours || 0;
      t.participants.forEach((p) => {
        if (p.statusKehadiran === 'Hadir') {
          totalHadir++;
        }
      });
    });

    const overallAttendanceRate = totalParticipants > 0 
      ? Math.round((totalHadir / totalParticipants) * 100) 
      : 0;

    const internalPct = totalTrainings > 0 
      ? Math.round((totalInternal / totalTrainings) * 100) 
      : 0;
    const externalPct = totalTrainings > 0 
      ? Math.round((totalExternal / totalTrainings) * 100) 
      : 0;

    return {
      totalTrainings,
      totalInternal,
      totalExternal,
      internalPct,
      externalPct,
      totalParticipants,
      totalHadir,
      totalJp,
      overallAttendanceRate
    };
  }, [filteredTrainings]);

  // Custom Recharts Tooltip - Optimized for 60fps tracking without GPU thrashing
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/98 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-2 min-w-[230px] pointer-events-none">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-bold text-white text-sm">
              {data.fullLabel || data.label}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              {data.trainingsCount} Sesi
            </span>
          </div>

          <div className="space-y-1.5">
            {/* Internal Breakdown */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
                Pelatihan Internal:
              </span>
              <strong className="text-cyan-300 font-bold tabular-nums">
                {data.internalCount} Sesi
              </strong>
            </div>

            {/* Eksternal Breakdown */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                Pelatihan Eksternal:
              </span>
              <strong className="text-amber-300 font-bold tabular-nums">
                {data.externalCount} Sesi
              </strong>
            </div>

            {/* Total Sesi */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Total Sesi:</span>
              <span className="text-white font-bold tabular-nums">{data.trainingsCount} Sesi</span>
            </div>

            {/* Attendance Rate */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                Tingkat Kehadiran:
              </span>
              <strong className="text-emerald-300 font-bold tabular-nums">
                {data.attendanceRate}%
              </strong>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span>Peserta Hadir:</span>
              <span className="text-white font-semibold">
                {data.totalHadir} / {data.totalParticipants} Pegawai
              </span>
            </div>

            {data.totalSksHours > 0 && (
              <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
                <span>Jam Pelajaran (JP):</span>
                <span className="text-white font-semibold">{data.totalSksHours} JP</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col gap-3 min-h-0 select-none overflow-y-auto pb-10">
      {/* ========================================================
          TOP CONTROL BAR: RENTANG TANGGAL (DARI TGL S/D TGL)
      ======================================================== */}
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-3 sm:p-3.5 space-y-3 aero-border-gradient shrink-0 shadow-lg">
        {/* Row 1: Title and Main Date Range Inputs */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-cyan-500/20 shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  Visualisasi Tren Pelatihan & Kehadiran
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/70">
                  {filteredTrainings.length} Sesi Ditemukan
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Analisis perbandingan pelatihan Internal vs Eksternal dan presensi dalam rentang waktu yang dipilih.
              </p>
            </div>
          </div>

          {/* DATE RANGE CONTROLS: DARI TANGGAL S/D TANGGAL */}
          <div className="flex items-center flex-wrap gap-2 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 shadow-inner">
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 px-2 font-semibold">
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Rentang:</span>
            </div>

            {/* Dari Tanggal */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400 font-medium">Dari</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400 font-mono [color-scheme:dark]"
                title="Pilih tanggal mulai"
              />
            </div>

            {/* Ke Tanggal */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400 font-medium">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (startDate && e.target.value < startDate) {
                    setStartDate(e.target.value);
                  }
                }}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400 font-mono [color-scheme:dark]"
                title="Pilih tanggal akhir"
              />
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
              title="Kembalikan ke rentang waktu awal"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Row 2: Quick Presets & Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Akses Cepat:</span>
            
            <button
              type="button"
              onClick={() => handlePreset('october')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                startDate === '2026-10-01' && endDate === '2026-10-31'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-cyan-500/50'
              }`}
            >
              Bulan Oktober 2026
            </button>

            <button
              type="button"
              onClick={() => handlePreset('q4')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                startDate === '2026-10-01' && endDate === '2026-12-31'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-cyan-500/50'
              }`}
            >
              Kuartal 4 (Okt - Des 2026)
            </button>

            <button
              type="button"
              onClick={() => handlePreset('year2026')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                startDate === '2026-01-01' && endDate === '2026-12-31'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-cyan-500/50'
              }`}
            >
              Tahun 2026 Penuh
            </button>

            <button
              type="button"
              onClick={() => handlePreset('all')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                startDate === minDate && endDate === maxDate && (minDate !== '2026-01-01' || maxDate !== '2026-12-31')
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-cyan-500/50'
              }`}
            >
              Semua Periode Data
            </button>
          </div>

          {/* Right Toolbar: ViewMode & Granularity */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Granularity switch (Bulanan vs Harian) */}
            <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setAggregationType('auto')}
                className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-all ${
                  aggregationType === 'auto'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Otomatis tentukan berdasarkan rentang tanggal"
              >
                Auto ({effectiveAggregation === 'daily' ? 'Harian' : 'Bulanan'})
              </button>
              <button
                type="button"
                onClick={() => setAggregationType('monthly')}
                className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-all ${
                  aggregationType === 'monthly'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setAggregationType('daily')}
                className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-all ${
                  aggregationType === 'daily'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Harian
              </button>
            </div>

            {/* Scope Filter */}
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="ALL">Semua Jenis (Internal & Eksternal)</option>
              <option value="Internal">🏢 Hanya Internal</option>
              <option value="Eksternal">🌐 Hanya Eksternal</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer max-w-[130px] truncate"
            >
              <option value="ALL">Semua Kategori</option>
              {Object.keys(CATEGORY_COLORS).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip for Selected Date Range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Sesi Pelatihan dalam Rentang */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 aero-border-gradient flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Total Sesi Terpilih
            </p>
            <h3 className="text-lg sm:text-xl font-black text-white tabular-nums my-0.5">
              {summaryMetrics.totalTrainings} <span className="text-xs font-semibold text-slate-400">Sesi</span>
            </h3>
            <p className="text-xs text-cyan-300 font-medium truncate">
              {startDate && endDate ? `${startDate} s/d ${endDate}` : 'Semua Periode'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: PERBANDINGAN INTERNAL vs EKSTERNAL */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 aero-border-gradient flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Internal vs Eksternal
            </p>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
              <span className="text-cyan-300">{summaryMetrics.totalInternal} Int</span>
              <span className="text-slate-500">:</span>
              <span className="text-amber-300">{summaryMetrics.totalExternal} Eks</span>
            </div>
          </div>

          {/* Visual split progress bar */}
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex my-1 border border-slate-800">
            <div 
              style={{ width: `${summaryMetrics.internalPct}%` }}
              className="bg-cyan-400 transition-all duration-500" 
              title={`Internal: ${summaryMetrics.totalInternal} Sesi (${summaryMetrics.internalPct}%)`}
            />
            <div 
              style={{ width: `${summaryMetrics.externalPct}%` }}
              className="bg-amber-400 transition-all duration-500" 
              title={`Eksternal: ${summaryMetrics.totalExternal} Sesi (${summaryMetrics.externalPct}%)`}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              {summaryMetrics.internalPct}% Internal
            </span>
            <span className="text-amber-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              {summaryMetrics.externalPct}% Eksternal
            </span>
          </div>
        </div>

        {/* Card 3: Tingkat Kehadiran Pegawai */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 aero-border-gradient flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Tingkat Kehadiran
            </p>
            <h3 className="text-lg sm:text-xl font-black text-emerald-300 tabular-nums my-0.5">
              {summaryMetrics.overallAttendanceRate}%
            </h3>
            <p className="text-xs text-emerald-400 font-medium">Rata-rata Presensi</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
            <Award className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Total Jam Pelajaran & Peserta */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 aero-border-gradient flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Beban Diklat & Peserta
            </p>
            <h3 className="text-lg sm:text-xl font-black text-indigo-300 tabular-nums my-0.5">
              {summaryMetrics.totalJp} <span className="text-xs font-semibold text-indigo-400">JP</span>
            </h3>
            <p className="text-xs text-sky-300 font-medium truncate">{summaryMetrics.totalHadir} / {summaryMetrics.totalParticipants} Personil Hadir</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Recharts Visual: Dual-Axis Bar Chart Container */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col gap-3 aero-border-gradient shrink-0 overflow-hidden">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          {/* Chart Legends & Mode Indicator */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Pelatihan Internal Legend */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <span className="w-3 h-3 rounded bg-cyan-400 inline-block shadow-sm shadow-cyan-400/40" />
              <span>Pelatihan Internal</span>
            </div>

            {/* Pelatihan Eksternal Legend */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block shadow-sm shadow-amber-400/40" />
              <span>Pelatihan Eksternal</span>
            </div>

            {/* Attendance Legend (when applicable) */}
            {(viewMode === 'combined' || viewMode === 'attendance') && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <span className="w-3 h-3 rounded bg-emerald-400 inline-block shadow-sm shadow-emerald-400/40" />
                <span>Tingkat Kehadiran (%)</span>
              </div>
            )}
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-[11px] overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setViewMode('comparison')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'comparison'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Perbandingan
            </button>
            <button
              type="button"
              onClick={() => setViewMode('combined')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'combined'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Gabungan Sesi & %
            </button>
            <button
              type="button"
              onClick={() => setViewMode('trainings')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'trainings'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Total Sesi
            </button>
            <button
              type="button"
              onClick={() => setViewMode('attendance')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'attendance'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kehadiran %
            </button>
          </div>
        </div>

        {/* Recharts Responsive Container cleanly enclosed inside fixed height container */}
        <div className="w-full h-[260px] sm:h-[280px] md:h-[300px] relative flex items-center justify-center">
          {chartData.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-500 py-6">
              <CalendarRange className="w-8 h-8 text-slate-600" />
              <p className="text-sm font-bold text-slate-300">Tidak ada data pelatihan dalam rentang tanggal ini</p>
              <p className="text-xs text-slate-500 text-center max-w-sm">
                Silakan pilih rentang tanggal lain atau klik tombol reset untuk menampilkan seluruh periode.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Reset ke Semua Tanggal
              </button>
            </div>
          ) : isMounted ? (
            <ResponsiveContainer 
              width="100%" 
              height="100%" 
              minWidth={0} 
              debounce={50}
            >
              <BarChart
                data={chartData}
                margin={{ 
                  top: 10, 
                  right: isMobile ? 8 : 16, 
                  left: isMobile ? -14 : 0, 
                  bottom: 8 
                }}
                barGap={isMobile ? 2 : 4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: '#e2e8f0', fontSize: isMobile ? 10 : 11, fontWeight: 700 }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={{ stroke: '#475569' }}
                  dy={4}
                  interval={isMobile && chartData.length > 8 ? (chartData.length > 18 ? 3 : 1) : 0}
                />

                {/* Left Y-Axis for Jumlah Sesi */}
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#06b6d4"
                  width={isMobile ? 32 : 46}
                  tick={{ fill: '#38bdf8', fontSize: isMobile ? 10 : 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#0891b2' }}
                  tickLine={{ stroke: '#0891b2' }}
                  allowDecimals={false}
                  label={isMobile ? undefined : { 
                    value: 'Sesi', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: '#38bdf8', 
                    fontSize: 11,
                    fontWeight: 700,
                    offset: 12
                  }}
                />

                {/* Right Y-Axis for Tingkat Kehadiran (%) */}
                {(viewMode === 'combined' || viewMode === 'attendance') && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    stroke="#10b981"
                    width={isMobile ? 34 : 46}
                    tick={{ fill: '#34d399', fontSize: isMobile ? 10 : 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#059669' }}
                    tickLine={{ stroke: '#059669' }}
                    unit="%"
                    label={isMobile ? undefined : { 
                      value: 'Kehadiran (%)', 
                      angle: 90, 
                      position: 'insideRight', 
                      fill: '#34d399', 
                      fontSize: 11,
                      fontWeight: 700,
                      offset: 12
                    }}
                  />
                )}

                <Tooltip 
                  content={<CustomTooltip />} 
                  isAnimationActive={false}
                  cursor={{ fill: 'rgba(56, 189, 248, 0.06)' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 8, fontSize: isMobile ? 11 : 12, fontWeight: 600 }} 
                  iconType="circle"
                />

                {/* MODE 1: PERBANDINGAN INTERNAL VS EKSTERNAL */}
                {viewMode === 'comparison' && (
                  <>
                    <Bar
                      yAxisId="left"
                      dataKey="internalCount"
                      name="Pelatihan Internal"
                      fill="#06b6d4"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={isMobile ? 22 : 28}
                      isAnimationActive={true}
                      animationDuration={250}
                      animationEasing="ease-out"
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="externalCount"
                      name="Pelatihan Eksternal"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={isMobile ? 22 : 28}
                      isAnimationActive={true}
                      animationDuration={250}
                      animationEasing="ease-out"
                    />
                  </>
                )}

                {/* MODE 2: GABUNGAN */}
                {viewMode === 'combined' && (
                  <>
                    <Bar
                      yAxisId="left"
                      dataKey="internalCount"
                      name="Pelatihan Internal"
                      fill="#06b6d4"
                      stackId="sesi"
                      radius={[0, 0, 0, 0]}
                      maxBarSize={isMobile ? 22 : 28}
                      isAnimationActive={true}
                      animationDuration={250}
                      animationEasing="ease-out"
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="externalCount"
                      name="Pelatihan Eksternal"
                      fill="#f59e0b"
                      stackId="sesi"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={isMobile ? 22 : 28}
                      isAnimationActive={true}
                      animationDuration={250}
                      animationEasing="ease-out"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="attendanceRate"
                      name="Kehadiran (%)"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={isMobile ? 18 : 24}
                      isAnimationActive={true}
                      animationDuration={250}
                      animationEasing="ease-out"
                    />
                  </>
                )}

                {/* MODE 3: TOTAL SESI */}
                {viewMode === 'trainings' && (
                  <Bar
                    yAxisId="left"
                    dataKey="trainingsCount"
                    name="Total Sesi Pelatihan"
                    fill="#06b6d4"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={isMobile ? 26 : 32}
                    isAnimationActive={true}
                    animationDuration={250}
                    animationEasing="ease-out"
                  />
                )}

                {/* MODE 4: KEHADIRAN SAJA */}
                {viewMode === 'attendance' && (
                  <Bar
                    yAxisId="right"
                    dataKey="attendanceRate"
                    name="Tingkat Kehadiran (%)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={isMobile ? 26 : 32}
                    isAnimationActive={true}
                    animationDuration={250}
                    animationEasing="ease-out"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                Memuat grafik pelatihan...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          RINCIAN INTERVAL RENTANG (Dinamis Menyesuaikan Lembar Kerja Sampai Sebelah Kiri Penuh)
      ======================================================== */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shrink-0 shadow-lg aero-border-gradient">
        {/* Header Bar: Judul, Indikator Warna, dan Tombol Switch Tampilan Grid / Tabel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Rincian Interval Rentang</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-bold">
              {startDate} s/d {endDate} · {chartData.length} Titik Data
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
            {/* Color Legend Tags */}
            <div className="flex items-center gap-2.5 text-[11px] text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
                <span className="text-cyan-200">Internal</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400/50" />
                <span className="text-amber-200">Eksternal</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50" />
                <span className="text-emerald-200">Kehadiran</span>
              </span>
            </div>

            {/* Toggle Mode: Grid Kartu Dinamis vs Tabel Data Dinamis */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setIntervalViewFormat('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  intervalViewFormat === 'grid'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilkan format kartu yang meregang penuh ke seluruh lembar kerja"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid Penuh</span>
              </button>
              <button
                type="button"
                onClick={() => setIntervalViewFormat('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  intervalViewFormat === 'table'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilkan format tabel data formal yang membentang penuh dari kiri ke kanan"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabel Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. TAMPILAN FORMAT GRID: DINAMIS MELEBAR PENUH DARI KIRI KE KANAN */}
        {intervalViewFormat === 'grid' && (
          <div 
            className="w-full grid gap-1.5 sm:gap-2 select-none"
            style={{
              gridTemplateColumns: chartData.length <= 12
                ? (isMobile ? 'repeat(auto-fit, minmax(min(100%, 92px), 1fr))' : `repeat(${chartData.length}, minmax(0, 1fr))`)
                : 'repeat(auto-fit, minmax(min(100%, 95px), 1fr))'
            }}
          >
            {chartData.map((m, idx) => {
              const hasData = m.trainingsCount > 0;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (hasData && onSelectTraining && m.trainings && m.trainings.length > 0) {
                      onSelectTraining(m.trainings[0]);
                    }
                  }}
                  className={`w-full min-w-0 p-2 sm:p-2.5 rounded-xl border text-center transition-all flex flex-col justify-between ${
                    hasData
                      ? 'bg-slate-950 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30 hover:border-cyan-400 hover:scale-[1.01] cursor-pointer'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                  }`}
                  title={hasData ? `${m.label}: ${m.trainingsCount} Sesi (${m.internalCount} Internal, ${m.externalCount} Eksternal). Klik untuk buka jadwal pertama.` : `${m.label}: Tidak ada agenda pelatihan`}
                >
                  {/* Label / Nama Interval Bulan atau Tanggal */}
                  <div className="text-[11px] sm:text-xs font-black text-slate-200 uppercase tracking-wider truncate pb-1 border-b border-slate-800/80">
                    {m.label}
                  </div>

                  {/* Jumlah Sesi */}
                  <div className="text-sm sm:text-base font-black text-white tabular-nums my-1 flex items-baseline justify-center gap-1">
                    <span>{m.trainingsCount}</span>
                    <span className="text-[10px] font-medium text-slate-400">sesi</span>
                  </div>

                  {/* Rincian Komposisi Internal vs Eksternal */}
                  <div className="text-[10px] sm:text-[11px] font-bold font-mono flex items-center justify-center gap-1.5 py-0.5 px-1 rounded-lg bg-slate-900 border border-slate-800 my-0.5">
                    <span className="text-cyan-300 font-bold" title={`${m.internalCount} Pelatihan Internal`}>{m.internalCount}I</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-amber-300 font-bold" title={`${m.externalCount} Pelatihan Eksternal`}>{m.externalCount}E</span>
                  </div>

                  {/* Persentase Rata-Rata Kehadiran */}
                  <div className={`text-[10px] sm:text-[11px] font-bold tabular-nums py-0.5 px-1 rounded-md text-center mt-1 border truncate ${
                    m.attendanceRate >= 80
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/70'
                      : m.attendanceRate > 0
                      ? 'bg-amber-950/80 text-amber-300 border-amber-800/70'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800/70'
                  }`}>
                    {m.attendanceRate}% Hadir
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. TAMPILAN FORMAT TABEL LENGKAP: MEMBENTANG PENUH 100% DARI SISI KIRI KE KANAN */}
        {intervalViewFormat === 'table' && (
          <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
            <table className="w-full min-w-full border-collapse text-xs table-auto text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-300 uppercase tracking-wider text-[10.5px] font-bold border-b border-slate-800">
                  <th className="py-2.5 px-3 text-center border-r border-slate-800 w-12 font-mono">No</th>
                  <th className="py-2.5 px-4 text-left border-r border-slate-800">Interval / Periode</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-800">Total Sesi</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-800 text-cyan-400">Internal</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-800 text-amber-400">Eksternal</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-800">Total Peserta</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-800">Rata-Rata Presensi</th>
                  <th className="py-2.5 px-4 text-center">Status Kelayakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                {chartData.map((m, idx) => {
                  const hasData = m.trainingsCount > 0;
                  return (
                    <tr
                      key={idx}
                      onClick={() => {
                        if (hasData && onSelectTraining && m.trainings && m.trainings.length > 0) {
                          onSelectTraining(m.trainings[0]);
                        }
                      }}
                      className={`transition-colors ${
                        hasData 
                          ? 'hover:bg-slate-800/70 cursor-pointer' 
                          : 'hover:bg-slate-900/40 text-slate-400'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center border-r border-slate-800/80 font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 text-left border-r border-slate-800/80 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${hasData ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                          <span>{m.label}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-800/80 font-bold text-white tabular-nums">
                        {m.trainingsCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/70">
                            {m.trainingsCount} Sesi
                          </span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-800/80 font-mono font-semibold text-cyan-300 tabular-nums">
                        {m.internalCount}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-800/80 font-mono font-semibold text-amber-300 tabular-nums">
                        {m.externalCount}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-800/80 tabular-nums font-medium text-slate-300">
                        {m.totalParticipants > 0 ? `${m.totalParticipants} Orang` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-800/80 tabular-nums">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          m.attendanceRate >= 80 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/70' 
                            : m.attendanceRate > 0 
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/70' 
                            : 'text-slate-500'
                        }`}>
                          {m.attendanceRate > 0 ? `${m.attendanceRate}%` : '0%'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {m.attendanceRate >= 85 ? (
                          <span className="text-emerald-400 font-semibold text-[11px] flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Optimal</span>
                          </span>
                        ) : m.attendanceRate >= 60 ? (
                          <span className="text-amber-400 font-semibold text-[11px]">
                            Standar
                          </span>
                        ) : m.trainingsCount > 0 ? (
                          <span className="text-rose-400 font-semibold text-[11px]">
                            Perlu Evaluasi
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            Nir-Aktivitas
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
