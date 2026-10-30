/**
 * Background Manager for RSIA Az Zahra Training Calendar
 * Manages 20 curated presets and custom manual backgrounds (file upload, custom URL, gradient builder)
 */

import { saveBackgroundConfigToFirebase, subscribeToBackgroundConfig } from '../lib/firebase';

export interface AppBackground {
  id: string;
  name: string;
  category: 'Rumah Sakit & Klinis' | 'Medis & Laboratorium' | 'Gradien Gelap & Neon' | 'Abstrak & Cyber Health' | 'Minimalis & Elegan' | 'Kustom Anda';
  type: 'preset' | 'custom';
  cssValue: string; // e.g. url('...'), linear-gradient(...), or radial-gradient(...)
  thumbnailUrl?: string; // image or gradient preview
  overlayOpacity?: number; // 0.2 to 0.95, default 0.82
  blur?: number; // 0 to 12 px, default 0
  description?: string;
  createdAt?: string;
}

export const PRESET_BACKGROUNDS: AppBackground[] = [
  // --- 1. RUMAH SAKIT & KLINIS ---
  {
    id: 'default-aerodynamic',
    name: 'Midnight Aerodynamic (Bawaan)',
    category: 'Rumah Sakit & Klinis',
    type: 'preset',
    cssValue: `radial-gradient(at 10% 10%, rgba(6, 182, 212, 0.2) 0px, transparent 40%), radial-gradient(at 90% 15%, rgba(56, 189, 248, 0.16) 0px, transparent 45%), radial-gradient(at 50% 90%, rgba(14, 165, 233, 0.15) 0px, transparent 50%), linear-gradient(180deg, #0b0f19 0%, #070a12 100%)`,
    thumbnailUrl: 'linear-gradient(135deg, #0b0f19 0%, #0e2439 50%, #061e2d 100%)',
    overlayOpacity: 0.65,
    blur: 0,
    description: 'Latar aerodinamis resmi SIMRS Diklat RSIA Az Zahra dengan aura toska klinis.'
  },
  {
    id: 'hospital-modern-suite',
    name: 'Ruang Perawatan VIP Modern',
    category: 'Rumah Sakit & Klinis',
    type: 'preset',
    cssValue: `url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80')`,
    thumbnailUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=300&q=70',
    overlayOpacity: 0.85,
    blur: 0,
    description: 'Suasana interior ruang rawat inap modern, rapi dan higienis.'
  },
  {
    id: 'medical-center-atrium',
    name: 'Atrium & Gedung Utama RS',
    category: 'Rumah Sakit & Klinis',
    type: 'preset',
    cssValue: `url('https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1920&q=80')`,
    thumbnailUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=300&q=70',
    overlayOpacity: 0.85,
    blur: 0,
    description: 'Arsitektur lobi rumah sakit kontemporer dengan pencahayaan luas.'
  },
  {
    id: 'nurse-station-night',
    name: 'Nurse Station & Telemetri',
    category: 'Rumah Sakit & Klinis',
    type: 'preset',
    cssValue: `url('https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1920&q=80')`,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=300&q=70',
    overlayOpacity: 0.82,
    blur: 0,
    description: 'Pusat stasiun keperawatan dengan stetoskop dan rekam medik klinis.'
  },
  {
    id: 'operating-theatre-tech',
    name: 'Ruang Operasi & Bedah Digital',
    category: 'Rumah Sakit & Klinis',
    type: 'preset',
    cssValue: `url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1920&q=80')`,
    thumbnailUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=300&q=70',
    overlayOpacity: 0.85,
    blur: 0,
    description: 'Lampu operasi futuristik dan peralatan bedah presisi tinggi.'
  },

  // --- 2. MEDIS & LABORATORIUM ---
  {
    id: 'icu-neonatal-care',
    name: 'Unit Perawatan Intensif (ICU/NICU)',
    category: 'Medis & Laboratorium',
    type: 'preset',
    cssValue: `url('https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1920&q=80')`,
    thumbnailUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=300&q=70',
    overlayOpacity: 0.84,
    blur: 0,
    description: 'Peralatan perawatan intensif neonatus dan pasien kritis.'
  },
  {
    id: 'radiology-diagnostic',
    name: 'Pusat Radiologi & CT Scan',
    category: 'Medis & Laboratorium',
    type: 'preset',
    cssValue: `url('https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1920&q=80')`,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=300&q=70',
    overlayOpacity: 0.85,
    blur: 0,
    description: 'Mesin pemindaian diagnostik modern berteknologi tinggi.'
  },
  {
    id: 'pharmacy-laboratory',
    name: 'Laboratorium & Farmasi Klinis',
    category: 'Medis & Laboratorium',
    type: 'preset',
    cssValue: `url('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=80')`,
    thumbnailUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=70',
    overlayOpacity: 0.83,
    blur: 0,
    description: 'Peralatan analisis laboratorium mikroskopis dan sediaan farmasi.'
  },
  {
    id: 'dna-molecular-helix',
    name: 'Heliks DNA & Bioteknologi Medis',
    category: 'Medis & Laboratorium',
    type: 'preset',
    cssValue: `url('https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1920&q=80')`,
    thumbnailUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=300&q=70',
    overlayOpacity: 0.82,
    blur: 0,
    description: 'Struktur molekuler genetika dan visualisasi bio-medis modern.'
  },

  // --- 3. GRADIEN GELAP & NEON ---
  {
    id: 'deep-sapphire-mesh',
    name: 'Deep Sapphire Navy Gradient',
    category: 'Gradien Gelap & Neon',
    type: 'preset',
    cssValue: `radial-gradient(circle at 80% 20%, #1e3a8a 0%, transparent 50%), radial-gradient(circle at 20% 80%, #0369a1 0%, transparent 45%), linear-gradient(135deg, #030712 0%, #0f172a 100%)`,
    thumbnailUrl: 'linear-gradient(135deg, #030712 0%, #1e3a8a 50%, #0369a1 100%)',
    overlayOpacity: 0.6,
    blur: 0,
    description: 'Gradien biru safir pekat dengan pencahayaan radial elegan.'
  },
  {
    id: 'emerald-clinical-gradient',
    name: 'Emerald Health Care Mesh',
    category: 'Gradien Gelap & Neon',
    type: 'preset',
    cssValue: `radial-gradient(circle at 15% 15%, #064e3b 0%, transparent 45%), radial-gradient(circle at 85% 85%, #047857 0%, transparent 50%), linear-gradient(135deg, #022c22 0%, #061c14 100%)`,
    thumbnailUrl: 'linear-gradient(135deg, #022c22 0%, #064e3b 60%, #047857 100%)',
    overlayOpacity: 0.6,
    blur: 0,
    description: 'Warna hijau zamrud klinis yang menenangkan dan higienis.'
  },
  {
    id: 'amethyst-violet-aura',
    name: 'Amethyst Royal Purple Glow',
    category: 'Gradien Gelap & Neon',
    type: 'preset',
    cssValue: `radial-gradient(circle at 20% 20%, #581c87 0%, transparent 45%), radial-gradient(circle at 80% 80%, #7e22ce 0%, transparent 45%), linear-gradient(135deg, #0f0728 0%, #17092b 100%)`,
    thumbnailUrl: 'linear-gradient(135deg, #0f0728 0%, #581c87 50%, #7e22ce 100%)',
    overlayOpacity: 0.6,
    blur: 0,
    description: 'Aura ungu kerajaan berkelas untuk tampilan eksklusif.'
  },
  {
    id: 'crimson-ruby-pulse',
    name: 'Crimson Ruby Velvet',
    category: 'Gradien Gelap & Neon',
    type: 'preset',
    cssValue: `radial-gradient(circle at 10% 90%, #881337 0%, transparent 45%), radial-gradient(circle at 90% 10%, #be123c 0%, transparent 45%), linear-gradient(135deg, #14050a 0%, #1f0710 100%)`,
    thumbnailUrl: 'linear-gradient(135deg, #14050a 0%, #881337 50%, #be123c 100%)',
    overlayOpacity: 0.6,
    blur: 0,
    description: 'Warna delima merah pekat dengan nuansa percaya diri tinggi.'
  },
  {
    id: 'golden-luxury-horizon',
    name: 'Golden Amber & Bronze',
    category: 'Gradien Gelap & Neon',
    type: 'preset',
    cssValue: `radial-gradient(circle at 80% 15%, #78350f 0%, transparent 50%), radial-gradient(circle at 15% 85%, #b45309 0%, transparent 45%), linear-gradient(135deg, #140e05 0%, #1c1308 100%)`,
    thumbnailUrl: 'linear-gradient(135deg, #140e05 0%, #78350f 50%, #b45309 100%)',
    overlayOpacity: 0.6,
    blur: 0,
    description: 'Nuansa hangat keemasan dan tembaga prestisius.'
  },

  // --- 4. ABSTRAK & CYBER HEALTH ---
  {
    id: 'cardiac-ecg-grid',
    name: 'Gelombang Jantung EKG Telemetri',
    category: 'Abstrak & Cyber Health',
    type: 'preset',
    cssValue: `radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 60%), linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%), repeating-linear-gradient(0deg, rgba(6, 182, 212, 0.05) 0px, rgba(6, 182, 212, 0.05) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(6, 182, 212, 0.05) 0px, rgba(6, 182, 212, 0.05) 1px, transparent 1px, transparent 40px)`,
    thumbnailUrl: 'linear-gradient(135deg, #08121f 0%, #0e2a47 50%, #06b6d4 100%)',
    overlayOpacity: 0.7,
    blur: 0,
    description: 'Pola telemetri kardiologi grid EKG modern dengan aksen cyan.'
  },
  {
    id: 'cyber-hospital-matrix',
    name: 'Cyber Health Network Grid',
    category: 'Abstrak & Cyber Health',
    type: 'preset',
    cssValue: `radial-gradient(circle at 30% 20%, rgba(14, 165, 233, 0.25) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(99, 102, 241, 0.2) 0%, transparent 50%), linear-gradient(135deg, #020617 0%, #0b1329 100%)`,
    thumbnailUrl: 'linear-gradient(135deg, #020617 0%, #0284c7 50%, #4f46e5 100%)',
    overlayOpacity: 0.65,
    blur: 0,
    description: 'Jaringan data kesehatan terintegrasi berbasis cyber cloud.'
  },
  {
    id: 'geometric-hex-mesh',
    name: 'Hexagonal Bio-Cellular Mesh',
    category: 'Abstrak & Cyber Health',
    type: 'preset',
    cssValue: `radial-gradient(ellipse at bottom, rgba(16, 185, 129, 0.15), transparent), radial-gradient(ellipse at top, rgba(6, 182, 212, 0.18), transparent), linear-gradient(180deg, #090d16 0%, #050b12 100%)`,
    thumbnailUrl: 'linear-gradient(135deg, #090d16 0%, #059669 50%, #0891b2 100%)',
    overlayOpacity: 0.65,
    blur: 0,
    description: 'Struktur sarang lebah heksagonal biologi molekuler modern.'
  },
  {
    id: 'arctic-ice-glaze',
    name: 'Arctic Ice Glaze & Glass',
    category: 'Abstrak & Cyber Health',
    type: 'preset',
    cssValue: `radial-gradient(circle at 10% 10%, #0284c7 0%, transparent 40%), radial-gradient(circle at 90% 90%, #38bdf8 0%, transparent 45%), linear-gradient(135deg, #031422 0%, #061f33 100%)`,
    thumbnailUrl: 'linear-gradient(135deg, #031422 0%, #0284c7 50%, #38bdf8 100%)',
    overlayOpacity: 0.65,
    blur: 0,
    description: 'Kesejukan kristal es kutub dengan nuansa biru cerah jernih.'
  },

  // --- 5. MINIMALIS & ELEGAN ---
  {
    id: 'obsidian-dark-slate',
    name: 'Obsidian Charcoal Minimalist',
    category: 'Minimalis & Elegan',
    type: 'preset',
    cssValue: `linear-gradient(180deg, #090d14 0%, #04070c 100%)`,
    thumbnailUrl: 'linear-gradient(135deg, #090d14 0%, #111827 100%)',
    overlayOpacity: 0.5,
    blur: 0,
    description: 'Kegelapan pekat minimalis arang obsidian untuk konsentrasi kerja maksimal.'
  },
  {
    id: 'titanium-carbon-executive',
    name: 'Titanium Steel & Slate Grid',
    category: 'Minimalis & Elegan',
    type: 'preset',
    cssValue: `radial-gradient(circle at 50% 0%, #334155 0%, transparent 60%), linear-gradient(135deg, #0b1120 0%, #020617 100%)`,
    thumbnailUrl: 'linear-gradient(135deg, #0b1120 0%, #334155 50%, #020617 100%)',
    overlayOpacity: 0.55,
    blur: 0,
    description: 'Baja titanium dingin korporat yang kokoh, rapi, dan berwibawa.'
  }
];

