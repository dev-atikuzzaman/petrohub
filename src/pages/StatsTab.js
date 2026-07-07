// src/pages/StatsTab.js
import React, { useMemo } from 'react';

function countBy(members, key) {
  const counts = {};
  members.forEach((m) => {
    const val = m[key] || 'অজানা';
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function BarChart({ data, color = 'var(--accent)' }) {
  const max = Math.max(...data.map((d) => d[1]), 1);
  return (
    <div>
      {data.slice(0, 8).map(([label, count]) => (
        <div key={label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 3 }}>
            <span>{label}</span>
            <span style={{ fontWeight: 700 }}>{count}</span>
          </div>
          <div style={{ background: 'var(--border-soft)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${(count / max) * 100}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function StatsTab({ members, posts }) {
  const districtData = useMemo(() => countBy(members, 'district'), [members]);
  const companyData = useMemo(() => countBy(members, 'current_company'), [members]);
  const activeCount = members.filter((m) => m.status !== 'Resigned').length;
  const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 14px 90px' }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard label="মোট সদস্য" value={members.length} icon="👥" />
        <StatCard label="সক্রিয় সদস্য" value={activeCount} icon="✅" />
        <StatCard label="মোট পোস্ট" value={posts.length} icon="📝" />
        <StatCard label="মোট মন্তব্য" value={totalComments} icon="💬" />
      </div>

      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: 18, marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>জেলা অনুযায়ী বিতরণ</h3>
        {districtData.length > 0 ? <BarChart data={districtData} color="var(--accent)" /> : <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>কোনো তথ্য নেই</div>}
      </div>

      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>প্রতিষ্ঠান অনুযায়ী বিতরণ</h3>
        {companyData.length > 0 ? <BarChart data={companyData} color="#8b5cf6" /> : <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>কোনো তথ্য নেই</div>}
      </div>
    </div>
  );
}
