// src/pages/ImportantUpdatesTab.js
import React, { useState, useEffect } from 'react';
import Avatar from '../components/Avatar';
import { PlusIcon, TrashIcon, LoaderIcon, CheckIcon, EditIcon } from '../components/Icons';
import { getImportantUpdates, createImportantUpdate, updateImportantUpdate, deleteImportantUpdate } from '../lib/dataService';

const PRIORITY = {
  urgent: { label: '🔴 জরুরি', bg: 'var(--danger-soft)', color: 'var(--danger)', border: 'var(--danger)' },
  high:   { label: '🟠 উচ্চ', bg: 'var(--warning-soft)', color: 'var(--warning)', border: 'var(--warning)' },
  normal: { label: '🟢 সাধারণ', bg: 'var(--success-soft)', color: 'var(--success)', border: 'var(--success)' },
};

function daysLeft(deadline) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - new Date()) / 86400000);
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
}

function DeadlineBadge({ deadline }) {
  if (!deadline) return null;
  const days = daysLeft(deadline);
  if (days < 0) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)', fontSize: 11.5, fontWeight: 700 }}>⏰ মেয়াদ শেষ</span>;
  if (days === 0) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 11.5, fontWeight: 700 }}>🔥 আজই শেষ দিন</span>;
  if (days <= 3) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'var(--warning-soft)', color: 'var(--warning)', fontSize: 11.5, fontWeight: 700 }}>⚠️ {days} দিন বাকি</span>;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'var(--info-soft)', color: 'var(--info)', fontSize: 11.5, fontWeight: 700 }}>📅 {days} দিন বাকি</span>;
}

export default function ImportantUpdatesTab({ currentUser }) {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', priority: 'normal', start_date: '', deadline: '' });
  const [filterPriority, setFilterPriority] = useState('সব');

  async function load() {
    const data = await getImportantUpdates();
    setUpdates(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNewForm() {
    setEditingId(null);
    setForm({ title: '', body: '', priority: 'normal', start_date: '', deadline: '' });
    setShowForm(true);
  }

  function openEditForm(u) {
    setEditingId(u.id);
    setForm({
      title: u.title || '',
      body: u.body || '',
      priority: u.priority || 'normal',
      start_date: u.start_date || '',
      deadline: u.deadline || '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    if (editingId) {
      await updateImportantUpdate(editingId, form);
    } else {
      await createImportantUpdate(currentUser.id, form);
    }
    setSaving(false);
    closeForm();
    setForm({ title: '', body: '', priority: 'normal', start_date: '', deadline: '' });
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm('এই আপডেটটি মুছে ফেলবেন?')) return;
    await deleteImportantUpdate(id);
    load();
  }

  const filtered = filterPriority === 'সব' ? updates : updates.filter((u) => u.priority === filterPriority);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 14px 90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>গুরুত্বপূর্ণ আপডেট</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>নোটিশ, ডেডলাইন ও জরুরি তথ্য</div>
        </div>
        <button onClick={openNewForm} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12,
          border: 'none', background: 'linear-gradient(135deg, #dc2626, #9f1239)',
          color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
        }}>
          <PlusIcon width={16} height={16} /> নতুন আপডেট
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['সব', 'urgent', 'high', 'normal'].map((p) => (
          <button key={p} onClick={() => setFilterPriority(p)} style={{
            padding: '5px 14px', borderRadius: 20, border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            background: filterPriority === p ? '#dc2626' : 'var(--bg-surface-alt)',
            color: filterPriority === p ? '#fff' : 'var(--text-secondary)',
          }}>
            {p === 'সব' ? '📋 সব' : PRIORITY[p].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><LoaderIcon width={24} height={24} color="var(--danger)" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 14 }}>কোনো আপডেট নেই</div>
        </div>
      ) : (
        filtered.map((u) => {
          const p = PRIORITY[u.priority] || PRIORITY.normal;
          const expired = u.deadline && daysLeft(u.deadline) < 0;
          return (
            <div key={u.id} style={{
              background: 'var(--bg-surface)', borderRadius: 18, padding: 18, marginBottom: 12,
              border: `1.5px solid ${expired ? 'var(--border)' : p.border}`,
              boxShadow: 'var(--shadow)', opacity: expired ? 0.75 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: p.bg, color: p.color, fontSize: 11.5, fontWeight: 700 }}>{p.label}</span>
                    <DeadlineBadge deadline={u.deadline} />
                    {expired && <span style={{ padding: '3px 10px', borderRadius: 20, background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)', fontSize: 11.5, fontWeight: 700 }}>Expired</span>}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15.5, color: 'var(--text-primary)', marginBottom: 8 }}>{u.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{u.body}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    {u.start_date && <span>▶️ শুরু: {formatDate(u.start_date)}</span>}
                    {u.deadline && <span>🏁 শেষ: {formatDate(u.deadline)}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <Avatar name={u.author?.name} src={u.author?.avatar_url} size={24} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.author?.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('bn-BD')}</span>
                  </div>
                </div>
                {u.user_id === currentUser.id && (
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => openEditForm(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                      <EditIcon width={16} height={16} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}>
                      <TrashIcon width={16} height={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {showForm && (
        <div onClick={closeForm} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-surface)', borderRadius: 22, padding: 22, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.3s ease', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{editingId ? 'আপডেট এডিট করুন' : 'নতুন আপডেট'}</h3>

            <input placeholder="শিরোনাম *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
            <textarea placeholder="বিস্তারিত লিখুন... *" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>অগ্রাধিকার</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}>
                  <option value="normal">🟢 সাধারণ</option>
                  <option value="high">🟠 উচ্চ</option>
                  <option value="urgent">🔴 জরুরি</option>
                </select>
              </div>
              <div />
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>শুরুর তারিখ</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>ডেডলাইন</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button onClick={closeForm} style={{ flex: 1, padding: 11, borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}>বাতিল</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.body.trim()}
                style={{ flex: 1, padding: 11, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #dc2626, #9f1239)', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {saving ? <LoaderIcon width={15} height={15} /> : <><CheckIcon width={15} height={15} /> {editingId ? 'আপডেট করুন' : 'পোস্ট করুন'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
