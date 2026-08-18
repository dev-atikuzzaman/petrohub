// src/pages/PRLCalculatorTab.js
import React, { useState } from 'react';
import { CalendarIcon, ClockIcon } from '../components/Icons';

// সরকারি চাকরির বাধ্যতামূলক অবসর বয়স (Public Servants Retirement Act, 1974 অনুযায়ী)
const RETIREMENT_AGE = 59;

const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

function parseDate(value) {
  // value আসে <input type="date"> থেকে, ফরম্যাট: YYYY-MM-DD
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDate(date) {
  if (!date) return '—';
  const d = String(date.getDate()).padStart(2, '0');
  const m = BN_MONTHS[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function ResultRow({ icon, label, value, highlight }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px',
        borderBottom: '1px solid var(--border-soft)',
      }}
    >
      <div
        style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: highlight ? 'var(--accent)' : 'var(--bg-surface-alt)',
          color: highlight ? '#ffffff' : 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
        <div
          style={{
            fontSize: highlight ? 15.5 : 14, fontWeight: highlight ? 800 : 700,
            color: highlight ? 'var(--accent)' : 'var(--text-primary)',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export default function PRLCalculatorTab() {
  const [dob, setDob] = useState('');

  const birthDate = parseDate(dob);
  let result = null;

  if (birthDate) {
    const ageDate = addYears(birthDate, RETIREMENT_AGE); // ৫৯ বছর পূর্ণ হওয়ার তারিখ
    const lastWorkingDay = addDays(ageDate, -1);
    const prlStart = ageDate;
    const prlEnd = addDays(addYears(prlStart, 1), -1); // PRL ১ বছর, শেষ দিনটাই চূড়ান্ত অবসর
    const pensionEffective = addDays(prlEnd, 1);

    result = { ageDate, lastWorkingDay, prlStart, prlEnd, pensionEffective };
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 14px 90px' }}>
      <div
        style={{
          background: 'var(--bg-surface)', borderRadius: 18, padding: 18,
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 14,
        }}
      >
        <h3 style={{ margin: '0 0 4px', fontSize: 15.5, fontWeight: 800, color: 'var(--text-primary)' }}>
          PRL ক্যালকুলেটর
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          জন্মতারিখ দিন — সরকারি চাকরির বাধ্যতামূলক অবসর (৫৯ বছর), PRL শুরু ও চূড়ান্ত অবসরের তারিখ বের হয়ে যাবে।
        </p>

        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
          জন্মতারিখ
        </label>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 12,
            border: '1.5px solid var(--border)', background: 'var(--bg-surface-alt)',
            color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
          }}
        />
      </div>

      {result && (
        <div
          style={{
            background: 'var(--bg-surface)', borderRadius: 18, padding: '4px 14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 14,
          }}
        >
          <ResultRow
            icon={<CalendarIcon width={17} height={17} />}
            label="৫৯ বছর পূর্ণ হওয়ার তারিখ"
            value={formatDate(result.ageDate)}
          />
          <ResultRow
            icon={<ClockIcon width={17} height={17} />}
            label="শেষ কর্মদিবস (Last Working Day)"
            value={formatDate(result.lastWorkingDay)}
          />
          <ResultRow
            icon={<CalendarIcon width={17} height={17} />}
            label="PRL শুরুর তারিখ"
            value={formatDate(result.prlStart)}
          />
          <ResultRow
            icon={<CalendarIcon width={17} height={17} />}
            label="PRL শেষ / চূড়ান্ত অবসরের তারিখ"
            value={formatDate(result.prlEnd)}
            highlight
          />
          <ResultRow
            icon={<ClockIcon width={17} height={17} />}
            label="পেনশন কার্যকর হওয়ার তারিখ"
            value={formatDate(result.pensionEffective)}
          />
        </div>
      )}

      <div
        style={{
          background: 'var(--bg-surface-alt)', borderRadius: 14, padding: 14,
          fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7,
        }}
      >
        📌 হিসাব Public Servants (Retirement) Act, 1974 অনুযায়ী ৫৯ বছর বাধ্যতামূলক অবসর ও ১ বছরের PRL ধরে করা হয়েছে। দপ্তর/ক্যাডারভেদে নিয়মে ভিন্নতা থাকতে পারে — চূড়ান্ত সিদ্ধান্তের আগে সংশ্লিষ্ট প্রশাসনিক শাখার সাথে যাচাই করে নিন।
      </div>
    </div>
  );
}
