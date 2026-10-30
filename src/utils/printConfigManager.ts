/**
 * printConfigManager.ts
 * Mengelola konfigurasi terpusat (global) pejabat penandatangan cetak dokumen
 * (Cetak Dokumen Data Karyawan & Cetak Lembar Presensi Diklat RSIA Az Zahra).
 */

import { savePrintSigneeConfigToFirebase, subscribeToPrintSigneeConfig } from '../lib/firebase';

export interface PrintSigneeConfig {
  // Pihak Kiri (misal: Mengetahui / Kepala Bidang Keperawatan)
  leftPrefix: string;
  leftRole: string;
  leftName: string;
  leftNip: string;
  leftNipLabel: string; // 'NIK' | 'NIP'

  // Pihak Kanan (misal: Palembang, Tanggal / Ka. Subag Kepegawaian & SDM)
  rightCity: string;
  rightCustomDate: string; // Kosong = tanggal otomatis hari ini
  rightRole: string;
  rightName: string;
  rightNip: string;
  rightNipLabel: string; // 'NIK' | 'NIP'

  // Pengaturan Kop / Header Cetak Dokumen
  documentHeader: string;
  hospitalTitle: string;
}

export const DEFAULT_PRINT_SIGNEE_CONFIG: PrintSigneeConfig = {
  leftPrefix: 'Mengetahui,',
  leftRole: 'Kepala Bidang Keperawatan',
  leftName: 'Ns. Siti Rahmawati, S.Kep.',
  leftNip: '19920315 201601 2 001',
  leftNipLabel: 'NIK',

  rightCity: 'Palembang',
  rightCustomDate: '',
  rightRole: 'Ka. Subag Kepegawaian & SDM',
  rightName: 'Ratna Kusuma Dewi, S.Psi., M.M.',
  rightNip: '19870914 201102 2 001',
  rightNipLabel: 'NIK',

  documentHeader: 'NAMA - NAMA PERAWAT DAN BIDAN RSIA AZ ZAHRA',
  hospitalTitle: 'RSIA AZ ZAHRA PALEMBANG'
};

const STORAGE_KEY = 'simrs_global_print_signee_config_v1';
const EVENT_NAME = 'simrs-print-signee-changed';

/**
 * Mengambil konfigurasi tanda tangan dari localStorage atau nilai default
 */
export function getStoredPrintSigneeConfig(): PrintSigneeConfig {
  if (typeof window === 'undefined') return DEFAULT_PRINT_SIGNEE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRINT_SIGNEE_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PRINT_SIGNEE_CONFIG,
      ...parsed
    };
  } catch (err) {
    console.warn('Gagal membaca print signee config:', err);
    return DEFAULT_PRINT_SIGNEE_CONFIG;
  }
}

/**
 * Menyimpan konfigurasi penandatangan ke localStorage dan menyebarkan event ke seluruh komponen
 */
export function savePrintSigneeConfig(config: PrintSigneeConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: config }));
    savePrintSigneeConfigToFirebase(config).catch(() => {});
  } catch (err) {
    console.error('Gagal menyimpan print signee config:', err);
  }
}

/**
 * Mengembalikan konfigurasi penandatangan ke nilai default awal
 */
export function resetPrintSigneeConfig(): PrintSigneeConfig {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: DEFAULT_PRINT_SIGNEE_CONFIG }));
      savePrintSigneeConfigToFirebase(DEFAULT_PRINT_SIGNEE_CONFIG).catch(() => {});
    } catch (err) {
      console.error('Gagal mereset print signee config:', err);
    }
  }
  return DEFAULT_PRINT_SIGNEE_CONFIG;
}

/**
 * Berlangganan event perubahan konfigurasi tanda tangan
 */
export function onPrintSigneeConfigChange(callback: (config: PrintSigneeConfig) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<PrintSigneeConfig>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener(EVENT_NAME, handler);
  // Juga dengarkan storage event untuk sinkronisasi antar tab browser
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getStoredPrintSigneeConfig());
    }
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

/**
 * Sinkronisasi real-time print signee config antar perangkat via Firestore
 */
export function startRealtimePrintSigneeSync(): () => void {
  return subscribeToPrintSigneeConfig((remoteConfig) => {
    if (remoteConfig && remoteConfig.leftName && remoteConfig.rightName) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteConfig));
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: remoteConfig }));
      } catch {
        // ignore
      }
    }
  });
}
