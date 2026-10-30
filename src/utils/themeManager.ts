import { saveThemeConfigToFirebase, subscribeToThemeConfig } from '../lib/firebase';

export interface ThemePreset {
  id: string;
  name: string;
  category: 'Modern Dark' | 'Medical & Clinical' | 'Luxury & Vibrant' | 'Executive' | 'Tema Terang (Light Mode)';
  description: string;
  primaryColor: string; // Hex for badge/accent
  secondaryColor: string;
  bgDark: string; // Body background
  cardBg: string; // Surface background
  borderGlow: string;
  tag: string;
  isLight?: boolean;
  gradientBg?: string; // Harmonious background gradient
}

export const THEME_PRESETS: ThemePreset[] = [
  // ==========================================
  // KATEGORI: TEMA TERANG (LIGHT MODE) DENGAN GRADASI HARMONIS
  // ==========================================
  {
    id: 'light-clinical-cyan',
    name: 'Klinis Cerah & Cyan Breeze',
    category: 'Tema Terang (Light Mode)',
    description: 'Nuansa higienis putih klinis dengan gradasi hembusan cyan segar dan toska menenangkan khas RS modern.',
    primaryColor: '#0284c7',
    secondaryColor: '#06b6d4',
    bgDark: '#f0f9ff',
    cardBg: '#ffffff',
    borderGlow: 'rgba(2, 132, 199, 0.25)',
    tag: 'Terang & Klinis',
    isLight: true,
    gradientBg: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 45%, #e0f2fe 100%)'
  },
  {
    id: 'light-emerald-mint',
    name: 'Emerald Mint & Herbal Fresh',
    category: 'Tema Terang (Light Mode)',
    description: 'Gradasi hijau mint dan daun herbal segar yang higienis, bersih, dan sangat menyehatkan penglihatan.',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    bgDark: '#f0fdf4',
    cardBg: '#ffffff',
    borderGlow: 'rgba(5, 150, 105, 0.25)',
    tag: 'Segar & Higienis',
    isLight: true,
    gradientBg: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #d1fae5 100%)'
  },
  {
    id: 'light-porcelain-sapphire',
    name: 'Porcelain Sapphire Corporate',
    category: 'Tema Terang (Light Mode)',
    description: 'Putih porselen berpadu gradasi biru safir korporat yang formal, berwibawa, dan rapi untuk operasional.',
    primaryColor: '#2563eb',
    secondaryColor: '#3b82f6',
    bgDark: '#eff6ff',
    cardBg: '#ffffff',
    borderGlow: 'rgba(37, 99, 235, 0.25)',
    tag: 'Formal & Elegan',
    isLight: true,
    gradientBg: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #dbeafe 100%)'
  },
  {
    id: 'light-warm-ivory',
    name: 'Warm Ivory & Golden Sand',
    category: 'Tema Terang (Light Mode)',
    description: 'Gradasi krem ivory hangat dan kilau keemasan madu yang ramah, nyaman, dan berkelas prima.',
    primaryColor: '#d97706',
    secondaryColor: '#f59e0b',
    bgDark: '#fffbeb',
    cardBg: '#ffffff',
    borderGlow: 'rgba(217, 119, 6, 0.25)',
    tag: 'Hangat & Ramah',
    isLight: true,
    gradientBg: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 50%, #fef3c7 100%)'
  },
  {
    id: 'light-lavender-sakura',
    name: 'Soft Lavender & Sakura Rose',
    category: 'Tema Terang (Light Mode)',
    description: 'Gradasi lembut lavender pastel dan merah muda sakura yang memberikan ketenangan dan kenyamanan visual.',
    primaryColor: '#9333ea',
    secondaryColor: '#db2777',
    bgDark: '#faf5ff',
    cardBg: '#ffffff',
    borderGlow: 'rgba(147, 51, 234, 0.25)',
    tag: 'Pastel Anggun',
    isLight: true,
    gradientBg: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 45%, #fce7f3 100%)'
  },
  {
    id: 'light-cool-platinum',
    name: 'Cool Platinum & Slate Modern',
    category: 'Tema Terang (Light Mode)',
    description: 'Estetika abu-abu platinum netral dengan aksen biru baja minimalis, tajam, dan kontras profesional.',
    primaryColor: '#475569',
    secondaryColor: '#0284c7',
    bgDark: '#f1f5f9',
    cardBg: '#ffffff',
    borderGlow: 'rgba(71, 85, 105, 0.22)',
    tag: 'Minimalis Modern',
    isLight: true,
    gradientBg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)'
  },

  // ==========================================
  // KATEGORI: MODERN DARK (DEFAULT & AERODINAMIS)
  // ==========================================
  {
    id: 'midnight-cyan',
    name: 'Midnight Aerodynamic (Default)',
    category: 'Modern Dark',
    description: 'Nuansa biru laut dalam dengan aksen cyan aerodinamis khas SIMRS Corporate.',
    primaryColor: '#06b6d4',
    secondaryColor: '#38bdf8',
    bgDark: '#0b0f19',
    cardBg: '#0f172a',
    borderGlow: 'rgba(6, 182, 212, 0.45)',
    tag: 'Standar Default'
  },
  {
    id: 'emerald-hospital',
    name: 'Emerald Health & Clinical',
    category: 'Medical & Clinical',
    description: 'Warna hijau zamrud klinis yang menenangkan, higienis, dan terpercaya bagi rumah sakit.',
    primaryColor: '#10b981',
    secondaryColor: '#34d399',
    bgDark: '#051410',
    cardBg: '#0b241c',
    borderGlow: 'rgba(16, 185, 129, 0.45)',
    tag: 'Klinis & Medis'
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst & Violet',
    category: 'Luxury & Vibrant',
    description: 'Gradasi ungu mewah dan orkid gelap memberikan kesan eksklusif dan bergengsi.',
    primaryColor: '#a855f7',
    secondaryColor: '#c084fc',
    bgDark: '#0f081d',
    cardBg: '#1b0f33',
    borderGlow: 'rgba(168, 85, 247, 0.45)',
    tag: 'Eksklusif'
  },
  {
    id: 'obsidian-crimson',
    name: 'Obsidian Crimson Velvet',
    category: 'Luxury & Vibrant',
    description: 'Kombinasi merah delima (ruby) berwibawa dengan latar hitam obsidian pekat.',
    primaryColor: '#f43f5e',
    secondaryColor: '#fb7185',
    bgDark: '#14070a',
    cardBg: '#260a12',
    borderGlow: 'rgba(244, 63, 94, 0.45)',
    tag: 'Premium Bold'
  },
  {
    id: 'golden-horizon',
    name: 'Golden Horizon & Amber',
    category: 'Luxury & Vibrant',
    description: 'Kombinasi emas murni dan tembaga hangat mencerminkan prestasi dan dedikasi.',
    primaryColor: '#f59e0b',
    secondaryColor: '#fbbf24',
    bgDark: '#140e05',
    cardBg: '#241807',
    borderGlow: 'rgba(245, 158, 11, 0.45)',
    tag: 'Keemasan'
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk High-Tech Neon',
    category: 'Modern Dark',
    description: 'Neon elektrik kontras tinggi perpaduan cyan berkilau dan aksen magenta futuristik.',
    primaryColor: '#00f0ff',
    secondaryColor: '#f000ff',
    bgDark: '#060714',
    cardBg: '#0f1128',
    borderGlow: 'rgba(0, 240, 255, 0.55)',
    tag: 'Ultra Futuristik'
  },
  {
    id: 'arctic-frost',
    name: 'Arctic Frost & Ice Glaze',
    category: 'Modern Dark',
    description: 'Kesejukan es kutub dengan latar biru malam pekat dan sentuhan es jernih.',
    primaryColor: '#38bdf8',
    secondaryColor: '#7dd3fc',
    bgDark: '#07111c',
    cardBg: '#0e1e33',
    borderGlow: 'rgba(56, 189, 248, 0.45)',
    tag: 'Sejuk & Bersih'
  },
  {
    id: 'titanium-executive',
    name: 'Titanium Slate Executive',
    category: 'Executive',
    description: 'Karakter baja titanium dingin dan abu-abu korporat formal yang minimalis.',
    primaryColor: '#94a3b8',
    secondaryColor: '#cbd5e1',
    bgDark: '#0f172a',
    cardBg: '#1e293b',
    borderGlow: 'rgba(148, 163, 184, 0.35)',
    tag: 'Korporat Formal'
  },
  {
    id: 'deep-ocean',
    name: 'Deep Mariana Trench',
    category: 'Modern Dark',
    description: 'Kedalaman samudra palung laut dengan aksen toska laut dan pantulan cahaya akuatik.',
    primaryColor: '#14b8a6',
    secondaryColor: '#2dd4bf',
    bgDark: '#03121a',
    cardBg: '#062230',
    borderGlow: 'rgba(20, 184, 166, 0.45)',
    tag: 'Samudra'
  },
  {
    id: 'rose-blossom',
    name: 'Rose Quartz & Mauve',
    category: 'Luxury & Vibrant',
    description: 'Kelembutan warna mawar dan kuarsa merah muda dengan estetika anggun dan hangat.',
    primaryColor: '#ec4899',
    secondaryColor: '#f472b6',
    bgDark: '#170914',
    cardBg: '#290d24',
    borderGlow: 'rgba(236, 72, 153, 0.45)',
    tag: 'Elegan Anggun'
  },
  {
    id: 'bio-forest',
    name: 'Bio-Sage Herbal Garden',
    category: 'Medical & Clinical',
    description: 'Nuansa herbal dan botani alami dengan perpaduan hijau daun muda dan lumut tropis.',
    primaryColor: '#84cc16',
    secondaryColor: '#a3e635',
    bgDark: '#081406',
    cardBg: '#13280d',
    borderGlow: 'rgba(132, 204, 22, 0.45)',
    tag: 'Alami Herbal'
  },
  {
    id: 'sunset-tangerine',
    name: 'Solar Flare Sunset',
    category: 'Executive',
    description: 'Energi hangat matahari senja dengan oranye jingga cerah yang membangkitkan semangat.',
    primaryColor: '#f97316',
    secondaryColor: '#fb923c',
    bgDark: '#170b05',
    cardBg: '#2a1408',
    borderGlow: 'rgba(249, 115, 22, 0.45)',
    tag: 'Penuh Semangat'
  }
];

