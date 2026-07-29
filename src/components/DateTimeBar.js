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
        // Marquee-ও accent-gradient ব্যবহার করে বলে DateTimeBar-এ সেটা এড়িয়ে
        // নিউট্রাল surface কার্ড রাখা হয়েছে — যাতে থিম যেটাই হোক (এমনকি
        // উজ্জ্বল গ্র্যাডিয়েন্ট থিমেও) দুটো আলাদা এলিমেন্ট হিসেবে স্পষ্ট
        // বোঝা যায়, একে অপরের সাথে মিশে না যায়
        margin: '10px 14px 12px', padding: '12px 16px', borderRadius: 16,
        background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: 'var(--accent-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <CalendarIcon width={16} height={16} color="var(--accent)" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: 0.2 }}>{day}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{date}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, background: 'var(--bg-surface-alt)', padding: '6px 10px', borderRadius: 10 }}>
        <ClockIcon width={13} height={13} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', letterSpacing: 0.3 }}>
          {time}
        </span>
      </div>
    </div>
  );
}
