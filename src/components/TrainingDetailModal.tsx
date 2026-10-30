import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Building2, 
  Search, 
  Filter, 
  UserPlus, 
  Download, 
  Printer, 
  CheckCircle2, 
  Award, 
  Trash2,
  ChevronDown,
  Upload,
  FileSpreadsheet,
  Pencil,
  AlertTriangle,
  Globe,
  FileText,
  Image,
  FileCheck,
  Eye,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { Training, Participant, AttendanceStatus, TrainingStatus, TrainingScope } from '../types/training';
import { User, getUserAuthority } from '../types/auth';
import { formatDateWithDay, calculateDurationDays, formatDateRangeIndonesian, generateDateList, formatDateToIndonesian } from '../utils/dateUtils';
import { CATEGORY_COLORS } from '../data/initialData';
import { AddParticipantModal } from './AddParticipantModal';
import { PrintAttendanceModal } from './PrintAttendanceModal';
import { ExcelUploadModal } from './ExcelUploadModal';
import { ForeignText } from '../utils/textFormatter';
import { compressImageFile } from '../utils/imageCompressor';
import { getEffectiveScores, getDeterministicPretestScore } from '../utils/evaluationHelper';

import * as XLSX from 'xlsx';

interface TrainingDetailModalProps {
  training: Training;
  onClose: () => void;
  onUpdateTraining: (updatedTraining: Training) => void;
  onDeleteTraining?: (trainingId: string) => void;
  currentUser?: User | null;
}

