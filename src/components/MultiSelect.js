// src/components/MultiSelect.js
import React, { useState, useRef, useEffect } from 'react';
import { FilterIcon, XIcon } from './Icons';

export default function MultiSelect({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggle(opt) {
    if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt));
    else onChange([...selected, opt]);
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
          border: `1.5px solid ${selected.length ? 'var(--accent)' : 'var(--border)'}`,
          background: selected.length ? 'var(--accent-soft)' : 'var(--bg-surface)', color: selected.length ? 'var(--accent)' : 'var(--text-secondary)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <FilterIcon width={14} height={14} />
        {label} {selected.length > 0 && `(${selected.length})`}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 38, left: 0, background: 'var(--bg-surface)', borderRadius: 14, padding: 10,
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)', zIndex: 20, minWidth: 200, maxHeight: 280, overflowY: 'auto',
        }}>
          {options.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>কোনো অপশন নেই</div>}
          {options.map((opt) => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
              {opt}
            </label>
          ))}
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, background: 'none', border: 'none', color: 'var(--danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <XIcon width={12} height={12} /> সব মুছুন
            </button>
          )}
        </div>
      )}
    </div>
  );
}
