import { ALL_UNIT_KERJA } from '../data/initialData';
import { Training } from '../types/training';

export const CUSTOM_UNITS_STORAGE_KEY = 'simrs_custom_unit_kerja_v1';
const UNIT_CHANGE_EVENT = 'simrs-unit-list-changed';

/**
 * Mendapatkan daftar unit kerja kustom / free teks yang tersimpan di LocalStorage
 */
export function getStoredCustomUnits(): string[] {
  try {
    const saved = localStorage.getItem(CUSTOM_UNITS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(u => typeof u === 'string' && u.trim().length > 0);
      }
    }
  } catch (e) {
    console.warn('Gagal membaca custom units dari localStorage:', e);
  }
  return [];
}

import { saveCustomUnitsToFirebase, subscribeToCustomUnits } from '../lib/firebase';

export function normalizeUnitName(name: string): string {
  const clean = (name || '').trim();
  if (clean.toUpperCase() === 'HRD') {
    return 'HC';
  }
  return clean;
}

/**
 * Menyimpan unit kerja baru (free teks) secara permanen
 */
export function saveCustomUnit(unitName: string): string[] {
  const clean = normalizeUnitName(unitName);
  if (!clean) return getStoredCustomUnits();

  const current = getStoredCustomUnits();
  const allDefaults = ALL_UNIT_KERJA.map(u => u.toLowerCase());

  // Jangan duplikasi jika sudah ada di default atau di custom
  if (
    !allDefaults.includes(clean.toLowerCase()) &&
    !current.some(c => c.toLowerCase() === clean.toLowerCase())
  ) {
    const updated = [...current, clean];
    try {
      localStorage.setItem(CUSTOM_UNITS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(UNIT_CHANGE_EVENT, { detail: { unit: clean } }));
      saveCustomUnitsToFirebase(updated).catch(() => {});
    } catch (e) {
      console.warn('Gagal menyimpan custom unit ke localStorage:', e);
    }
    return updated;
  }
  return current;
}

/**
 * Menyimpan banyak unit kerja kustom sekaligus (misal dipisahkan koma)
 */
export function saveBulkCustomUnits(unitNames: string[]): string[] {
  const current = getStoredCustomUnits();
  const allDefaults = ALL_UNIT_KERJA.map(u => u.toLowerCase());
  const updated = [...current];
  let changed = false;

  unitNames.forEach(raw => {
    const clean = normalizeUnitName(raw);
    if (!clean) return;
    if (
      !allDefaults.includes(clean.toLowerCase()) &&
      !updated.some(c => c.toLowerCase() === clean.toLowerCase())
    ) {
      updated.push(clean);
      changed = true;
    }
  });

  if (changed) {
    try {
      localStorage.setItem(CUSTOM_UNITS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(UNIT_CHANGE_EVENT));
      saveCustomUnitsToFirebase(updated).catch(() => {});
    } catch (e) {
      console.warn('Gagal menyimpan bulk custom units:', e);
    }
  }

  return updated;
}

/**
 * Real-time listener sinkronisasi unit kerja kustom antar perangkat via Firestore
 */
export function startRealtimeCustomUnitsSync(): () => void {
  return subscribeToCustomUnits((remoteUnits) => {
    if (Array.isArray(remoteUnits) && remoteUnits.length > 0) {
      const current = getStoredCustomUnits();
      const merged = Array.from(new Set([...current, ...remoteUnits]));
      try {
        localStorage.setItem(CUSTOM_UNITS_STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent(UNIT_CHANGE_EVENT));
      } catch (e) {
        // ignore
      }
    }
  });
}

/**
 * Mendapatkan seluruh unit kerja lengkap:
 * 1. 26 Unit Bawaan Rumah Sakit (ALL_UNIT_KERJA)
 * 2. Unit Kustom Free Teks dari LocalStorage
 * 3. Unit yang ada di targetUnits seluruh pelatihan
 * 4. Unit yang ada di data peserta seluruh pelatihan
 */
export function getAllKnownUnits(trainings?: Training[], extraUnits?: string[]): string[] {
  const map = new Map<string, string>();

  // 1. Masukkan default units
  ALL_UNIT_KERJA.forEach(u => {
    const clean = normalizeUnitName(u);
    map.set(clean.toLowerCase(), clean);
  });

  // 2. Masukkan custom units tersimpan
  getStoredCustomUnits().forEach(u => {
    const clean = normalizeUnitName(u);
    if (!map.has(clean.toLowerCase())) {
      map.set(clean.toLowerCase(), clean);
    }
  });

  // 3. Masukkan ekstra units opsional
  if (extraUnits) {
    extraUnits.forEach(u => {
      const clean = normalizeUnitName(u);
      if (clean && !map.has(clean.toLowerCase())) {
        map.set(clean.toLowerCase(), clean);
      }
    });
  }

  // 4. Masukkan unit dari targetUnits & participants pelatihan
  if (trainings && Array.isArray(trainings)) {
    trainings.forEach(t => {
      if (t.targetUnits && Array.isArray(t.targetUnits)) {
        t.targetUnits.forEach(tu => {
          const clean = normalizeUnitName(tu);
          if (clean && !map.has(clean.toLowerCase())) {
            map.set(clean.toLowerCase(), clean);
          }
        });
      }
      if (t.participants && Array.isArray(t.participants)) {
        t.participants.forEach(p => {
          const clean = normalizeUnitName(p.unitKerja);
          if (clean && !map.has(clean.toLowerCase())) {
            map.set(clean.toLowerCase(), clean);
          }
        });
      }
    });
  }

  return Array.from(map.values());
}

/**
 * Listener untuk memantau perubahan daftar unit secara real-time
 */
export function onUnitsChange(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(UNIT_CHANGE_EVENT, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === CUSTOM_UNITS_STORAGE_KEY) {
      callback();
    }
  });
  return () => {
    window.removeEventListener(UNIT_CHANGE_EVENT, handler);
  };
}