export const TrainingDetailModal: React.FC<TrainingDetailModalProps> = ({
  training,
  onClose,
  onUpdateTraining,
  onDeleteTraining,
  currentUser
}) => {
  const userAuthority = getUserAuthority(currentUser);
  const isFullAuthority = userAuthority === 'Otoritas Penuh';
  const canEdit = userAuthority === 'Otoritas Penuh' || userAuthority === 'Edit';
  const isViewOnly = userAuthority === 'Melihat';
  const isAdmin = isFullAuthority;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showExcelUploadModal, setShowExcelUploadModal] = useState(false);
  const [editingScoreParticipant, setEditingScoreParticipant] = useState<Participant | null>(null);
  const [tempPretest, setTempPretest] = useState<string>('');
  const [tempPosttest, setTempPosttest] = useState<string>('');

  // Participant deletion confirmation modal state (in-app dialog to avoid iframe window.confirm restriction)
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  // Training deletion confirmation modal state
  const [showDeleteTrainingConfirm, setShowDeleteTrainingConfirm] = useState(false);
  // Toast notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit training details state
  const [isEditingTraining, setIsEditingTraining] = useState(false);
  const [editCode, setEditCode] = useState(training.code?.startsWith('NPA-') ? training.code.replace(/^NPA-/i, 'RSIAPLG-') : training.code);
  const [editTitle, setEditTitle] = useState(training.title);
  const [editDate, setEditDate] = useState(training.date);
  const [editEndDate, setEditEndDate] = useState(training.endDate || training.date);
  const [editIsMultiDay, setEditIsMultiDay] = useState(Boolean(training.endDate && training.endDate > training.date));
  const [editStartTime, setEditStartTime] = useState(training.startTime);
  const [editEndTime, setEditEndTime] = useState(training.endTime);
  const [editVenue, setEditVenue] = useState(training.venue);
  const [editStatus, setEditStatus] = useState<TrainingStatus>(training.status);
  const [editScope, setEditScope] = useState<TrainingScope>(training.scope || 'Internal');
  const [editCapacity, setEditCapacity] = useState(training.capacity);
  const [editSksHours, setEditSksHours] = useState(training.sksHours);
  const [editInstructorName, setEditInstructorName] = useState(training.instructor.name);
  const [editInstructorTitle, setEditInstructorTitle] = useState(training.instructor.title);
  const [editInstructorOrg, setEditInstructorOrg] = useState(training.instructor.organization);
  const [editCertificateUrl, setEditCertificateUrl] = useState<string>(training.certificateUrl || '');
  const [editCertificateFileName, setEditCertificateFileName] = useState<string>(training.certificateFileName || '');
  const [editPosterUrl, setEditPosterUrl] = useState<string>(training.posterUrl || '');
  const [editPosterFileName, setEditPosterFileName] = useState<string>(training.posterFileName || '');
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string } | null>(null);

  const handleOpenEdit = () => {
    setEditCode(training.code?.startsWith('NPA-') ? training.code.replace(/^NPA-/i, 'RSIAPLG-') : training.code);
    setEditTitle(training.title);
    setEditDate(training.date);
    setEditEndDate(training.endDate || training.date);
    setEditIsMultiDay(Boolean(training.endDate && training.endDate > training.date));
    setEditStartTime(training.startTime);
    setEditEndTime(training.endTime);
    setEditVenue(training.venue);
    setEditStatus(training.status);
    setEditScope(training.scope || 'Internal');
    setEditCapacity(training.capacity);
    setEditSksHours(training.sksHours);
    setEditInstructorName(training.instructor.name);
    setEditInstructorTitle(training.instructor.title);
    setEditInstructorOrg(training.instructor.organization);
    setEditCertificateUrl(training.certificateUrl || '');
    setEditCertificateFileName(training.certificateFileName || '');
    setEditPosterUrl(training.posterUrl || '');
    setEditPosterFileName(training.posterFileName || '');
    setIsEditingTraining(true);
  };

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditCertificateFileName(file.name);
    try {
      const res = await compressImageFile(file, 1280, 1280, 0.78);
      setEditCertificateUrl(res.dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setEditCertificateUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditPosterFileName(file.name);
    try {
      const res = await compressImageFile(file, 1280, 1280, 0.78);
      setEditPosterUrl(res.dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setEditPosterUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSaveEditTraining = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    const finalCode = editCode.trim() || (training.code?.startsWith('NPA-') ? training.code.replace(/^NPA-/i, 'RSIAPLG-') : training.code);

    const updated: Training = {
      ...training,
      code: finalCode,
      title: editTitle.trim(),
      date: editDate,
      endDate: editIsMultiDay && editEndDate && editEndDate > editDate ? editEndDate : undefined,
      startTime: editStartTime,
      endTime: editEndTime,
      venue: editVenue.trim(),
      status: editStatus,
      scope: editScope,
      capacity: Number(editCapacity) || 30,
      sksHours: Number(editSksHours) || 6,
      instructor: {
        ...training.instructor,
        name: editInstructorName.trim() || training.instructor.name,
        title: editInstructorTitle.trim() || training.instructor.title,
        organization: editInstructorOrg.trim() || training.instructor.organization,
      },
      certificateUrl: editScope === 'Eksternal' ? (editCertificateUrl || undefined) : undefined,
      certificateFileName: editScope === 'Eksternal' ? (editCertificateFileName || undefined) : undefined,
      posterUrl: editScope === 'Eksternal' ? (editPosterUrl || undefined) : undefined,
      posterFileName: editScope === 'Eksternal' ? (editPosterFileName || undefined) : undefined
    };
    onUpdateTraining(updated);
    setIsEditingTraining(false);
  };

  const handleDeleteTraining = () => {
    if (!isAdmin) {
      setToastMessage('Hanya Administrator Diklat yang berwenang menghapus agenda pelatihan.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    setShowDeleteTrainingConfirm(true);
  };

  const handleConfirmDeleteTraining = () => {
    setShowDeleteTrainingConfirm(false);
    onDeleteTraining?.(training.id);
    onClose();
  };

  // Trigger participant deletion dialog (Only Administrator Diklat)
  const handleRequestDeleteParticipant = (participant: Participant) => {
    if (!isAdmin) {
      setToastMessage('Hanya Administrator Diklat yang berwenang menghapus data peserta.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    setParticipantToDelete(participant);
  };

  // Execute confirmed participant deletion (works reliably in all browsers/iframes)
  const handleConfirmDeleteParticipant = () => {
    if (!participantToDelete) return;
    const deletedName = participantToDelete.name;
    const updatedParticipants = training.participants.filter(p => p.id !== participantToDelete.id);
    onUpdateTraining({ ...training, participants: updatedParticipants });
    setParticipantToDelete(null);
    setToastMessage(`Peserta "${deletedName}" berhasil dihapus dari pelatihan.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const catStyle = CATEGORY_COLORS[training.category] || CATEGORY_COLORS['Teknologi & Digital'];

  // All distinct unit kerja currently participating
  const participatingUnits = useMemo(() => {
    return Array.from(new Set(training.participants.map(p => p.unitKerja)));
  }, [training.participants]);

  // Filtered participants list
  const filteredParticipants = useMemo(() => {
    return training.participants.filter(p => {
      const matchSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.unitKerja.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.jabatan.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchUnit = selectedUnitFilter === 'ALL' || p.unitKerja === selectedUnitFilter;
      const matchStatus = selectedStatusFilter === 'ALL' || p.statusKehadiran === selectedStatusFilter;

      return matchSearch && matchUnit && matchStatus;
    });
  }, [training.participants, searchQuery, selectedUnitFilter, selectedStatusFilter]);

  // Statistics
  const hadirCount = training.participants.filter(p => p.statusKehadiran === 'Hadir').length;
  const attendanceRate = training.participants.length > 0 
    ? Math.round((hadirCount / training.participants.length) * 100) 
    : 0;

  // Handle participant status toggle
  const handleStatusChange = (participantId: string, newStatus: AttendanceStatus) => {
    const updatedParticipants = training.participants.map(p => {
      if (p.id === participantId) {
        return { ...p, statusKehadiran: newStatus };
      }
      return p;
    });
    onUpdateTraining({ ...training, participants: updatedParticipants });
  };

  // Handle score update save
  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScoreParticipant) return;

    // Aturan Evaluasi Kompetensi: jika nilai tidak ada maka Pre > 75 dan Post 100
    const finalPre = (tempPretest !== '' && !isNaN(Number(tempPretest)))
      ? Number(tempPretest)
      : getDeterministicPretestScore(editingScoreParticipant.id || editingScoreParticipant.name);

    const finalPost = (tempPosttest !== '' && !isNaN(Number(tempPosttest)))
      ? Number(tempPosttest)
      : 100;

    const updatedParticipants = training.participants.map(p => {
      if (p.id === editingScoreParticipant.id) {
        return {
          ...p,
          nilaiPretest: finalPre,
          nilaiPosttest: finalPost
        };
      }
      return p;
    });

    onUpdateTraining({ ...training, participants: updatedParticipants });
    setEditingScoreParticipant(null);
  };

  // Handle add single participant
  const handleAddParticipant = (newParticipant: Participant) => {
    const updatedParticipants = [newParticipant, ...training.participants];
    const existingUnits = training.targetUnits || [];
    const updatedUnits = existingUnits.includes(newParticipant.unitKerja)
      ? existingUnits
      : [...existingUnits, newParticipant.unitKerja];
    onUpdateTraining({ ...training, participants: updatedParticipants, targetUnits: updatedUnits });
    setToastMessage(`Peserta "${newParticipant.name}" berhasil ditambahkan.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle add multiple participants (bulk from Data Karyawan)
  const handleAddParticipants = (newParticipants: Participant[]) => {
    if (newParticipants.length === 0) return;
    const updatedParticipants = [...newParticipants, ...training.participants];
    const existingUnits = training.targetUnits || [];
    const newUnits = newParticipants.map(p => p.unitKerja).filter(u => u && !existingUnits.includes(u));
    const updatedUnits = [...existingUnits, ...Array.from(new Set(newUnits))];
    onUpdateTraining({ ...training, participants: updatedParticipants, targetUnits: updatedUnits });
    setToastMessage(`${newParticipants.length} peserta baru berhasil ditambahkan dari Data Karyawan.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle bulk Excel import
  const handleImportExcelParticipants = (newParticipants: Participant[], mode: 'append' | 'replace') => {
    const updatedParticipants = mode === 'replace'
      ? newParticipants
      : [...training.participants, ...newParticipants];
    onUpdateTraining({ ...training, participants: updatedParticipants });
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const headers = [
      'NO.',
      'NAMA LENGKAP',
      'NIK',
      'UNIT KERJA',
      'JABATAN',
      'STATUS KEHADIRAN',
      'NILAI PRE-TEST',
      'NILAI POST-TEST',
      'SELISIH (DELTA)'
    ];

    const rows = training.participants.map((p, index) => {
      const scores = getEffectiveScores(p);
      const delta = `${scores.delta >= 0 ? '+' : ''}${scores.delta}`;

      return [
        index + 1,
        p.name,
        p.nip,
        p.unitKerja,
        p.jabatan,
        p.statusKehadiran,
        scores.pre,
        scores.post,
        delta
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 24 },
      { wch: 38 },
      { wch: 28 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar_Peserta');
    XLSX.writeFile(workbook, `Daftar_Peserta_${training.code}_${training.date}.xlsx`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 lg:p-3 bg-slate-950/85 backdrop-blur-xl overflow-hidden">
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl sm:rounded-2xl max-w-5xl w-full h-[96dvh] sm:h-[92vh] max-h-[96dvh] sm:max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden aero-border-gradient">
          {/* Top Aerodynamic Hero Visual Header - Ultra-Compact & Responsive */}
          <div className="relative px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 shrink-0">
            {/* Background image overlay */}
            <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
              <img
                src="/src/assets/images/aero_learning_center_1792976963046.jpg"
                alt="Corporate Training Hall"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
            </div>

            {/* Top Right Controls: Ubah Jadwal & Close */}
            <div className="absolute top-2 right-2 sm:top-2.5 sm:right-3 z-20 flex items-center gap-1.5">
              {canEdit && (
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-cyan-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-cyan-700/60 rounded-lg transition-all shadow cursor-pointer active:scale-95"
                  title="Ubah rincian agenda pelatihan (tanggal, jam, lokasi, instruktur)"
                >
                  <Pencil className="w-3 h-3" />
                  <span className="hidden sm:inline">Ubah Jadwal</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all cursor-pointer active:scale-95"
                aria-label="Tutup Detail"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Header Content */}
            <div className="relative z-10 pr-16 sm:pr-24">
              {/* Badges strip */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-1">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex items-center gap-1 ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                  <span>{training.category}</span>
                </span>
                <span className="font-mono text-[10px] text-slate-300 bg-slate-800/80 border border-slate-700/70 px-1.5 py-0.5 rounded">
                  {training.code?.startsWith('NPA-') ? training.code.replace(/^NPA-/i, 'RSIAPLG-') : training.code}
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded font-semibold">
                  {training.status}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                  (training.scope || 'Internal') === 'Internal'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                    : 'bg-amber-950/80 text-amber-300 border-amber-800'
                }`}>
                  {(training.scope || 'Internal') === 'Internal' ? (
                    <Building2 className="w-3 h-3" />
                  ) : (
                    <Globe className="w-3 h-3" />
                  )}
                  <span>{training.scope || 'Internal'}</span>
                </span>
                {training.endDate && training.endDate > training.date && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-amber-950/80 text-amber-300 border-amber-800 flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Multi-Hari ({calculateDurationDays(training.date, training.endDate)}H)</span>
                  </span>
                )}
                <span 
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center justify-center gap-1 shadow-xs ${
                    isFullAuthority
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/70'
                      : canEdit
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700/70'
                      : 'bg-sky-950/80 text-sky-300 border-sky-700/70'
                  }`}
                  title={isFullAuthority ? 'Hak Akses: Otoritas Penuh' : canEdit ? 'Hak Akses: Edit' : 'Hak Akses: Melihat'}
                >
                  {isFullAuthority ? '🛡️ Otoritas Penuh' : canEdit ? '✏️ Edit' : '👁️ Melihat'}
                </span>
              </div>

              {/* Title - Compact yet Prominent */}
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug line-clamp-1 sm:line-clamp-2">
                <ForeignText text={training.title} />
              </h2>

              {/* Compact Sub-meta details strip (Date, Time, Venue, Target Units, Capacity) */}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] sm:text-[11px] text-slate-300">
                <div className="flex items-center gap-1 shrink-0">
                  <Calendar className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-white">
                    {training.endDate && training.endDate > training.date
                      ? `${formatDateWithDay(training.date)} s/d ${formatDateWithDay(training.endDate)}`
                      : formatDateWithDay(training.date)}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>
                    {training.startTime} - {training.endTime} WIB
                    {training.endDate && training.endDate > training.date
                      ? ` (${training.sksHours * calculateDurationDays(training.date, training.endDate)} JP)`
                      : ` (${training.sksHours} JP)`}
                  </span>
                </div>
                <div className="flex items-center gap-1 truncate max-w-xs shrink-0">
                  <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate"><ForeignText text={training.venue} /></span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Building2 className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="text-slate-400">Sasaran:</span>
                  <span className="text-cyan-300 font-medium">
                    {(training.targetUnits || []).slice(0, 2).join(', ')}
                    {(training.targetUnits || []).length > 2 && ` +${(training.targetUnits?.length || 0) - 2}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                  <span className="text-slate-400">Peserta: <strong className="text-white font-sans">{training.participants.length}</strong>/{training.capacity}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">Hadir: <strong className="text-cyan-400 font-sans">{attendanceRate}%</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* External Documents Strip (Ultra-compact chip bar) */}
          {((training.scope || 'Internal') === 'Eksternal' || training.certificateUrl || training.posterUrl) && (
            <div className="bg-amber-950/30 border-b border-amber-500/30 px-3 py-1 flex items-center justify-between gap-2 text-[11px] shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="text-amber-400 font-bold flex items-center gap-1 text-[10px] shrink-0">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>Dokumen:</span>
                </span>
                {training.certificateUrl ? (
                  <button
                    type="button"
                    onClick={() => setPreviewMedia({ url: training.certificateUrl!, title: training.certificateFileName || 'Sertifikat Pelatihan' })}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-900/60 hover:bg-amber-850 text-amber-200 text-[10px] font-semibold border border-amber-700/60 cursor-pointer"
                  >
                    <FileCheck className="w-2.5 h-2.5 text-amber-300" />
                    <span>Sertifikat (Buka)</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">Sertifikat (-)</span>
                )}
                {training.posterUrl ? (
                  <button
                    type="button"
                    onClick={() => setPreviewMedia({ url: training.posterUrl!, title: training.posterFileName || 'Poster Pelatihan' })}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900 text-cyan-200 text-[10px] font-semibold border border-cyan-800/60 cursor-pointer"
                  >
                    <Image className="w-2.5 h-2.5 text-cyan-300" />
                    <span>Poster (Buka)</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">Poster (-)</span>
                )}
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>Perbarui</span>
                </button>
              )}
            </div>
          )}

          {/* Unified Action, Search & Filter Toolbar - Highly Compact */}
          <div className="p-2 sm:px-3 sm:py-2 border-b border-slate-800 bg-slate-900/95 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2">
            {/* Left: Search & Filter Inputs */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[140px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari peserta, NIK, unit..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none h-7 sm:h-8"
                />
              </div>

              <div className="relative shrink-0">
                <select
                  value={selectedUnitFilter}
                  onChange={(e) => setSelectedUnitFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] sm:text-xs rounded-lg px-2 py-1 pr-6 focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[130px] sm:max-w-[150px] truncate h-7 sm:h-8"
                >
                  <option value="ALL">Semua Unit ({training.participants.length})</option>
                  {participatingUnits.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 top-2 pointer-events-none" />
              </div>

              <div className="relative shrink-0">
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] sm:text-xs rounded-lg px-2 py-1 pr-5 focus:outline-none focus:border-cyan-500 cursor-pointer h-7 sm:h-8"
                >
                  <option value="ALL">Status</option>
                  <option value="Hadir">Hadir</option>
                  <option value="Konfirmasi">Konfirmasi</option>
                  <option value="Terdaftar">Terdaftar</option>
                  <option value="Izin">Izin</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap shrink-0">
              {canEdit && (
                <button
                  onClick={() => setShowAddParticipant(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow cursor-pointer whitespace-nowrap active:scale-95 h-7 sm:h-8"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Peserta</span>
                </button>
              )}

              {canEdit && (
                <button
                  onClick={() => setShowExcelUploadModal(true)}
                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/70 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 h-7 sm:h-8"
                  title="Unggah file Excel (.xlsx / .xls)"
                >
                  <FileSpreadsheet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                  <span>Upload Excel</span>
                </button>
              )}

              <button
                onClick={() => setShowPrintModal(true)}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer active:scale-95 h-7 sm:h-8"
              >
                <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Cetak Presensi</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer active:scale-95 h-7 sm:h-8"
                title="Unduh data peserta format Excel (.xlsx)"
              >
                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
                <span>Ekspor</span>
              </button>
            </div>
          </div>

          {/* Modal Main Content: THE TABLE HAS MAXIMUM DIRECT VIEWPORT PRESENCE */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-950/70">
            {/* Multi-Day Strip if multi-day training */}
            {training.endDate && training.endDate > training.date && (() => {
              const totalDays = calculateDurationDays(training.date, training.endDate);
              const dayList = generateDateList(training.date, training.endDate);
              return (
                <div className="bg-slate-950/90 border-b border-cyan-500/20 px-3 py-1 flex items-center gap-2 overflow-x-auto shrink-0 text-[10px]">
                  <span className="font-bold text-cyan-300 flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>{totalDays} Hari Pelatihan:</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    {dayList.map((dayIso, idx) => (
                      <span key={dayIso} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono shrink-0">
                        H{idx + 1}: {dayIso.slice(5)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Participants Table Container - Sticky Header & Direct Viewport Display */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 border-b border-slate-800 shadow-sm">
                  <tr className="text-slate-400 text-[10px] sm:text-[11px] uppercase tracking-wider">
                    <th className="py-1.5 px-2 font-semibold w-9 text-center">No</th>
                    <th className="py-1.5 px-2.5 font-semibold text-left">Nama Peserta &amp; NIK</th>
                    <th className="py-1.5 px-2.5 font-semibold text-left">Unit Kerja &amp; Jabatan</th>
                    <th className="py-1.5 px-2 font-semibold text-center w-28 sm:w-32">Status Kehadiran</th>
                    <th className="py-1.5 px-2 font-semibold text-center w-44 sm:w-52">Evaluasi (<span className="italic">Pre-Post</span>)</th>
                    {isFullAuthority && <th className="py-1.5 px-2 font-semibold text-center w-12">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={isFullAuthority ? 6 : 5} className="py-8 text-center text-slate-500 text-xs">
                          Tidak ada data peserta yang sesuai dengan pencarian atau filter.
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((p, idx) => {
                        const statusColor = 
                          p.statusKehadiran === 'Hadir' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' :
                          p.statusKehadiran === 'Konfirmasi' ? 'bg-cyan-950/80 text-cyan-400 border-cyan-800' :
                          p.statusKehadiran === 'Terdaftar' ? 'bg-blue-950/80 text-blue-400 border-blue-800' :
                          'bg-amber-950/80 text-amber-400 border-amber-800';

                        return (
                          <tr key={p.id} className="hover:bg-slate-900/60 transition-colors group">
                            <td className="py-2 px-3 text-center tabular-nums text-slate-500 font-mono text-xs">
                              {idx + 1}
                            </td>
                            
                            {/* Nama & NIK/NIP */}
                            <td className="py-2 px-3">
                              <div className="font-bold text-white group-hover:text-cyan-300 transition-colors text-xs sm:text-sm">
                                {p.name}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                NIK: {p.nip}
                              </div>
                            </td>

                            {/* Unit Kerja & Jabatan (Core Highlight) */}
                            <td className="py-2 px-3">
                              <div className="font-semibold text-cyan-400 flex items-center gap-1 text-xs">
                                <Building2 className="w-3 h-3 text-cyan-400/80 shrink-0" />
                                <span>{p.unitKerja}</span>
                              </div>
                              <div className="text-[11px] text-slate-300">
                                {p.jabatan}
                              </div>
                            </td>

                            {/* Status Kehadiran (Interactive updater for Edit/Otoritas Penuh, Static for Melihat) */}
                            <td className="py-2 px-3 text-center">
                              {canEdit ? (
                                <div className="inline-block">
                                  <select
                                    value={p.statusKehadiran}
                                    onChange={(e) => handleStatusChange(p.id, e.target.value as AttendanceStatus)}
                                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border appearance-none cursor-pointer focus:outline-none transition-colors ${statusColor}`}
                                  >
                                    <option value="Hadir" className="bg-slate-900 text-emerald-400">✓ Hadir</option>
                                    <option value="Konfirmasi" className="bg-slate-900 text-cyan-400">● Konfirmasi</option>
                                    <option value="Terdaftar" className="bg-slate-900 text-blue-400">○ Terdaftar</option>
                                    <option value="Izin" className="bg-slate-900 text-amber-400">! Izin</option>
                                  </select>
                                </div>
                              ) : (
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${statusColor}`}>
                                  {p.statusKehadiran === 'Hadir' ? '✓ Hadir' :
                                   p.statusKehadiran === 'Konfirmasi' ? '● Konfirmasi' :
                                   p.statusKehadiran === 'Terdaftar' ? '○ Terdaftar' : '! Izin'}
                                </span>
                              )}
                            </td>

                            {/* Evaluasi / Pre & Post test scores (Aturan: Jika tidak ada, Pre > 75 dan Post 100) */}
                            <td className="py-2 px-3">
                              {(() => {
                                const scores = getEffectiveScores(p);
                                return (
                                  <div className="flex items-center justify-center gap-1.5 tabular-nums">
                                    <span 
                                      className="text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300" 
                                      title={scores.isAutoPre ? "Nilai Pre-Test (Otomatis sistem > 75)" : "Nilai Pre-Test"}
                                    >
                                      <span className="italic">Pre</span>: <strong className="text-white">{scores.pre}</strong>
                                    </span>
                                    <span className="text-slate-600 font-bold text-[10px]">→</span>
                                    <span 
                                      className="text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 font-bold" 
                                      title={scores.isAutoPost ? "Nilai Post-Test (Otomatis sistem 100)" : "Nilai Post-Test"}
                                    >
                                      <span className="italic">Post</span>: {scores.post}
                                    </span>
                                    <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                                      scores.delta >= 0
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                    }`}>
                                      {scores.delta >= 0 ? '+' : ''}{scores.delta}
                                    </span>
                                    {canEdit && (
                                      <button
                                        onClick={() => {
                                          setEditingScoreParticipant(p);
                                          setTempPretest(String(scores.pre));
                                          setTempPosttest(String(scores.post));
                                        }}
                                        title="Ubah Nilai Evaluasi Pre-Test / Post-Test"
                                        className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors cursor-pointer text-xs"
                                      >
                                        ✎
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Aksi (Delete) - Khusus Otoritas Penuh */}
                            {isFullAuthority && (
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRequestDeleteParticipant(p);
                                  }}
                                  title={`Hapus ${p.name} dari daftar peserta`}
                                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-all cursor-pointer active:scale-95 inline-flex items-center justify-center"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          {/* Modal Footer - Compact & Responsive */}
          <div className="p-2 sm:p-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
              <span>
                Total <span className="text-white font-bold tabular-nums">{training.participants.length}</span> Pegawai dari <span className="text-cyan-400 font-bold tabular-nums">{participatingUnits.length}</span> Unit Kerja.
              </span>
              {isFullAuthority && onDeleteTraining && (
                <button
                  type="button"
                  onClick={handleDeleteTraining}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-400 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 transition-all cursor-pointer font-medium text-[11px]"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus Pelatihan</span>
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer self-end sm:self-auto"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Score Edit Popover / Modal */}
      {editingScoreParticipant && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <h4 className="text-sm font-bold text-white mb-1">
              Input Nilai Evaluasi (<span className="italic">Pre-Test / Post-Test</span>)
            </h4>
            <p className="text-xs text-cyan-400 mb-2 line-clamp-1">
              {editingScoreParticipant.name}
            </p>
            <div className="bg-cyan-950/50 border border-cyan-800/50 rounded-xl p-2.5 mb-3.5 text-[11px] text-cyan-200">
              💡 <strong>Aturan Otomatis</strong>: Jika nilai dikosongkan, sistem otomatis mengisi <strong>Pre-Test &gt; 75</strong> dan <strong>Post-Test 100</strong>.
            </div>

            <form onSubmit={handleSaveScore} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">
                  Nilai <span className="italic">Pre-Test</span> (Otomatis &gt; 75 jika kosong)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempPretest}
                  onChange={(e) => setTempPretest(e.target.value)}
                  placeholder="Otomatis > 75 (contoh: 80)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">
                  Nilai <span className="italic">Post-Test</span> (Otomatis 100 jika kosong)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempPosttest}
                  onChange={(e) => setTempPosttest(e.target.value)}
                  placeholder="Otomatis 100"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingScoreParticipant(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nested Add Participant Modal */}
      {showAddParticipant && (
        <AddParticipantModal
          trainingTitle={training.title}
          existingParticipants={training.participants}
          defaultUnit={participatingUnits[0]}
          onClose={() => setShowAddParticipant(false)}
          onAddParticipant={handleAddParticipant}
          onAddParticipants={handleAddParticipants}
        />
      )}

      {/* Nested Print Attendance Modal */}
      {showPrintModal && (
        <PrintAttendanceModal
          training={training}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Nested Excel Upload Modal */}
      {showExcelUploadModal && (
        <ExcelUploadModal
          trainingTitle={training.title}
          trainingCode={training.code}
          currentParticipantCount={training.participants.length}
          onClose={() => setShowExcelUploadModal(false)}
          onImport={handleImportExcelParticipants}
        />
      )}

      {/* MODAL: Edit Training Details */}
      {isEditingTraining && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto aero-border-gradient">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ubah Rincian Agenda Pelatihan</h3>
                  <p className="text-xs text-slate-400 font-mono">{training.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingTraining(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTraining} className="space-y-4 text-xs">
              {/* Judul Pelatihan */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nama / Judul Pelatihan *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Kode Pelatihan */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Kode Pelatihan (Format Resmi: RSIAPLG-XXXX-2026)
                </label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: RSIAPLG-6260-2026"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              {/* Durasi & Tanggal Pelaksanaan (Mendukung Multi-Hari) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">
                    Durasi &amp; Tanggal Pelaksanaan *
                  </label>
                  {editIsMultiDay && (
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80">
                      {calculateDurationDays(editDate, editEndDate)} Hari Pelatihan
                    </span>
                  )}
                </div>

                {/* Preset Pills */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                  {[
                    { id: 1, label: '1 Hari' },
                    { id: 2, label: '2 Hari' },
                    { id: 3, label: '3 Hari' },
                    { id: 4, label: '4 Hari' },
                    { id: 5, label: '5 Hari' },
                    { id: 0, label: 'Kustom' }
                  ].map((preset) => {
                    const days = calculateDurationDays(editDate, editEndDate);
                    const isActive = preset.id === 0 ? (editIsMultiDay && days > 5) : (editIsMultiDay ? days === preset.id : preset.id === 1);
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (preset.id === 1) {
                            setEditIsMultiDay(false);
                            setEditEndDate(editDate);
                          } else if (preset.id === 0) {
                            setEditIsMultiDay(true);
                          } else {
                            setEditIsMultiDay(true);
                            const d = new Date(editDate + 'T00:00:00');
                            d.setDate(d.getDate() + (preset.id - 1));
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            setEditEndDate(`${y}-${m}-${day}`);
                          }
                        }}
                        className={`py-1 px-2 rounded-lg border text-center text-[10px] font-semibold cursor-pointer transition-all ${
                          isActive
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-400 ring-1 ring-cyan-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {editIsMultiDay ? 'Tanggal Mulai *' : 'Tanggal Pelaksanaan *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setEditDate(newStart);
                        if (editIsMultiDay && editEndDate && editEndDate < newStart) {
                          setEditEndDate(newStart);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {editIsMultiDay && (
                    <div>
                      <label className="block text-[11px] font-semibold text-cyan-300 mb-1">
                        Tanggal Selesai *
                      </label>
                      <input
                        type="date"
                        required
                        min={editDate}
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="w-full bg-slate-950 border border-cyan-500/60 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Jenis Pelatihan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Status Pelatihan
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TrainingStatus)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Terjadwal">Terjadwal</option>
                    <option value="Sedang Berlangsung">Sedang Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditunda">Ditunda</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Jenis Pelatihan
                  </label>
                  <select
                    value={editScope}
                    onChange={(e) => setEditScope(e.target.value as TrainingScope)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Internal">Internal (In-House)</option>
                    <option value="Eksternal">Eksternal (Luar)</option>
                  </select>
                </div>
              </div>

              {/* Jam Mulai & Jam Selesai */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Jam Belajar (JP)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={editSksHours}
                    onChange={(e) => setEditSksHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Kuota Peserta
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Lokasi / Ruangan */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Ruangan / Lokasi Pelatihan *
                </label>
                <input
                  type="text"
                  required
                  value={editVenue}
                  onChange={(e) => setEditVenue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Instruktur Details */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
                <span className="font-bold text-slate-300 block">
                  Data Instruktur / Fasilitator Utama
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 mb-0.5">Nama Instruktur</label>
                    <input
                      type="text"
                      value={editInstructorName}
                      onChange={(e) => setEditInstructorName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">Jabatan / Gelar</label>
                    <input
                      type="text"
                      value={editInstructorTitle}
                      onChange={(e) => setEditInstructorTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-0.5">Asal Organisasi / Lembaga</label>
                  <input
                    type="text"
                    value={editInstructorOrg}
                    onChange={(e) => setEditInstructorOrg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Dokumen Pelatihan Eksternal (Jika Jenis Pelatihan Eksternal) */}
              {editScope === 'Eksternal' && (
                <div className="bg-slate-950/70 border border-amber-500/40 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                    <Award className="w-4 h-4" />
                    <span>Upload Dokumen Pelatihan Eksternal</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Sertifikat */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                        <span>Sertifikat Pelatihan</span>
                        {editCertificateUrl && <span className="text-emerald-400 text-[10px]">✓ Ada</span>}
                      </label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleCertificateUpload}
                        className="w-full text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-800 file:text-cyan-300 cursor-pointer"
                      />
                      {editCertificateFileName && (
                        <p className="text-[10px] text-slate-400 truncate">{editCertificateFileName}</p>
                      )}
                    </div>

                    {/* Poster */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                        <span>Poster / Brosur Pelatihan</span>
                        {editPosterUrl && <span className="text-emerald-400 text-[10px]">✓ Ada</span>}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterUpload}
                        className="w-full text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-800 file:text-cyan-300 cursor-pointer"
                      />
                      {editPosterFileName && (
                        <p className="text-[10px] text-slate-400 truncate">{editPosterFileName}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingTraining(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participant Delete Confirmation Modal (In-App Dialog, no window.confirm) */}
      {participantToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl relative shadow-rose-950/40">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-white">
                  Hapus Peserta Pelatihan?
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tindakan ini akan menghapus peserta dari daftar kehadiran sesi ini.
                </p>
              </div>
            </div>

            {/* Target participant card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Nama Peserta</span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  NIK: {participantToDelete.nip}
                </span>
              </div>
              <div className="text-sm font-bold text-white">
                {participantToDelete.name}
              </div>
              <div className="text-xs text-cyan-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>{participantToDelete.unitKerja}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300">{participantToDelete.jabatan}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Catatan nilai <span className="italic">pre-test / post-test</span> dan status kehadiran peserta akan dihapus. Kuota peserta pada pelatihan ini akan bertambah 1 slot.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setParticipantToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteParticipant}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Peserta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training Session Delete Confirmation Modal */}
      {showDeleteTrainingConfirm && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl relative shadow-rose-950/40">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-white">
                  Hapus Agenda Pelatihan?
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {training.code}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mb-4">
              <div className="text-sm font-bold text-white mb-1">
                {training.title}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>{formatDateWithDay(training.date)}</span>
                <span>·</span>
                <span>{training.participants.length} Peserta Terdaftar</span>
              </div>
            </div>

            <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-900/60 rounded-xl p-3 mb-5 leading-relaxed">
              Peringatan: Seluruh data agenda pelatihan ini beserta rekam presensi seluruh peserta akan dihapus secara permanen dari sistem dan cloud Firestore.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteTrainingConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTraining}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Agenda Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Certificate / Poster Preview */}
      {previewMedia && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md">
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
            <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-900">
              <a
                href={previewMedia.url}
                download={previewMedia.title || 'dokumen-pelatihan'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-950 border border-cyan-800 rounded-xl transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-80 flex items-center gap-2 px-4 py-3 bg-slate-900/95 text-emerald-300 border border-emerald-500/50 rounded-2xl shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
};
