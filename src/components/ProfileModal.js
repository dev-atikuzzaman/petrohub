// src/components/ProfileModal.js
import React, { useState } from 'react';
import Avatar from './Avatar';
import Badge from './Badge';
import {
  XIcon, MailIcon, PhoneIcon, MapPinIcon, BuildingIcon, GraduationIcon,
  EditIcon, CheckIcon, LoaderIcon, LockIcon, EyeIcon, EyeOffIcon, TagIcon, PlusIcon, TrashIcon,
} from './Icons';
import { updateProfile, uploadAvatar } from '../lib/dataService';
import { compressAvatar } from '../lib/imageCompress';
import { useAuth } from '../lib/AuthContext';

const FIELDS = [
  { key: 'batch', label: 'ব্যাচ', icon: GraduationIcon },
  { key: 'phone', label: 'ফোন', icon: PhoneIcon },
  { key: 'district', label: 'জেলা', icon: MapPinIcon },
  { key: 'university', label: 'বিশ্ববিদ্যালয়', icon: GraduationIcon },
  { key: 'subject', label: 'বিষয়', icon: GraduationIcon },
  { key: 'current_company', label: 'বর্তমান প্রতিষ্ঠান', icon: BuildingIcon },
  { key: 'designation', label: 'পদবী', icon: BuildingIcon },
  { key: 'department', label: 'বিভাগ', icon: BuildingIcon },
  { key: 'address', label: 'বর্তমান ঠিকানা', icon: MapPinIcon },
];

