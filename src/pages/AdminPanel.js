// src/pages/AdminPanel.js
import React, { useState, useEffect } from 'react';
import Avatar from '../components/Avatar';
import { XIcon, PlusIcon, TrashIcon, LoaderIcon, EditIcon, CheckIcon } from '../components/Icons';
import {
  preloadMember, getPendingInvites, updatePendingInvite, deletePendingInvite,
  getPendingApprovals, approveUser, rejectUser, getAllUsers,
} from '../lib/dataService';

const TABS = ['অনুমোদন অপেক্ষায়', 'Pre-load তালিকা', 'সব সদস্য'];

export default function AdminPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const [pending, setPending] = useState([]);
  const [invites, setInvites] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', district: '', university: '', subject: '', company: '', designation: '', department: '' });
  const [editingInvite, setEditingInvite] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  async function loadAll() {
    setLoading(true);
    const [p, i, u] = await Promise.all([getPendingApprovals(), getPendingInvites(), getAllUsers()]);
    setPending(p);
    setInvites(i);
    setAllUsers(u);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function handleAdd() {
    setError('');
    if (!form.name.trim() || !form.email.trim()) { setError('নাম ও ইমেইল আবশ্যক'); return; }
    setAdding(true);
    const { error } = await preloadMember(form);
    setAdding(false);
    if (error) {
      setError(error.message.includes('duplicate') ? 'এই ইমেইল আগেই যোগ করা আছে' : error.message);
    } else {
      setForm({ name: '', email: '', district: '', university: '', subject: '', company: '', designation: '', department: '' });
      loadAll();
    }
  }

  async function handleSaveEdit() {
    const { error } = await updatePendingInvite(editingInvite, {
      name: editForm.name, email: editForm.email, district: editForm.district,
      university: editForm.university, subject: editForm.subject, company: editForm.company,
      designation: editForm.designation, department: editForm.department,
    });
    if (!error) { setEditingInvite(null); loadAll(); }
  }

  async function handleApprove(userId) {
    await approveUser(userId);
    loadAll();
  }

  async function handleReject(userId) {
    if (!window.confirm('এই অনুরোধ প্রত্যাখ্যান করবেন?')) return;
    await rejectUser(userId);
    loadAll();
  }

  const fields = [
    ['name', 'নাম *'], ['email', 'ইমেইল *'], ['district', 'জেলা'], ['university', 'বিশ্ববিদ্যালয়'],
    ['subject', 'বিষয়'], ['company', 'প্রতিষ্ঠান'], ['designation', 'পদবী'], ['department', 'বিভাগ'],
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 22, width: '100%', maxWidth: 600, maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)', borderBottom: `1px solid var(--border-soft)`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>🛡️ Admin Panel</h3>
          <button onClick={onClose} style={{ background: 'var(--border-soft)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon width={16} height={16} />
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: `1px solid var(--border-soft)`, padding: '0 20px' }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '10px 14px', border: 'none', background: 'none', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', borderBottom: activeTab === i ? `2px solid var(--accent)` : '2px solid transparent',
              color: activeTab === i ? 'var(--accent)' : 'var(--text-secondary)',
            }}>
              {t}
              {i === 0 && pending.length > 0 && (
                <span style={{ marginLeft: 6, background: 'var(--danger)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 30 }}><LoaderIcon width={22} height={22} color="var(--accent)" /></div>
          ) : activeTab === 0 ? (
            <>
              {pending.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 32 }}>✅</div>
                  <div style={{ marginTop: 8, fontSize: 14 }}>কোনো অনুমোদন অপেক্ষায় নেই</div>
                </div>
              ) : pending.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid var(--border-soft)` }}>
                  <Avatar name={u.name} src={u.avatar_url} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('bn-BD')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleApprove(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 9, border: 'none', background: 'var(--success-soft)', color: 'var(--success)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                      <CheckIcon width={13} height={13} /> অনুমোদন
                    </button>
                    <button onClick={() => handleReject(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 9, border: 'none', background: 'var(--danger-soft)', color: 'var(--danger)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                      <XIcon width={13} height={13} /> প্রত্যাখ্যান
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : activeTab === 1 ? (
            <>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 0 }}>এখানে যাদের ইমেইল যোগ করবেন, তারা signup করলে স্বয়ংক্রিয়ভাবে approved হয়ে যাবে।</p>
              {error && <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 10 }}>{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {fields.map(([key, label]) => (
                  <input key={key} placeholder={label} value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    style={{ padding: '9px 10px', borderRadius: 9, border: `1.5px solid var(--border)`, fontSize: 13, outline: 'none' }}
                  />
                ))}
              </div>
              <button onClick={handleAdd} disabled={adding} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>
                {adding ? <LoaderIcon width={14} height={14} /> : <PlusIcon width={14} height={14} />} যোগ করুন
              </button>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>অপেক্ষমান সদস্য ({invites.length})</h4>
              {invites.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>কোনো অপেক্ষমান সদস্য নেই</div>
              ) : invites.map((inv) => (
                <div key={inv.id} style={{ borderRadius: 12, background: 'var(--bg-surface-alt)', marginBottom: 8, padding: 12 }}>
                  {editingInvite === inv.id ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                        {fields.map(([key, label]) => (
                          <input key={key} placeholder={label} value={editForm[key] || ''}
                            onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                            style={{ padding: '7px 9px', borderRadius: 8, border: `1.5px solid var(--border)`, fontSize: 12.5, outline: 'none' }}
                          />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setEditingInvite(null)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1.5px solid var(--border)`, background: 'var(--bg-surface)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>বাতিল</button>
                        <button onClick={handleSaveEdit} style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>সংরক্ষণ</button>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{inv.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{inv.email}</div>
                        {inv.company && <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{inv.company} · {inv.designation}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setEditingInvite(inv.id); setEditForm({ ...inv }); }} style={{ background: 'var(--accent-soft)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--accent)' }}>
                          <EditIcon width={14} height={14} />
                        </button>
                        <button onClick={() => { deletePendingInvite(inv.id); loadAll(); }} style={{ background: 'var(--danger-soft)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--danger)' }}>
                          <TrashIcon width={14} height={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 0 }}>{allUsers.length} জন সদস্য</p>
              {allUsers.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid var(--border-soft)` }}>
                  <Avatar name={u.name} src={u.avatar_url} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {u.is_admin && <span style={{ padding: '2px 8px', borderRadius: 8, background: 'var(--admin-soft)', color: 'var(--admin-color)', fontSize: 11, fontWeight: 700 }}>Admin</span>}
                    <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: u.approved ? 'var(--success-soft)' : 'var(--danger-soft)', color: u.approved ? 'var(--success)' : 'var(--danger)' }}>
                      {u.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