const THEME_STORAGE_KEY = 'simrs_app_theme_preset_v1';
const THEME_CHANGE_EVENT = 'simrs-theme-changed';
const THEME_STYLE_ELEMENT_ID = 'simrs-active-theme-styles';

export function getActiveTheme(): ThemePreset {
  try {
    const savedId = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedId) {
      const found = THEME_PRESETS.find((t) => t.id === savedId);
      if (found) return found;
    }
  } catch {
    // ignore
  }
  return THEME_PRESETS.find((t) => t.id === 'midnight-cyan') || THEME_PRESETS[0];
}

export function setActiveTheme(themeId: string): ThemePreset {
  const theme = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  } catch {
    // ignore
  }
  applyThemeToDOM(theme);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }));
  saveThemeConfigToFirebase(theme.id).catch(() => {});
  return theme;
}

/**
 * Generates high-priority stylesheet rules that override base colors,
 * surfaces, cards, accents, buttons, borders, and glows for the active theme.
 * Screen media only so print layouts remain pristine white paper.
 */
export function generateThemeCss(theme: ThemePreset): string {
  const p = theme.primaryColor;
  const s = theme.secondaryColor;
  const bg = theme.bgDark;
  const card = theme.cardBg;
  const glow = theme.borderGlow;

  if (theme.isLight) {
    // =========================================================================
    // CSS INJECTION FOR HARMONIOUS LIGHT THEMES
    // =========================================================================
    const gradient = theme.gradientBg || `linear-gradient(135deg, ${bg} 0%, #ffffff 50%, ${bg} 100%)`;

    return `
@media screen {
  :root {
    --color-theme-primary: ${p};
    --color-theme-secondary: ${s};
    --color-theme-bg: ${bg};
    --color-theme-card: ${card};
    --color-theme-glow: ${glow};
    color-scheme: light;
  }

  /* Root Viewport and App Background */
  html, body, #root, .app-root-bg {
    background-color: ${bg} !important;
    background-image: ${gradient} !important;
    background-attachment: fixed !important;
    color: #0f172a !important;
  }

  /* Aerodynamic Mesh Backdrop with Light Gradient */
  .aero-mesh-backdrop {
    background-color: ${bg} !important;
    background-image: 
      radial-gradient(at 10% 12%, ${p}16 0px, transparent 40%),
      radial-gradient(at 90% 18%, ${s}18 0px, transparent 45%),
      radial-gradient(at 50% 88%, ${p}10 0px, transparent 50%),
      ${gradient} !important;
    background-attachment: fixed !important;
  }

  /* Structural Framework: Aside & Header */
  aside,
  header {
    background-color: #fffffff5 !important;
    border-color: #e2e8f0 !important;
    box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05) !important;
  }

  /* Aero Cards, Glass & Surfaces */
  .aero-card,
  .ultra-aero-surface,
  .aero-glass {
    background: #ffffff !important;
    border-color: #e2e8f0 !important;
    box-shadow: 0 4px 18px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.03) !important;
  }

  .aero-border-gradient {
    border-color: ${p}35 !important;
    box-shadow: inset 0 1px 0 0 ${p}15, 0 4px 14px -2px rgba(15, 23, 42, 0.06) !important;
  }

  /* Base Slate Backgrounds for Modals, Drawers & Tables */
  .bg-slate-950,
  .bg-slate-950\\/95,
  .bg-slate-950\\/90,
  .bg-slate-950\\/85,
  .bg-slate-950\\/80,
  .bg-slate-950\\/70,
  .bg-slate-950\\/60,
  .bg-slate-950\\/50,
  .bg-slate-950\\/40 {
    background-color: #f8fafceb !important;
  }

  .bg-slate-900,
  .bg-slate-900\\/95,
  .bg-slate-900\\/90,
  .bg-slate-900\\/80,
  .bg-slate-900\\/70,
  .bg-slate-900\\/60,
  .bg-slate-850,
  .bg-slate-800\\/90,
  .bg-slate-800\\/80 {
    background-color: #ffffff !important;
  }

  .bg-slate-800,
  .bg-slate-800\\/60,
  .bg-slate-800\\/40 {
    background-color: #f1f5f9 !important;
  }

  /* Borders Adaptation for Light Mode */
  .border-slate-800,
  .border-slate-800\\/90,
  .border-slate-800\\/80,
  .border-slate-800\\/70,
  .border-slate-800\\/60,
  .border-slate-700,
  .border-slate-700\\/80,
  .border-slate-700\\/60 {
    border-color: #e2e8f0 !important;
  }

  /* Typography Contrast in Light Mode */
  h1, h2, h3, h4, h5, h6 {
    color: #0f172a !important;
  }

  .text-white:not(button):not(button *):not([class*="bg-cyan-5"]):not([class*="bg-cyan-6"]):not([class*="bg-emerald-6"]):not([class*="bg-rose-5"]):not([class*="bg-rose-6"]):not([class*="bg-amber-5"]):not([class*="bg-indigo-6"]):not([class*="bg-blue-6"]):not(.keep-text-white),
  .text-slate-100,
  .text-slate-200 {
    color: #0f172a !important;
  }

  .text-slate-300 {
    color: #334155 !important;
  }

  .text-slate-400 {
    color: #64748b !important;
  }

  .text-slate-500 {
    color: #94a3b8 !important;
  }

  .text-slate-600 {
    color: #94a3b8 !important;
  }

  /* Form Controls */
  input:not([type="checkbox"]):not([type="radio"]),
  select,
  textarea {
    background-color: #ffffff !important;
    color: #0f172a !important;
    border-color: #cbd5e1 !important;
  }

  input::placeholder,
  textarea::placeholder {
    color: #94a3b8 !important;
  }

  input:focus,
  select:focus,
  textarea:focus {
    border-color: ${p} !important;
    box-shadow: 0 0 0 2px ${p}20 !important;
  }

  /* Primary Accent Text */
  .text-cyan-400,
  .text-cyan-300,
  .text-cyan-200,
  .text-cyan-500 {
    color: ${p} !important;
  }

  /* Status Colors in Light Mode */
  .text-emerald-400 {
    color: #059669 !important;
  }
  .text-rose-400,
  .text-rose-400\\/90 {
    color: #e11d48 !important;
  }
  .text-amber-400 {
    color: #d97706 !important;
  }
  .text-sky-400 {
    color: #0284c7 !important;
  }
  .text-purple-400 {
    color: #9333ea !important;
  }

  /* Primary Accent Buttons & Active States */
  .bg-cyan-500,
  .bg-cyan-400,
  .bg-cyan-600,
  button.bg-cyan-500,
  button.bg-cyan-600 {
    background-color: ${p} !important;
    color: #ffffff !important;
  }

  .bg-cyan-500 *,
  .bg-cyan-600 *,
  .bg-cyan-400 *,
  .bg-cyan-500.text-slate-950,
  .bg-cyan-500 .text-slate-950 {
    color: #ffffff !important;
  }

  /* Badge and Pill Accents in Light Mode */
  .bg-cyan-950,
  .bg-cyan-950\\/90,
  .bg-cyan-950\\/80,
  .bg-cyan-950\\/70,
  .bg-cyan-950\\/60,
  .bg-cyan-950\\/50,
  .bg-cyan-950\\/40,
  .bg-cyan-950\\/30,
  .bg-cyan-950\\/20,
  .bg-cyan-900\\/60,
  .bg-cyan-900\\/50,
  .bg-cyan-900\\/40 {
    background-color: ${p}15 !important;
    color: ${p} !important;
    border-color: ${p}35 !important;
  }

  .bg-emerald-950,
  .bg-emerald-950\\/60,
  .bg-emerald-950\\/50 {
    background-color: #ecfdf5 !important;
    color: #059669 !important;
    border-color: #a7f3d0 !important;
  }

  .bg-rose-950,
  .bg-rose-950\\/60,
  .bg-rose-950\\/50 {
    background-color: #fff1f2 !important;
    color: #e11d48 !important;
    border-color: #fecdd3 !important;
  }

  .bg-amber-950,
  .bg-amber-950\\/60,
  .bg-amber-950\\/50 {
    background-color: #fffbeb !important;
    color: #d97706 !important;
    border-color: #fde68a !important;
  }

  /* Accent Borders */
  .border-cyan-500,
  .border-cyan-400,
  .border-cyan-300,
  .border-cyan-500\\/50,
  .border-cyan-500\\/40,
  .border-cyan-500\\/30,
  .border-cyan-500\\/20,
  .border-cyan-700,
  .border-cyan-800,
  .border-cyan-800\\/80,
  .border-cyan-800\\/70,
  .border-cyan-800\\/60,
  .border-cyan-900\\/40 {
    border-color: ${p}45 !important;
  }

  .border-cyan-400 {
    border-color: ${p} !important;
  }

  /* Interactive Hovers in Light Mode */
  .hover\\:bg-cyan-400:hover,
  .hover\\:bg-cyan-500:hover,
  .hover\\:bg-cyan-300:hover {
    background-color: ${s} !important;
    color: #ffffff !important;
  }

  .hover\\:bg-slate-850:hover,
  .hover\\:bg-slate-800:hover,
  .hover\\:bg-slate-900:hover,
  .hover\\:bg-slate-700\\/60:hover {
    background-color: #f1f5f9 !important;
  }

  .hover\\:text-cyan-300:hover,
  .hover\\:text-cyan-400:hover,
  .hover\\:text-cyan-200:hover,
  .group:hover .group-hover\\:text-cyan-300,
  .group:hover .group-hover\\:text-cyan-400 {
    color: ${s} !important;
  }

  .hover\\:border-cyan-400:hover,
  .hover\\:border-cyan-500:hover,
  .hover\\:border-cyan-500\\/50:hover,
  .focus\\:border-cyan-400:focus,
  .focus\\:border-cyan-500:focus {
    border-color: ${p} !important;
  }

  /* Active Ring & Highlight */
  .ring-cyan-400,
  .ring-cyan-500,
  .ring-cyan-400\\/90,
  .ring-cyan-400\\/40,
  .ring-cyan-500\\/40 {
    --tw-ring-color: ${p} !important;
  }

  /* Glow Effects */
  .aero-glow-cyan {
    box-shadow: 0 0 16px -2px ${glow} !important;
  }

  /* Modal Backdrop in Light Mode */
  .fixed.inset-0.bg-slate-950\\/80,
  .fixed.inset-0.bg-slate-950\\/70,
  .fixed.inset-0.bg-black\\/60,
  .fixed.inset-0.bg-black\\/70,
  .fixed.inset-0.bg-black\\/80 {
    background-color: rgba(15, 23, 42, 0.45) !important;
  }

  /* Selections & Scrollbars */
  ::selection {
    background-color: ${p} !important;
    color: #ffffff !important;
  }

  ::-webkit-scrollbar-track {
    background: #f1f5f9 !important;
  }

  ::-webkit-scrollbar-thumb {
    background: ${p}45 !important;
    border-radius: 9999px !important;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${p}85 !important;
  }

  /* Keyboard kbd */
  kbd {
    background-color: #f1f5f9 !important;
    border-color: #cbd5e1 !important;
    color: #334155 !important;
  }

  /* Brand and Gradient Accents */
  .from-cyan-600,
  .from-cyan-500,
  .from-cyan-700 {
    --tw-gradient-from: ${p} var(--tw-gradient-from-position) !important;
    --tw-gradient-to: ${s} var(--tw-gradient-to-position) !important;
    --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-from), var(--tw-gradient-to)) !important;
  }

  .to-sky-600,
  .to-sky-500,
  .to-indigo-600 {
    --tw-gradient-to: ${s} var(--tw-gradient-to-position) !important;
  }
}
`;
  }

  // =========================================================================
  // CSS INJECTION FOR DARK THEMES (DEFAULT)
  // =========================================================================
  return `
@media screen {
  :root {
    --color-theme-primary: ${p};
    --color-theme-secondary: ${s};
    --color-theme-bg: ${bg};
    --color-theme-card: ${card};
    --color-theme-glow: ${glow};
    color-scheme: dark;
  }

  /* Root Viewport and App Background */
  html, body, #root, .app-root-bg {
    background-color: ${bg} !important;
  }

  /* Aerodynamic Mesh Backdrop */
  .aero-mesh-backdrop {
    background-color: ${bg} !important;
    background-image: 
      radial-gradient(at 10% 10%, ${p}24 0px, transparent 35%),
      radial-gradient(at 90% 15%, ${s}20 0px, transparent 40%),
      radial-gradient(at 50% 90%, ${p}18 0px, transparent 45%) !important;
  }

  /* Structural Framework: Aside & Header */
  aside,
  header {
    background-color: ${card}f6 !important;
    border-color: ${p}26 !important;
  }

  /* Aero Cards, Glass & Surfaces */
  .aero-card,
  .ultra-aero-surface,
  .aero-glass {
    background: linear-gradient(135deg, ${card}f8 0%, ${bg}fc 100%) !important;
    border-color: ${p}33 !important;
  }

  .aero-border-gradient {
    border-color: ${p}36 !important;
    box-shadow: inset 0 1px 0 0 ${p}22, 0 4px 18px -2px rgba(0, 0, 0, 0.5) !important;
  }

  /* Base Slate Backgrounds for Modals, Drawers & Tables */
  .bg-slate-950,
  .bg-slate-950\\/95,
  .bg-slate-950\\/90,
  .bg-slate-950\\/85,
  .bg-slate-950\\/80,
  .bg-slate-950\\/70,
  .bg-slate-950\\/60,
  .bg-slate-950\\/50 {
    background-color: ${bg}f0 !important;
  }

  .bg-slate-900,
  .bg-slate-900\\/95,
  .bg-slate-900\\/90,
  .bg-slate-900\\/80,
  .bg-slate-900\\/70,
  .bg-slate-900\\/60,
  .bg-slate-850 {
    background-color: ${card} !important;
  }

  /* Primary Accent Text */
  .text-cyan-400,
  .text-cyan-300,
  .text-cyan-200,
  .text-cyan-500 {
    color: ${p} !important;
  }

  /* Primary Accent Buttons & Active States */
  .bg-cyan-500,
  .bg-cyan-400,
  .bg-cyan-600 {
    background-color: ${p} !important;
    color: #ffffff !important;
  }

  /* Badge and Pill Accents */
  .bg-cyan-950,
  .bg-cyan-950\\/90,
  .bg-cyan-950\\/80,
  .bg-cyan-950\\/70,
  .bg-cyan-950\\/60,
  .bg-cyan-950\\/50,
  .bg-cyan-950\\/40,
  .bg-cyan-950\\/30,
  .bg-cyan-950\\/20,
  .bg-cyan-900\\/60,
  .bg-cyan-900\\/50,
  .bg-cyan-900\\/40 {
    background-color: ${p}22 !important;
    color: ${p} !important;
    border-color: ${p}48 !important;
  }

  /* Accent Borders */
  .border-cyan-500,
  .border-cyan-400,
  .border-cyan-300,
  .border-cyan-500\\/50,
  .border-cyan-500\\/40,
  .border-cyan-500\\/30,
  .border-cyan-500\\/20,
  .border-cyan-700,
  .border-cyan-800,
  .border-cyan-800\\/80,
  .border-cyan-800\\/70,
  .border-cyan-800\\/60,
  .border-cyan-900\\/40 {
    border-color: ${p}55 !important;
  }

  .border-cyan-400 {
    border-color: ${p} !important;
  }

  /* Interactive Hovers */
  .hover\\:bg-cyan-400:hover,
  .hover\\:bg-cyan-500:hover,
  .hover\\:bg-cyan-300:hover {
    background-color: ${s} !important;
    color: #ffffff !important;
  }

  .hover\\:text-cyan-300:hover,
  .hover\\:text-cyan-400:hover,
  .hover\\:text-cyan-200:hover,
  .group:hover .group-hover\\:text-cyan-300,
  .group:hover .group-hover\\:text-cyan-400 {
    color: ${s} !important;
  }

  .hover\\:border-cyan-400:hover,
  .hover\\:border-cyan-500:hover,
  .hover\\:border-cyan-500\\/50:hover,
  .focus\\:border-cyan-400:focus,
  .focus\\:border-cyan-500:focus {
    border-color: ${p} !important;
  }

  /* Active Ring & Highlight */
  .ring-cyan-400,
  .ring-cyan-500,
  .ring-cyan-400\\/90,
  .ring-cyan-400\\/40,
  .ring-cyan-500\\/40 {
    --tw-ring-color: ${p} !important;
  }

  /* Glow Effects */
  .aero-glow-cyan {
    box-shadow: 0 0 18px -2px ${glow} !important;
  }

  /* Selections & Scrollbars */
  ::selection {
    background-color: ${p} !important;
    color: #ffffff !important;
  }

  ::-webkit-scrollbar-thumb {
    background: ${p}40 !important;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${p}88 !important;
  }

  /* Brand and Gradient Accents */
  .from-cyan-600,
  .from-cyan-500,
  .from-cyan-700 {
    --tw-gradient-from: ${p} var(--tw-gradient-from-position) !important;
    --tw-gradient-to: ${s} var(--tw-gradient-to-position) !important;
    --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-from), var(--tw-gradient-to)) !important;
  }

  .to-sky-600,
  .to-sky-500,
  .to-indigo-600 {
    --tw-gradient-to: ${s} var(--tw-gradient-to-position) !important;
  }
}
`;
}

