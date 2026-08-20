// src/components/GasProductionStrip.js
import React, { useEffect, useState } from 'react';
import { DropletIcon } from './Icons';
import { getGasProduction } from '../lib/dataService';
import { formatBnDate } from '../lib/bnDate';


// ফিড ট্যাবের একদম উপরে, DateTimeBar-এর উপরে বসানোর জন্য এক-লাইনের
// ছোট strip — সর্বশেষ গ্যাস প্রোডাকশন (MMCFD) দেখায়, ক্লিক করলে
// "গ্যাস প্রোডাকশন" ট্যাবে নিয়ে যায় (বিস্তারিত/হিস্টোরি দেখার জন্য)
export default function GasProductionStrip({ onOpen }) {
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await getGasProduction(1);
      if (active && data && data.length) setLatest(data[0]);
    })();
    return () => { active = false; };
  }, []);

  if (!latest) return null;

  return (
    <div
      onClick={onOpen}
      role={onOpen ? 'button' : undefined}
      style={{
        margin: '10px 14px 0', padding: '8px 14px', borderRadius: 12,
        background: 'var(--accent-soft)', border: '1px solid var(--border-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        cursor: onOpen ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <DropletIcon width={14} height={14} color="var(--accent)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>গ্যাস প্রোডাকশন</span>
        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>({formatBnDate(latest.production_date)})</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {Number(latest.mmcfd).toLocaleString('bn-BD')} <span style={{ fontSize: 10.5, fontWeight: 700 }}>MMCFD</span>
      </div>
    </div>
  );
}
