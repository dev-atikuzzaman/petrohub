// src/components/TypographyMenu.js
import React, { useState } from 'react';
import { useTypography } from '../lib/TypographyContext';
import { SIZE_ORDER, WEIGHT_ORDER, TEXT_COLOR_ORDER, TEXT_COLOR_OPTIONS } from '../lib/typography';
import { PlusIcon, XIcon, TrashIcon, LoaderIcon } from './Icons';

const selectStyle = {
  width: '100%', padding: '9px 10px', borderRadius: 10, border: '1px solid var(--border)',
  background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
  outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
};

const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, display: 'block' };

/**
 * currentPageKey দেওয়া হলে এই মেনু থেকে "শুধু এই পেজের জন্য" টগল দিয়ে
 * page-wise override সেট করা যায়। না দিলে শুধু গ্লোবাল সেটিংস দেখাবে।
 */
export default function TypographyMenu({ currentPageKey, currentPageLabel }) {
  const {
    global, pages, setGlobal, setPageOverride, clearPageOverride, getEffective,
    fontOptions, fontOrder, sizeOptions, weightOptions, customFonts, addCustomFont, removeCustomFont,
  } = useTypography();
  const [open, setOpen] = useState(false);
  const [newFontName, setNewFontName] = useState('');
  const [addingFont, setAddingFont] = useState(false);
  const [fontError, setFontError] = useState('');

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

  async function handleAddFont() {
    setFontError('');
    if (!newFontName.trim()) {
      setFontError('ফন্টের নাম লিখুন');
      return;
    }
    setAddingFont(true);
    // Google Fonts stylesheet লোড হতে একটু সময় দেওয়া হচ্ছে
    await new Promise((r) => setTimeout(r, 300));
    const { error, key } = addCustomFont(newFontName);
    setAddingFont(false);
    if (error) {
      setFontError(error);
    } else {
      setNewFontName('');
      updateField('font', key);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="ফন্ট ও লেখার সাইজ"
        style={{
          background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', borderRadius: 10,
          padding: '8px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 15,
        }}
      >
        Aa
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface)', borderRadius: 18, padding: 18, boxShadow: 'var(--shadow-lg)',
              width: '100%', maxWidth: 340, maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box',
              animation: 'slideUp 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>
                লেখার ধরন কাস্টমাইজ করুন
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
                <XIcon width={18} height={18} />
              </button>
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
              {fontOrder.map((k) => <option key={k} value={k}>{fontOptions[k].label}</option>)}
            </select>

            {/* কাস্টম ফন্ট যোগ করার ব্যবস্থা */}
            <div style={{ background: 'var(--bg-surface-alt)', borderRadius: 12, padding: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                কাস্টম ফন্ট যোগ করুন (Google Fonts)
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={newFontName}
                  onChange={(e) => setNewFontName(e.target.value)}
                  placeholder="যেমন: Tiro Bangla, Poppins"
                  style={{
                    flex: 1, padding: '8px 10px', borderRadius: 9, border: '1px solid var(--border)',
                    background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 12.5, outline: 'none', minWidth: 0,
                  }}
                />
                <button
                  onClick={handleAddFont}
                  disabled={addingFont}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', borderRadius: 9,
                    border: 'none', background: 'var(--accent-gradient)', color: '#fff', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {addingFont ? <LoaderIcon width={14} height={14} /> : <PlusIcon width={14} height={14} />}
                </button>
              </div>
              {fontError && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 5 }}>{fontError}</div>}
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                💡 Google Fonts-এ থাকা ফন্টের নাম হুবহু লিখুন (যেমন fonts.google.com এ যা লেখা আছে)। যোগ করার সাথে সাথে ড্রপডাউনে চলে আসবে ও সাথে সাথে প্রয়োগ হবে।
              </div>

              {customFonts.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {customFonts.map((name) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span style={{ flex: 1, fontFamily: `'${name}', sans-serif` }}>{name}</span>
                      <button
                        onClick={() => removeCustomFont(name)}
                        title="মুছে ফেলুন"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 3, display: 'flex' }}
                      >
                        <TrashIcon width={13} height={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
        </div>
      )}
    </>
  );
}
