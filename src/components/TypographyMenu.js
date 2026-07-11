// src/components/TypographyMenu.js
import React, { useState, useRef, useEffect } from 'react';
import { useTypography } from '../lib/TypographyContext';
import { FONT_ORDER, SIZE_ORDER, WEIGHT_ORDER, TEXT_COLOR_ORDER, TEXT_COLOR_OPTIONS } from '../lib/typography';

const selectStyle = {
  width: '100%', padding: '9px 10px', borderRadius: 10, border: '1px solid var(--border)',
  background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
  outline: 'none', cursor: 'pointer',
};

const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, display: 'block' };

/**
 * currentPageKey দেওয়া হলে এই মেনু থেকে "শুধু এই পেজের জন্য" টগল দিয়ে
 * page-wise override সেট করা যায়। না দিলে শুধু গ্লোবাল সেটিংস দেখাবে।
 */
export default function TypographyMenu({ currentPageKey, currentPageLabel }) {
  const { global, pages, setGlobal, setPageOverride, clearPageOverride, getEffective, fontOptions, sizeOptions, weightOptions } = useTypography();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasPageOverride = currentPageKey && !!pages[currentPageKey];
  const scope = hasPageOverride ? pages[currentPageKey] : global;
  const effective = currentPageKey ? getEffective(currentPageKey) : global;

  function updateField(field, value) {
    if (hasPageOverride && currentPageKey) {
      setPageOverride(currentPageKey, { [field]: value });
    } else {
      setGlobal({ [field]: value });
    }
  }

  function togglePageOverride(checked) {
    if (!currentPageKey) return;
    if (checked) {
      setPageOverride(currentPageKey, { font: effective.font, size: effective.size, weight: effective.weight, color: effective.color });
    } else {
      clearPageOverride(currentPageKey);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title="ফন্ট ও লেখার সাইজ"
        style={{
          background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', borderRadius: 10,
          padding: '8px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 15,
        }}
      >
        Aa
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 42, background: 'var(--bg-surface)', borderRadius: 14,
          padding: 14, boxShadow: 'var(--shadow-lg)', zIndex: 100, width: 240,
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
            লেখার ধরন কাস্টমাইজ করুন
          </div>

          {currentPageKey && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasPageOverride}
                onChange={(e) => togglePageOverride(e.target.checked)}
                style={{ width: 15, height: 15, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                শুধু "{currentPageLabel}" পেজের জন্য আলাদা রাখুন
              </span>
            </label>
          )}

          <label style={labelStyle}>ফন্ট</label>
          <select style={{ ...selectStyle, marginBottom: 10 }} value={scope.font || 'system'} onChange={(e) => updateField('font', e.target.value)}>
            {FONT_ORDER.map((k) => <option key={k} value={k}>{fontOptions[k].label}</option>)}
          </select>

          <label style={labelStyle}>লেখার সাইজ</label>
          <select style={{ ...selectStyle, marginBottom: 10 }} value={scope.size || 'normal'} onChange={(e) => updateField('size', e.target.value)}>
            {SIZE_ORDER.map((k) => <option key={k} value={k}>{sizeOptions[k].label}</option>)}
          </select>

          <label style={labelStyle}>বোল্ডনেস</label>
          <select style={{ ...selectStyle, marginBottom: 10 }} value={scope.weight || 'normal'} onChange={(e) => updateField('weight', e.target.value)}>
            {WEIGHT_ORDER.map((k) => <option key={k} value={k}>{weightOptions[k].label}</option>)}
          </select>

          <label style={labelStyle}>লেখার রঙ</label>
          <select style={selectStyle} value={scope.color || 'default'} onChange={(e) => updateField('color', e.target.value)}>
            {TEXT_COLOR_ORDER.map((k) => <option key={k} value={k}>{TEXT_COLOR_OPTIONS[k].label}</option>)}
          </select>

          {!currentPageKey && (
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
              💡 এটি সব পেজের জন্য প্রযোজ্য ডিফল্ট। পেজ-ভিত্তিক আলাদা সেটিং সেটিংস ট্যাব থেকে করা যায়।
            </div>
          )}
        </div>
      )}
    </div>
  );
}