const ACTIVE_BACKGROUND_STORAGE_KEY = 'rsia_app_active_background_v2';
const CUSTOM_BACKGROUNDS_STORAGE_KEY = 'rsia_app_custom_backgrounds_v2';
const BACKGROUND_CHANGE_EVENT = 'rsia-background-changed';

/**
 * Retrieve current active background from localStorage (or fallback to default preset)
 */
export function getActiveBackground(): AppBackground {
  if (typeof window === 'undefined') return PRESET_BACKGROUNDS[0];
  try {
    const raw = localStorage.getItem(ACTIVE_BACKGROUND_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.cssValue) {
        // Sanitize legacy blur values from older presets to ensure 100% sharp initial rendering
        if (parsed.blur === 1 || parsed.blur === 2) {
          parsed.blur = 0;
          try {
            localStorage.setItem(ACTIVE_BACKGROUND_STORAGE_KEY, JSON.stringify(parsed));
          } catch {
            // ignore
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse active background:', e);
  }
  return PRESET_BACKGROUNDS[0];
}

/**
 * Retrieve user's custom created backgrounds
 */
export function getCustomBackgrounds(): AppBackground[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_BACKGROUNDS_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.error('Failed to parse custom backgrounds:', e);
  }
  return [];
}

/**
 * Set active background and notify listeners
 */
export function setActiveBackground(bg: AppBackground): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_BACKGROUND_STORAGE_KEY, JSON.stringify(bg));
  } catch (e) {
    console.error('Failed to save active background:', e);
  }
  applyBackgroundToDOM(bg);
  window.dispatchEvent(new CustomEvent(BACKGROUND_CHANGE_EVENT, { detail: bg }));
  saveBackgroundConfigToFirebase(bg).catch(() => {});
}

