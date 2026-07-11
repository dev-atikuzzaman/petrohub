// src/lib/TypographyContext.js
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { FONT_OPTIONS, SIZE_OPTIONS, WEIGHT_OPTIONS, TEXT_COLOR_OPTIONS, DEFAULT_TYPOGRAPHY, supportsZoom } from './typography';

const TypographyContext = createContext(null);
const STORAGE_KEY = 'petro-hub-typography-v1';

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
  const zoomOk = useMemo(() => supportsZoom(), []);

  useEffect(() => {
    // গ্লোবাল ফন্ট body তে বসানো হয় — বাকি সব কম্পোনেন্ট এটাই inherit করবে
    const font = FONT_OPTIONS[state.global.font] || FONT_OPTIONS.system;
    document.body.style.fontFamily = font.stack;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage ব্লক থাকলেও অ্যাপ যেন না ভাঙে
    }
  }, [state]);

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
    const font = FONT_OPTIONS[eff.font] || FONT_OPTIONS.system;
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
    fontOptions: FONT_OPTIONS,
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
