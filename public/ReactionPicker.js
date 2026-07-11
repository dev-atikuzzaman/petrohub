// src/components/ReactionPicker.js
import React, { useState, useRef, useCallback } from 'react';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
const LONG_PRESS_MS = 380;

/**
 * ফেসবুক/হোয়াটসঅ্যাপ-স্টাইল লং-প্রেস রিয়্যাকশন পিকার।
 * - ছোট ট্যাপ (quick tap): ডিফল্ট ইমোজি (👍) দিয়ে রিয়্যাক্ট/আন-রিয়্যাক্ট টগল করে
 * - চেপে ধরে রাখলে (long press): ইমোজি ভেসে উঠে, আঙুল/মাউস টেনে বেছে ছেড়ে দিলে সেটা সিলেক্ট হয়
 *
 * Props:
 *  - myReaction: বর্তমান ব্যবহারকারীর বিদ্যমান রিয়্যাকশন emoji (string|null)
 *  - onReact(emoji): কোনো ইমোজি সিলেক্ট হলে কল হয় (আগেরটার মতোই হলে toggle off ধরে নেওয়া হয়)
 *  - size: 'normal' | 'small' — পোস্টের জন্য normal, কমেন্টের জন্য small
 *  - label: বাটনের পাশের টেক্সট (কমেন্টে ফাঁকা রাখা যায়)
 *  - defaultIcon: রিয়্যাক্ট না করা থাকলে দেখানো আইকন (JSX)
 */
export default function ReactionPicker({ myReaction, onReact, size = 'normal', label, defaultIcon, activeColor = 'var(--danger)', activeBg = 'var(--danger-soft)' }) {
  const [open, setOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const timerRef = useRef(null);
  const longPressedRef = useRef(false);
  const btnRef = useRef(null);
  const pickerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  function startPress() {
    longPressedRef.current = false;
    clearTimer();
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      setOpen(true);
      if (navigator.vibrate) navigator.vibrate(12); // হালকা হ্যাপটিক ফিডব্যাক (সাপোর্ট করলে)
    }, LONG_PRESS_MS);
  }

  function endPress(e) {
    clearTimer();
    if (longPressedRef.current) {
      // পিকার খোলা অবস্থায় আঙুল/মাউস কোন ইমোজির উপর ছেড়েছে সেটা বের করা
      const point = e.changedTouches ? e.changedTouches[0] : e;
      const el = document.elementFromPoint(point.clientX, point.clientY);
      const emoji = el?.getAttribute?.('data-emoji');
      if (emoji) onReact(emoji);
      setOpen(false);
      setHoveredIdx(-1);
    } else {
      // ছোট ট্যাপ — ডিফল্ট ইমোজি দিয়ে টগল
      onReact(myReaction || EMOJIS[0]);
    }
  }

  function cancelPress() {
    clearTimer();
    setOpen(false);
    setHoveredIdx(-1);
  }

  function handleMove(e) {
    if (!open) return;
    const point = e.touches ? e.touches[0] : e;
    const el = document.elementFromPoint(point.clientX, point.clientY);
    const idx = el?.getAttribute?.('data-emoji-idx');
    setHoveredIdx(idx !== null && idx !== undefined ? Number(idx) : -1);
  }

  const isSmall = size === 'small';
  const emojiSize = isSmall ? 20 : 22;
  const pickerPad = isSmall ? '6px 8px' : '8px 10px';

  return (
    <div style={{ position: 'relative', display: isSmall ? 'inline-block' : 'flex', flex: isSmall ? undefined : 1 }}>
      <button
        ref={btnRef}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onTouchMove={handleMove}
        onTouchCancel={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        style={isSmall ? {
          display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 700, color: myReaction ? activeColor : 'var(--text-muted)', padding: '2px 4px',
          userSelect: 'none', touchAction: 'none',
        } : {
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px', borderRadius: 10, border: 'none',
          background: myReaction ? activeBg : 'var(--bg-surface-alt)',
          color: myReaction ? activeColor : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          userSelect: 'none', touchAction: 'none',
        }}
      >
        {myReaction ? <span style={{ fontSize: isSmall ? 13 : 16 }}>{myReaction}</span> : defaultIcon}
        {label}
      </button>

      {open && (
        <div
          ref={pickerRef}
          style={{
            position: 'absolute', bottom: '100%', left: 0, marginBottom: 8, background: 'var(--bg-surface)',
            borderRadius: 20, padding: pickerPad, boxShadow: 'var(--shadow-lg)', display: 'flex', gap: isSmall ? 4 : 6,
            zIndex: 50, border: '1px solid var(--border)', whiteSpace: 'nowrap',
          }}
        >
          {EMOJIS.map((e, idx) => (
            <span
              key={e}
              data-emoji={e}
              data-emoji-idx={idx}
              style={{
                fontSize: hoveredIdx === idx ? emojiSize * 1.5 : emojiSize,
                cursor: 'pointer',
                transition: 'font-size 0.12s ease, transform 0.12s ease',
                transform: hoveredIdx === idx ? 'translateY(-6px)' : 'none',
                display: 'inline-block',
                lineHeight: 1,
              }}
              onClick={() => { onReact(e); setOpen(false); }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(-1)}
            >
              {e}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
