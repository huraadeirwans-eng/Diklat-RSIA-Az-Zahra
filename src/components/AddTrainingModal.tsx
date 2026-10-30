import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User,
  Sparkles,
  Building2,
  Users,
  CheckCircle2,
  Check,
  Search,
  BookOpen,
  Laptop,
  Video,
  MonitorCheck,
  RefreshCw,
  HelpCircle,
  Globe,
  Award,
  Upload,
  FileText,
  Image,
  Trash2,
  Eye,
  FileCheck,
  Link as LinkIcon
} from 'lucide-react';
import { Training, TrainingCategory, TrainingStatus, TrainingScope, DailyScheduleItem } from '../types/training';
import { ALL_UNIT_KERJA } from '../data/initialData';
import { ForeignText } from '../utils/textFormatter';
import { formatDateToIndonesian, formatDateWithDay, calculateDurationDays, generateDateList } from '../utils/dateUtils';
import { compressImageFile, formatBytes } from '../utils/imageCompressor';
import { getAllKnownUnits, saveCustomUnit, saveBulkCustomUnits, getStoredCustomUnits } from '../utils/unitManager';


interface AddTrainingModalProps {
  initialDate?: string;
  onClose: () => void;
  onAddTraining: (training: Training) => void;
}

// 6 Kategori Kompetensi (Tetap yang ada)
const CATEGORIES: TrainingCategory[] = [
  'Teknologi & Digital',
  'Kepemimpinan & Manajerial',
  'K3 & Lingkungan',
  'Keuangan & Audit',
  'Operasional & Layanan',
  'Tata Kelola & Kepatuhan'
];

/**
 * Otomatis mendeteksi Kategori Kompetensi berdasarkan kata kunci dalam Nama / Judul Pelatihan
 */
function inferCategoryFromTitle(titleText: string): TrainingCategory | null {
  const t = titleText.toLowerCase().trim();
  if (!t) return null;

  // 1. K3 & Lingkungan
  if (
    t.includes('k3') ||
    t.includes('keselamatan') ||
    t.includes('kebakaran') ||
    t.includes('apar') ||
    t.includes('evakuasi') ||
    t.includes('bantuan hidup') ||
    t.includes('bhd') ||
    t.includes('btcls') ||
    t.includes('bcls') ||
    t.includes('ppi') ||
    t.includes('infeksi') ||
    t.includes('limbah') ||
    t.includes('b3') ||
    t.includes('ergonomi') ||
    t.includes('hazards') ||
    t.includes('safety') ||
    t.includes('first aid') ||
    t.includes('tanggap darurat') ||
    t.includes('disaster') ||
    t.includes('lingkungan') ||
    t.includes('patient safety')
  ) {
    return 'K3 & Lingkungan';
  }

  // 2. Keuangan & Audit
  if (
    t.includes('keuangan') ||
    t.includes('finance') ||
    t.includes('finansial') ||
    t.includes('akuntansi') ||
    t.includes('accounting') ||
    t.includes('kasir') ||
    t.includes('cashier') ||
    t.includes('pajak') ||
    t.includes('tax') ||
    t.includes('audit') ||
    t.includes('anggaran') ||
    t.includes('budget') ||
    t.includes('invoice') ||
    t.includes('billing') ||
    t.includes('treasury') ||
    t.includes('investasi') ||
    t.includes('pembukuan') ||
    t.includes('rekonsiliasi') ||
    t.includes('wacc') ||
    t.includes('valuation')
  ) {
    return 'Keuangan & Audit';
  }

  // 3. Teknologi & Digital
  if (
    t.includes('it') ||
    t.includes('cyber') ||
    t.includes('siber') ||
    t.includes('digital') ||
    t.includes('software') ||
    t.includes('hardware') ||
    t.includes('ai') ||
    t.includes('generative ai') ||
    t.includes('data') ||
    t.includes('analyst') ||
    t.includes('analisis data') ||
    t.includes('sistem') ||
    t.includes('jaringan') ||
    t.includes('network') ||
    t.includes('aplikasi') ||
    t.includes('database') ||
    t.includes('cloud') ||
    t.includes('iso 27001') ||
    t.includes('komputer') ||
    t.includes('otomasi') ||
    t.includes('automation') ||
    t.includes('coding') ||
    t.includes('programming') ||
    t.includes('developer') ||
    t.includes('security')
  ) {
    return 'Teknologi & Digital';
  }

  // 4. Kepemimpinan & Manajerial
  if (
    t.includes('leadership') ||
    t.includes('pemimpin') ||
    t.includes('kepemimpinan') ||
    t.includes('manajerial') ||
    t.includes('manajemen') ||
    t.includes('manajer') ||
    t.includes('manager') ||
    t.includes('supervisor') ||
    t.includes('coaching') ||
    t.includes('mentoring') ||
    t.includes('strategic') ||
    t.includes('kepala') ||
    t.includes('head') ||
    t.includes('units head') ||
    t.includes('eksekutif') ||
    t.includes('executive') ||
    t.includes('talent') ||
    t.includes('change management') ||
    t.includes('agile') ||
    t.includes('negosiasi')
  ) {
    return 'Kepemimpinan & Manajerial';
  }

  // 5. Tata Kelola & Kepatuhan
  if (
    t.includes('tata kelola') ||
    t.includes('kepatuhan') ||
    t.includes('compliance') ||
    t.includes('hukum') ||
    t.includes('legal') ||
    t.includes('regulasi') ||
    t.includes('akreditasi') ||
    t.includes('uu') ||
    t.includes('etika') ||
    t.includes('sop') ||
    t.includes('kebijakan') ||
    t.includes('gcg') ||
    t.includes('perizinan')
  ) {
    return 'Tata Kelola & Kepatuhan';
  }

  // 6. Operasional & Layanan
  if (
    t.includes('preceptor') ||
    t.includes('preseptor') ||
    t.includes('nursing') ||
    t.includes('keperawatan') ||
    t.includes('perawat') ||
    t.includes('klinis') ||
    t.includes('clinical') ||
    t.includes('pelayanan') ||
    t.includes('layanan') ||
    t.includes('service') ||
    t.includes('customer') ||
    t.includes('pasien') ||
    t.includes('bedside') ||
    t.includes('rawat') ||
    t.includes('inpatient') ||
    t.includes('outpatient') ||
    t.includes('icu') ||
    t.includes('igd') ||
    t.includes('gawat darurat') ||
    t.includes('kamar bedah') ||
    t.includes('operating theater') ||
    t.includes('farmasi') ||
    t.includes('pharmacy') ||
    t.includes('laboratorium') ||
    t.includes('laboratory') ||
    t.includes('radiologi') ||
    t.includes('radiology') ||
    t.includes('rekam medis') ||
    t.includes('medical record') ||
    t.includes('medical rehab') ||
    t.includes('logistik') ||
    t.includes('cssd') ||
    t.includes('gizi') ||
    t.includes('nutrition') ||
    t.includes('operasional') ||
    t.includes('tindakan') ||
    t.includes('triase') ||
    t.includes('triage') ||
    t.includes('delivery room') ||
    t.includes('fmga') ||
    t.includes('driver') ||
    t.includes('outsourcing')
  ) {
    return 'Operasional & Layanan';
  }

  return 'Operasional & Layanan';
}