export function applyThemeToDOM(theme: ThemePreset = getActiveTheme()): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-theme-mode', theme.isLight ? 'light' : 'dark');
  root.style.setProperty('--color-theme-primary', theme.primaryColor);
  root.style.setProperty('--color-theme-secondary', theme.secondaryColor);
  root.style.setProperty('--color-theme-bg', theme.bgDark);
  root.style.setProperty('--color-theme-card', theme.cardBg);
  root.style.setProperty('--color-theme-glow', theme.borderGlow);

  // Update body background
  if (document.body) {
    document.body.style.backgroundColor = theme.bgDark;
    if (theme.isLight && theme.gradientBg) {
      document.body.style.backgroundImage = theme.gradientBg;
    } else {
      document.body.style.backgroundImage = '';
    }
  }

  // Inject or update dynamic high-priority theme stylesheet
  let styleTag = document.getElementById(THEME_STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = THEME_STYLE_ELEMENT_ID;
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = generateThemeCss(theme);
}

export function onThemeChange(callback: (theme: ThemePreset) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<ThemePreset>;
    callback(customEvent.detail || getActiveTheme());
  };
  window.addEventListener(THEME_CHANGE_EVENT, handler);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, handler);
}

/**
 * Start real-time Firestore sync for Visual Theme across all devices
 */
export function startRealtimeThemeSync(): () => void {
  return subscribeToThemeConfig((remoteThemeId) => {
    if (!remoteThemeId) return;
    const currentTheme = getActiveTheme();
    if (currentTheme.id !== remoteThemeId) {
      const found = THEME_PRESETS.find((t) => t.id === remoteThemeId);
      if (found) {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, found.id);
        } catch {
          // ignore
        }
        applyThemeToDOM(found);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: found }));
        }
      }
    }
  });
}

// Auto-run applyThemeToDOM immediately on file evaluation if in browser
if (typeof window !== 'undefined') {
  try {
    applyThemeToDOM();
  } catch {
    // ignore
  }
}
