import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  Palette, 
  Layers, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Trash2, 
  RotateCcw, 
  Sliders, 
  Eye, 
  Search, 
  Plus, 
  AlertCircle, 
  X, 
  Maximize2, 
  Maximize, 
  Sun, 
  Moon, 
  ShieldCheck,
  Building2,
  Stethoscope,
  Activity,
  FileImage,
  RefreshCw
} from 'lucide-react';
import { 
  AppBackground, 
  PRESET_BACKGROUNDS, 
  getActiveBackground, 
  setActiveBackground, 
  getCustomBackgrounds, 
  addCustomBackground, 
  deleteCustomBackground, 
  resetToDefaultBackground, 
  updateActiveBackgroundSettings, 
  onBackgroundChange,
  normalizeCssBackgroundValue
} from '../utils/backgroundManager';
import { compressImageFile } from '../utils/imageCompressor';

type FilterCategory = 'Semua' | 'Rumah Sakit & Klinis' | 'Medis & Laboratorium' | 'Gradien Gelap & Neon' | 'Abstrak & Cyber Health' | 'Minimalis & Elegan' | 'Kustom Anda';

const CATEGORIES: FilterCategory[] = [
  'Semua',
  'Rumah Sakit & Klinis',
  'Medis & Laboratorium',
  'Gradien Gelap & Neon',
  'Abstrak & Cyber Health',
  'Minimalis & Elegan',
  'Kustom Anda'
];

// Quick gradient presets for the gradient builder
const GRADIENT_PALETTES = [
  { name: 'Cyan Hospital Glow', color1: '#081e2b', color2: '#0e7490', angle: '135deg' },
  { name: 'Emerald Clinical', color1: '#03251c', color2: '#047857', angle: '135deg' },
  { name: 'Deep Space Sapphire', color1: '#030712', color2: '#1e3a8a', angle: '180deg' },
  { name: 'Royal Amethyst RS', color1: '#120727', color2: '#6b21a8', angle: '135deg' },
  { name: 'Titanium Dark Slate', color1: '#090d16', color2: '#334155', angle: '135deg' },
  { name: 'Crimson Emergency', color1: '#18040a', color2: '#9f1239', angle: '135deg' }
];