// প্রতিটা কাস্টম ফিল্ডের জন্য একটা ইউনিক আইডি বানানো হয়
function newFieldId() {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function ProfileModal({ profile, isOwnProfile, onClose, onUpdated, initialEditing = false }) {
  const { updatePassword } = useAuth();
  const [editing, setEditing] = useState(initialEditing);
  const [form, setForm] = useState({ ...profile, custom_fields: { ...(profile.custom_fields || {}) } });
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url);
  const [compressing, setCompressing] = useState(false);

  // পাসওয়ার্ড পরিবর্তন সংক্রান্ত state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  async function handlePasswordChange() {
    setPwdError('');
    setPwdSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError('সব ঘর পূরণ করুন');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('নতুন পাসওয়ার্ড দুটো মিলছে না');
      return;
    }

    setPwdSaving(true);
    const { error } = await updatePassword(currentPassword, newPassword);
    setPwdSaving(false);

    if (error) {
      setPwdError(error.message);
    } else {
      setPwdSuccess('✅ পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordForm(false);
        setPwdSuccess('');
      }, 2000);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressAvatar(file);
      setAvatarFile(compressed);
      setAvatarPreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error('❌ Avatar compress error:', err);
      // compress fail করলেও মূল ফাইল দিয়ে কাজ চালিয়ে যাওয়া
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  }

  // ---- কাস্টম ফিল্ড হেল্পার ফাংশন ----
  function addCustomField() {
    const id = newFieldId();
    setForm((f) => ({ ...f, custom_fields: { ...(f.custom_fields || {}), [id]: { label: '', value: '' } } }));
  }

  function updateCustomField(id, key, val) {
    setForm((f) => ({
      ...f,
      custom_fields: { ...(f.custom_fields || {}), [id]: { ...(f.custom_fields?.[id] || {}), [key]: val } },
    }));
  }

  function removeCustomField(id) {
    setForm((f) => {
      const cf = { ...(f.custom_fields || {}) };
      delete cf[id];
      return { ...f, custom_fields: cf };
    });
  }

  async function handleSave() {
    setSaving(true);
    let avatar_url = profile.avatar_url;

    if (avatarFile) {
      const { url, error } = await uploadAvatar(profile.id, avatarFile);
      if (!error && url) avatar_url = url;
    }

    // খালি লেবেলের কাস্টম ফিল্ড বাদ দিয়ে সেভ করা
    const cleanedCustomFields = {};
    Object.entries(form.custom_fields || {}).forEach(([id, f]) => {
      if (f && f.label && f.label.trim()) {
        cleanedCustomFields[id] = { label: f.label.trim(), value: (f.value || '').trim() };
      }
    });

    const updates = { ...form, custom_fields: cleanedCustomFields, avatar_url };
    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;
    delete updates.email;
    delete updates.is_admin;
    delete updates.claimed;
    delete updates.is_preloaded;

    const { error } = await updateProfile(profile.id, updates);
    setSaving(false);

    if (!error) {
      setEditing(false);
      onUpdated && onUpdated();
    }
  }

  const customFieldEntries = Object.entries(form.custom_fields || {});
  const viewCustomFieldEntries = Object.entries(profile.custom_fields || {}).filter(([, f]) => f && f.label);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)', borderRadius: 24, width: '100%', maxWidth: 440,
          maxHeight: '88vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)',
          animation: 'slideUp 0.3s ease',
        }}
      >
        <div style={{
          background: 'var(--accent-gradient)',
          padding: '28px 24px 50px', position: 'relative', borderRadius: '24px 24px 0 0',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)',
            border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff',
          }}>
            <XIcon width={18} height={18} />
          </button>
          {isOwnProfile && !editing && (
            <button onClick={() => setEditing(true)} style={{
              position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.2)',
              border: 'none', borderRadius: 10, padding: '6px 12px', display: 'flex',
              alignItems: 'center', gap: 6, cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600,
            }}>
              <EditIcon width={14} height={14} /> Edit
            </button>
          )}
        </div>

        <div style={{ padding: '0 24px 24px', marginTop: -42, textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar name={profile.name} src={avatarPreview} size={84} />
            {compressing && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(15,23,42,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LoaderIcon width={22} height={22} color="#fff" />
              </div>
            )}
            {editing && !compressing && (
              <label style={{
                position: 'absolute', bottom: 0, right: 0, background: 'var(--accent)', borderRadius: '50%',
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '2px solid var(--bg-surface)',
              }}>
                <EditIcon width={13} height={13} color="#fff" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          {editing ? (
            <input
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ display: 'block', margin: '12px auto 4px', textAlign: 'center', fontSize: 18, fontWeight: 700, border: '1.5px solid var(--border)', borderRadius: 10, padding: '6px 10px', width: '90%', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
          ) : (
            <h2 style={{ margin: '12px 0 4px', fontSize: 19, fontWeight: 800, color: 'var(--text-primary)' }}>{profile.name}</h2>
          )}

          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
            {profile.is_admin && <Badge tone="admin">Admin</Badge>}
            <Badge tone={profile.status === 'Resigned' ? 'danger' : 'success'}>{profile.status === 'Resigned' ? 'Resigned' : 'Active সদস্য'}</Badge>
          </div>

          {profile.email && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
              <MailIcon width={14} height={14} /> {profile.email}
            </div>
          )}

          <div style={{ marginTop: 20, textAlign: 'left' }}>
            {FIELDS.map(({ key, label, icon: Icon }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon width={16} height={16} color="var(--accent)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
                  {editing ? (
                    <input
                      value={form[key] || ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 8px', fontSize: 14, marginTop: 3, boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                  ) : (
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginTop: 1 }}>{profile[key] || '—'}</div>
                  )}
                </div>
              </div>
            ))}

            {/* Status (Active/Resigned) — যাদের চাকরি পরিবর্তন হয়েছে তাদের জন্য */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BuildingIcon width={16} height={16} color="var(--accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>স্ট্যাটাস</div>
                {editing ? (
                  <select
                    value={form.status || 'Active'}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 8px', fontSize: 14, marginTop: 3, boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  >
                    <option value="Active">Active (এখনো গ্যাস ফিল্ডে কর্মরত)</option>
                    <option value="Resigned">Resigned (অন্য প্রতিষ্ঠানে চলে গেছেন)</option>
                  </select>
                ) : (
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginTop: 1 }}>
                    {profile.status === 'Resigned' ? 'Resigned' : 'Active'}
                  </div>
                )}
              </div>
            </div>

            {/* পূর্ববর্তী প্রতিষ্ঠান — শুধু Resigned হলে দেখানো/এডিট করা প্রাসঙ্গিক */}
            {(form.status === 'Resigned' || profile.status === 'Resigned') && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BuildingIcon width={16} height={16} color="var(--danger)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>পূর্ববর্তী প্রতিষ্ঠান (Petro/গ্যাস ফিল্ড)</div>
                  {editing ? (
                    <input
                      value={form.original_company || ''}
                      onChange={(e) => setForm({ ...form, original_company: e.target.value })}
                      placeholder="যেমন: BGFCL"
                      style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 8px', fontSize: 14, marginTop: 3, boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                  ) : (
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginTop: 1 }}>{profile.original_company || '—'}</div>
                  )}
                </div>
              </div>
            )}

            {/* কাস্টম ফিল্ড — ভিউ মোড */}
            {!editing && viewCustomFieldEntries.map(([id, f]) => (
              <div key={id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TagIcon width={16} height={16} color="var(--accent)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{f.label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginTop: 1 }}>{f.value || '—'}</div>
                </div>
              </div>
            ))}

            {/* কাস্টম ফিল্ড — এডিট মোড */}
            {editing && (
              <div style={{ marginTop: 4 }}>
                {customFieldEntries.map(([id, f]) => (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <TagIcon width={16} height={16} color="var(--accent)" />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <input
                        value={f.label || ''}
                        onChange={(e) => updateCustomField(id, 'label', e.target.value)}
                        placeholder="ফিল্ডের নাম (যেমন: গাড়ির নম্বর)"
                        style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 8px', fontSize: 12, fontWeight: 700, boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-muted)', textTransform: 'uppercase' }}
                      />
                      <input
                        value={f.value || ''}
                        onChange={(e) => updateCustomField(id, 'value', e.target.value)}
                        placeholder="মান লিখুন"
                        style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 8px', fontSize: 14, boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <button
                      onClick={() => removeCustomField(id)}
                      style={{ background: 'var(--danger-soft)', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', color: 'var(--danger)', flexShrink: 0, display: 'flex' }}
                    >
                      <TrashIcon width={14} height={14} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addCustomField}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%',
                    marginTop: 10, padding: '10px', borderRadius: 10, border: '1.5px dashed var(--border)',
                    background: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  <PlusIcon width={14} height={14} /> নতুন ফিল্ড যোগ করুন
                </button>
              </div>
            )}
          </div>

          {/* পাসওয়ার্ড পরিবর্তন — শুধু নিজের প্রোফাইল এডিট মোডে */}
          {editing && isOwnProfile && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button
                onClick={() => { setShowPasswordForm(!showPasswordForm); setPwdError(''); setPwdSuccess(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
                  color: 'var(--accent)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', padding: 0,
                }}
              >
                <LockIcon width={15} height={15} /> পাসওয়ার্ড পরিবর্তন করুন
              </button>

              {showPasswordForm && (
                <div style={{ marginTop: 12, background: 'var(--bg-surface-alt)', borderRadius: 14, padding: 14 }}>
                  {pwdError && (
                    <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '8px 12px', borderRadius: 8, fontSize: 12.5, marginBottom: 10 }}>
                      {pwdError}
                    </div>
                  )}
                  {pwdSuccess && (
                    <div style={{ background: 'var(--success-soft)', color: 'var(--success)', padding: '8px 12px', borderRadius: 8, fontSize: 12.5, marginBottom: 10 }}>
                      {pwdSuccess}
                    </div>
                  )}

                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="বর্তমান পাসওয়ার্ড"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{ width: '100%', padding: '9px 36px 9px 10px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ width: '100%', padding: '9px 36px 9px 10px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="নতুন পাসওয়ার্ড আবার লিখুন"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ width: '100%', padding: '9px 36px 9px 10px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                      tabIndex={-1}
                    >
                      {showPwd ? <EyeOffIcon width={15} height={15} /> : <EyeIcon width={15} height={15} />}
                    </button>
                  </div>

                  <button
                    onClick={handlePasswordChange}
                    disabled={pwdSaving}
                    style={{
                      width: '100%', padding: 10, borderRadius: 10, border: 'none',
                      background: 'var(--accent-gradient)', color: '#fff', fontWeight: 700,
                      fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    {pwdSaving ? <LoaderIcon width={14} height={14} /> : 'পাসওয়ার্ড বদলান'}
                  </button>
                </div>
              )}
            </div>
          )}

          {editing && (
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => { setEditing(false); setForm({ ...profile, custom_fields: { ...(profile.custom_fields || {}) } }); setAvatarPreview(profile.avatar_url); setAvatarFile(null); }}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
              >
                বাতিল
              </button>
              <button
                onClick={handleSave}
                disabled={saving || compressing}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {saving ? <LoaderIcon width={16} height={16} /> : <><CheckIcon width={16} height={16} /> সংরক্ষণ করুন</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
