// src/lib/TypographyContext.js
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { FONT_OPTIONS, FONT_ORDER, SIZE_OPTIONS, WEIGHT_OPTIONS, TEXT_COLOR_OPTIONS, DEFAULT_TYPOGRAPHY, supportsZoom, buildCustomFontEntry, googleFontsUrl } from './typography';

const TypographyContext = createContext(null);
const STORAGE_KEY = 'petro-hub-typography-v1';
const CUSTOM_FONTS_KEY = 'petro-hub-custom-fonts-v1';

function loadCustomFonts() {
  try {
    const raw = localStorage.getItem(CUSTOM_FONTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function injectGoogleFontLink(name) {
  const id = `custom-font-${name.trim().toLowerCase().replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return; // আগেই লোড করা থাকলে আবার যোগ করার দরকার নেই
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = googleFontsUrl(name);
  document.head.appendChild(link);
}

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { global: DEFAULT_TYPOGRAPHY, pages: {} };
    const parsed = JSON.parse(raw);
    return {
      global: { ...DEFAULT_TYPOGRAPHY, ...(parsed.global || {}) },
      pages: parsed.pages || {},
    };
  } catch {
    return { global: DEFAULT_TYPOGRAPHY, pages: {} };
  }
}

export function TypographyProvider({ children }) {
  const [state, setState] = useState(loadStored);
  const [customFonts, setCustomFonts] = useState(loadCustomFonts);
  const zoomOk = useMemo(() => supportsZoom(), []);

  // মিশ্রিত ফন্ট তালিকা — বিল্ট-ইন ৭টা + ব্যবহারকারীর যোগ করা কাস্টম ফন্ট
  const mergedFontOptions = useMemo(() => {
    const merged = { ...FONT_OPTIONS };
    customFonts.forEach((name) => {
      merged[`custom:${name}`] = buildCustomFontEntry(name);
    });
    return merged;
  }, [customFonts]);

  const mergedFontOrder = useMemo(
    () => [...FONT_ORDER, ...customFonts.map((name) => `custom:${name}`)],
    [customFonts]
  );

  // অ্যাপ চালু হওয়ার সময় আগে যোগ করা কাস্টম ফন্টগুলো Google Fonts থেকে
  // (আবার) লোড করে নেওয়া — লোকালস্টোরেজে নাম সংরক্ষিত থাকে, কিন্তু
  // stylesheet <link> ট্যাগ পেজ রিফ্রেশ হলে হারিয়ে যায়
  useEffect(() => {
    customFonts.forEach((name) => injectGoogleFontLink(name));
  }, [customFonts]);

  useEffect(() => {
    // গ্লোবাল ফন্ট body তে বসানো হয় — বাকি সব কম্পোনেন্ট এটাই inherit করবে
    const font = mergedFontOptions[state.global.font] || FONT_OPTIONS.system;
    document.body.style.fontFamily = font.stack;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage ব্লক থাকলেও অ্যাপ যেন না ভাঙে
    }
  }, [state, mergedFontOptions]);

  function addCustomFont(name) {
    const clean = (name || '').trim();
    if (!clean) return { error: 'ফন্টের নাম লিখুন' };

    const alreadyExists = customFonts.some((f) => f.toLowerCase() === clean.toLowerCase());
    if (alreadyExists) return { error: 'এই ফন্ট আগেই যোগ করা আছে' };

    injectGoogleFontLink(clean);
    const next = [...customFonts, clean];
    setCustomFonts(next);
    try {
      localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    return { error: null, key: `custom:${clean}` };
  }

  function removeCustomFont(name) {
    const next = customFonts.filter((f) => f !== name);
    setCustomFonts(next);
    try {
      localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function setGlobal(partial) {
    setState((prev) => ({ ...prev, global: { ...prev.global, ...partial } }));
  }

  function setPageOverride(pageKey, partial) {
    setState((prev) => ({
      ...prev,
      pages: { ...prev.pages, [pageKey]: { ...(prev.pages[pageKey] || {}), ...partial } },
    }));
  }

  function clearPageOverride(pageKey) {
    setState((prev) => {
      const next = { ...prev.pages };
      delete next[pageKey];
      return { ...prev, pages: next };
    });
  }

  // pageKey এর জন্য effective (override থাকলে সেটা, না থাকলে global) সেটিংস
  function getEffective(pageKey) {
    const override = pageKey && state.pages[pageKey];
    return override ? { ...state.global, ...override } : state.global;
  }

  // একটা page wrapper <div> এ বসানোর জন্য style object — font-family, boldness ও size scale
  function getPageStyle(pageKey) {
    const eff = getEffective(pageKey);
    const font = mergedFontOptions[eff.font] || FONT_OPTIONS.system;
    const weight = WEIGHT_OPTIONS[eff.weight] || WEIGHT_OPTIONS.normal;
    const size = SIZE_OPTIONS[eff.size] || SIZE_OPTIONS.normal;

    const style = { fontFamily: font.stack, fontWeight: weight.value };

    // color override — CSS custom property হিসেবে বসানো হয়, তাই এই wrapper এর
    // ভেতরে var(--text-primary) ব্যবহার করা যেকোনো element স্বয়ংক্রিয়ভাবে এই রঙ পাবে
    const colorOpt = TEXT_COLOR_OPTIONS[eff.color];
    if (colorOpt && colorOpt.value) {
      style['--text-primary'] = colorOpt.value;
    }

    if (size.scale !== 1) {
      if (zoomOk) {
        style.zoom = size.scale;
      } else {
        // Firefox fallback: transform-scale + width compensation যাতে layout ভেঙে না যায়
        style.transform = `scale(${size.scale})`;
        style.transformOrigin = 'top center';
        style.width = `${100 / size.scale}%`;
        style.marginLeft = `${(100 - 100 / size.scale) / 2}%`;
      }
    }
    return style;
  }

  const value = {
    global: state.global,
    pages: state.pages,
    setGlobal,
    setPageOverride,
    clearPageOverride,
    getEffective,
    getPageStyle,
    fontOptions: mergedFontOptions,
    fontOrder: mergedFontOrder,
    customFonts,
    addCustomFont,
    removeCustomFont,
    sizeOptions: SIZE_OPTIONS,
    weightOptions: WEIGHT_OPTIONS,
  };

  return <TypographyContext.Provider value={value}>{children}</TypographyContext.Provider>;
}

export function useTypography() {
  const ctx = useContext(TypographyContext);
  if (!ctx) throw new Error('useTypography must be used within TypographyProvider');
  return ctx;
}
