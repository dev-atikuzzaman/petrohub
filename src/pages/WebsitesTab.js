// src/pages/WebsitesTab.js
import React, { useState } from 'react';

// পেট্রোবাংলা ও এর ১৩টি কোম্পানির তথ্য।
// লিংক পরবর্তীতে update করে দেবেন।
const COMPANIES = [
  {
    id: 1,
    name: 'Petrobangla',
    shortName: 'PB',
    fullName: 'Bangladesh Oil, Gas and Mineral Corporation',
    url: 'https://petrobangla.org.bd/',
    color: '#1e3a5f',
    accent: '#0ea5e9',
    category: 'Corporation',
  },
  {
    id: 2,
    name: 'BGFCL',
    shortName: 'BG',
    fullName: 'Bangladesh Gas Fields Company Limited',
    url: 'https://bgfcl.portal.gov.bd/',
    color: '#166534',
    accent: '#22c55e',
    category: 'Gas Production',
  },
  {
    id: 3,
    name: 'BAPEX',
    shortName: 'BX',
    fullName: 'Bangladesh Petroleum Exploration and Production Company Limited',
    url: 'https://bapex.com.bd/',
    color: '#7c2d12',
    accent: '#f97316',
    category: 'Exploration',
  },
  {
    id: 4,
    name: 'GTCL',
    shortName: 'GT',
    fullName: 'Gas Transmission Company Limited',
    url: 'https://gtcl.gov.bd/',
    color: '#1e3a5f',
    accent: '#38bdf8',
    category: 'Transmission',
  },
  {
    id: 5,
    name: 'TGTDCL',
    shortName: 'TG',
    fullName: 'Titas Gas Transmission & Distribution Co. Ltd.',
    url: 'https://titasgas.gov.bd/',
    color: '#164e63',
    accent: '#06b6d4',
    category: 'Distribution',
  },
  {
    id: 6,
    name: 'BGDCL',
    shortName: 'BGD',
    fullName: 'Bakhrabad Gas Distribution Company Limited',
    url: 'https://bgdcl.gov.bd/',
    color: '#14532d',
    accent: '#4ade80',
    category: 'Distribution',
  },
  {
    id: 7,
    name: 'JGTDSL',
    shortName: 'JG',
    fullName: 'Jalalabad Gas Transmission & Distribution System Ltd.',
    url: 'https://jalalabadgas.portal.gov.bd/',
    color: '#3b0764',
    accent: '#a855f7',
    category: 'Distribution',
  },
  {
    id: 8,
    name: 'PGCL',
    shortName: 'PG',
    fullName: 'Pashchimanchal Gas Company Limited',
    url: 'https://pgcl.gov.bd/',
    color: '#7c3aed',
    accent: '#c4b5fd',
    category: 'Distribution',
  },
  {
    id: 9,
    name: 'KGDCL',
    shortName: 'KG',
    fullName: 'Karnaphuli Gas Distribution Company Limited',
    url: 'https://kgdcl.gov.bd/',
    color: '#9f1239',
    accent: '#fb7185',
    category: 'Distribution',
  },
  {
    id: 10,
    name: 'SGFL',
    shortName: 'SF',
    fullName: 'Sylhet Gas Fields Limited',
    url: 'https://sgfl.portal.gov.bd/',
    color: '#065f46',
    accent: '#34d399',
    category: 'Gas Production',
  },
  {
    id: 11,
    name: 'RPGCL',
    shortName: 'RP',
    fullName: 'Rupantarita Prakritik Gas Company Limited',
    url: 'https://rpgcl.org.bd/',
    color: '#0c4a6e',
    accent: '#7dd3fc',
    category: 'LNG/CNG/LPG',
  },
  {
    id: 12,
    name: 'SGCL',
    shortName: 'SGD',
    fullName: 'Sundarban Gas Company Limited',
    url: 'https://sgcl.gov.bd/',
    color: '#854d0e',
    accent: '#fcd34d',
    category: 'Distribution',
  },
  {
    id: 13,
    name: 'BCMCL',
    shortName: 'BC',
    fullName: 'Bangladesh Coal Management Company Limited',
    url: 'https://bcmcl.org.bd/',
    color: '#27272a',
    accent: '#a1a1aa',
    category: 'Mining',
  },
  {
    id: 14,
    name: 'MGMCL',
    shortName: 'MG',
    fullName: 'Maddhapara Granite Mining Company Limited',
    url: 'https://mgmcl.gov.bd/',
    color: '#1e3a5f',
    accent: '#f59e0b',
    category: 'Mining',
  },
    {
    id: 15,
    name: 'EMRD',
    shortName: 'EMR',
    fullName: 'Energy and Mineral Resources Division',
    url: 'https://emrd.gov.bd/',
    color: '#1e3a5f',
    accent: '#f59e0b',
    category: 'Division',
  },
    {
    id: 16,
    name: 'MPEMR',
    shortName: 'PE',
    fullName: 'Power, Energy and Mineral Resources Ministry',
    url: 'https://poweren.portal.gov.bd/',
    color: '#1e3a5f',
    accent: '#f59e0b',
    category: 'Ministry',
  },
      {
    id: 17,
    name: 'BERC',
    shortName: 'ER',
    fullName: 'Bangladesh Energy Regulatory Commission',
    url: 'https://berc.org.bd/',
    color: '#1e3a5f',
    accent: '#f59e0b',
    category: 'Commission',
  },
  {
    id: 18,
    name: 'BEPRC',
    shortName: 'EPR',
    fullName: 'Bangladesh Energy and Power Research Council',
    url: 'https://eprc.gov.bd/',
    color: '#1e3a5f',
    accent: '#f59e0b',
    category: 'Council',
  },
    {
    id: 19,
    name: 'EMRD DASHBOARD',
    shortName: 'EMD',
    fullName: 'Energy and Mineral Resources Division Dashboard',
    url: 'https://www.emrddashboard.gov.bd/',
    color: '#1e3a5f',
    accent: '#f59e0b',
    category: 'Report',
  },
    {
    id: 20,
    name: 'BAPEX',
    shortName: 'BX',
    fullName: 'Bangladesh Petroleum Exploration and Production Company Limited',
    url: 'https://bapex.com.bd/',
    color: '#7c2d12',
    accent: '#f97316',
    category: 'Gas Production',
  },
];

