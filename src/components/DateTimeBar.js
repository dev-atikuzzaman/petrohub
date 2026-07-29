// src/components/DateTimeBar.js
import React, { useEffect, useState } from 'react';
import { CalendarIcon, ClockIcon } from './Icons';

function formatParts(now) {
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const date = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  return { day, date, time };
}

export default function DateTimeBar() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { day, date, time } = formatParts(now);

  return (
    <div
      style={{
        margin: '10px 14px 0', padding: '12px 16px', borderRadius: 16,
        background: 'var(--accent-gradient)', boxShadow: 'var(--shadow)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* সূক্ষ্ম প্রিমিয়াম টেক্সচার — একটা হালকা আলোর বৃত্ত */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%',
        background: 'rgba(255,255,255,0.10)', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', minWidth: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <CalendarIcon width={16} height={16} color="#fff" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', letterSpacing: 0.2 }}>{day}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{date}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative', flexShrink: 0 }}>
        <ClockIcon width={14} height={14} color="rgba(255,255,255,0.85)" />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: 0.3 }}>
          {time}
        </span>
      </div>
    </div>
  );
}
