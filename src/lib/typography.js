// src/lib/typography.js
// ফন্ট, সাইজ ও বোল্ডনেস — গ্লোবাল ও পেজ-ওয়াইজ কাস্টমাইজেশনের জন্য অপশনগুলো এখানে সংজ্ঞায়িত।
// দাপ্তরিক বাংলা ফন্টগুলো (Nikosh, NikoshBan, SiyamRupali) সাধারণত ব্যবহারকারীর
// কম্পিউটারে আগে থেকেই ইনস্টল করা থাকে (সরকারি/অফিসিয়াল ব্যবহারের জন্য প্রচলিত)।
// এখানে সেগুলোকে system font হিসেবে রেফার করা হয়েছে, সাথে যুক্তিসঙ্গত fallback দেওয়া আছে —
// ফন্ট ইনস্টল করা না থাকলে ব্রাউজার স্বয়ংক্রিয়ভাবে পরবর্তী fallback ব্যবহার করবে।

export const FONT_OPTIONS = {
  system: {
    label: 'ডিফল্ট (Hind Siliguri)',
    stack: "'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  },
  solaimanLipi: {
    label: 'SolaimanLipi',
    stack: "'SolaimanLipi', 'Hind Siliguri', sans-serif",
  },
  nikosh: {
    label: 'Nikosh',
    stack: "'Nikosh', 'SolaimanLipi', 'Hind Siliguri', sans-serif",
  },
  nikoshBan: {
    label: 'NikoshBan',
    stack: "'NikoshBan', 'Nikosh', 'SolaimanLipi', sans-serif",
  },
  siyamRupali: {
    label: 'Siyam Rupali',
    stack: "'Siyam Rupali', 'SolaimanLipi', 'Hind Siliguri', sans-serif",
  },
  timesNewRoman: {
    label: 'Times New Roman (দাপ্তরিক)',
    stack: "'Times New Roman', 'Nikosh', Times, serif",
  },
  kalpurush: {
    label: 'Kalpurush',
    stack: "'Kalpurush', 'SolaimanLipi', 'Hind Siliguri', sans-serif",
  },
};

export const FONT_ORDER = ['system', 'solaimanLipi', 'nikosh', 'nikoshBan', 'siyamRupali', 'timesNewRoman', 'kalpurush'];

// zoom-scale ভিত্তিক সাইজ — পুরো পেজের সব লেখা (হেডিং, বাটন, লেবেল) একসাথে বড়/ছোট হবে
export const SIZE_OPTIONS = {
  compact: { label: 'কমপ্যাক্ট', scale: 0.92 },
  normal: { label: 'স্বাভাবিক', scale: 1 },
  large: { label: 'বড়', scale: 1.14 },
  xlarge: { label: 'অতিরিক্ত বড়', scale: 1.3 },
};

export const SIZE_ORDER = ['compact', 'normal', 'large', 'xlarge'];

export const WEIGHT_OPTIONS = {
  normal: { label: 'স্বাভাবিক', value: 400 },
  medium: { label: 'মিডিয়াম', value: 550 },
  bold: { label: 'বোল্ড', value: 700 },
  extrabold: { label: 'অতিরিক্ত বোল্ড', value: 800 },
};

export const WEIGHT_ORDER = ['normal', 'medium', 'bold', 'extrabold'];

// পেজ-ওয়াইজ কাস্টমাইজেশনের জন্য ট্যাব লিস্ট (App.js এর tabs এর সাথে মিলিয়ে রাখা)
export const PAGE_OPTIONS = [
  { key: '__global__', label: 'সব পেজ (গ্লোবাল ডিফল্ট)' },
  { key: 'feed', label: 'ফিড' },
  { key: 'members', label: 'সদস্য' },
  { key: 'updates', label: 'আপডেট' },
  { key: 'notes', label: 'নোট' },
  { key: 'websites', label: 'ওয়েবসাইট' },
  { key: 'documents', label: 'ডকুমেন্ট' },
  { key: 'stats', label: 'পরিসংখ্যান' },
  { key: 'settings', label: 'সেটিংস' },
];

// লেখার রঙ — থিমের সাথে মানানসই একটা curated প্যালেট, যাতে পেজ-ভিত্তিক
// রঙ পাল্টালেও readability নষ্ট না হয়
export const TEXT_COLOR_OPTIONS = {
  default: { label: 'থিমের ডিফল্ট', value: null },
  mint: { label: 'মিন্ট সাদা', value: '#eafff2' },
  gold: { label: 'সোনালি', value: '#f5d78a' },
  sky: { label: 'আকাশি নীল', value: '#bfe4ff' },
  warm: { label: 'উষ্ণ সাদা', value: '#fdf6e3' },
  slate: { label: 'স্লেট ধূসর', value: '#dbe6e0' },
};

export const TEXT_COLOR_ORDER = ['default', 'mint', 'gold', 'sky', 'warm', 'slate'];

export const DEFAULT_TYPOGRAPHY = { font: 'system', size: 'normal', weight: 'normal', color: 'default' };

// ============================================================
// কাস্টম ফন্ট — ব্যবহারকারী নিজে ফন্টের নাম লিখে যোগ করতে পারেন
// ============================================================
// এখানে থাকা ৭টা ফন্ট (SolaimanLipi, Nikosh ইত্যাদি) সাধারণত মানুষের
// ডিভাইসে ইনস্টল করা থাকে না, তাই বেছে নিলেও দৃশ্যত কোনো পরিবর্তন
// দেখা যায় না। এর সমাধান হিসেবে ব্যবহারকারী Google Fonts-এ থাকা
// যেকোনো ফন্টের নাম লিখে দিলে সেটা সরাসরি Google Fonts থেকে লোড করে
// নেওয়া হয় (ইনস্টলের দরকার নেই, ইন্টারনেট lagbe)।

// একটা কাস্টম ফন্টের নাম থেকে dropdown-এর জন্য entry বানানো
export function buildCustomFontEntry(name) {
  const clean = name.trim();
  return {
    label: `${clean} (কাস্টম)`,
    stack: `'${clean}', 'Hind Siliguri', sans-serif`,
    isCustom: true,
    googleFontName: clean,
  };
}

// Google Fonts CSS2 API থেকে ফন্টটা লোড করার জন্য stylesheet URL
export function googleFontsUrl(name) {
  const family = name.trim().replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%2B/g, '+')}:wght@400;500;600;700;800&display=swap`;
}

// zoom সাপোর্ট করে না এমন ব্রাউজারের (মূলত Firefox) জন্য transform-scale ফলব্যাক দরকার কিনা যাচাই
export function supportsZoom() {
  try {
    return typeof document !== 'undefined' && CSS && CSS.supports && CSS.supports('zoom', '1');
  } catch {
    return false;
  }
}
