// src/lib/ThemeContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { THEMES, THEME_ORDER, themeToCSSVariables } from './themes';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'petro-hub-theme';

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(() => {
    // localStorage থেকে আগে সিলেক্ট করা থিম পড়া, না থাকলে 'light' ডিফল্ট
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && THEMES[saved] ? saved : 'premium';
    } catch {
      return 'premium';
    }
  });

  useEffect(() => {
    // প্রতিবার থিম বদলালে :root এ CSS variable বসানো হয়
    const cssVars = themeToCSSVariables(themeKey);
    let styleTag = document.getElementById('theme-vars');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'theme-vars';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = `:root {\n${cssVars}\n}`;

    // body background ও সাথে সাথে বদলানো (flash এড়াতে)
    document.body.style.background = THEMES[themeKey].colors.bgBase;

    // ডার্ক থিমে native form control (dropdown, checkbox ইত্যাদি) সঠিকভাবে
    // দেখানোর জন্য color-scheme সেট করা — Light থিমে এটা normal থাকে
    document.documentElement.style.colorScheme = themeKey === 'light' ? 'light' : 'dark';

    try {
      localStorage.setItem(STORAGE_KEY, themeKey);
    } catch {
      // localStorage ব্লক করা থাকলেও app যেন ভেঙে না পড়ে
    }
  }, [themeKey]);

  function setTheme(key) {
    if (THEMES[key]) setThemeKey(key);
  }

  const value = {
    themeKey,
    theme: THEMES[themeKey],
    colors: THEMES[themeKey].colors,
    setTheme,
    themeOrder: THEME_ORDER,
    themes: THEMES,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
