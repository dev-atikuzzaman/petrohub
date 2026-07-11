// src/pages/NotesTab.js
import React, { useState, useEffect, useCallback } from 'react';
import { getNotes, createNote, updateNote, deleteNote } from '../lib/dataService';
import { PlusIcon, EditIcon, TrashIcon, CheckIcon, LoaderIcon } from '../components/Icons';

// এই রঙগুলো সম্পূর্ণ CSS ভ্যারিয়েবল-ভিত্তিক, তাই Light ও Premium Forest —
// দুই থিমেই স্বয়ংক্রিয়ভাবে মানানসই ও readable থাকে (আগে হার্ডকোড করা পেস্টেল
// রঙ ডার্ক থিমে সাদা প্যাচ হয়ে ফুটে উঠত)
const NOTE_COLORS = {
  green: { bg: 'var(--success-soft)', border: 'var(--success)', dot: 'var(--success)', text: 'var(--text-primary)' },
  blue:  { bg: 'var(--info-soft)', border: 'var(--info)', dot: 'var(--info)', text: 'var(--text-primary)' },
  red:   { bg: 'var(--danger-soft)', border: 'var(--danger)', dot: 'var(--danger)', text: 'var(--text-primary)' },
  gray:  { bg: 'var(--border-soft)', border: 'var(--border)', dot: 'var(--text-secondary)', text: 'var(--text-primary)' },
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'এইমাত্র';
  if (diff < 3600) return `${Math.floor(diff / 60)} মি. আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘ. আগে`;
  return new Date(dateStr).toLocaleDateString('bn-BD');
}

export default function NotesTab({ currentUser }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', color: 'green' });
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    const data = await getNotes(currentUser.id);
    setNotes(data);
    setLoading(false);
  }, [currentUser.id]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  function openCreate() {
    setEditingNote(null);
    setForm({ title: '', body: '', color: 'green' });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.body.trim()) return;
    setSaving(true);
    if (editingNote) {
      await updateNote(editingNote.id, form);
    } else {
      await createNote(currentUser.id, form);
    }
    setSaving(false);
    setShowForm(false);
    loadNotes();
  }

  async function handleDelete(note) {
    if (!window.confirm('নোটটি মুছে ফেলবেন?')) return;
    await deleteNote(note.id);
    loadNotes();
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 14px 90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>আমার নোট</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>শুধু আপনিই দেখতে পাবেন</div>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12,
          border: 'none', background: 'var(--accent-gradient)',
          color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
        }}>
          <PlusIcon width={16} height={16} /> নতুন নোট
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><LoaderIcon width={24} height={24} color="var(--accent)" /></div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
          <div style={{ fontSize: 14 }}>এখনো কোনো নোট নেই।</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {notes.map((note) => {
            const c = NOTE_COLORS[note.color] || NOTE_COLORS.gray;
            return (
              <div key={note.id} style={{
                background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 16, padding: 16,
                position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}>
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                  <button onClick={() => { setEditingNote(note); setForm({ title: note.title, body: note.body, color: note.color }); setShowForm(true); }}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', cursor: 'pointer', color: 'var(--text-secondary)', padding: 5, borderRadius: 8 }}>
                    <EditIcon width={13} height={13} />
                  </button>
                  <button onClick={() => handleDelete(note)}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', cursor: 'pointer', color: 'var(--danger)', padding: 5, borderRadius: 8 }}>
                    <TrashIcon width={13} height={13} />
                  </button>
                </div>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.dot, marginBottom: 8 }} />
                {note.title && <div style={{ fontWeight: 700, fontSize: 14.5, color: c.text, marginBottom: 6, paddingRight: 56 }}>{note.title}</div>}
                <div style={{ fontSize: 13.5, color: c.text, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{note.body}</div>
                <div style={{ fontSize: 11, color: c.dot, marginTop: 10, fontWeight: 600 }}>{timeAgo(note.updated_at)}</div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div onClick={() => setShowForm(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--bg-surface)', borderRadius: 22, padding: 22, width: '100%', maxWidth: 440,
            boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.3s ease',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
              {editingNote ? 'নোট এডিট করুন' : 'নতুন নোট'}
            </h3>
            <input placeholder="শিরোনাম" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
            <textarea placeholder="তোমার নোট লিখো..." rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', marginBottom: 14, boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {Object.entries(NOTE_COLORS).map(([key, c]) => (
                <button key={key} onClick={() => setForm({ ...form, color: key })} style={{
                  width: 28, height: 28, borderRadius: '50%', border: 'none', background: c.dot, cursor: 'pointer',
                  outline: form.color === key ? `3px solid ${c.dot}` : 'none', outlineOffset: 2,
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 11, borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}>বাতিল</button>
              <button onClick={handleSave} disabled={saving || !form.body.trim()} style={{
                flex: 1, padding: 11, borderRadius: 12, border: 'none',
                background: form.body.trim() ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'var(--border)',
                color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {saving ? <LoaderIcon width={15} height={15} /> : <><CheckIcon width={15} height={15} /> সেভ করো</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
