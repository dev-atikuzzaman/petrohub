// src/lib/themes.js
// প্রতিটা থিমের জন্য একটা সম্পূর্ণ color palette। প্রতিটা component এই
// নামগুলো (CSS variable হিসেবে) ব্যবহার করবে, hardcoded hex color নয়।

export const THEMES = {
  light: {
    label: 'Light',
    emoji: '☀️',
    colors: {
      // মূল background স্তরগুলো
      bgBase: '#f0f4f8',        // পুরো পেজের background
      bgSurface: '#ffffff',      // card/modal background
      bgSurfaceAlt: '#f8fafc',   // হালকা ধূসর প্যানেল (button bg, input bg)
      bgHeader: 'rgba(255,255,255,0.92)',

      // টেক্সট
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      textMuted: '#94a3b8',
      textInverse: '#ffffff',

      // বর্ডার
      border: '#e2e8f0',
      borderSoft: '#f1f5f9',     // অতি হালকা divider (list separator, hover bg)
      borderFocus: '#0ea5e9',

      // অ্যাকসেন্ট (প্রধান ব্র্যান্ড রং — বাটন, লিংক, হাইলাইট)
      accent: '#0ea5e9',
      accentDark: '#1e3a5f',
      accentGradient: 'linear-gradient(135deg, #0ea5e9, #1e3a5f)',
      accentSoft: '#f0f9ff',     // হালকা accent background (selected state)

      // স্ট্যাটাস রং
      success: '#16a34a',
      successSoft: '#dcfce7',
      danger: '#dc2626',
      dangerSoft: '#fee2e2',
      warning: '#d97706',
      warningSoft: '#fef3c7',
      info: '#0284c7',
      infoSoft: '#e0f2fe',
      adminColor: '#7c3aed',
      adminSoft: '#ede9fe',

      // শ্যাডো
      shadow: '0 2px 12px rgba(0,0,0,0.06)',
      shadowLg: '0 20px 60px rgba(0,0,0,0.3)',
    },
  },

  dark: {
    label: 'Dark',
    emoji: '🌙',
    colors: {
      bgBase: '#0f172a',
      bgSurface: '#1e293b',
      bgSurfaceAlt: '#283548',
      bgHeader: 'rgba(15,23,42,0.92)',

      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      textInverse: '#0f172a',

      border: '#334155',
      borderSoft: '#283548',
      borderFocus: '#38bdf8',

      accent: '#38bdf8',
      accentDark: '#0369a1',
      accentGradient: 'linear-gradient(135deg, #38bdf8, #0369a1)',
      accentSoft: '#0c2d48',

      success: '#4ade80',
      successSoft: '#14532d',
      danger: '#f87171',
      dangerSoft: '#450a0a',
      warning: '#fbbf24',
      warningSoft: '#451a03',
      info: '#38bdf8',
      infoSoft: '#0c2d48',
      adminColor: '#a78bfa',
      adminSoft: '#2e1065',

      shadow: '0 2px 12px rgba(0,0,0,0.4)',
      shadowLg: '0 20px 60px rgba(0,0,0,0.6)',
    },
  },

  andromeda: {
    label: 'Andromeda',
    emoji: '🌌',
    colors: {
      // Andromeda VS Code থিম থেকে অনুপ্রাণিত — গাঢ় বেগুনি-নীল background, উজ্জ্বল cyan/pink accent
      bgBase: '#23262e',
      bgSurface: '#2b2f3a',
      bgSurfaceAlt: '#343844',
      bgHeader: 'rgba(35,38,46,0.92)',

      textPrimary: '#e6e6e6',
      textSecondary: '#a3a9bf',
      textMuted: '#787c8c',
      textInverse: '#23262e',

      border: '#3d4250',
      borderSoft: '#343844',
      borderFocus: '#00e8c6',

      accent: '#00e8c6',
      accentDark: '#7159ff',
      accentGradient: 'linear-gradient(135deg, #00e8c6, #7159ff)',
      accentSoft: '#1c3a3a',

      success: '#96e072',
      successSoft: '#1f3320',
      danger: '#f06c9b',
      dangerSoft: '#3a1525',
      warning: '#ffcb6b',
      warningSoft: '#3a2e10',
      info: '#7159ff',
      infoSoft: '#241c47',
      adminColor: '#c792ea',
      adminSoft: '#2e2240',

      shadow: '0 2px 12px rgba(0,0,0,0.45)',
      shadowLg: '0 20px 60px rgba(0,0,0,0.65)',
    },
  },
  premium: {
    label: 'Premium Forest',
    emoji: '🌿',
    colors: {
      // akibbd.com এর "Deep Forest Green" aesthetic থেকে অনুপ্রাণিত —
      // গাঢ় সবুজ-কালো gradient background, গ্লাস-কার্ড, সোনালি/টিল অ্যাকসেন্ট
      bgBase: 'linear-gradient(160deg, #060f0b 0%, #0a2118 42%, #0e3524 100%)',
      bgSurface: '#0f2a1e',
      bgSurfaceAlt: '#15382a',
      bgHeader: 'rgba(7,20,14,0.88)',

      textPrimary: '#eafff2',
      textSecondary: '#a4d9bf',
      textMuted: '#72a893',
      textInverse: '#06150e',

      border: 'rgba(110,210,165,0.18)',
      borderSoft: 'rgba(110,210,165,0.08)',
      borderFocus: '#2bd9ac',

      accent: '#2bd9ac',
      accentDark: '#0e7a8f',
      accentGradient: 'linear-gradient(135deg, #2bd9ac, #f5b942)',
      accentSoft: 'rgba(43,217,172,0.14)',

      success: '#4ade80',
      successSoft: 'rgba(74,222,128,0.16)',
      danger: '#f87171',
      dangerSoft: 'rgba(248,113,113,0.16)',
      warning: '#fbbf24',
      warningSoft: 'rgba(251,191,36,0.16)',
      info: '#38bdf8',
      infoSoft: 'rgba(56,189,248,0.16)',
      adminColor: '#c792ea',
      adminSoft: 'rgba(199,146,234,0.18)',

      shadow: '0 2px 20px rgba(0,0,0,0.35)',
      shadowLg: '0 24px 70px rgba(0,0,0,0.55)',
    },
  },
};

export const THEME_ORDER = ['premium', 'light', 'dark', 'andromeda'];

/**
 * একটা থিমের colors object থেকে CSS variable string বানায়,
 * যেটা :root এ inject করা হবে।
 */
export function themeToCSSVariables(themeKey) {
  const theme = THEMES[themeKey] || THEMES.light;
  return Object.entries(theme.colors)
    .map(([key, value]) => {
      // camelCase কে kebab-case এ বদলানো: bgBase -> --bg-base
      const cssVarName = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssVarName}: ${value};`;
    })
    .join('\n');
}
