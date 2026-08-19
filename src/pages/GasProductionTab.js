// src/pages/GasProductionTab.js
import React, { useEffect, useState, useCallback } from 'react';
import { DropletIcon, TrashIcon, LoaderIcon } from '../components/Icons';
import { getGasProduction, upsertGasProduction, deleteGasProduction } from '../lib/dataService';

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatBn(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function GasProductionTab({ currentUser, isAdmin }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [mmcfd, setMmcfd] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getGasProduction(60);
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(e) {
    e.preventDefault();
    if (!date || !mmcfd) return;
    setSaving(true);
    const { error } = await upsertGasProduction(currentUser.id, {
      production_date: date,
      mmcfd: parseFloat(mmcfd),
      note,
    });
    setSaving(false);
    if (!error) {
      setMmcfd('');
      setNote('');
      load();
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('এই এন্ট্রি মুছে ফেলতে চান?')) return;
    await deleteGasProduction(id);
    load();
  }

  const latest = rows[0];
  const maxVal = rows.length ? Math.max(...rows.map((r) => Number(r.mmcfd))) : 0;
  const chartRows = [...rows].slice(0, 14).reverse(); // সাম্প্রতিক ১৪ দিন, বাম থেকে ডানে

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 14px 90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <DropletIcon width={20} height={20} color="var(--accent)" />
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>গ্যাস প্রোডাকশন (MMCFD)</h2>
      </div>

      {latest && (
        <div style={{
          background: 'var(--accent-gradient)', borderRadius: 16, padding: '18px 20px', marginBottom: 16,
          color: '#fff', boxShadow: '0 8px 20px rgba(14,165,233,0.25)',
        }}>
          <div style={{ fontSize: 12.5, opacity: 0.9 }}>সর্বশেষ আপডেট — {formatBn(latest.production_date)}</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4 }}>{Number(latest.mmcfd).toLocaleString('bn-BD')} <span style={{ fontSize: 15, fontWeight: 600 }}>MMCFD</span></div>
          {latest.note && <div style={{ fontSize: 12.5, marginTop: 6, opacity: 0.9 }}>{latest.note}</div>}
        </div>
      )}

      {isAdmin && (
        <form onSubmit={handleSave} style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16,
          padding: 16, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>নতুন এন্ট্রি যোগ / আপডেট করুন (Admin)</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)}
              style={{ flex: '1 1 150px', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontSize: 13.5 }}
            />
            <input
              type="number" step="0.1" placeholder="MMCFD" value={mmcfd} onChange={(e) => setMmcfd(e.target.value)}
              style={{ flex: '1 1 120px', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontSize: 13.5 }}
              required
            />
          </div>
          <input
            type="text" placeholder="নোট (ঐচ্ছিক, যেমন: LNG সহ)" value={note} onChange={(e) => setNote(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontSize: 13.5 }}
          />
          <button
            type="submit" disabled={saving}
            style={{ padding: '11px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </button>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>একই তারিখে আবার সেভ করলে আগেরটা আপডেট হয়ে যাবে।</div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <LoaderIcon width={26} height={26} color="var(--accent)" />
        </div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13.5 }}>এখনো কোনো ডাটা যোগ করা হয়নি।</div>
      ) : (
        <>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 14px 6px', marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>সাম্প্রতিক প্রবণতা</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 110 }}>
              {chartRows.map((r) => (
                <div key={r.id} title={`${formatBn(r.production_date)}: ${r.mmcfd} MMCFD`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', maxWidth: 20, borderRadius: '4px 4px 0 0', background: 'var(--accent-gradient)',
                    height: `${maxVal ? Math.max((Number(r.mmcfd) / maxVal) * 90, 4) : 4}px`,
                  }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {chartRows.map((r) => (
                <div key={r.id} style={{ flex: 1, textAlign: 'center', fontSize: 8.5, color: 'var(--text-muted)' }}>
                  {new Date(r.production_date).getDate()}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map((r) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{formatBn(r.production_date)}</div>
                  {r.note && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.note}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)' }}>{r.mmcfd} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>MMCFD</span></div>
                  {isAdmin && (
                    <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger, #ef4444)', display: 'flex' }}>
                      <TrashIcon width={15} height={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
