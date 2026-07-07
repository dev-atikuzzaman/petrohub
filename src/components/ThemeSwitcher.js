// src/components/ThemeSwitcher.js
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../lib/ThemeContext';
import { CheckIcon } from './Icons';

export default function ThemeSwitcher() {
  const { themeKey, setTheme, themeOrder, themes, colors } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = themes[themeKey];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title="থিম পরিবর্তন করুন"
        style={{
          background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', borderRadius: 10,
          padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 16,
        }}
      >
        {current.emoji}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 42, background: 'var(--bg-surface)', borderRadius: 14,
          padding: 8, boxShadow: 'var(--shadow-lg)', zIndex: 100, minWidth: 190,
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '6px 10px' }}>
            থিম বেছে নিন
          </div>
          {themeOrder.map((key) => {
            const t = themes[key];
            const isActive = key === themeKey;
            return (
              <button
                key={key}
                onClick={() => { setTheme(key); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px',
                  borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
                  background: isActive ? 'var(--accent-soft)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-surface-alt)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 16 }}>{t.emoji}</span>
                <span style={{ flex: 1 }}>{t.label}</span>
                {isActive && <CheckIcon width={14} height={14} color={colors.accent} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
