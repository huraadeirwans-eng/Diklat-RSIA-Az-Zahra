import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Edit3, 
  RotateCcw, 
  Sliders, 
  Check, 
  UserCheck, 
  Sparkles, 
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Training } from '../types/training';
import { formatDateWithDay, calculateDurationDays } from '../utils/dateUtils';
import { ForeignText } from '../utils/textFormatter';
import { 
  getStoredPrintSigneeConfig, 
  savePrintSigneeConfig, 
  onPrintSigneeConfigChange 
} from '../utils/printConfigManager';

interface PrintAttendanceModalProps {
  training: Training;
  onClose: () => void;
}

interface SigneeConfig {
  approvalPrefix: string;
  signerRole: string;
  signerName: string;
  signerNip: string;
  instructorRole: string;
  instructorName: string;
  instructorTitle: string;
  cityDate: string;
}

const STORAGE_SIGNEE_KEY = 'simrs_diklat_print_signee_config_v2';

export const PrintAttendanceModal: React.FC<PrintAttendanceModalProps> = ({
  training,
  onClose
}) => {
  const isMultiDay = Boolean(training.endDate && training.endDate > training.date);
  const totalDays = isMultiDay ? calculateDurationDays(training.date, training.endDate) : 1;

  const globalCfg = getStoredPrintSigneeConfig();

  const defaultSigneeConfig: SigneeConfig = {
    approvalPrefix: globalCfg.leftPrefix || 'Mengetahui,',
    signerRole: globalCfg.rightRole || 'Kepala Divisi HC & SDM',
    signerName: globalCfg.rightName || 'Ratna Kusuma Dewi, S.Psi., M.M.',
    signerNip: globalCfg.rightNip || '19870914 201102 2 001',
    instructorRole: 'Instruktur / Pemateri,',
    instructorName: training.instructor?.name || 'Instruktur Pelatihan',
    instructorTitle: training.instructor?.title || 'Fasilitator & Spesialis Materi',
    cityDate: ''
  };

  // Load custom signee free-text from localStorage or fallback
  const [signee, setSignee] = useState<SigneeConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SIGNEE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSigneeConfig,
          ...parsed,
          // Keep training's actual instructor if not previously overwritten
          instructorName: parsed.instructorName || training.instructor?.name || defaultSigneeConfig.instructorName,
          instructorTitle: parsed.instructorTitle || training.instructor?.title || defaultSigneeConfig.instructorTitle
        };
      }
    } catch (e) {
      console.warn('Failed to read signee config:', e);
    }
    return defaultSigneeConfig;
  });

  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(true);
  const [isSavedAlert, setIsSavedAlert] = useState<boolean>(false);

  // Sync when global config changes
  useEffect(() => {
    return onPrintSigneeConfigChange((newGlobal) => {
      setSignee((prev) => ({
        ...prev,
        approvalPrefix: newGlobal.leftPrefix || prev.approvalPrefix,
        signerRole: newGlobal.rightRole || prev.signerRole,
        signerName: newGlobal.rightName || prev.signerName,
        signerNip: newGlobal.rightNip || prev.signerNip
      }));
    });
  }, []);

  // Sync back to localStorage & global config whenever altered
  const handleUpdateSignee = (field: keyof SigneeConfig, value: string) => {
    setSignee((prev) => {
      const updated = { ...prev, [field]: value };
      try {
        localStorage.setItem(STORAGE_SIGNEE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save signee config:', e);
      }

      // Propagate common signee changes to global print config
      try {
        const currentGlobal = getStoredPrintSigneeConfig();
        if (field === 'signerRole') {
          savePrintSigneeConfig({ ...currentGlobal, rightRole: value });
        } else if (field === 'signerName') {
          savePrintSigneeConfig({ ...currentGlobal, rightName: value });
        } else if (field === 'signerNip') {
          savePrintSigneeConfig({ ...currentGlobal, rightNip: value });
        }
      } catch (e) {
        console.warn('Failed to propagate global print signee:', e);
      }

      return updated;
    });
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2000);
  };

  const handleResetDefaults = () => {
    setSignee(defaultSigneeConfig);
    try {
      localStorage.removeItem(STORAGE_SIGNEE_KEY);
    } catch (e) {
      console.warn('Failed to reset signee config:', e);
    }
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:fixed print:inset-0 print:p-0 print:bg-white print:z-[99999] print-container">
      <div 
        id="print-attendance-sheet"
        className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-4 sm:p-8 flex flex-col print:max-h-none print:overflow-visible print:shadow-none print:border-none print:p-0 print:rounded-none"
      >
        {/* ========================================================
            MODAL CONTROLS (Hidden during actual print)
        ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight">
                Pratinjau Cetak Lembar Presensi Resmi
              </h3>
              <p className="text-xs text-slate-500">
                Format standar formulir absensi pelatihan corporate &amp; tandatangan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfigPanel((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-300"
              title="Kustomisasi teks jabatan dan nama penandatangan"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-600" />
              <span>{showConfigPanel ? 'Tutup Pengaturan Teks' : 'Kustomisasi Teks / Pejabat'}</span>
              {showConfigPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-cyan-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen (<span className="italic">Print / PDF</span>)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================
            PANEL KUSTOMISASI FREE-TEXT PENANDATANGAN (Print: Hidden)
        ======================================================== */}
        {showConfigPanel && (
          <div className="mb-6 p-4 bg-gradient-to-br from-slate-50 to-cyan-50/40 rounded-2xl border border-cyan-200/80 shadow-xs print:hidden space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-900">
                <Edit3 className="w-4 h-4 text-cyan-600" />
                <span>Pengaturan Free Teks Penandatangan &amp; Pejabat (Bisa Diedit Bebas)</span>
              </div>
              <div className="flex items-center gap-2">
                {isSavedAlert && (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in">
                    <Check className="w-3.5 h-3.5" /> Tersimpan Otomatis
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Kembalikan ke format default"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Kolom Kanan: Pejabat Penandatangan (Kepala Divisi dsb) */}
              <div className="bg-white p-3 rounded-xl border border-cyan-100 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Pejabat Penandatangan Dokumen</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Jabatan Penandatangan (Free Teks)
                  </label>
                  <input
                    type="text"
                    value={signee.signerRole}
                    onChange={(e) => handleUpdateSignee('signerRole', e.target.value)}
                    placeholder="Contoh: Kepala Divisi Human Capital & SDM"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Nama Lengkap &amp; Gelar
                    </label>
                    <input
                      type="text"
                      value={signee.signerName}
                      onChange={(e) => handleUpdateSignee('signerName', e.target.value)}
                      placeholder="Contoh: Ratna Kusuma Dewi, S.Psi., M.M."
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      NIK / Nomor Pegawai
                    </label>
                    <input
                      type="text"
                      value={signee.signerNip}
                      onChange={(e) => handleUpdateSignee('signerNip', e.target.value)}
                      placeholder="Contoh: 19870914 201102 2 001"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Teks Pengantar
                    </label>
                    <input
                      type="text"
                      value={signee.approvalPrefix}
                      onChange={(e) => handleUpdateSignee('approvalPrefix', e.target.value)}
                      placeholder="Mengetahui,"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Kota &amp; Tanggal Dokumen (Opsional)
                    </label>
                    <input
                      type="text"
                      value={signee.cityDate}
                      onChange={(e) => handleUpdateSignee('cityDate', e.target.value)}
                      placeholder="Contoh: Jakarta, 25 Oktober 2026"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Kolom Kiri: Instruktur / Pemateri */}
              <div className="bg-white p-3 rounded-xl border border-cyan-100 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <FileText className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Instruktur / Pemateri (Kiri)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Judul Pengantar Instruktur
                  </label>
                  <input
                    type="text"
                    value={signee.instructorRole}
                    onChange={(e) => handleUpdateSignee('instructorRole', e.target.value)}
                    placeholder="Instruktur / Pemateri,"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Nama Pemateri
                  </label>
                  <input
                    type="text"
                    value={signee.instructorName}
                    onChange={(e) => handleUpdateSignee('instructorName', e.target.value)}
                    placeholder="Nama Instruktur"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Keterangan / Jabatan Pemateri
                  </label>
                  <input
                    type="text"
                    value={signee.instructorTitle}
                    onChange={(e) => handleUpdateSignee('instructorTitle', e.target.value)}
                    placeholder="Keterangan atau Spesialisasi"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] font-semibold text-slate-700">Pilihan Cepat Format Tanda Tangan:</span>
              <button
                type="button"
                onClick={() => {
                  const globalConfig = getStoredPrintSigneeConfig();
                  setSignee(prev => ({
                    ...prev,
                    approvalPrefix: globalConfig.leftPrefix || 'Mengetahui,',
                    instructorRole: `${globalConfig.leftPrefix || 'Mengetahui,'}\n${globalConfig.leftRole || 'Kepala Bidang Keperawatan'}`,
                    instructorName: globalConfig.leftName || 'Ns. Siti Rahmawati, S.Kep.',
                    instructorTitle: `${globalConfig.leftNipLabel || 'NIK'}: ${globalConfig.leftNip || '19920315 201601 2 001'}`,
                    signerRole: globalConfig.rightRole || 'Ka. Subag Kepegawaian & SDM',
                    signerName: globalConfig.rightName || 'Ratna Kusuma Dewi, S.Psi., M.M.',
                    signerNip: globalConfig.rightNip || '19870914 201102 2 001'
                  }));
                  setIsSavedAlert(true);
                  setTimeout(() => setIsSavedAlert(false), 2000);
                }}
                className="px-2.5 py-1 rounded-lg bg-cyan-100 hover:bg-cyan-200 text-cyan-900 border border-cyan-300 text-[11px] font-semibold cursor-pointer transition-colors"
              >
                📋 Format RSIA Az Zahra (Keperawatan &amp; Ka. Subag SDM)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSignee(prev => ({
                    ...prev,
                    approvalPrefix: 'Mengetahui,',
                    instructorRole: 'Instruktur / Pemateri,',
                    instructorName: training.instructor?.name || 'Instruktur Pelatihan',
                    instructorTitle: training.instructor?.title || 'Fasilitator & Spesialis Materi',
                    signerRole: 'Ka. Subag Kepegawaian & SDM',
                    signerName: 'Ratna Kusuma Dewi, S.Psi., M.M.',
                    signerNip: '19870914 201102 2 001'
                  }));
                  setIsSavedAlert(true);
                  setTimeout(() => setIsSavedAlert(false), 2000);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[11px] font-semibold cursor-pointer transition-colors"
              >
                🎓 Format Diklat Klinis (Instruktur &amp; Ka. Subag SDM)
              </button>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              💡 Tip: Anda dapat langsung mengubah teks jabatan, nama, atau NIK di atas. Perubahan akan tersimpan otomatis dan sinkron dengan pengaturan terpusat cetak dokumen RSIA Az Zahra.
            </p>
          </div>
        )}

        {/* ========================================================
            PRINTABLE SHEET (Yang akan dicetak ke Printer / PDF)
        ======================================================== */}
        <div className="space-y-6 print:p-0">
          {/* Official Corporate Header */}
          <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider text-slate-900 italic">
                COORPORATE LEARNING CENTER &amp; ACADEMY
              </h1>
              <p className="text-xs text-slate-600 uppercase tracking-widest mt-0.5">
                Pusat Pengembangan Kompetensi &amp; Manajemen Sumber Daya Manusia
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <div>FORMULIR: HC-TRN-04</div>
              <div>REVISI: 02/2026</div>
            </div>
          </div>

          {/* Training Info Box */}
          <div className="text-center py-2">
            <h2 className="text-lg font-bold text-slate-900 uppercase underline tracking-wide">
              DAFTAR HADIR PESERTA PELATIHAN
            </h2>
            <p className="text-sm font-semibold text-slate-800 mt-1"><ForeignText text={training.title} /></p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="mb-1">
                <span className="font-semibold text-slate-600">Kode Pelatihan: </span>
                <span className="font-mono text-slate-900">{training.code}</span>
              </div>
              <div className="mb-1">
                <span className="font-semibold text-slate-600">Kategori: </span>
                <span className="text-slate-900">{training.category}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Instruktur / Fasilitator: </span>
                <span className="text-slate-900 font-medium">{signee.instructorName}</span>
              </div>
            </div>

            <div>
              <div className="mb-1">
                <span className="font-semibold text-slate-600">Hari / Tanggal: </span>
                <span className="text-slate-900 font-medium">
                  {isMultiDay
                    ? `${formatDateWithDay(training.date)} s/d ${formatDateWithDay(training.endDate!)} (${totalDays} Hari Pelatihan)`
                    : formatDateWithDay(training.date)}
                </span>
              </div>
              <div className="mb-1">
                <span className="font-semibold text-slate-600">Waktu &amp; Durasi: </span>
                <span className="text-slate-900">
                  {training.startTime} - {training.endTime} WIB 
                  {isMultiDay ? ` (${training.sksHours} JP/hari · Total ${training.sksHours * totalDays} JP)` : ` (${training.sksHours} JP)`}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Lokasi / Ruangan: </span>
                <span className="text-slate-900"><ForeignText text={training.venue} /></span>
              </div>
            </div>
          </div>

          {/* Participant Table */}
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                <th className="p-2 border-r border-slate-300 text-center w-10">No</th>
                <th className="p-2 border-r border-slate-300 text-center">Nama Lengkap &amp; NIK (Nomor Induk Karyawan)</th>
                <th className="p-2 border-r border-slate-300 text-center">Unit Kerja</th>
                <th className="p-2 border-r border-slate-300 text-center">Jabatan</th>
                <th className="p-2 border-r border-slate-300 text-center w-24">Status</th>
                <th className="p-2 text-center w-36">Tanda Tangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {training.participants.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-2 border-r border-slate-300 text-center tabular-nums">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-300">
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">NIK: {p.nip}</div>
                  </td>
                  <td className="p-2 border-r border-slate-300 font-medium text-slate-800">
                    {p.unitKerja}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-slate-700">
                    {p.jabatan}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-center">
                    <span className="text-[11px] font-semibold">
                      {p.statusKehadiran}
                    </span>
                  </td>
                  <td className="p-2 text-center text-[10px] text-slate-400">
                    {/* Blank space for physical signing */}
                    <div className="h-9 border-b border-dotted border-slate-400 mx-2 flex items-end justify-center pb-1">
                      {p.statusKehadiran === 'Hadir' ? '✓ Hadir' : ''}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ========================================================
              SIGNATURES SECTION (DENGAN FREE TEKS JABATAN & NAMA)
          ======================================================== */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
            {/* Sisi Kiri: Instruktur / Pemateri */}
            <div>
              <p className="text-slate-600 mb-16">{signee.instructorRole}</p>
              <p className="font-bold text-slate-900 underline">{signee.instructorName}</p>
              <p className="text-slate-500 mt-0.5">{signee.instructorTitle}</p>
            </div>

            {/* Sisi Kanan: Pejabat Penandatangan (Free Teks) */}
            <div>
              {signee.cityDate && (
                <p className="text-slate-600 mb-1">{signee.cityDate}</p>
              )}
              <p className="text-slate-600 mb-16">
                {signee.approvalPrefix}
                <br />
                <span className="font-semibold text-slate-700">{signee.signerRole}</span>
              </p>
              <p className="font-bold text-slate-900 underline text-sm sm:text-xs">
                {signee.signerName}
              </p>
              {signee.signerNip && (
                <p className="text-slate-500 font-mono mt-0.5">
                  {signee.signerNip.toLowerCase().startsWith('nik') || signee.signerNip.toLowerCase().startsWith('nip') ? signee.signerNip : `NIK: ${signee.signerNip}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
