// src/pages/AdminPanel.js
import React, { useState, useEffect, useMemo } from 'react';
import Avatar from '../components/Avatar';
import { XIcon, PlusIcon, TrashIcon, LoaderIcon, EditIcon, CheckIcon, ActivityIcon, EyeCheckIcon, FlagIcon } from '../components/Icons';
import {
  preloadMember, getPendingInvites, updatePendingInvite, deletePendingInvite,
  getPendingApprovals, approveUser, rejectUser, getAllUsers,
  adminCreateUser, adminDeleteUser, adminInviteUser,
  getAllPostViews, getPostReports, resolveReport, deletePost,
} from '../lib/dataService';

const TABS = ['অনুমোদন অপেক্ষায়', 'Pre-load তালিকা', 'সব সদস্য', 'নতুন ইউজার', 'অ্যানালিটিক্স', 'রিপোর্ট'];

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'এইমাত্র';
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} দিন আগে`;
  return new Date(dateStr).toLocaleDateString('bn-BD');
}

function MiniBar({ label, value, max, color = 'var(--accent)' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ background: 'var(--border-soft)', borderRadius: 6, height: 7, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export default function AdminPanel({ onClose, currentUser, posts = [], members = [] }) {
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

  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', district: '', university: '', subject: '', company: '', designation: '', department: '' });
  const [newUserMode, setNewUserMode] = useState('direct'); // 'direct' | 'invite'
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserError, setNewUserError] = useState('');
  const [newUserSuccess, setNewUserSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [postViews, setPostViews] = useState([]);
  const [reports, setReports] = useState([]);
  const [resolvingId, setResolvingId] = useState(null);

  async function loadAll() {
    setLoading(true);
    const [p, i, u, pv, r] = await Promise.all([
      getPendingApprovals(), getPendingInvites(), getAllUsers(), getAllPostViews(), getPostReports(),
    ]);
    setPending(p);
    setInvites(i);
    setAllUsers(u);
    setPostViews(pv);
    setReports(r);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  // ---- এনগেজমেন্ট অ্যানালিটিক্স হিসাব ----
  const analytics = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86400 * 1000;

    // সাম্প্রতিক সক্রিয়তা (গত ৭ দিনে পোস্ট + মন্তব্য) অনুযায়ী সবচেয়ে সক্রিয় সদস্য
    const activityMap = new Map();
    members.forEach((m) => activityMap.set(m.id, { member: m, count: 0 }));
    posts.forEach((p) => {
      if (new Date(p.created_at).getTime() >= sevenDaysAgo) {
        const e = activityMap.get(p.user_id);
        if (e) e.count += 1;
      }
      (p.comments || []).forEach((c) => {
        if (new Date(c.created_at).getTime() >= sevenDaysAgo) {
          const e = activityMap.get(c.user_id);
          if (e) e.count += 1;
        }
      });
    });
    const activeMembers = Array.from(activityMap.values())
      .filter((e) => e.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // পোস্ট ভিউ কাউন্ট (unique viewer)
    const viewCounts = new Map();
    postViews.forEach((v) => viewCounts.set(v.post_id, (viewCounts.get(v.post_id) || 0) + 1));
    const topViewedPosts = posts
      .map((p) => ({ post: p, views: viewCounts.get(p.id) || 0 }))
      .filter((e) => e.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);

    // গত ৭ দিনের পোস্ট ট্রেন্ড (দিনভিত্তিক)
    const dayLabels = [];
    const dayCounts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400 * 1000);
      const key = d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
      const count = posts.filter((p) => {
        const pd = new Date(p.created_at);
        return pd.toDateString() === d.toDateString();
      }).length;
      dayLabels.push(key);
      dayCounts.push(count);
    }
    const maxDayCount = Math.max(...dayCounts, 1);

    const totalViews = postViews.length;
    const activeToday = members.filter((m) =>
      posts.some((p) => p.user_id === m.id && new Date(p.created_at).toDateString() === new Date().toDateString())
    ).length;

    return { activeMembers, topViewedPosts, dayLabels, dayCounts, maxDayCount, totalViews, activeToday };
  }, [members, posts, postViews]);

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  async function handleResolveReport(reportId, status) {
    setResolvingId(reportId);
    await resolveReport(reportId, status, currentUser.id);
    await loadAll();
    setResolvingId(null);
  }

  async function handleDeleteReportedPost(report) {
    if (!window.confirm('এই পোস্টটি স্থায়ীভাবে মুছে ফেলতে চান?')) return;
    setResolvingId(report.id);
    await deletePost(report.post_id);
    await resolveReport(report.id, 'resolved', currentUser.id);
    await loadAll();
    setResolvingId(null);
  }


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

  async function handleCreateUser() {
    setNewUserError('');
    setNewUserSuccess('');

    if (!newUserForm.name.trim() || !newUserForm.email.trim()) {
      setNewUserError('নাম ও ইমেইল আবশ্যক');
      return;
    }
    if (newUserMode === 'direct' && (!newUserForm.password || newUserForm.password.length < 6)) {
      setNewUserError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setCreatingUser(true);
    const { error } = newUserMode === 'direct'
      ? await adminCreateUser(newUserForm)
      : await adminInviteUser(newUserForm);
    setCreatingUser(false);

    if (error) {
      setNewUserError(error.message);
    } else {
      setNewUserSuccess(newUserMode === 'direct' ? '✅ একাউন্ট তৈরি হয়েছে!' : '✅ ইনভাইট ইমেইল পাঠানো হয়েছে!');
      setNewUserForm({ name: '', email: '', password: '', district: '', university: '', subject: '', company: '', designation: '', department: '' });
      loadAll();
    }
  }

  async function handleDeleteUser(user) {
    if (!window.confirm(`${user.name}-এর একাউন্ট পুরোপুরি মুছে ফেলবেন? এটা ফিরিয়ে আনা যাবে না।`)) return;
    setDeletingId(user.id);
    const { error } = await adminDeleteUser(user.id);
    setDeletingId(null);
    if (error) {
      window.alert('মুছতে সমস্যা হয়েছে: ' + error.message);
    } else {
      loadAll();
    }
  }

  const fields = [
    ['name', 'নাম *'], ['email', 'ইমেইল *'], ['district', 'জেলা'], ['university', 'বিশ্ববিদ্যালয়'],
    ['subject', 'বিষয়'], ['company', 'প্রতিষ্ঠান'], ['designation', 'পদবী'], ['department', 'বিভাগ'],
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 22, width: '100%', maxWidth: 600, maxHeight: '88vh', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
        <div style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)', borderBottom: `1px solid var(--border-soft)`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>🛡️ Admin Panel</h3>
          <button onClick={onClose} style={{ background: 'var(--border-soft)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon width={16} height={16} />
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: `1px solid var(--border-soft)`, padding: '0 20px', overflowX: 'auto' }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '10px 14px', border: 'none', background: 'none', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', borderBottom: activeTab === i ? `2px solid var(--accent)` : '2px solid transparent',
              color: activeTab === i ? 'var(--accent)' : 'var(--text-secondary)', whiteSpace: 'nowrap',
            }}>
              {t}
              {i === 0 && pending.length > 0 && (
                <span style={{ marginLeft: 6, background: 'var(--danger)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>
                  {pending.length}
                </span>
              )}
              {i === 5 && pendingReportsCount > 0 && (
                <span style={{ marginLeft: 6, background: 'var(--danger)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>
                  {pendingReportsCount}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 10 }}>
                {fields.map(([key, label]) => (
                  <input key={key} placeholder={label} value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 10px', borderRadius: 9, border: `1.5px solid var(--border)`, fontSize: 13, outline: 'none', background: 'var(--bg-surface-alt)', color: 'var(--text-primary)' }}
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
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, marginBottom: 8 }}>
                        {fields.map(([key, label]) => (
                          <input key={key} placeholder={label} value={editForm[key] || ''}
                            onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                            style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '7px 9px', borderRadius: 8, border: `1.5px solid var(--border)`, fontSize: 12.5, outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
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
          ) : activeTab === 2 ? (
            <>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 0 }}>{allUsers.length} জন সদস্য</p>
              {allUsers.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid var(--border-soft)` }}>
                  <Avatar name={u.name} src={u.avatar_url} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {u.is_admin && <span style={{ padding: '2px 8px', borderRadius: 8, background: 'var(--admin-soft)', color: 'var(--admin-color)', fontSize: 11, fontWeight: 700 }}>Admin</span>}
                    <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: u.approved ? 'var(--success-soft)' : 'var(--danger-soft)', color: u.approved ? 'var(--success)' : 'var(--danger)' }}>
                      {u.approved ? 'Approved' : 'Pending'}
                    </span>
                    {currentUser && u.id !== currentUser.id && !u.approved && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        disabled={deletingId === u.id}
                        title="একাউন্ট মুছে ফেলুন"
                        style={{ background: 'var(--danger-soft)', border: 'none', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center' }}
                      >
                        {deletingId === u.id ? <LoaderIcon width={13} height={13} /> : <TrashIcon width={13} height={13} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : activeTab === 3 ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button
                  onClick={() => { setNewUserMode('direct'); setNewUserError(''); setNewUserSuccess(''); }}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                    background: newUserMode === 'direct' ? 'var(--accent-gradient)' : 'var(--bg-surface-alt)',
                    color: newUserMode === 'direct' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  সরাসরি তৈরি (পাসওয়ার্ড দিয়ে)
                </button>
                <button
                  onClick={() => { setNewUserMode('invite'); setNewUserError(''); setNewUserSuccess(''); }}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                    background: newUserMode === 'invite' ? 'var(--accent-gradient)' : 'var(--bg-surface-alt)',
                    color: newUserMode === 'invite' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  ইনভাইট পাঠান (ইমেইল লিংক)
                </button>
              </div>

              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 0 }}>
                {newUserMode === 'direct'
                  ? 'এখানে ইমেইল ও পাসওয়ার্ড দিয়ে সরাসরি একটা একাউন্ট বানিয়ে দেওয়া হবে — সদস্যকে আলাদা করে signup করতে হবে না, সাথে সাথে ব্যবহার করতে পারবেন।'
                  : 'এখানে ইমেইল দিলে সেই ইমেইলে একটা লিংক যাবে, সদস্য নিজে ক্লিক করে নিজের পাসওয়ার্ড ঠিক করে নেবেন।'}
              </p>

              {newUserError && <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 10 }}>{newUserError}</div>}
              {newUserSuccess && <div style={{ background: 'var(--success-soft)', color: 'var(--success)', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 10 }}>{newUserSuccess}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 10 }}>
                {fields.map(([key, label]) => (
                  <input key={key} placeholder={label} value={newUserForm[key]}
                    onChange={(e) => setNewUserForm({ ...newUserForm, [key]: e.target.value })}
                    style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 10px', borderRadius: 9, border: `1.5px solid var(--border)`, fontSize: 13, outline: 'none', background: 'var(--bg-surface-alt)', color: 'var(--text-primary)' }}
                  />
                ))}
                {newUserMode === 'direct' && (
                  <input
                    type="text"
                    placeholder="পাসওয়ার্ড * (কমপক্ষে ৬ অক্ষর)"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '9px 10px', borderRadius: 9, border: `1.5px solid var(--border)`, fontSize: 13, outline: 'none', background: 'var(--bg-surface-alt)', color: 'var(--text-primary)' }}
                  />
                )}
              </div>

              <button
                onClick={handleCreateUser}
                disabled={creatingUser}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                {creatingUser ? <LoaderIcon width={14} height={14} /> : <PlusIcon width={14} height={14} />}
                {newUserMode === 'direct' ? 'একাউন্ট তৈরি করুন' : 'ইনভাইট পাঠান'}
              </button>
            </>
          ) : activeTab === 4 ? (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, background: 'var(--bg-surface-alt)', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{analytics.activeToday}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>আজ সক্রিয় সদস্য</div>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-surface-alt)', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{analytics.totalViews}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>মোট পোস্ট ভিউ</div>
                </div>
              </div>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <ActivityIcon width={14} height={14} /> গত ৭ দিনের পোস্ট ট্রেন্ড
              </h4>
              <div style={{ marginBottom: 20 }}>
                {analytics.dayLabels.map((label, i) => (
                  <MiniBar key={label + i} label={label} value={analytics.dayCounts[i]} max={analytics.maxDayCount} />
                ))}
              </div>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>🔥 সবচেয়ে সক্রিয় সদস্য (গত ৭ দিনে)</h4>
              {analytics.activeMembers.length === 0 ? (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 20 }}>গত ৭ দিনে কোনো activity নেই</div>
              ) : (
                <div style={{ marginBottom: 20 }}>
                  {analytics.activeMembers.map(({ member, count }) => (
                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
                      <Avatar name={member.name} src={member.avatar_url} size={30} />
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{member.name}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{count} activity</div>
                    </div>
                  ))}
                </div>
              )}

              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <EyeCheckIcon width={14} height={14} /> সবচেয়ে বেশি দেখা পোস্ট
              </h4>
              {analytics.topViewedPosts.length === 0 ? (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>এখনো কোনো ভিউ রেকর্ড হয়নি</div>
              ) : (
                analytics.topViewedPosts.map(({ post, views }) => (
                  <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                    <Avatar name={post.author?.name} src={post.author?.avatar_url} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.text}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{post.author?.name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                      <EyeCheckIcon width={12} height={12} /> {views}
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              {reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 32 }}>🛡️</div>
                  <div style={{ marginTop: 8, fontSize: 14 }}>কোনো রিপোর্ট নেই</div>
                </div>
              ) : (
                reports.map((r) => (
                  <div key={r.id} style={{ borderRadius: 14, background: 'var(--bg-surface-alt)', marginBottom: 10, padding: 14, opacity: r.status !== 'pending' ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>
                        <FlagIcon width={13} height={13} /> {r.reason}
                      </div>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                        background: r.status === 'pending' ? 'var(--warning-soft)' : r.status === 'resolved' ? 'var(--success-soft)' : 'var(--border-soft)',
                        color: r.status === 'pending' ? 'var(--warning)' : r.status === 'resolved' ? 'var(--success)' : 'var(--text-muted)',
                      }}>
                        {r.status === 'pending' ? 'অপেক্ষমান' : r.status === 'resolved' ? 'সমাধান হয়েছে' : 'উপেক্ষা করা হয়েছে'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 11.5, color: 'var(--text-muted)' }}>
                      <Avatar name={r.reporter?.name} src={r.reporter?.avatar_url} size={20} />
                      রিপোর্টকারী: {r.reporter?.name} · {timeAgo(r.created_at)}
                    </div>

                    {r.post ? (
                      <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                          <Avatar name={r.post.author?.name} src={r.post.author?.avatar_url} size={22} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{r.post.author?.name}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {r.post.text}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>মূল পোস্টটি আর নেই (মুছে ফেলা হয়েছে)</div>
                    )}

                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {r.post && (
                          <button
                            onClick={() => handleDeleteReportedPost(r)}
                            disabled={resolvingId === r.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, border: 'none', background: 'var(--danger-soft)', color: 'var(--danger)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                          >
                            {resolvingId === r.id ? <LoaderIcon width={13} height={13} /> : <TrashIcon width={13} height={13} />} পোস্ট মুছুন
                          </button>
                        )}
                        <button
                          onClick={() => handleResolveReport(r.id, 'dismissed')}
                          disabled={resolvingId === r.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, border: `1.5px solid var(--border)`, background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          <XIcon width={13} height={13} /> উপেক্ষা করুন
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