/**
 * Add a new custom background
 */
export function addCustomBackground(bg: Omit<AppBackground, 'id' | 'type' | 'category'> & { id?: string }): AppBackground {
  const customList = getCustomBackgrounds();
  const newBg: AppBackground = {
    ...bg,
    id: bg.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'custom',
    category: 'Kustom Anda',
    createdAt: new Date().toISOString()
  };

  const updated = [newBg, ...customList];
  try {
    localStorage.setItem(CUSTOM_BACKGROUNDS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom backgrounds list:', e);
  }
  return newBg;
}

/**
 * Remove a custom background by ID
 */
export function deleteCustomBackground(id: string): boolean {
  const customList = getCustomBackgrounds();
  const filtered = customList.filter((b) => b.id !== id);
  try {
    localStorage.setItem(CUSTOM_BACKGROUNDS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete custom background:', e);
    return false;
  }

  // If deleted background was active, reset to default
  const active = getActiveBackground();
  if (active.id === id) {
    setActiveBackground(PRESET_BACKGROUNDS[0]);
  }
  return true;
}

/**
 * Normalize CSS background value ensuring images use url(...) syntax
 */
export function normalizeCssBackgroundValue(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.startsWith('url(') || trimmed.startsWith('linear-gradient(') || trimmed.startsWith('radial-gradient(')) {
    return trimmed;
  }
  return `url('${trimmed}')`;
}

/**
 * Update overlay opacity and blur for the currently active background
 */
export function updateActiveBackgroundSettings(overlayOpacity?: number, blur?: number): AppBackground {
  const current = getActiveBackground();
  const updated: AppBackground = {
    ...current,
    overlayOpacity: typeof overlayOpacity === 'number' ? overlayOpacity : (current.overlayOpacity ?? 0.8),
    blur: typeof blur === 'number' ? blur : (current.blur ?? 0)
  };
  setActiveBackground(updated);
  return updated;
}

/**
 * Returns all available backgrounds (20 presets + user custom backgrounds)
 */
export function getAllBackgrounds(): AppBackground[] {
  const custom = getCustomBackgrounds();
  return [...PRESET_BACKGROUNDS, ...custom];
}

/**
 * Reset to default preset
 */
export function resetToDefaultBackground(): AppBackground {
  const def = PRESET_BACKGROUNDS[0];
  setActiveBackground(def);
  return def;
}

const BG_STYLE_ELEMENT_ID = 'rsia-dynamic-app-background-styles';

/**
 * Injects dynamic CSS rules to apply the background seamlessly with overlay and filter
 */
export function applyBackgroundToDOM(bg: AppBackground = getActiveBackground()): void {
  if (typeof document === 'undefined') return;

  let styleEl = document.getElementById(BG_STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = BG_STYLE_ELEMENT_ID;
    document.head.appendChild(styleEl);
  }

  const overlay = typeof bg.overlayOpacity === 'number' ? bg.overlayOpacity : 0.8;
  const blurPx = typeof bg.blur === 'number' && bg.blur > 0 ? bg.blur : 0;
  const normalizedCss = normalizeCssBackgroundValue(bg.cssValue);

  // When blur is 0 (default), NO filter or backdrop-filter is applied, avoiding GPU blur latency entirely
  const layerFilterCss = blurPx > 0 ? `filter: blur(${blurPx}px);` : '';
  const overlayBackdropCss = blurPx > 0 ? `backdrop-filter: blur(${blurPx}px); -webkit-backdrop-filter: blur(${blurPx}px);` : '';
  const layerInset = blurPx > 0 ? '-24px' : '0px';

  // We style .app-dynamic-bg-wrapper and pseudo-elements
  styleEl.textContent = `
    @media screen {
      .app-dynamic-bg-wrapper {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
      }
      .app-dynamic-bg-layer {
        position: absolute;
        inset: ${layerInset};
        background-image: ${normalizedCss};
        background-position: center center;
        background-repeat: no-repeat;
        background-size: cover;
        ${layerFilterCss}
        transition: background-image 0.25s ease;
      }
      .app-dynamic-bg-overlay {
        position: absolute;
        inset: 0;
        background-color: rgba(11, 15, 25, ${overlay});
        ${overlayBackdropCss}
        transition: background-color 0.2s ease;
      }
      .app-content-root {
        position: relative;
        z-index: 1;
      }
    }
  `;
}

/**
 * Subscribe to background change events
 */
export function onBackgroundChange(callback: (bg: AppBackground) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<AppBackground>;
    callback(custom.detail || getActiveBackground());
  };
  window.addEventListener(BACKGROUND_CHANGE_EVENT, handler);
  return () => window.removeEventListener(BACKGROUND_CHANGE_EVENT, handler);
}

