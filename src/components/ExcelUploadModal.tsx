import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Users, 
  Building2,
  FileText,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Participant, AttendanceStatus } from '../types/training';
import { getDeterministicPretestScore } from '../utils/evaluationHelper';

interface ExcelUploadModalProps {
  trainingTitle: string;
  trainingCode: string;
  currentParticipantCount: number;
  onClose: () => void;
  onImport: (newParticipants: Participant[], mode: 'append' | 'replace') => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  trainingTitle,
  trainingCode,
  currentParticipantCount,
  onClose,
  onImport
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Participant[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate and download a sample Excel template (.xlsx) with exact requested columns
  const handleDownloadTemplate = () => {
    const templateData = [
      ['NO.', 'NAMA LENGKAP', 'NIK', 'UNIT KERJA', 'JABATAN', 'STATUS KEHADIRAN'],
      ['1', 'Ns. Siti Rahmawati, S.Kep.', '3271015608920002', 'Nursing Preceptor', 'Senior Clinical Preceptor', 'Hadir'],
      ['2', 'Ns. Arif Hidayat, S.Kep.', '3271012304900001', 'Nursing Units Head', 'Kepala Ruangan Rawat Inap', 'Konfirmasi'],
      ['3', 'dr. Budi Santoso, Sp.An.', '3271011511880003', 'Intensive Care', 'Dokter Spesialis Anastesi & ICU', 'Terdaftar'],
      ['4', 'Ratna Kusuma, S.Psi.', '3271014805930004', 'HC', 'Talent Development Officer', 'Izin']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    
    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 22 },
      { wch: 38 },
      { wch: 28 },
      { wch: 20 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar_Peserta');
    XLSX.writeFile(workbook, `Template_Peserta_${trainingCode}.xlsx`);
  };

  // Parse Excel / CSV file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON array of objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('File Excel kosong atau tidak memiliki baris data.');
          setParsedData([]);
          setIsProcessing(false);
          return;
        }

        // Helper to normalize column keys
        const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

        const participants: Participant[] = [];
        const todayDate = new Date().toISOString().split('T')[0];

        rawJson.forEach((row, index) => {
          // Look up columns flexibly
          let name = '';
          let nip = '';
          let unitKerja = '';
          let jabatan = '';
          let email = '';
          let phone = '';
          let status: AttendanceStatus = 'Terdaftar';

          for (const key of Object.keys(row)) {
            const cleanKey = normalizeKey(key);
            const val = String(row[key]).trim();

            if (cleanKey.includes('nama') || cleanKey === 'name' || cleanKey.includes('peserta')) {
              if (!name) name = val;
            } else if (cleanKey.includes('nip') || cleanKey.includes('nik') || cleanKey === 'id' || cleanKey.includes('karyawan')) {
              if (!nip) nip = val;
            } else if (cleanKey.includes('unit') || cleanKey.includes('divisi') || cleanKey.includes('dept') || cleanKey.includes('departemen')) {
              if (!unitKerja) unitKerja = val;
            } else if (cleanKey.includes('jabatan') || cleanKey.includes('posisi') || cleanKey === 'role' || cleanKey.includes('position')) {
              if (!jabatan) jabatan = val;
            } else if (cleanKey.includes('email') || cleanKey.includes('mail') || cleanKey.includes('surel')) {
              if (!email) email = val;
            } else if (cleanKey.includes('telp') || cleanKey.includes('phone') || cleanKey.includes('hp') || cleanKey.includes('wa') || cleanKey.includes('kontak')) {
              if (!phone) phone = val;
            } else if (cleanKey.includes('status') || cleanKey.includes('kehadiran') || cleanKey.includes('presensi')) {
              const lowerVal = val.toLowerCase();
              if (lowerVal.includes('hadir')) status = 'Hadir';
              else if (lowerVal.includes('konfirm')) status = 'Konfirmasi';
              else if (lowerVal.includes('izin') || lowerVal.includes('ijin')) status = 'Izin';
              else status = 'Terdaftar';
            }
          }

          // If row has at least a name
          if (name) {
            const preCalculated = getDeterministicPretestScore(nip || name);
            participants.push({
              id: `excel-p-${Date.now()}-${index}`,
              name,
              nip: nip || `199${Math.floor(100000000000 + Math.random() * 900000000000)}`,
              unitKerja: unitKerja?.toUpperCase() === 'HRD' ? 'HC' : (unitKerja || 'Unit Belum Ditentukan'),
              jabatan: jabatan || 'Staff Pelaksana',
              email: email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@coorporate.co.id`,
              phone: phone || '+62 812-0000-0000',
              statusKehadiran: status,
              nilaiPretest: preCalculated,
              nilaiPosttest: 100,
              registeredAt: todayDate
            });
          }
        });

        if (participants.length === 0) {
          setErrorMsg('Tidak ditemukan kolom "Nama" atau "Nama Lengkap" yang valid dalam file Excel.');
        } else {
          setParsedData(participants);
        }
      } catch (err: any) {
        console.error('Error reading Excel:', err);
        setErrorMsg('Gagal membaca file Excel. Pastikan format file adalah .xlsx, .xls, atau .csv yang valid.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Terjadi kesalahan saat membaca file.');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;
    onImport(parsedData, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[95dvh] sm:max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden aero-border-gradient">
        {/* Top Glow */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Unggah Daftar Peserta dari <span className="italic">File Excel</span>
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1">
                {trainingTitle} ({trainingCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Instructions & Template download banner */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Format Kolom <span className="italic">Template Excel</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Format standar: <span className="text-cyan-400 font-semibold font-mono">NO. | NAMA LENGKAP | NIK | UNIT KERJA | JABATAN | STATUS KEHADIRAN</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh <span className="italic">Template Excel</span> (.xlsx)</span>
            </button>
          </div>

          {/* Drag & Drop File Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
              file
                ? 'border-cyan-500/60 bg-cyan-950/20'
                : 'border-slate-700/80 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-slate-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>

            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-white flex items-center justify-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                  <span>{file.name}</span>
                </p>
                <p className="text-xs text-slate-400">
                  Ukuran: {(file.size / 1024).toFixed(1)} KB · Klik untuk mengganti file
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  Pilih atau Tarik <span className="italic">File Excel</span> (.xlsx, .xls, .csv) ke Sini
                </p>
                <p className="text-xs text-slate-400">
                  Daftar peserta akan otomatis dibaca dan diekstrak nama serta unit kerjanya
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview of Parsed Data */}
          {parsedData.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Berhasil Membaca {parsedData.length} Data Peserta</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Menampilkan 4 data pertama sebagai pratinjau:
                </span>
              </div>

              {/* Mini Preview Table */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <th className="py-2 px-3 font-semibold w-10 text-center">No</th>
                      <th className="py-2 px-3 font-semibold">Nama Peserta & NIK</th>
                      <th className="py-2 px-3 font-semibold">Unit Kerja</th>
                      <th className="py-2 px-3 font-semibold">Jabatan</th>
                      <th className="py-2 px-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parsedData.slice(0, 4).map((p, idx) => (
                      <tr key={idx} className="text-slate-300">
                        <td className="py-2 px-3 text-center tabular-nums text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-white block">{p.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{p.nip}</span>
                        </td>
                        <td className="py-2 px-3 text-cyan-400 font-medium">{p.unitKerja}</td>
                        <td className="py-2 px-3 text-slate-400">{p.jabatan}</td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {p.statusKehadiran}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedData.length > 4 && (
                <p className="text-[11px] text-slate-500 text-center">
                  ... dan {parsedData.length - 4} peserta lainnya siap diimpor.
                </p>
              )}

              {/* Mode Selection */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 mt-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Opsi Penggabungan Data:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    importMode === 'append'
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-cyan-500 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-white">Tambahkan ke Daftar Saat Ini (<span className="italic">Append</span>)</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Menambahkan {parsedData.length} orang ke {currentParticipantCount} peserta yang sudah ada.
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    importMode === 'replace'
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-cyan-500 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-white">Gantikan Seluruh Daftar (<span className="italic">Replace</span>)</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Mengganti seluruh peserta dengan {parsedData.length} data baru dari Excel ini.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={parsedData.length === 0 || isProcessing}
            onClick={handleConfirmImport}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              parsedData.length > 0 && !isProcessing
                ? 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white shadow-md shadow-cyan-500/30 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Impor {parsedData.length > 0 ? `${parsedData.length} Peserta` : 'Data Excel'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
