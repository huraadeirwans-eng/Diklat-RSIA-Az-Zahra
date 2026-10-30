import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  KeyRound, 
  Mail, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Lock,
  ArrowRight,
  RefreshCw,
  Copy,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { User } from '../types/auth';
import { 
  authenticate, 
  requestPasswordResetOTP, 
  verifyOTP, 
  loginWithOTP, 
  resetPasswordWithOTP, 
  OtpRecord 
} from '../utils/accountManager';
import { requestFullscreenMode } from '../utils/fullscreen';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  initialUsername?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLoginSuccess,
  initialUsername = ''
}) => {
  // Input fields (styled with signature pale yellow background matching BMHS lock screen)
  const [username, setUsername] = useState<string>(initialUsername);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successUnlock, setSuccessUnlock] = useState<boolean>(false);

  // Recovery / Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [recoveryStep, setRecoveryStep] = useState<'select_email' | 'verify_otp' | 'set_new_password'>('select_email');
  const [selectedEmail, setSelectedEmail] = useState<string>('adeirwanh4@gmail.com');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<OtpRecord | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState<boolean>(false);
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [otpTimer, setOtpTimer] = useState<number>(600); // 10 minutes in seconds
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');

  // Floating Toast Alert for simulated incoming email OTP
  const [simulatedInboxToast, setSimulatedInboxToast] = useState<OtpRecord | null>(null);

  // Listen to global OTP dispatch event for instant inbox notification
  useEffect(() => {
    const handleOtpEvent = (e: any) => {
      if (e.detail) {
        setSimulatedInboxToast(e.detail);
      }
    };
    window.addEventListener('simrs:otp-dispatched', handleOtpEvent);
    return () => window.removeEventListener('simrs:otp-dispatched', handleOtpEvent);
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    let interval: any = null;
    if (isForgotModalOpen && recoveryStep === 'verify_otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isForgotModalOpen, recoveryStep, otpTimer]);

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  // Main Login Handler (Strict: Only registered accounts with correct credentials can login)
  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim();
    const cleanPass = password;

    if (!cleanUser) {
      setErrorMessage('Silakan masukkan Username atau NIP.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Silakan masukkan kata sandi.');
      return;
    }

    setIsLoading(true);
    requestFullscreenMode();

    setTimeout(() => {
      const res = authenticate(cleanUser, cleanPass);

      if (res.success && res.user) {
        setIsLoading(false);
        setSuccessUnlock(true);
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 300);
      } else {
        setIsLoading(false);
        setErrorMessage(res.message || 'Username atau kata sandi tidak cocok. Akun tidak terdaftar.');
      }
    }, 250);
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#edf2f7] flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-slate-950 font-sans overflow-hidden">
      {/* Subtle Ambient Vignette & Medical Dots */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.85) 0%, rgba(226,232,240,0.5) 100%)'
        }}
      />
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(#0284c7 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* Floating Simulated Inbox Toast Alert for OTP */}
      <AnimatePresence>
        {simulatedInboxToast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.16 }}
            className="fixed top-4 inset-x-4 max-w-lg mx-auto z-50 bg-white border-2 border-cyan-500 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700 shrink-0">
                <Mail className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold text-cyan-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Kotak Masuk: SIMRS RSIA Az Zahra
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Baru saja</span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  Kode OTP Pemulihan: <span className="font-mono text-cyan-700 text-sm tracking-widest bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">{simulatedInboxToast.code}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Terkirim ke: <strong className="text-slate-800">{simulatedInboxToast.email}</strong>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpInput(simulatedInboxToast.code);
                      setUsername(simulatedInboxToast.username);
                      if (!isForgotModalOpen) {
                        setIsForgotModalOpen(true);
                        setRecoveryStep('verify_otp');
                        setGeneratedOtp(simulatedInboxToast);
                      }
                    }}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Gunakan Kode OTP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(simulatedInboxToast.code)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg border border-slate-300 cursor-pointer"
                  >
                    {isCopied ? 'Tersalin!' : 'Salin'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatedInboxToast(null)}
                    className="ml-auto text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title="Tutup Notifikasi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          CENTER CLUSTER: ANIMATED MEDICAL COLLAGE & LOGIN BOX
      ======================================================== */}
      <div className="relative w-full max-w-[560px] flex items-center justify-center min-h-[460px] sm:min-h-[520px]">
        
        {/* ======================================================
            1. FLOATING MEDICAL ILLUSTRATION COLLAGE (ANIMATED)
        ====================================================== */}
        <div className="absolute inset-0 pointer-events-none overflow-visible select-none" aria-hidden="true">
          
          {/* Stethoscope - Left & Top Loop (Animated Float 1) */}
          <div className="absolute -left-6 sm:left-4 top-2 sm:top-6 w-32 sm:w-44 h-32 sm:h-44 text-cyan-400/80 animate-bmhs-float-1">
            <svg viewBox="0 0 160 160" fill="none" className="w-full h-full drop-shadow-sm">
              {/* Binaural Earpieces */}
              <path d="M42 28 C42 16, 56 12, 68 18 C78 24, 82 38, 82 52" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
              <path d="M42 28 L38 24" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
              <path d="M82 52 L86 54" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
              {/* Tubing */}
              <path d="M55 35 C55 60, 68 78, 62 105 C56 128, 28 135, 18 110 C8 85, 30 70, 48 85" stroke="#38bdf8" strokeWidth="5.5" strokeLinecap="round" />
              {/* Chest Piece */}
              <circle cx="50" cy="88" r="14" fill="#cbd5e1" stroke="#64748b" strokeWidth="3" />
              <circle cx="50" cy="88" r="8" fill="#0284c7" />
            </svg>
          </div>

          {/* Medical Clipboard / Chart - Top Center (Animated Float 2) */}
          <div className="absolute left-[38%] -top-8 sm:-top-10 w-20 sm:w-24 h-24 sm:h-28 text-slate-300 animate-bmhs-float-2">
            <svg viewBox="0 0 80 95" fill="none" className="w-full h-full drop-shadow-sm">
              {/* Board */}
              <rect x="10" y="14" width="60" height="76" rx="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2.5" />
              {/* Clip */}
              <rect x="26" y="8" width="28" height="12" rx="3" fill="#94a3b8" />
              <circle cx="40" cy="14" r="3" fill="#ffffff" />
              {/* Paper */}
              <rect x="18" y="24" width="44" height="60" rx="3" fill="#ffffff" />
              {/* Red Cross on Chart */}
              <path d="M40 32 v8 M36 36 h8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
              {/* Text Lines */}
              <line x1="24" y1="48" x2="56" y2="48" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="56" x2="52" y2="56" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="64" x2="46" y2="64" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="72" x2="54" y2="72" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* First Aid Box with Red Cross - Top Right (Animated Float 3) */}
          <div className="absolute -right-4 sm:right-6 top-4 sm:top-8 w-24 sm:w-28 h-20 sm:h-24 animate-bmhs-float-3">
            <svg viewBox="0 0 100 85" fill="none" className="w-full h-full drop-shadow-sm">
              {/* Handle */}
              <path d="M38 20 C38 12, 62 12, 62 20" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
              {/* Case */}
              <rect x="12" y="18" width="76" height="60" rx="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="3" />
              {/* Latches */}
              <rect x="24" y="16" width="6" height="8" rx="1" fill="#cbd5e1" />
              <rect x="70" y="16" width="6" height="8" rx="1" fill="#cbd5e1" />
              {/* Soft Red Cross in Center */}
              <rect x="44" y="32" width="12" height="32" rx="3" fill="#fca5a5" />
              <rect x="34" y="42" width="32" height="12" rx="3" fill="#fca5a5" />
              <rect x="46" y="34" width="8" height="28" rx="2" fill="#ef4444" />
              <rect x="36" y="44" width="28" height="8" rx="2" fill="#ef4444" />
            </svg>
          </div>

          {/* Capsule Pills - Right Middle (Animated Float 1) */}
          <div className="absolute right-0 sm:right-10 top-36 sm:top-40 w-16 sm:w-20 h-16 sm:h-20 animate-bmhs-float-1">
            <svg viewBox="0 0 80 80" fill="none" className="w-full h-full drop-shadow-sm rotate-45">
              {/* Capsule 1: Yellow & White */}
              <rect x="26" y="10" width="16" height="34" rx="8" fill="#fef08a" stroke="#fde047" strokeWidth="1.5" />
              <rect x="26" y="27" width="16" height="17" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
              {/* Capsule 2: Cyan & White */}
              <g transform="translate(14, 28) rotate(-65)">
                <rect x="16" y="10" width="14" height="30" rx="7" fill="#38bdf8" stroke="#0ea5e9" strokeWidth="1.5" />
                <rect x="16" y="25" width="14" height="15" rx="7" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
              </g>
            </svg>
          </div>

          {/* Medicine Dropper - Far Right (Animated Float 2) */}
          <div className="absolute -right-6 sm:right-0 top-60 sm:top-64 w-12 sm:w-16 h-24 sm:h-28 animate-bmhs-float-2">
            <svg viewBox="0 0 50 100" fill="none" className="w-full h-full drop-shadow-sm rotate-12">
              <path d="M20 10 C20 4, 30 4, 30 10 L30 20 L20 20 Z" fill="#f59e0b" />
              <rect x="17" y="20" width="16" height="6" rx="1" fill="#475569" />
              <rect x="22" y="26" width="6" height="45" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
              <polygon points="22,71 28,71 25,82" fill="#cbd5e1" />
              <circle cx="25" cy="88" r="3.5" fill="#f59e0b" className="animate-ping" style={{ animationDuration: '3s' }} />
            </svg>
          </div>

          {/* Medicine Syrup Bottle - Middle Left (Animated Float 3) */}
          <div className="absolute -left-6 sm:left-2 top-36 sm:top-40 w-16 sm:w-20 h-28 sm:h-32 animate-bmhs-float-3">
            <svg viewBox="0 0 60 100" fill="none" className="w-full h-full drop-shadow-sm">
              {/* Bottle Cap */}
              <rect x="22" y="6" width="16" height="10" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
              {/* Neck */}
              <rect x="25" y="16" width="10" height="8" fill="#fed7aa" />
              {/* Bottle Body */}
              <rect x="10" y="24" width="40" height="64" rx="8" fill="#fed7aa" stroke="#fdba74" strokeWidth="2" />
              {/* Label */}
              <rect x="15" y="38" width="30" height="36" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
              {/* Orange Cross on Label */}
              <path d="M30 46 v12 M24 52 h12" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Adhesive Bandage (Bandaid) - Bottom Left (Animated Float 1) */}
          <div className="absolute -left-4 sm:left-6 top-64 sm:top-68 w-20 sm:w-24 h-12 sm:h-14 animate-bmhs-float-1">
            <svg viewBox="0 0 100 50" fill="none" className="w-full h-full drop-shadow-sm -rotate-15">
              <rect x="6" y="8" width="88" height="34" rx="17" fill="#fed7aa" stroke="#fcd34d" strokeWidth="2" />
              <rect x="36" y="8" width="28" height="34" fill="#fef08a" stroke="#fde047" strokeWidth="1" />
              {/* Dots */}
              <circle cx="22" cy="25" r="2" fill="#ea580c" opacity="0.6" />
              <circle cx="30" cy="20" r="1.5" fill="#ea580c" opacity="0.6" />
              <circle cx="30" cy="30" r="1.5" fill="#ea580c" opacity="0.6" />
              <circle cx="70" cy="20" r="1.5" fill="#ea580c" opacity="0.6" />
              <circle cx="70" cy="30" r="1.5" fill="#ea580c" opacity="0.6" />
              <circle cx="78" cy="25" r="2" fill="#ea580c" opacity="0.6" />
            </svg>
          </div>

          {/* Blister Pack with Yellow Tablets - Far Bottom Left (Animated Float 2) */}
          <div className="absolute left-10 sm:left-18 -bottom-6 sm:-bottom-4 w-20 sm:w-24 h-16 sm:h-20 animate-bmhs-float-2">
            <svg viewBox="0 0 90 70" fill="none" className="w-full h-full drop-shadow-sm rotate-6">
              <rect x="6" y="6" width="78" height="58" rx="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
              {/* 6 Pills */}
              <circle cx="24" cy="22" r="8" fill="#facc15" stroke="#eab308" strokeWidth="1.5" />
              <circle cx="45" cy="22" r="8" fill="#facc15" stroke="#eab308" strokeWidth="1.5" />
              <circle cx="66" cy="22" r="8" fill="#facc15" stroke="#eab308" strokeWidth="1.5" />
              <circle cx="24" cy="48" r="8" fill="#facc15" stroke="#eab308" strokeWidth="1.5" />
              <circle cx="45" cy="48" r="8" fill="#facc15" stroke="#eab308" strokeWidth="1.5" />
              <circle cx="66" cy="48" r="8" fill="#facc15" stroke="#eab308" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Heartbeat ECG / Medical Cross Pulse - Bottom Center (Animated Pulse Slow) */}
          <div className="absolute left-[30%] sm:left-[35%] -bottom-10 sm:-bottom-8 w-44 sm:w-52 h-16 sm:h-20 animate-bmhs-pulse-slow">
            <svg viewBox="0 0 160 50" fill="none" className="w-full h-full opacity-60">
              <path 
                d="M10 25 L45 25 L55 8 L65 42 L75 18 L85 28 L95 25 L150 25" 
                stroke="#f43f5e" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>

          {/* Syringe / Thermometer - Bottom Right (Animated Float 3) */}
          <div className="absolute right-6 sm:right-16 -bottom-6 sm:-bottom-4 w-12 sm:w-16 h-24 sm:h-28 animate-bmhs-float-3">
            <svg viewBox="0 0 50 100" fill="none" className="w-full h-full drop-shadow-sm -rotate-45">
              <rect x="20" y="25" width="10" height="45" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="16" y1="25" x2="34" y2="25" stroke="#64748b" strokeWidth="2.5" />
              <rect x="23" y="10" width="4" height="15" fill="#94a3b8" />
              <line x1="25" y1="70" x2="25" y2="92" stroke="#64748b" strokeWidth="1.5" />
              {/* Measurement lines */}
              <line x1="22" y1="35" x2="26" y2="35" stroke="#94a3b8" strokeWidth="1" />
              <line x1="22" y1="45" x2="28" y2="45" stroke="#0284c7" strokeWidth="1.5" />
              <line x1="22" y1="55" x2="26" y2="55" stroke="#94a3b8" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* ======================================================
            2. THE CENTER LOGIN CARD (EXACT MATCH OF SCREENSHOT)
        ====================================================== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-[340px] sm:max-w-[370px] flex flex-col items-center text-center px-4 py-5"
        >
          {/* LOGO RESMI RSIA AZ ZAHRA */}
          <div className="flex items-center justify-center mb-4 select-none px-2">
            <img 
              src="/assets/aistudio/NEW_-_Logo_RSIA_Az_Zahra_001_44047f51.png"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('logo_rsia_az_zahra.png')) {
                  target.src = '/assets/images/logo_rsia_az_zahra.png';
                }
              }}
              alt="Logo RSIA Az Zahra - Family of RS Bunda Jakarta" 
              className="h-12 sm:h-14 max-w-[260px] sm:max-w-[290px] w-auto object-contain drop-shadow-xs"
            />
          </div>

          {/* Error Message Feedback */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-3 p-2 rounded-md bg-rose-50 border border-rose-300 text-rose-700 text-xs flex items-center gap-1.5 shadow-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="text-left font-medium">{errorMessage}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-2">
            {/* Username Input Field (Signature Yellow #fef9c3) */}
            <div className="w-full relative">
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username / NIP"
                required
                className="w-full h-10 px-3 bg-[#fef9c3] border border-[#cbd5e1] hover:border-slate-400 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-500 rounded-[3px] text-xs sm:text-sm text-[#0f172a] font-medium placeholder-slate-400 shadow-inner focus:outline-none transition-colors"
              />
            </div>

            {/* Password Input Field (Signature Yellow #fef9c3 with working View Password toggle) */}
            <div className="w-full relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Password"
                required
                className={`w-full h-10 pl-3 pr-10 bg-[#fef9c3] border border-[#cbd5e1] hover:border-slate-400 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-500 rounded-[3px] text-xs sm:text-sm text-[#0f172a] font-medium placeholder-slate-400 shadow-inner focus:outline-none transition-colors ${
                  showPassword ? 'font-sans tracking-normal' : 'font-mono tracking-widest'
                }`}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword(!showPassword);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer p-1.5 z-10 rounded"
                title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-700" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-500 hover:text-slate-700" />
                )}
              </button>
            </div>

            {/* Solid Navy Blue Login Button (L O G I N) */}
            <button
              type="submit"
              disabled={isLoading || successUnlock}
              className={`w-full h-10 mt-0.5 rounded-[3px] font-bold text-xs sm:text-sm text-white tracking-[0.38em] uppercase transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-2 select-none active:scale-[0.99] ${
                isLoading || successUnlock
                  ? 'bg-slate-700 text-slate-300 cursor-wait'
                  : 'bg-[#1a365d] hover:bg-[#1e40af] text-white hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span className="tracking-widest">MEMPROSES...</span>
                </div>
              ) : successUnlock ? (
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="tracking-widest">BERHASIL</span>
                </div>
              ) : (
                'L O G I N'
              )}
            </button>
          </form>

          {/* Under-Button Text Links (Exactly matching screenshot) */}
          <div className="w-full flex flex-col items-center mt-3 text-center">
            {/* Lupa Password Link */}
            <button
              type="button"
              onClick={() => {
                setIsForgotModalOpen(true);
                setRecoveryStep('select_email');
                setRecoveryMessage(null);
              }}
              className="text-[#2563eb] hover:text-[#1d4ed8] text-xs sm:text-sm font-medium hover:underline cursor-pointer transition-colors"
            >
              Lupa Password
            </button>

            {/* Welcome Please login. */}
            <p className="text-[11px] sm:text-xs text-[#334155] font-normal mt-2.5">
              Welcome Please login.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Subtle Bottom Trust Bar */}
      <footer className="relative z-10 w-full pb-2 px-4 text-center text-[10px] text-slate-400 select-none">
        SIMRS Diklat RSIA Az Zahra · Bundamedik Healthcare System
      </footer>

      {/* ========================================================
          MODAL: LUPA PASSWORD / RESET KATA SANDI VIA EMAIL OTP
      ======================================================== */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-smooth-fade">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col text-slate-800">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Pemulihan Akun &amp; Sandi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kirim kode OTP ke email resmi rumah sakit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                aria-label="Tutup Dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Alert Message */}
              {recoveryMessage && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  recoveryMessage.type === 'error'
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : recoveryMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-cyan-50 border-cyan-300 text-cyan-800'
                }`}>
                  {recoveryMessage.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{recoveryMessage.text}</span>
                </div>
              )}

              {/* STEP 1: PILIH EMAIL */}
              {recoveryStep === 'select_email' && (
                <div className="space-y-4">
                  <p className="text-slate-600 leading-relaxed">
                    Sistem akan mengirimkan <strong>6-digit kode OTP</strong> untuk memverifikasi kepemilikan akun Anda:
                  </p>

                  <div className="space-y-2">
                    {[
                      { email: 'rawatinap.rsiaazahra@gmail.com', name: 'RSIA Az Zahra Palembang (Administrator)' },
                      { email: 'adeirwanh4@gmail.com', name: 'Administrator Diklat (Ade Irwan)' },
                      { email: 'ci.palembang@bunda.co.id', name: 'Koordinator Preceptor (CI Bunda Palembang)' }
                    ].map((item) => (
                      <label 
                        key={item.email}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedEmail === item.email
                            ? 'bg-cyan-50 border-cyan-500 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="recovery_target"
                            checked={selectedEmail === item.email}
                            onChange={() => {
                              setSelectedEmail(item.email);
                              setCustomEmail('');
                            }}
                            className="text-cyan-600 focus:ring-cyan-500"
                          />
                          <div>
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{item.email}</div>
                          </div>
                        </div>
                        <Mail className="w-4 h-4 text-cyan-600" />
                      </label>
                    ))}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-600">Atau masukkan username / email terdaftar lainnya:</span>
                    <input
                      type="text"
                      value={customEmail}
                      onChange={(e) => {
                        setCustomEmail(e.target.value);
                        setSelectedEmail('');
                      }}
                      placeholder="Misal: admin atau email Anda..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={recoveryLoading || (!selectedEmail && !customEmail.trim())}
                    onClick={() => {
                      const target = customEmail.trim() || selectedEmail;
                      setRecoveryLoading(true);
                      setRecoveryMessage(null);

                      setTimeout(() => {
                        const res = requestPasswordResetOTP(target);
                        setRecoveryLoading(false);
                        if (res.success && res.otp) {
                          setGeneratedOtp(res as any);
                          setRecoveryStep('verify_otp');
                          setOtpTimer(600);
                          setRecoveryMessage({
                            type: 'success',
                            text: res.message
                          });
                        } else {
                          setRecoveryMessage({
                            type: 'error',
                            text: res.message || 'Email atau username tidak ditemukan.'
                          });
                        }
                      }, 400);
                    }}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    {recoveryLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Kirim Kode OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STEP 2: VERIFIKASI KODE OTP */}
              {recoveryStep === 'verify_otp' && generatedOtp && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-cyan-800 font-semibold uppercase">Kode Dikirim Ke:</div>
                      <div className="font-mono font-bold text-slate-800">{generatedOtp.email}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-800 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-bold">
                      Masukkan 6-Digit Kode OTP:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Contoh: 123456"
                      className="w-full py-2.5 text-center font-mono text-xl tracking-[0.4em] font-bold bg-slate-50 border-2 border-slate-300 focus:border-cyan-500 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      disabled={recoveryLoading || otpInput.length !== 6}
                      onClick={() => {
                        setRecoveryLoading(true);
                        setRecoveryMessage(null);
                        setTimeout(() => {
                          const res = loginWithOTP(generatedOtp.email, otpInput);
                          setRecoveryLoading(false);
                          if (res.success && res.user) {
                            setIsForgotModalOpen(false);
                            onLoginSuccess(res.user);
                          } else {
                            setRecoveryMessage({
                              type: 'error',
                              text: res.message || 'Kode OTP tidak cocok.'
                            });
                          }
                        }, 350);
                      }}
                      className="py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Masuk Langsung</span>
                    </button>

                    <button
                      type="button"
                      disabled={recoveryLoading || otpInput.length !== 6}
                      onClick={() => {
                        const check = verifyOTP(generatedOtp.email, otpInput);
                        if (check.success) {
                          setRecoveryStep('set_new_password');
                          setRecoveryMessage({
                            type: 'info',
                            text: 'Kode terverifikasi. Masukkan kata sandi baru Anda.'
                          });
                        } else {
                          setRecoveryMessage({
                            type: 'error',
                            text: check.message
                          });
                        }
                      }}
                      className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Ubah Password</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: ATUR ULANG KATA SANDI BARU */}
              {recoveryStep === 'set_new_password' && generatedOtp && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-slate-700 font-bold">Kata Sandi Baru (Min. 4 Karakter):</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-700 font-bold">Ulangi Kata Sandi Baru:</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Konfirmasi kata sandi baru..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={recoveryLoading || !newPassword || newPassword !== confirmNewPassword}
                    onClick={() => {
                      setRecoveryLoading(true);
                      setTimeout(() => {
                        const res = resetPasswordWithOTP(generatedOtp.email, otpInput, newPassword);
                        setRecoveryLoading(false);
                        if (res.success && res.user) {
                          setIsForgotModalOpen(false);
                          onLoginSuccess(res.user);
                        } else {
                          setRecoveryMessage({
                            type: 'error',
                            text: res.message
                          });
                        }
                      }, 400);
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Kata Sandi &amp; Masuk</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
