import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle2, Share, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string; compact?: boolean }> = ({ className = '', compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already installed and launched as standalone app, hide button
  if (isInstalled && !installedSuccess) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstalledSuccess(true);
        setTimeout(() => setInstalledSuccess(false), 4000);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`group flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 hover:border-emerald-400/50 shadow-xs transition-all duration-150 cursor-pointer active:scale-98 ${className}`}
        title="Pasang aplikasi SIMRS Diklat di HP Android atau Komputer Anda"
        aria-label="Instal Aplikasi Android"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-105 transition-transform shrink-0" />
        <span className="tracking-tight font-medium">{compact ? 'Instal App' : 'Instal di Android'}</span>
        <Download className="w-3 h-3 text-emerald-400/70 group-hover:translate-y-0.5 transition-transform shrink-0" />
      </button>

      {/* Guide Dialog when browser prompt requires manual trigger or on iOS/PC */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-smooth-fade">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Instal Aplikasi di Android &amp; HP</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </h3>
                <p className="text-[11px] text-slate-400">
                  Nikmati pengalaman aplikasi mandiri tanpa bilah browser.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 mb-5">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-emerald-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-[10px] text-emerald-300 font-bold shrink-0">
                    1
                  </span>
                  <span>Di HP Android (Google Chrome):</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                  Ketuk ikon titik tiga <strong>(⋮)</strong> di pojok kanan atas browser Chrome, lalu pilih menu <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                </p>
              </div>

              {isIOS ? (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-sky-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-950 border border-sky-600 flex items-center justify-center text-[10px] text-sky-300 font-bold shrink-0">
                      2
                    </span>
                    <span>Di iPhone / iPad (Safari):</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                    Ketuk tombol <strong>Share</strong> (ikon kotak tanda panah ke atas) di menu bawah Safari, lalu pilih <strong>"Add to Home Screen"</strong> (Tambah ke Layar Utama).
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-cyan-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-600 flex items-center justify-center text-[10px] text-cyan-300 font-bold shrink-0">
                      2
                    </span>
                    <span>Di Laptop / PC (Chrome / Edge):</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                    Klik ikon instal di bilah alamat URL browser (ujung kanan) untuk memasang aplikasi sebagai aplikasi desktop Windows/Mac.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Otomatis sinkron ke database cloud</span>
              </span>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