export const BackgroundSettingsTab: React.FC = () => {
  const [activeBg, setActiveBg] = useState<AppBackground>(getActiveBackground);
  const [customBgs, setCustomBgs] = useState<AppBackground[]>(getCustomBackgrounds);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Manual Addition Drawer / Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [creationMethod, setCreationMethod] = useState<'upload' | 'url' | 'gradient'>('upload');

  // Form Fields
  const [customName, setCustomName] = useState<string>('');
  const [customOverlay, setCustomOverlay] = useState<number>(0.78);
  const [customBlur, setCustomBlur] = useState<number>(0);

  // File Upload State
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadStats, setUploadStats] = useState<{ originalSize: number; compressedSize: number } | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const quickUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Web URL State
  const [urlInput, setUrlInput] = useState<string>('');
  const [urlPreviewValid, setUrlPreviewValid] = useState<boolean | null>(null);
  const [isTestingUrl, setIsTestingUrl] = useState<boolean>(false);

  // Custom Gradient State
  const [gradientColor1, setGradientColor1] = useState<string>('#081e2b');
  const [gradientColor2, setGradientColor2] = useState<string>('#0e7490');
  const [gradientType, setGradientType] = useState<'135deg' | '180deg' | '90deg' | 'radial'>('135deg');

  // Delete Confirmation Modal State
  const [deleteCandidate, setDeleteCandidate] = useState<AppBackground | null>(null);

  // Fullscreen Preview Modal
  const [previewBg, setPreviewBg] = useState<AppBackground | null>(null);

  // Live adjustments for currently active background
  const [liveOverlay, setLiveOverlay] = useState<number>(activeBg.overlayOpacity ?? 0.8);
  const [liveBlur, setLiveBlur] = useState<number>(activeBg.blur ?? 0);

  // Synchronize state with background change event
  useEffect(() => {
    return onBackgroundChange((newBg) => {
      setActiveBg(newBg);
      setLiveOverlay(newBg.overlayOpacity ?? 0.8);
      setLiveBlur(newBg.blur ?? 0);
    });
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Handle switching background
  const handleSelectBackground = (bg: AppBackground) => {
    setActiveBackground(bg);
    setActiveBg(bg);
    showToast(`Latar belakang "${bg.name}" berhasil diterapkan!`);
  };

  // Handle live tuning
  const handleLiveOverlayChange = (val: number) => {
    setLiveOverlay(val);
    const updated = updateActiveBackgroundSettings(val, liveBlur);
    setActiveBg(updated);
  };

  const handleLiveBlurChange = (val: number) => {
    setLiveBlur(val);
    const updated = updateActiveBackgroundSettings(liveOverlay, val);
    setActiveBg(updated);
  };

  // Handle Reset to Default
  const handleResetDefault = () => {
    const def = resetToDefaultBackground();
    setActiveBg(def);
    setLiveOverlay(def.overlayOpacity ?? 0.8);
    setLiveBlur(def.blur ?? 0);
    showToast('Latar belakang dikembalikan ke bawaan (Midnight Aerodynamic).', 'info');
  };

  // Quick Direct Upload Handler: Uploads, compresses, saves, and activates instantly
  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      // Compress to max 1920x1080 with 0.82 quality to ensure fast rendering & light storage
      const result = await compressImageFile(file, 1920, 1080, 0.82);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const titleName = `Foto ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}`;

      const newBg = addCustomBackground({
        name: titleName,
        cssValue: `url('${result.dataUrl}')`,
        thumbnailUrl: result.dataUrl,
        overlayOpacity: liveOverlay,
        blur: liveBlur,
        description: `Diunggah ${new Date().toLocaleDateString('id-ID')} (${(result.compressedSize / 1024).toFixed(1)} KB)`
      });

      setCustomBgs(getCustomBackgrounds());
      setActiveBackground(newBg);
      setActiveBg(newBg);
      showToast(`Foto "${titleName}" berhasil diunggah & langsung aktif sebagai background!`, 'success');
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Gagal memproses gambar. Pastikan format JPG, PNG, atau WEBP.', 'error');
    } finally {
      setIsCompressing(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Handle File Upload & Compression in manual form
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setUploadFileName(file.name);

    try {
      // Compress to max 1920x1080 with 0.82 quality to ensure fast rendering & light storage
      const result = await compressImageFile(file, 1920, 1080, 0.82);
      setUploadedDataUrl(result.dataUrl);
      setUploadStats({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize
      });
      if (!customName.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setCustomName(`Latar ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}`);
      }
      showToast('Gambar berhasil diunggah & dioptimasi otomatis!', 'success');
    } catch (err) {
      console.error('File compression error:', err);
      showToast('Gagal memproses gambar. Pastikan format berupa JPG, PNG, atau WEBP.', 'error');
    } finally {
      setIsCompressing(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Handle URL Validation
  const handleTestUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      showToast('Masukkan URL gambar terlebih dahulu.', 'error');
      return;
    }

    setIsTestingUrl(true);
    const img = new Image();
    img.onload = () => {
      setIsTestingUrl(false);
      setUrlPreviewValid(true);
      showToast('Tautan gambar valid & berhasil dimuat!', 'success');
      if (!customName.trim()) {
        setCustomName('Latar Gambar Kustom Web');
      }
    };
    img.onerror = () => {
      setIsTestingUrl(false);
      setUrlPreviewValid(false);
      showToast('Gambar tidak dapat dimuat dari URL tersebut. Periksa tautan kembali.', 'error');
    };
    img.src = trimmed;
  };

  // Save new custom background
  const handleSaveCustomBackground = (e: React.FormEvent) => {
    e.preventDefault();

    let cssVal = '';
    let thumbVal = '';

    if (creationMethod === 'upload') {
      if (!uploadedDataUrl) {
        showToast('Pilih dan unggah berkas gambar terlebih dahulu.', 'error');
        return;
      }
      cssVal = `url('${uploadedDataUrl}')`;
      thumbVal = uploadedDataUrl;
    } else if (creationMethod === 'url') {
      const trimmedUrl = urlInput.trim();
      if (!trimmedUrl) {
        showToast('Masukkan URL gambar.', 'error');
        return;
      }
      cssVal = `url('${trimmedUrl}')`;
      thumbVal = trimmedUrl;
    } else {
      // Gradient
      if (gradientType === 'radial') {
        cssVal = `radial-gradient(circle at 50% 50%, ${gradientColor2} 0%, ${gradientColor1} 100%)`;
        thumbVal = `radial-gradient(circle at 50% 50%, ${gradientColor2} 0%, ${gradientColor1} 100%)`;
      } else {
        cssVal = `linear-gradient(${gradientType}, ${gradientColor1} 0%, ${gradientColor2} 100%)`;
        thumbVal = `linear-gradient(${gradientType}, ${gradientColor1} 0%, ${gradientColor2} 100%)`;
      }
    }

    const finalName = customName.trim() || `Latar Kustom ${new Date().toLocaleDateString('id-ID')}`;

    const newBg = addCustomBackground({
      name: finalName,
      cssValue: cssVal,
      thumbnailUrl: thumbVal,
      overlayOpacity: customOverlay,
      blur: customBlur,
      description: `Background manual kustom ditambahkan pada ${new Date().toLocaleDateString('id-ID')}.`
    });

    setCustomBgs(getCustomBackgrounds());
    setActiveBackground(newBg);
    setActiveBg(newBg);

    // Reset Form
    setShowAddForm(false);
    setCustomName('');
    setUploadedDataUrl(null);
    setUploadFileName('');
    setUploadStats(null);
    setUrlInput('');
    setUrlPreviewValid(null);

    showToast(`Background kustom "${finalName}" berhasil disimpan dan diterapkan!`);
  };

  // Execute Delete
  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;
    deleteCustomBackground(deleteCandidate.id);
    setCustomBgs(getCustomBackgrounds());
    showToast(`Background "${deleteCandidate.name}" berhasil dihapus.`);
    setDeleteCandidate(null);
  };

  // Combine Presets + Custom
  const allBackgrounds = useMemo(() => {
    return [...PRESET_BACKGROUNDS, ...customBgs];
  }, [customBgs]);

  // Filter & Search
  const filteredBackgrounds = useMemo(() => {
    return allBackgrounds.filter((bg) => {
      const matchCategory = 
        activeCategory === 'Semua' 
          ? true 
          : activeCategory === 'Kustom Anda' 
            ? bg.type === 'custom' 
            : bg.category === activeCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = 
        !q || 
        bg.name.toLowerCase().includes(q) || 
        bg.category.toLowerCase().includes(q) || 
        (bg.description && bg.description.toLowerCase().includes(q));

      return matchCategory && matchSearch;
    });
  }, [allBackgrounds, activeCategory, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-smooth-fade">
      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div 
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between shadow-2xl animate-smooth-slide-up sticky top-2 z-30 backdrop-blur-xl ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/80 text-rose-200'
              : toastMessage.type === 'info'
                ? 'bg-sky-950/90 border-sky-500/80 text-sky-200'
                : 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : toastMessage.type === 'info' ? (
              <Activity className="w-5 h-5 text-sky-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/60 shrink-0">
            <Layers className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Ganti Background Kalender &amp; Portal Diklat
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/60 text-[10px] font-mono text-cyan-300 font-bold">
                20 BACKGROUND RESMI + KUSTOM
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Pilih dari 20 latar belakang elegan tema rumah sakit, ruang operasi, nurse station, gradien safir &amp; neon, atau tambahkan latar belakang kustom Anda sendiri (unggah foto atau tautan web).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 z-10 flex-wrap">
          {/* Hidden Direct File Input for 1-Click Upload */}
          <input 
            type="file"
            ref={quickUploadInputRef}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleQuickUpload}
            className="hidden"
          />

          {/* Primary Action: Direct Photo Upload */}
          <button
            type="button"
            onClick={() => quickUploadInputRef.current?.click()}
            disabled={isCompressing}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-95"
          >
            {isCompressing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Upload className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{isCompressing ? 'Sedang Memproses Foto...' : 'Upload Background (Foto / Gambar)'}</span>
          </button>

          {/* Secondary Action: Toggle Gradient / URL builder */}
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Tutup Gradien & URL' : 'Opsi Gradien & URL Web'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Kembalikan ke latar bawaan resmi"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bawaan</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Currently Active Background & Live Sliders */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div 
              className="w-16 h-11 rounded-xl border border-cyan-500/40 shadow-md overflow-hidden relative shrink-0"
              style={{
                background: activeBg.thumbnailUrl?.startsWith('http') || activeBg.thumbnailUrl?.startsWith('data:') 
                  ? `url('${activeBg.thumbnailUrl}') center/cover no-repeat` 
                  : (activeBg.thumbnailUrl || activeBg.cssValue)
              }}
            >
              <div 
                className="absolute inset-0"
                style={{ backgroundColor: `rgba(11, 15, 25, ${liveOverlay})` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="w-4 h-4 text-cyan-300 drop-shadow" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Background Aktif Saat Ini
                </span>
                <span className="px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 text-[10px] border border-slate-700">
                  {activeBg.type === 'custom' ? 'Kustom Anda' : activeBg.category}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white mt-0.5">
                {activeBg.name}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewBg(activeBg)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tinjau Layar Penuh</span>
            </button>
          </div>
        </div>

        {/* Live Tuning Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Overlay Opacity Slider */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tingkat Kegelapan Lapisan (Dark Overlay)</span>
              </span>
              <span className="font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                {Math.round(liveOverlay * 100)}%
              </span>
            </div>
            <input 
              type="range"
              min="0.20"
              max="0.95"
              step="0.02"
              value={liveOverlay}
              onChange={(e) => handleLiveOverlayChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Lebih Terang (20%)</span>
              <span className="text-cyan-400/80">Direkomendasikan (75% - 85%)</span>
              <span>Sangat Gelap (95%)</span>
            </div>
          </div>

          {/* Backdrop Blur Slider */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Efek Lembut / Buram (Blur Effect)</span>
              </span>
              <span className="font-mono font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60">
                {liveBlur} px
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="8"
              step="1"
              value={liveBlur}
              onChange={(e) => handleLiveBlurChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Tajam / Asli (0px)</span>
              <span className="text-sky-400/80">Lembut (1-2px)</span>
              <span>Sangat Buram (8px)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          FORM: TAMBAH BACKGROUND SECARA MANUAL (UNGGAH / URL / GRADIEN)
      ======================================================== */}
      {showAddForm && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border-2 border-cyan-500/50 shadow-2xl space-y-5 animate-smooth-slide-up relative">
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            aria-label="Tutup Formulir"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">
                Tambah Background Kustom Secara Manual
              </h4>
              <p className="text-xs text-slate-300">
                Gunakan foto gedung RSIA, ruang pelatihan, foto tim, URL web, atau buat gradien elegan sendiri.
              </p>
            </div>
          </div>

          {/* Sub-Method Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
            <button
              type="button"
              onClick={() => setCreationMethod('upload')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                creationMethod === 'upload'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>1. Unggah Gambar dari HP / Laptop</span>
            </button>

            <button
              type="button"
              onClick={() => setCreationMethod('url')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                creationMethod === 'url'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>2. Tautan URL Gambar Web</span>
            </button>

            <button
              type="button"
              onClick={() => setCreationMethod('gradient')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                creationMethod === 'gradient'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>3. Buat Gradien Warna Kustom</span>
            </button>
          </div>

          <form onSubmit={handleSaveCustomBackground} className="space-y-4">
            {/* METHOD 1: FILE UPLOAD */}
            {creationMethod === 'upload' && (
              <div className="space-y-3">
                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-950/70 hover:bg-slate-950 rounded-2xl p-6 text-center cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform mb-3 shadow-md">
                    {isCompressing ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-cyan-300" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>

                  <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {isCompressing ? 'Sedang Mengompresi Gambar Otomatis...' : 'Klik untuk Memilih Foto dari Perangkat'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Mendukung JPG, PNG, WEBP, atau SVG. Gambar dikompresi otomatis tanpa mengurangi ketajaman.
                  </p>
                </div>

                {/* Upload Success Feedback & Preview */}
                {uploadedDataUrl && uploadStats && (
                  <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex flex-col sm:flex-row items-center gap-4 animate-smooth-fade">
                    <img 
                      src={uploadedDataUrl} 
                      alt="Pratinjau Unggahan" 
                      className="w-24 h-16 object-cover rounded-lg border border-cyan-400/40 shrink-0 shadow"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="font-bold text-white truncate">{uploadFileName}</div>
                      <div className="text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>Ukuran Asli: <strong className="text-slate-300">{(uploadStats.originalSize / 1024).toFixed(1)} KB</strong></span>
                        <span>→</span>
                        <span>Dikompresi: <strong className="text-cyan-300 font-bold">{(uploadStats.compressedSize / 1024).toFixed(1)} KB</strong></span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.2 rounded border border-emerald-800">
                          Hemat {Math.round((1 - uploadStats.compressedSize / uploadStats.originalSize) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const finalName = customName.trim() || `Latar ${uploadFileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}`;
                          const newBg = addCustomBackground({
                            name: finalName,
                            cssValue: `url('${uploadedDataUrl}')`,
                            thumbnailUrl: uploadedDataUrl!,
                            overlayOpacity: customOverlay,
                            blur: customBlur,
                            description: `Background manual kustom diunggah ${new Date().toLocaleDateString('id-ID')}.`
                          });
                          setCustomBgs(getCustomBackgrounds());
                          setActiveBackground(newBg);
                          setActiveBg(newBg);
                          setShowAddForm(false);
                          showToast(`Background "${finalName}" berhasil diterapkan!`, 'success');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs cursor-pointer shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Terapkan Langsung</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedDataUrl(null);
                          setUploadStats(null);
                          setUploadFileName('');
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer shrink-0 ml-1"
                      >
                        Ganti
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* METHOD 2: DIRECT URL INPUT */}
            {creationMethod === 'url' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="url"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setUrlPreviewValid(null);
                      }}
                      placeholder="https://images.unsplash.com/... atau tautan gambar langsung"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTestUrl}
                    disabled={isTestingUrl || !urlInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    {isTestingUrl ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>Uji &amp; Muat</span>
                  </button>
                </div>

                {urlPreviewValid === true && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
                    <img 
                      src={urlInput.trim()} 
                      alt="Pratinjau URL" 
                      className="w-20 h-12 object-cover rounded-lg border border-emerald-500/40 shrink-0"
                    />
                    <div className="text-xs text-emerald-300">
                      <strong>Tautan Gambar Valid!</strong> Gambar siap disimpan dan diterapkan sebagai latar belakang.
                    </div>
                  </div>
                )}

                {urlPreviewValid === false && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Gambar gagal dimuat dari tautan tersebut. Pastikan tautan langsung mengarah ke file gambar (.jpg, .png, dsb).</span>
                  </div>
                )}
              </div>
            )}

            {/* METHOD 3: GRADIENT BUILDER */}
            {creationMethod === 'gradient' && (
              <div className="space-y-4">
                {/* Palette Quick Pick */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                    Pilihan Palet Gradien Medis Cepat:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GRADIENT_PALETTES.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setGradientColor1(p.color1);
                          setGradientColor2(p.color2);
                          setGradientType(p.angle as any);
                          if (!customName.trim()) setCustomName(p.name);
                        }}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 flex items-center gap-2.5 text-left cursor-pointer transition-all"
                      >
                        <span 
                          className="w-5 h-5 rounded-lg border border-white/20 shrink-0 shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${p.color1}, ${p.color2})` }}
                        />
                        <span className="text-[11px] font-semibold text-slate-200 truncate">
                          {p.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Warna Pertama (Base Dark)
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color"
                        value={gradientColor1}
                        onChange={(e) => setGradientColor1(e.target.value)}
                        className="w-9 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={gradientColor1}
                        onChange={(e) => setGradientColor1(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Warna Kedua (Aksen)
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color"
                        value={gradientColor2}
                        onChange={(e) => setGradientColor2(e.target.value)}
                        className="w-9 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={gradientColor2}
                        onChange={(e) => setGradientColor2(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Arah Gradien
                    </label>
                    <select
                      value={gradientType}
                      onChange={(e) => setGradientType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="135deg">Diagonal 135°</option>
                      <option value="180deg">Vertikal 180°</option>
                      <option value="90deg">Horisontal 90°</option>
                      <option value="radial">Melingkar (Radial)</option>
                    </select>
                  </div>
                </div>

                {/* Live Gradient Preview Box */}
                <div 
                  className="w-full h-20 rounded-xl border border-cyan-500/40 shadow-inner flex items-center justify-center text-xs font-bold text-white/90"
                  style={{
                    background: gradientType === 'radial'
                      ? `radial-gradient(circle at 50% 50%, ${gradientColor2} 0%, ${gradientColor1} 100%)`
                      : `linear-gradient(${gradientType}, ${gradientColor1} 0%, ${gradientColor2} 100%)`
                  }}
                >
                  Pratinjau Gradien Langsung
                </div>
              </div>
            )}

            {/* Custom Background Name & Opacity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nama Latar Belakang Kustom *
                </label>
                <input 
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Contoh: Gedung Rawat Inap RSIA Az Zahra"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Lapisan Gelap (Overlay): {Math.round(customOverlay * 100)}%
                </label>
                <input 
                  type="range"
                  min="0.20"
                  max="0.95"
                  step="0.05"
                  value={customOverlay}
                  onChange={(e) => setCustomOverlay(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-2"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Simpan &amp; Terapkan Sekarang</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          GALLERY OF 20 PRESETS + USER'S CUSTOM BACKGROUNDS
      ======================================================== */}
      <div className="space-y-4">
        {/* Category Pills & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {CATEGORIES.map((cat) => {
              const count = 
                cat === 'Semua' 
                  ? allBackgrounds.length 
                  : cat === 'Kustom Anda' 
                    ? customBgs.length 
                    : PRESET_BACKGROUNDS.filter(b => b.category === cat).length;

              const isCatActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                    isCatActive
                      ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/25'
                      : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isCatActive ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari background..."
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Background Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Direct Upload Card as 1st Item (Visible when viewing All or Custom) */}
          {(!searchQuery && (activeCategory === 'Semua' || activeCategory === 'Kustom Anda')) && (
            <div
              onClick={() => quickUploadInputRef.current?.click()}
              className="group relative rounded-2xl border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 bg-gradient-to-b from-cyan-950/30 to-slate-900/80 hover:from-cyan-950/50 hover:to-slate-900 flex flex-col justify-between overflow-hidden transition-all duration-200 shadow-xl cursor-pointer p-4 text-center min-h-[260px] active:scale-[0.99]"
            >
              <div className="flex-1 flex flex-col items-center justify-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:border-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all mb-3 shadow-md">
                  {isCompressing ? (
                    <RefreshCw className="w-7 h-7 animate-spin text-cyan-300" />
                  ) : (
                    <Upload className="w-7 h-7 stroke-[2.2]" />
                  )}
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-[10px] font-mono text-cyan-300 font-bold mb-2">
                  UPLOAD DARI PERANGKAT
                </span>
                <h4 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                  {isCompressing ? 'Sedang Memproses Foto...' : 'Upload Foto / Wallpaper'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                  Pilih file JPG, PNG, atau WEBP dari HP/Laptop. Otomatis dikompres &amp; langsung aktif.
                </p>
              </div>

              <div className="pt-3 border-t border-cyan-500/20">
                <div className="w-full py-2 px-3 rounded-xl bg-cyan-500 group-hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Pilih Gambar Sekarang</span>
                </div>
              </div>
            </div>
          )}

          {filteredBackgrounds.map((bg) => {
            const isActive = activeBg.id === bg.id;
            return (
              <div
                key={bg.id}
                className={`group relative rounded-2xl border flex flex-col justify-between overflow-hidden transition-all duration-200 shadow-xl ${
                  isActive
                    ? 'bg-slate-900/95 border-cyan-400 ring-2 ring-cyan-400/40 shadow-cyan-950/60'
                    : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                {/* Visual Thumbnail (Aspect Ratio 16:9) */}
                <div 
                  className="relative w-full aspect-video overflow-hidden cursor-pointer bg-slate-950"
                  onClick={() => handleSelectBackground(bg)}
                >
                  <div 
                    className="absolute inset-0 bg-center bg-cover transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: bg.thumbnailUrl?.startsWith('http') || bg.thumbnailUrl?.startsWith('data:')
                        ? `url('${bg.thumbnailUrl}')`
                        : (bg.thumbnailUrl || bg.cssValue)
                    }}
                  />
                  {/* Subtle Dark Overlay */}
                  <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-slate-300 border border-slate-700/80">
                      {bg.type === 'custom' ? 'Kustom Anda' : bg.category}
                    </span>

                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/90 backdrop-blur-md border border-cyan-400 text-cyan-300 text-[10px] font-black shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>

                  {/* Zoom Preview Quick Button on Hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewBg(bg);
                    }}
                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-950/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow"
                    title="Tinjau Layar Penuh"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {bg.name}
                    </h5>
                    {bg.description && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {bg.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleSelectBackground(bg)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 cursor-default'
                          : 'bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Digunakan</span>
                        </>
                      ) : (
                        <span>Terapkan</span>
                      )}
                    </button>

                    {/* Delete button if custom */}
                    {bg.type === 'custom' && (
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(bg)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-900/60"
                        title="Hapus background kustom ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredBackgrounds.length === 0 && (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
            <ImageIcon className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-white">Tidak ada background yang sesuai pencarian</p>
            <p className="text-xs text-slate-500 mt-1">Coba kata kunci lain atau pilih kategori &quot;Semua&quot;.</p>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: KONFIRMASI HAPUS BACKGROUND KUSTOM
      ======================================================== */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-smooth-fade">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/50 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Hapus Background Kustom?</h4>
                <p className="text-xs text-slate-400">Latar belakang ini akan dihapus dari daftar pilihan Anda.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              Latar: <strong className="text-white">{deleteCandidate.name}</strong>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PRATINJAU LAYAR PENUH (FULLSCREEN PREVIEW)
      ======================================================== */}
      {previewBg && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-between p-6 bg-slate-950 animate-smooth-fade overflow-hidden"
          style={{
            backgroundImage: normalizeCssBackgroundValue(previewBg.cssValue),
            backgroundPosition: 'center center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Overlay simulator */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ 
              backgroundColor: `rgba(11, 15, 25, ${previewBg.overlayOpacity ?? liveOverlay})`,
              backdropFilter: `blur(${previewBg.blur ?? liveBlur}px)`
            }}
          />

          {/* Top Bar Preview */}
          <div className="relative z-10 flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl shadow-2xl max-w-4xl mx-auto w-full">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Mode Pratinjau Layar Penuh
              </span>
              <h3 className="text-base font-black text-white">{previewBg.name}</h3>
              <p className="text-xs text-slate-400">{previewBg.category} · {previewBg.description || 'Latar Belakang RSIA Az Zahra'}</p>
            </div>

            <div className="flex items-center gap-2">
              {activeBg.id !== previewBg.id && (
                <button
                  type="button"
                  onClick={() => {
                    handleSelectBackground(previewBg);
                    setPreviewBg(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black shadow-lg cursor-pointer"
                >
                  Terapkan Sekarang
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreviewBg(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Simulated Cards */}
          <div className="relative z-10 max-w-2xl mx-auto w-full p-6 rounded-2xl bg-slate-900/80 border border-slate-700/80 backdrop-blur-xl shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Simulasi Tampilan Konten</h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-lg mx-auto">
              Ini adalah pratinjau bagaimana teks, kalender, dan kartu pelatihan terbaca dengan jelas saat background ini digunakan.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-bold">
                Kontras Terjaga 100%
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold">
                Standar Rumah Sakit
              </span>
            </div>
          </div>

          {/* Bottom Bar Close */}
          <div className="relative z-10 text-center">
            <button
              type="button"
              onClick={() => setPreviewBg(null)}
              className="px-4 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold cursor-pointer shadow-xl backdrop-blur-md"
            >
              Kembali ke Pengaturan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
