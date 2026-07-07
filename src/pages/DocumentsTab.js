// src/pages/DocumentsTab.js
import React, { useState, useEffect } from 'react';
import Avatar from '../components/Avatar';
import { PlusIcon, SearchIcon, DownloadIcon, TrashIcon, LoaderIcon, CheckIcon, EditIcon } from '../components/Icons';
import { getDocuments, uploadDocument, updateDocument, deleteDocument } from '../lib/dataService';

const CATEGORIES = ['সাধারণ', 'প্রকিউরমেন্ট', 'টেকনিক্যাল', 'প্রশাসনিক', 'প্রশিক্ষণ', 'অর্থ ও হিসাব', 'বিবিধ'];

function fileIcon(type) {
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('sheet') || type.includes('excel')) return '📊';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📑';
  if (type.includes('image')) return '🖼️';
  if (type.includes('zip') || type.includes('rar')) return '🗜️';
  return '📎';
}

function fileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DocumentsTab({ currentUser }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('সব');
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', category: 'সাধারণ', file: null });
  const [editingDoc, setEditingDoc] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: 'সাধারণ' });
  const [editSaving, setEditSaving] = useState(false);

  async function load() {
    const data = await getDocuments();
    setDocs(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEditForm(doc) {
    setEditingDoc(doc);
    setEditForm({ title: doc.title || '', description: doc.description || '', category: doc.category || 'সাধারণ' });
  }

  async function handleEditSave() {
    if (!editForm.title.trim()) return;
    setEditSaving(true);
    const { error } = await updateDocument(editingDoc.id, editForm);
    setEditSaving(false);
    if (!error) {
      setEditingDoc(null);
      load();
    } else {
      alert('সংরক্ষণ ব্যর্থ হয়েছে: ' + error.message);
    }
  }

  const filtered = docs.filter((d) => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase()) ||
      d.uploader?.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'সব' || d.category === activeCategory;
    return matchSearch && matchCat;
  });

  async function handleUpload() {
    if (!form.file || !form.title.trim()) return;
    setUploading(true);
    setUploadProgress(30);
    const { error } = await uploadDocument(currentUser.id, form.file, { title: form.title, description: form.description, category: form.category });
    setUploadProgress(100);
    setUploading(false);
    if (!error) {
      setShowForm(false);
      setForm({ title: '', description: '', category: 'সাধারণ', file: null });
      load();
    } else {
      alert('আপলোড ব্যর্থ হয়েছে: ' + error.message);
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`"${doc.title}" মুছে ফেলবেন?`)) return;
    await deleteDocument(doc.id, doc.file_url);
    load();
  }

  const allCategories = ['সব', ...CATEGORIES];

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '16px 14px 90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>ডকুমেন্টস</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>গুরুত্বপূর্ণ ফাইল সংগ্রহ</div>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12,
          border: 'none', background: 'var(--accent-gradient)',
          color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
        }}>
          <PlusIcon width={16} height={16} /> ফাইল আপলোড
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <SearchIcon width={17} height={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ফাইল, বিবরণ বা আপলোডকারীর নামে খুঁজুন..."
          style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: 14, border: '1.5px solid var(--border)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {allCategories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: '5px 14px', borderRadius: 20, border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            background: activeCategory === cat ? 'var(--accent-gradient)' : 'var(--bg-surface-alt)',
            color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
          }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>{filtered.length}টি ফাইল পাওয়া গেছে</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><LoaderIcon width={24} height={24} color="var(--accent)" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
          <div style={{ fontSize: 14 }}>কোনো ডকুমেন্ট নেই</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((doc) => (
            <div key={doc.id} style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {fileIcon(doc.file_type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</div>
                {doc.description && <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.description}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>{doc.category}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fileSize(doc.file_size)}</span>
                  <Avatar name={doc.uploader?.name} src={doc.uploader?.avatar_url} size={16} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.uploader?.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(doc.created_at).toLocaleDateString('bn-BD')}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <a href={doc.file_url} download={doc.file_name} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', textDecoration: 'none' }}>
                  <DownloadIcon width={16} height={16} />
                </a>
                {doc.user_id === currentUser.id && (
                  <button onClick={() => openEditForm(doc)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                    <EditIcon width={15} height={15} />
                  </button>
                )}
                {doc.user_id === currentUser.id && (
                  <button onClick={() => handleDelete(doc)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--danger-soft)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                    <TrashIcon width={15} height={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div onClick={() => !uploading && setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-surface)', borderRadius: 22, padding: 22, width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.3s ease' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>ফাইল আপলোড করুন</h3>

            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 14, border: '2px dashed var(--border)', cursor: 'pointer', marginBottom: 12, background: form.file ? 'var(--accent-soft)' : 'var(--bg-surface-alt)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{form.file ? fileIcon(form.file.type) : '📂'}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: form.file ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {form.file ? form.file.name : 'ফাইল বেছে নিন (যেকোনো ধরন)'}
              </div>
              {form.file && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>{fileSize(form.file.size)}</div>}
              <input type="file" onChange={(e) => { const f = e.target.files[0]; if (f) setForm({ ...form, file: f, title: form.title || f.name }); }} style={{ display: 'none' }} />
            </label>

            <input placeholder="শিরোনাম *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
            <input placeholder="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', marginBottom: 14, boxSizing: 'border-box' }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {uploading && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ background: 'var(--bg-surface-alt)', borderRadius: 8, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.4s ease', borderRadius: 8 }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, textAlign: 'center' }}>আপলোড হচ্ছে...</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowForm(false)} disabled={uploading} style={{ flex: 1, padding: 11, borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}>বাতিল</button>
              <button onClick={handleUpload} disabled={uploading || !form.file || !form.title.trim()}
                style={{ flex: 1, padding: 11, borderRadius: 12, border: 'none', background: (form.file && form.title.trim()) ? 'var(--accent-gradient)' : 'var(--border)', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {uploading ? <LoaderIcon width={15} height={15} /> : <><CheckIcon width={15} height={15} /> আপলোড</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {editingDoc && (
        <div onClick={() => !editSaving && setEditingDoc(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-surface)', borderRadius: 22, padding: 22, width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.3s ease' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>ফাইলের তথ্য এডিট করুন</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, background: 'var(--bg-surface-alt)', marginBottom: 14 }}>
              <div style={{ fontSize: 22 }}>{fileIcon(editingDoc.file_type)}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{editingDoc.file_name}</div>
            </div>

            <input placeholder="শিরোনাম *" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
            <input placeholder="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
            <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', marginBottom: 14, boxSizing: 'border-box' }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 14 }}>
              💡 নতুন ফাইল আপলোড করতে চাইলে এই ফাইলটা মুছে আবার আপলোড করুন — এখান থেকে শুধু শিরোনাম, বিবরণ ও ক্যাটেগরি বদলানো যাবে।
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditingDoc(null)} disabled={editSaving} style={{ flex: 1, padding: 11, borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}>বাতিল</button>
              <button onClick={handleEditSave} disabled={editSaving || !editForm.title.trim()}
                style={{ flex: 1, padding: 11, borderRadius: 12, border: 'none', background: editForm.title.trim() ? 'var(--accent-gradient)' : 'var(--border)', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {editSaving ? <LoaderIcon width={15} height={15} /> : <><CheckIcon width={15} height={15} /> সংরক্ষণ করুন</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