const CATEGORIES = ['সব', ...new Set(COMPANIES.map((c) => c.category))];

export default function WebsitesTab() {
  const [activeCategory, setActiveCategory] = useState('সব');

  const filtered = activeCategory === 'সব'
    ? COMPANIES
    : COMPANIES.filter((c) => c.category === activeCategory);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 14px 90px' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>পেট্রোবাংলা পরিবার</h2>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Petrobangla ও সহযোগী কোম্পানিসমূহ</div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              background: activeCategory === cat ? 'var(--accent-gradient)' : 'var(--bg-surface-alt)',
              color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Company cards — সরাসরি নতুন ট্যাবে ওয়েবসাইট খোলে */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 14 }}>
        {filtered.map((company) => (
          <a
            key={company.id}
            href={company.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'var(--bg-surface)', borderRadius: 18, padding: '18px 14px', textAlign: 'center',
              border: '1.5px solid var(--border-soft)', cursor: 'pointer', boxShadow: 'var(--shadow)',
              transition: 'transform 0.15s, box-shadow 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {/* Logo placeholder */}
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: `linear-gradient(135deg, ${company.color}, ${company.color}dd)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: 0.5,
              boxShadow: `0 4px 12px ${company.accent}44`,
            }}>
              {company.shortName}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{company.name}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{company.category}</div>
            </div>
            <div style={{
              fontSize: 10.5, padding: '3px 10px', borderRadius: 20,
              background: `linear-gradient(135deg, ${company.color}, ${company.color}dd)`, color: '#fff', fontWeight: 700,
            }}>
              নতুন ট্যাবে খুলুন ↗
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