/**
 * Start real-time Firestore sync for Background Wallpaper across all devices
 */
export function startRealtimeBackgroundSync(): () => void {
  return subscribeToBackgroundConfig((remoteBg) => {
    if (!remoteBg || !remoteBg.id || !remoteBg.cssValue) return;
    const current = getActiveBackground();
    if (
      current.id !== remoteBg.id ||
      current.cssValue !== remoteBg.cssValue ||
      current.overlayOpacity !== remoteBg.overlayOpacity ||
      current.blur !== remoteBg.blur
    ) {
      const newBg: AppBackground = {
        id: remoteBg.id,
        name: remoteBg.name || 'Latar Belakang RSIA',
        category: (remoteBg.category as any) || 'Rumah Sakit & Klinis',
        type: (remoteBg.type as any) || 'preset',
        cssValue: remoteBg.cssValue,
        thumbnailUrl: remoteBg.thumbnailUrl,
        overlayOpacity: typeof remoteBg.overlayOpacity === 'number' ? remoteBg.overlayOpacity : 0.8,
        blur: typeof remoteBg.blur === 'number' ? remoteBg.blur : 0
      };
      try {
        localStorage.setItem(ACTIVE_BACKGROUND_STORAGE_KEY, JSON.stringify(newBg));
      } catch {
        // ignore
      }
      applyBackgroundToDOM(newBg);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(BACKGROUND_CHANGE_EVENT, { detail: newBg }));
      }
    }
  });
}

// Auto-run on script evaluation
if (typeof window !== 'undefined') {
  try {
    applyBackgroundToDOM();
  } catch {
    // ignore
  }
}