export const AddTrainingModal: React.FC<AddTrainingModalProps> = ({
  initialDate,
  onClose,
  onAddTraining
}) => {
  // 1. Nama / Judul Pelatihan
  const [title, setTitle] = useState('');
  // Kode Pelatihan (Opsional / Otomatis RSIAPLG-XXXX-2026)
  const [code, setCode] = useState('');

  // 2. Kategori Kompetensi (Tetap yang ada) - Auto inferred when typing title
  const [category, setCategory] = useState<TrainingCategory>('Operasional & Layanan');
  const [isCategoryAutoSelected, setIsCategoryAutoSelected] = useState<boolean>(true);
  const [hasUserManuallyChangedCategory, setHasUserManuallyChangedCategory] = useState<boolean>(false);

  // Jenis Penyelenggaraan Pelatihan: Internal atau Eksternal
  const [scope, setScope] = useState<TrainingScope>('Internal');

  // Dokumen & Media Khusus Pelatihan Eksternal (Upload Sertifikat & Poster)
  const [certificateUrl, setCertificateUrl] = useState<string>('');
  const [certificateFileName, setCertificateFileName] = useState<string>('');
  const [certificateCompressInfo, setCertificateCompressInfo] = useState<string>('');
  const [certificateMode, setCertificateMode] = useState<'upload' | 'link'>('upload');
  const [certificateLinkInput, setCertificateLinkInput] = useState<string>('');

  const [posterUrl, setPosterUrl] = useState<string>('');
  const [posterFileName, setPosterFileName] = useState<string>('');
  const [posterCompressInfo, setPosterCompressInfo] = useState<string>('');
  const [posterMode, setPosterMode] = useState<'upload' | 'link'>('upload');
  const [posterLinkInput, setPosterLinkInput] = useState<string>('');

  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string } | null>(null);

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCertificateFileName(file.name);
    try {
      const res = await compressImageFile(file, 1280, 1280, 0.78);
      setCertificateUrl(res.dataUrl);
      const savedPercent = res.originalSize > 0 
        ? Math.round(((res.originalSize - res.compressedSize) / res.originalSize) * 100) 
        : 0;
      if (savedPercent > 0) {
        setCertificateCompressInfo(`${formatBytes(res.originalSize)} → ${formatBytes(res.compressedSize)} (Hemat ${savedPercent}%)`);
      } else {
        setCertificateCompressInfo(formatBytes(res.compressedSize));
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setCertificateUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFileName(file.name);
    try {
      const res = await compressImageFile(file, 1280, 1280, 0.78);
      setPosterUrl(res.dataUrl);
      const savedPercent = res.originalSize > 0 
        ? Math.round(((res.originalSize - res.compressedSize) / res.originalSize) * 100) 
        : 0;
      if (savedPercent > 0) {
        setPosterCompressInfo(`${formatBytes(res.originalSize)} → ${formatBytes(res.compressedSize)} (Hemat ${savedPercent}%)`);
      } else {
        setPosterCompressInfo(formatBytes(res.compressedSize));
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setPosterUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


function addDaysToISODate(isoDate: string, days: number): string {
  try {
    const d = new Date(isoDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return isoDate;
  }
}

  // 3. Tanggal Pelaksanaan (Mendukung Pelatihan Lebih dari 1 Hari / Multi-Hari)
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [durationPreset, setDurationPreset] = useState<'1' | '2' | '3' | '4' | '5' | 'custom'>('1');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [endDate, setEndDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [dailyTopics, setDailyTopics] = useState<Record<number, string>>({});
  const [showRundownEditor, setShowRundownEditor] = useState<boolean>(false);

  const handleSelectPreset = (preset: '1' | '2' | '3' | '4' | '5' | 'custom') => {
    setDurationPreset(preset);
    if (preset === '1') {
      setIsMultiDay(false);
      setEndDate(date);
    } else if (preset === 'custom') {
      setIsMultiDay(true);
      if (!endDate || endDate <= date) {
        setEndDate(addDaysToISODate(date, 1));
      }
    } else {
      setIsMultiDay(true);
      const daysToAdd = parseInt(preset, 10) - 1;
      setEndDate(addDaysToISODate(date, daysToAdd));
    }
  };

  const handleStartDateChange = (newStart: string) => {
    setDate(newStart);
    if (durationPreset === '1') {
      setEndDate(newStart);
    } else if (durationPreset !== 'custom') {
      const daysToAdd = parseInt(durationPreset, 10) - 1;
      setEndDate(addDaysToISODate(newStart, daysToAdd));
    } else if (endDate && endDate < newStart) {
      setEndDate(newStart);
    }
  };

  // Hitung jumlah hari durasi pelatihan
  const trainingDurationDays = useMemo(() => {
    if (!isMultiDay || !endDate || endDate <= date) return 1;
    return calculateDurationDays(date, endDate);
  }, [date, endDate, isMultiDay]);

  // Daftar seluruh tanggal pelaksanaan pelatihan
  const trainingDayList = useMemo(() => {
    if (!isMultiDay || !endDate || endDate <= date) return [date];
    return generateDateList(date, endDate);
  }, [date, endDate, isMultiDay]);

  // 4. Jam Mulai
  const [startTime, setStartTime] = useState('08:00');

  // 5. Jam Selesai
  const [endTime, setEndTime] = useState('16:00');

  // 6. Format Pelaksanaan (Offline, Online, Hybrid)
  const [locationType, setLocationType] = useState<'Offline' | 'Online' | 'Hybrid'>('Offline');

  // 7. Lokasi / Ruangan Pelatihan
  const [venue, setVenue] = useState('Auditorium Ruang Diklat Lt. 3');

  // 8. Kapasitas Kuota Peserta
  const [capacity, setCapacity] = useState(30);

  // 9. Jam Pelajaran (JP)
  const [sksHours, setSksHours] = useState(6);

  // 10. Unit Kerja (26 Unit Kerjasama) & Free Text Custom Units
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [participantName, setParticipantName] = useState<string>('');
  const [unitSearch, setUnitSearch] = useState('');
  const [customUnitInput, setCustomUnitInput] = useState('');
  const [customUnitsList, setCustomUnitsList] = useState<string[]>(() => {
    return getStoredCustomUnits();
  });

  // Seluruh daftar unit yang tersedia (26 default + kustom tersimpan)
  const allAvailableUnits = useMemo(() => {
    return getAllKnownUnits(undefined, customUnitsList);
  }, [customUnitsList]);

  const handleAddCustomUnit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customUnitInput.trim()) return;

    // Support comma-separated inputs (e.g. "Poli Eksekutif, Kamar Operasi 2")
    const newUnits = customUnitInput
      .split(',')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    // Save to permanent storage so it appears across all components (Distribusi Unit Kerja, etc.)
    saveBulkCustomUnits(newUnits);

    setSelectedUnits(prev => {
      const updated = [...prev];
      newUnits.forEach(nu => {
        if (!updated.includes(nu)) {
          updated.push(nu);
        }
      });
      return updated;
    });

    setCustomUnitsList(prev => {
      const updated = [...prev];
      newUnits.forEach(nu => {
        if (!updated.includes(nu)) {
          updated.push(nu);
        }
      });
      return updated;
    });

    setCustomUnitInput('');
  };

  const handleRemoveUnit = (unitToRemove: string) => {
    setSelectedUnits(prev => prev.filter(u => u !== unitToRemove));
    setCustomUnitsList(prev => prev.filter(u => u !== unitToRemove));
  };

  const [description, setDescription] = useState('');

  // Effect: Saat memasukkan judul maka otomatis kategori kompetensi akan terpilih menyesuaikan dengan judul pelatihan
  useEffect(() => {
    if (!title.trim()) return;

    if (!hasUserManuallyChangedCategory) {
      const detected = inferCategoryFromTitle(title);
      if (detected) {
        setCategory(detected);
        setIsCategoryAutoSelected(true);
      }
    }
  }, [title, hasUserManuallyChangedCategory]);

  // Handle Title Change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);

    // If user deleted title or wants auto adaptation, automatically infer
    const detected = inferCategoryFromTitle(val);
    if (detected) {
      setCategory(detected);
      setIsCategoryAutoSelected(true);
      setHasUserManuallyChangedCategory(false);
    }
  };

  // Handle Manual Category Selection
  const handleCategorySelect = (newCat: TrainingCategory) => {
    setCategory(newCat);
    setIsCategoryAutoSelected(false);
    setHasUserManuallyChangedCategory(true);
  };

  // Re-run auto detection manually if user wants
  const handleReDetect = () => {
    const detected = inferCategoryFromTitle(title);
    if (detected) {
      setCategory(detected);
      setIsCategoryAutoSelected(true);
      setHasUserManuallyChangedCategory(false);
    }
  };

  // Toggle single unit selection
  const handleToggleUnit = (unit: string) => {
    setSelectedUnits(prev => 
      prev.includes(unit) 
        ? prev.filter(u => u !== unit) 
        : [...prev, unit]
    );
  };

  // Select all units
  const handleSelectAllUnits = () => {
    setSelectedUnits([...allAvailableUnits]);
  };

  // Clear units
  const handleClearUnits = () => {
    setSelectedUnits([]);
  };

  // Filtered unit kerja based on search
  const filteredUnits = useMemo(() => {
    if (!unitSearch.trim()) return allAvailableUnits;
    const q = unitSearch.toLowerCase();
    return allAvailableUnits.filter(u => u.toLowerCase().includes(q));
  }, [unitSearch, allAvailableUnits]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const unitsForTraining = selectedUnits.length > 0 ? selectedUnits : [ALL_UNIT_KERJA[0]];

    // Ensure any custom units in selectedUnits are permanently saved
    saveBulkCustomUnits(unitsForTraining);

    // Peserta baru akan ditambahkan melalui Kotak Dialog Tambah Peserta yang muncul otomatis setelah simpan
    const initialParticipants: Training['participants'] = participantName.trim()
      ? [
          {
            id: `p-${Date.now()}-1`,
            name: participantName.trim(),
            nip: `199${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            unitKerja: unitsForTraining[0],
            jabatan: 'Staff Pelaksana / Delegasi Unit',
            email: `${participantName.trim().toLowerCase().replace(/[^a-z0-9]/g, '.')}@rsia-az.co.id`,
            phone: '+62 812-7788-9901',
            statusKehadiran: 'Hadir' as const,
            registeredAt: date
          }
        ]
      : [];

    const dailySchedules: DailyScheduleItem[] = [];
    if (isMultiDay && endDate && endDate > date) {
      trainingDayList.forEach((dStr, idx) => {
        dailySchedules.push({
          dayNumber: idx + 1,
          date: dStr,
          topic: dailyTopics[idx + 1]?.trim() || undefined,
          startTime,
          endTime
        });
      });
    }

    const newTraining: Training = {
      id: `trn-${Date.now()}`,
      code: code.trim() || `RSIAPLG-${Math.floor(1000 + Math.random() * 9000)}-${date.split('-')[0] || '2026'}`,
      title: title.trim(),
      category,
      scope,
      date,
      endDate: isMultiDay && endDate && endDate > date ? endDate : undefined,
      dailySchedules: dailySchedules.length > 0 ? dailySchedules : undefined,
      startTime,
      endTime,
      locationType,
      venue: venue.trim() || 'Ruang Diklat Lantai 3',
      instructor: {
        name: 'Tim Fasilitator Diklat RSIA AZ',
        title: 'Clinical Preceptor & Fasilitator',
        organization: 'RSIA AZ Preceptor Academy'
      },
      capacity: Number(capacity) || 30,
      status: 'Terjadwal' as TrainingStatus,
      description: description.trim() || `Pelatihan peningkatan kompetensi ${category} bagi jajaran unit kerja terpilih di lingkungan rumah sakit.`,
      learningObjectives: [
        'Penguasaan materi inti dan standar operasional prosedur klinis terkini',
        'Penerapan praktikum bimbingan klinis dan pemecahan kasus nyata',
        'Evaluasi hasil pelatihan melalui pengukuran kompetensi pre-test dan post-test'
      ],
      sksHours: Number(sksHours) || 6,
      colorTheme: category === 'Teknologi & Digital' ? 'cyan' 
        : category === 'Kepemimpinan & Manajerial' ? 'purple'
        : category === 'K3 & Lingkungan' ? 'emerald'
        : category === 'Keuangan & Audit' ? 'blue'
        : category === 'Tata Kelola & Kepatuhan' ? 'rose'
        : 'sky',
      participants: initialParticipants,
      targetUnits: unitsForTraining,
      certificateUrl: scope === 'Eksternal' ? (certificateUrl || undefined) : undefined,
      certificateFileName: scope === 'Eksternal' ? (certificateFileName || undefined) : undefined,
      posterUrl: scope === 'Eksternal' ? (posterUrl || undefined) : undefined,
      posterFileName: scope === 'Eksternal' ? (posterFileName || undefined) : undefined
    };

    onAddTraining(newTraining);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[96dvh] sm:max-h-[92vh] overflow-y-auto p-4 sm:p-6 lg:p-7 shadow-2xl relative aero-border-gradient">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm shadow-cyan-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Kotak Dialog Jadwalkan Pelatihan Baru
              </h3>
              <p className="text-xs text-slate-400">
                Penerbitan jadwal pelatihan terstruktur ke <span className="italic">Calender Training</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 1. NAMA / JUDUL PELATIHAN */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Nama / Judul Pelatihan <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                Kategori terdeteksi otomatis saat mengetik
              </span>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={handleTitleChange}
              placeholder="Contoh: Clinical Preceptorship Program & Bedside Teaching Keperawatan"
              className="w-full bg-slate-900 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Rekomendasi contoh:</span>
              <button
                type="button"
                onClick={() => handleTitleChange({ target: { value: 'Clinical Preceptorship Program & Bedside Teaching' } } as any)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 cursor-pointer transition-colors"
              >
                <span className="italic">Clinical Preceptorship</span>
              </button>
              <button
                type="button"
                onClick={() => handleTitleChange({ target: { value: 'Pelatihan Ahli K3 Kebakaran & Evakuasi Darurat' } } as any)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 cursor-pointer transition-colors"
              >
                K3 & Evakuasi
              </button>
              <button
                type="button"
                onClick={() => handleTitleChange({ target: { value: 'Sertifikasi Keamanan Siber & ISO 27001' } } as any)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 cursor-pointer transition-colors"
              >
                Keamanan <span className="italic">Cyber</span> & <span className="italic">IT</span>
              </button>
              <button
                type="button"
                onClick={() => handleTitleChange({ target: { value: 'Financial Modeling & Analisis Akuntansi' } } as any)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 cursor-pointer transition-colors"
              >
                <span className="italic">Finance</span> & Akuntansi
              </button>
            </div>
          </div>

          {/* KODE PELATIHAN (OPSIONAL / AUTO RSIAPLG) */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Kode Pelatihan <span className="text-slate-500 font-normal lowercase">(opsional)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Otomatis: RSIAPLG-XXXX-{date.split('-')[0] || '2026'}
              </span>
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={`Contoh: RSIAPLG-${Math.floor(1000 + Math.random() * 9000)}-${date.split('-')[0] || '2026'}`}
              className="w-full bg-slate-900 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
            <p className="text-[10px] text-slate-400">
              Kosongkan untuk membuat kode otomatis resmi dengan awalan <strong className="text-cyan-400 font-mono">RSIAPLG-</strong>.
            </p>
          </div>

          {/* 2. KATEGORI KOMPETENSI (TETAP YANG ADA) */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Kategori Kompetensi (Tetap Yang Ada)
                </label>
                {isCategoryAutoSelected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-800 shadow-xs animate-in fade-in duration-300">
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                    Otomatis Terpilih
                  </span>
                )}
                {hasUserManuallyChangedCategory && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/70 text-amber-300 border border-amber-800/60">
                    Pilihan Manual
                  </span>
                )}
              </div>
              {hasUserManuallyChangedCategory && title.trim() && (
                <button
                  type="button"
                  onClick={handleReDetect}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  title="Deteksi ulang kategori dari judul pelatihan"
                >
                  <RefreshCw className="w-3 h-3" />
                  Deteksi Ulang dari Judul
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Kategori otomatis terisi dan menyesuaikan berdasarkan kata kunci judul, namun tetap dapat Anda ganti jika diperlukan:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PILIHAN JENIS PENYELENGGARAAN PELATIHAN: INTERNAL vs EKSTERNAL */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>Jenis Penyelenggaraan Pelatihan</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/70">
                  Internal / Eksternal
                </span>
              </label>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Terhubung dengan Grafik & Tren Perbandingan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Pilihan 1: Internal */}
              <button
                type="button"
                onClick={() => setScope('Internal')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  scope === 'Internal'
                    ? 'bg-gradient-to-r from-cyan-950/90 via-slate-900 to-slate-900 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    scope === 'Internal' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                      <span>Pelatihan Internal</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-mono">
                        In-House
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Penyelenggaraan internal korporat / akademi
                    </p>
                  </div>
                </div>
                {scope === 'Internal' && (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />
                )}
              </button>

              {/* Pilihan 2: Eksternal */}
              <button
                type="button"
                onClick={() => setScope('Eksternal')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  scope === 'Eksternal'
                    ? 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-900 border-amber-400 text-white shadow-lg shadow-amber-950/40 ring-1 ring-amber-500'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    scope === 'Eksternal' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                      <span>Pelatihan Eksternal</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80 font-mono">
                        Luar
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Lembaga luar, sertifikasi, seminar eksternal
                    </p>
                  </div>
                </div>
                {scope === 'Eksternal' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
                )}
              </button>
            </div>

            {/* KHUSUS PELATIHAN EKSTERNAL: UPLOAD SERTIFIKAT DAN POSTER */}
            {scope === 'Eksternal' && (
              <div className="mt-3 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl shadow-amber-950/20">
                <div className="flex items-center justify-between border-b border-amber-900/50 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-amber-200 uppercase tracking-wide">
                        Khusus Pelatihan Eksternal: Upload Dokumen &amp; Media
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Lampirkan Sertifikat Pelatihan resmi dan Poster / Brosur kegiatan
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800">
                    Eksternal
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Upload Sertifikat */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-amber-400" />
                          <span>Sertifikat Pelatihan</span>
                        </label>
                        {certificateUrl && (
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Terunggah
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Auto-kompres hemat kuota ~95% atau gunakan Tautan Google Drive (0 KB beban database).
                      </p>
                    </div>

                    {/* Mode Toggle: File vs Google Drive Link */}
                    <div className="flex rounded-lg bg-slate-950/80 p-0.5 border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setCertificateMode('upload')}
                        className={`flex-1 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          certificateMode === 'upload' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCertificateMode('link')}
                        className={`flex-1 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          certificateMode === 'link' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Link Google Drive</span>
                      </button>
                    </div>

                    {certificateUrl ? (
                      <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-2.5 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-12 h-12 rounded-lg bg-amber-500/15 border border-amber-500/30 overflow-hidden flex items-center justify-center shrink-0">
                            {certificateUrl.startsWith('http') && !certificateUrl.startsWith('data:') ? (
                              <LinkIcon className="w-6 h-6 text-amber-400" />
                            ) : certificateUrl.startsWith('data:image') || certificateUrl.endsWith('.svg') || certificateUrl.endsWith('.png') || certificateUrl.endsWith('.jpg') ? (
                              <img src={certificateUrl} alt="Sertifikat" className="w-full h-full object-cover" />
                            ) : (
                              <FileCheck className="w-6 h-6 text-amber-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              {certificateFileName || 'Sertifikat_Pelatihan_Eksternal'}
                            </div>
                            {certificateCompressInfo && (
                              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                                ⚡ {certificateCompressInfo}
                              </div>
                            )}
                            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                              ✓ Siap disimpan ke profil pelatihan
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => {
                              if (certificateUrl.startsWith('http') && !certificateUrl.startsWith('data:')) {
                                window.open(certificateUrl, '_blank', 'noopener,noreferrer');
                              } else {
                                setPreviewMedia({ url: certificateUrl, title: certificateFileName || 'Sertifikat Pelatihan' });
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-cyan-300 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCertificateUrl('');
                              setCertificateFileName('');
                              setCertificateCompressInfo('');
                              setCertificateLinkInput('');
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-rose-400 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/50 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    ) : certificateMode === 'upload' ? (
                      <div className="space-y-2">
                        <label className="border-2 border-dashed border-slate-700/80 hover:border-amber-500/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-950/50 hover:bg-amber-950/10 transition-colors group">
                          <Upload className="w-6 h-6 text-slate-500 group-hover:text-amber-400 transition-colors" />
                          <span className="text-xs font-semibold text-slate-300 group-hover:text-amber-200">
                            Pilih File Sertifikat
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Auto-kompres otomatis &middot; Format JPG, PNG, PDF
                          </span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleCertificateUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setCertificateFileName('Sertifikat_Kompetensi_Eksternal_Standar.svg');
                            setCertificateUrl('/src/assets/images/certificate_sample_diklat.svg');
                            setCertificateCompressInfo('Template bawaan sistem (12 KB)');
                          }}
                          className="w-full text-center text-[10px] text-amber-400/90 hover:text-amber-300 py-1 transition-colors cursor-pointer"
                        >
                          ✨ Gunakan Template Sertifikat Diklat
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                        <label className="text-[11px] font-semibold text-slate-300 block">
                          Tautan Dokumen Google Drive (0 KB Kuota DB)
                        </label>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/file/d/..."
                          value={certificateLinkInput}
                          onChange={(e) => setCertificateLinkInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          disabled={!certificateLinkInput.trim()}
                          onClick={() => {
                            if (certificateLinkInput.trim()) {
                              setCertificateUrl(certificateLinkInput.trim());
                              setCertificateFileName('Tautan Dokumen Sertifikat (Google Drive)');
                              setCertificateCompressInfo('Tautan Cloud (Beban DB: 0 KB)');
                            }
                          }}
                          className="w-full py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          Tautkan Dokumen Bebas Kuota
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2. Upload Poster / Brosur */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Image className="w-4 h-4 text-cyan-400" />
                          <span>Poster / Brosur Pelatihan</span>
                        </label>
                        {posterUrl && (
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Terunggah
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Flyer informasi acara, poster simposium, atau rundown eksternal.
                      </p>
                    </div>

                    {/* Mode Toggle: File vs Google Drive Link */}
                    <div className="flex rounded-lg bg-slate-950/80 p-0.5 border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setPosterMode('upload')}
                        className={`flex-1 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          posterMode === 'upload' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPosterMode('link')}
                        className={`flex-1 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          posterMode === 'link' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Link Cloud / Drive</span>
                      </button>
                    </div>

                    {posterUrl ? (
                      <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-12 h-12 rounded-lg bg-cyan-500/15 border border-cyan-500/30 overflow-hidden flex items-center justify-center shrink-0">
                            {posterUrl.startsWith('http') && !posterUrl.startsWith('data:') ? (
                              <LinkIcon className="w-6 h-6 text-cyan-400" />
                            ) : (
                              <img src={posterUrl} alt="Poster Pelatihan" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              {posterFileName || 'Poster_Brosur_Pelatihan'}
                            </div>
                            {posterCompressInfo && (
                              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                                ⚡ {posterCompressInfo}
                              </div>
                            )}
                            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                              ✓ Siap ditampilkan pada lembar detail
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => {
                              if (posterUrl.startsWith('http') && !posterUrl.startsWith('data:')) {
                                window.open(posterUrl, '_blank', 'noopener,noreferrer');
                              } else {
                                setPreviewMedia({ url: posterUrl, title: posterFileName || 'Poster Pelatihan' });
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-cyan-300 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPosterUrl('');
                              setPosterFileName('');
                              setPosterCompressInfo('');
                              setPosterLinkInput('');
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-rose-400 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/50 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    ) : posterMode === 'upload' ? (
                      <div className="space-y-2">
                        <label className="border-2 border-dashed border-slate-700/80 hover:border-cyan-500/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-950/50 hover:bg-cyan-950/10 transition-colors group">
                          <Upload className="w-6 h-6 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                          <span className="text-xs font-semibold text-slate-300 group-hover:text-cyan-200">
                            Pilih File Poster / Brosur
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Format Gambar PNG, JPG, JPEG, WebP, SVG
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePosterUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setPosterFileName('Poster_Simposium_Pelatihan_Eksternal.svg');
                            setPosterUrl('/src/assets/images/poster_sample_diklat.svg');
                            setPosterCompressInfo('Template bawaan sistem (14 KB)');
                          }}
                          className="w-full text-center text-[10px] text-cyan-400/90 hover:text-cyan-300 py-1 transition-colors cursor-pointer"
                        >
                          ✨ Gunakan Template Poster Diklat
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                        <label className="text-[11px] font-semibold text-slate-300 block">
                          Tautan Poster Google Drive (0 KB Kuota DB)
                        </label>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/file/d/..."
                          value={posterLinkInput}
                          onChange={(e) => setPosterLinkInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          type="button"
                          disabled={!posterLinkInput.trim()}
                          onClick={() => {
                            if (posterLinkInput.trim()) {
                              setPosterUrl(posterLinkInput.trim());
                              setPosterFileName('Tautan Poster Pelatihan (Google Drive)');
                              setPosterCompressInfo('Tautan Cloud (Beban DB: 0 KB)');
                            }
                          }}
                          className="w-full py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          Tautkan Dokumen Bebas Kuota
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3, 4, 5. TANGGAL PELAKSANAAN (MENDUKUNG SINGLE HARI & MULTI-HARI / 2 HARI ATAU LEBIH), JAM MULAI, JAM SELESAI */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-cyan-400" />
                  <span>3. Tanggal &amp; Durasi Pelaksanaan</span>
                  <span className="text-rose-400">*</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pilih durasi pelatihan: 1 hari reguler atau pelatihan intensif 2 hari, 3 hari, hingga lebih dari 1 pekan.
                </p>
              </div>

              {/* Status Durasi Pill */}
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                  isMultiDay 
                    ? 'bg-amber-950/80 text-amber-300 border-amber-600/70 shadow-sm shadow-amber-950/50' 
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
                }`}>
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>{trainingDurationDays} Hari Pelatihan</span>
                  {isMultiDay && <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.2 rounded font-mono">Multi-Hari</span>}
                </span>
              </div>
            </div>

            {/* OPSI PILIHAN CEPAT DURASI (PRESET 1 HARI, 2 HARI, 3 HARI, DST) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Pilih Durasi Hari Pelatihan:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
                {[
                  { id: '1', label: '1 Hari', sub: 'Tunggal / Reguler' },
                  { id: '2', label: '2 Hari', sub: '+1 Hari Berurutan' },
                  { id: '3', label: '3 Hari', sub: '+2 Hari Intensif' },
                  { id: '4', label: '4 Hari', sub: '+3 Hari Program' },
                  { id: '5', label: '5 Hari', sub: '1 Pekan Kerja Penuh' },
                  { id: 'custom', label: 'Kustom', sub: 'Bebas Rentang Tanggal' }
                ].map((preset) => {
                  const isActive = durationPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id as any)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 select-none active:scale-95 ${
                        isActive
                          ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {isActive && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                        <span className="text-xs">{preset.label}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 leading-tight">{preset.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Tanggal: 1 Hari vs Rentang Hari */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* Tanggal Mulai */}
              <div className={isMultiDay ? 'sm:col-span-1' : 'sm:col-span-2'}>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>{isMultiDay ? 'Tanggal Mulai Pelatihan *' : 'Tanggal Pelaksanaan *'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDateToIndonesian(date)}
                  </span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                />
              </div>

              {/* Tanggal Selesai (Jika Multi-Hari) */}
              {isMultiDay && (
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-cyan-300 mb-1 flex items-center justify-between">
                    <span>Tanggal Selesai Pelatihan *</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateToIndonesian(endDate)}
                    </span>
                  </label>
                  <input
                    type="date"
                    required={isMultiDay}
                    min={date}
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDurationPreset('custom');
                    }}
                    className="w-full bg-slate-900 border border-cyan-500/60 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  />
                </div>
              )}

              {/* Jam Mulai */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>4. Jam Mulai Harian</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer font-mono"
                />
              </div>

              {/* Jam Selesai */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>5. Jam Selesai Harian</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer font-mono"
                />
              </div>
            </div>

            {/* VISUAL TIMELINE & DAY-BY-DAY RINCIAN UNTUK PELATIHAN > 1 HARI */}
            {isMultiDay && (
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3 sm:p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                      {trainingDurationDays}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Rincian Rangkaian Hari Pelatihan ({trainingDurationDays} Hari)</span>
                        <span className="text-[10px] text-cyan-300 font-mono">
                          ({formatDateToIndonesian(date)} s/d {formatDateToIndonesian(endDate)})
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Setiap hari akan otomatis dipetakan ke Kalender dan Laci Tanggal.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRundownEditor(!showRundownEditor)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors self-start sm:self-auto"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{showRundownEditor ? 'Tutup Rincian Topik' : '+ Tambah Topik / Silabus Per Hari (Opsional)'}</span>
                  </button>
                </div>

                {/* Day-by-Day Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {trainingDayList.map((dayIso, idx) => {
                    const dayNum = idx + 1;
                    return (
                      <div 
                        key={dayIso}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between gap-1.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
                            Hari ke-{dayNum}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                            {startTime} - {endTime}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200">
                          {formatDateWithDay(dayIso)}
                        </div>

                        {showRundownEditor ? (
                          <input
                            type="text"
                            placeholder={`Topik Hari ke-${dayNum} (contoh: ${dayNum === 1 ? 'Materi Dasar & Regulasi' : dayNum === 2 ? 'Praktikum & Simulasi' : 'Ujian & Evaluasi'})`}
                            value={dailyTopics[dayNum] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDailyTopics((prev) => ({ ...prev, [dayNum]: val }));
                            }}
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 mt-1"
                          />
                        ) : dailyTopics[dayNum] ? (
                          <div className="text-[10px] text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 truncate">
                            {dailyTopics[dayNum]}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* Akumulasi Jam Pelajaran & Penjelasan Sistem */}
                <div className="bg-cyan-950/30 border border-cyan-800/50 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-cyan-300">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      Total Akumulasi: <strong className="text-white">{sksHours * trainingDurationDays} Jam Pembelajaran (JP)</strong> ({trainingDurationDays} hari × {sksHours} JP/hari).
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Otomatis tampil pada seluruh {trainingDurationDays} tanggal di Kalender Bulanan</span>
                  </div>
                </div>
              </div>
            )}

            {/* PANDUAN PELATIHAN LEBIH DARI 1 HARI (TIPS & INFO SISTEM) */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-300 text-xs">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Bagaimana Sistem Memproses Pelatihan &gt; 1 Hari (2 Hari atau Lebih)?</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1 text-[10px] text-slate-400">
                <li>
                  <strong className="text-slate-300">Kalender Bulanan:</strong> Kegiatan muncul otomatis di setiap tanggal ({date} sampai {endDate}) dengan penanda nomor hari (misal <em>[H1/3]</em>, <em>[H2/3]</em>, dst.).
                </li>
                <li>
                  <strong className="text-slate-300">Laci Jadwal Harian:</strong> Ketika memilih tanggal berapa pun dalam rentang tersebut, sistem akan menampilkan kegiatan beserta status harinya.
                </li>
                <li>
                  <strong className="text-slate-300">Presensi &amp; Rekap Peserta:</strong> Rombongan peserta terdaftar serentak untuk seluruh rangkaian hari pelatihan dan lembar presensi resmi mencantumkan durasi hari lengkap.
                </li>
              </ul>
            </div>
          </div>

          {/* 6 & 7. FORMAT PELAKSANAAN (OFFLINE, ONLINE, HYBRID) & LOKASI / RUANGAN PELATIHAN */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* FORMAT PELAKSANAAN */}
            <div className="sm:col-span-6 bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                6. Format Pelaksanaan (<span className="italic">Offline</span>, <span className="italic">Online</span>, <span className="italic">Hybrid</span>)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'Offline', label: 'Offline', sub: 'Tatap Muka', icon: Building2 },
                  { id: 'Online', label: 'Online', sub: 'Virtual / Zoom', icon: Video },
                  { id: 'Hybrid', label: 'Hybrid', sub: 'Tatap & Virtual', icon: Laptop }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = locationType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLocationType(item.id as any)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold italic">{item.label}</span>
                      <span className="text-[9px] text-slate-400 leading-none">{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LOKASI / RUANGAN PELATIHAN */}
            <div className="sm:col-span-6 bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3 space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                7. Lokasi / Ruangan Pelatihan
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Contoh: Auditorium Lt. 3 / Ruang Diklat Preceptor / Zoom Link"
                className="w-full bg-slate-900 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-500"
              />
              <span className="text-[10px] text-slate-400 block">
                Tuliskan gedung, nomor ruangan, atau tautan tautan <span className="italic">online meeting</span>
              </span>
            </div>
          </div>

          {/* 8 & 9. KAPASITAS KUOTA PESERTA & JAM PELAJARAN (JP) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3 space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                8. Kapasitas Kuota Peserta
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-semibold"
                />
                <span className="text-xs text-slate-400 shrink-0">Peserta</span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3 space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                9. Jam Pelajaran (<span className="italic">JP</span>)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={80}
                  value={sksHours}
                  onChange={(e) => setSksHours(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-semibold"
                />
                <span className="text-xs text-slate-400 shrink-0"><span className="italic">JP</span> / Jam</span>
              </div>
            </div>

            {/* INPUT NAMA PESERTA PERDANA */}
            <div className="sm:col-span-2 bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3 space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  Nama Peserta Perdana (1 Peserta)
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Opsional (dapat ditambahkan lagi melalui lembar Detail Pelatihan)
                </span>
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Contoh: Ns. Siti Fatimah, S.Kep (Kosongkan untuk nama delegasi unit kerja)"
                className="w-full bg-slate-900 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-500 font-medium"
              />
            </div>
          </div>

          {/* 10. UNIT KERJA (26 Unit Kerjasama) */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  10. Unit Kerja Sasaran ({selectedUnits.length} dari {allAvailableUnits.length} Terpilih)
                </label>
                <p className="text-[11px] text-slate-400">
                  Pilih satu atau lebih unit kerja yang ditargetkan untuk mengikuti pelatihan ini
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllUnits}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/70 rounded-lg transition-colors cursor-pointer"
                >
                  Pilih Semua ({allAvailableUnits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUnits([
                    'Nursing Units Head',
                    'Nursing Preceptor',
                    'Outpatient',
                    'Intensive Care',
                    'Inpatient',
                    'Operating Theater',
                    'Emergency',
                    'Delivery Room'
                  ])}
                  className="px-2 py-1 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Unit <span className="italic">Nursing</span> & Medis
                </button>
                <button
                  type="button"
                  onClick={handleClearUnits}
                  className="px-2 py-1 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* FREE TEKS INPUT: Tambah Unit Kerja Bebas / Kustom */}
            <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-3 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Free Teks / Tambah Unit Kerja Kustom</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  Ketik nama unit lalu tekan Enter atau klik Tambah (bisa gunakan koma untuk multi-unit)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customUnitInput}
                  onChange={(e) => setCustomUnitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomUnit();
                    }
                  }}
                  placeholder="Ketik unit kerja bebas (contoh: Poli Eksekutif Melati, Sub-Divisi Rawat Gabung, Mitra Luar)..."
                  className="flex-1 bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                  <button
                  type="button"
                  onClick={() => handleAddCustomUnit()}
                  disabled={!customUnitInput.trim()}
                  className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow cursor-pointer shrink-0 active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tambah Free Teks</span>
                </button>
              </div>

              {/* Tampilkan badge unit free teks yang telah ditambahkan */}
              {customUnitsList.length > 0 && (
                <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-amber-300">
                    Unit Free Teks Terpilih:
                  </span>
                  {customUnitsList.map((unit) => (
                    <span
                      key={unit}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/80 rounded-lg shadow-xs"
                    >
                      <span>{unit}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUnit(unit)}
                        className="p-0.5 hover:bg-amber-800/60 rounded text-amber-400 hover:text-white cursor-pointer ml-0.5"
                        title="Hapus unit ini"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Search filter for units */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                placeholder="Cari unit kerja (contoh: Nursing, Emergency, Pharmacy, IT)..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Unit grid list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-52 overflow-y-auto pr-1">
              {filteredUnits.map((unit) => {
                const isChecked = selectedUnits.includes(unit);
                return (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleToggleUnit(unit)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer text-xs ${
                      isChecked
                        ? 'bg-cyan-950/70 border-cyan-500/60 text-white font-medium shadow-xs'
                        : 'bg-slate-900/90 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold'
                          : 'border-slate-700 bg-slate-950'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate italic text-slate-200 flex-1">
                      {unit}
                    </span>
                    {!ALL_UNIT_KERJA.includes(unit) && (
                      <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 shrink-0">
                        BEBAS
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedUnits.length === 0 && (
              <p className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                ⚠️ Mohon pilih minimal 1 unit kerja sasaran pelatihan
              </p>
            )}
          </div>


          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!title.trim() || selectedUnits.length === 0}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 rounded-xl transition-all shadow-md shadow-cyan-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
            >
              <CalendarIcon className="w-4 h-4" />
              Simpan & Terbitkan Jadwal
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox Modal for Certificate / Poster Preview */}
      {previewMedia && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-md">
                  {previewMedia.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950/90">
              <img
                src={previewMedia.url}
                alt={previewMedia.title}
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
            <div className="p-3 border-t border-slate-800 flex items-center justify-end bg-slate-900">
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
