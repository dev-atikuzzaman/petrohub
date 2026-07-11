// src/components/CreatePostModal.js
import React, { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import { XIcon, ImageIcon, LoaderIcon, LockIcon, GlobeIcon, CheckIcon } from './Icons';
import { createPost } from '../lib/dataService';
import { compressPostImage } from '../lib/imageCompress';

export default function CreatePostModal({ currentUser, onClose, onCreated }) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [privacy, setPrivacy] = useState('public');
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const privacyRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (privacyRef.current && !privacyRef.current.contains(e.target)) {
        setShowPrivacyMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressPostImage(file);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error('❌ Post image compress error:', err);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  }

  async function handlePost() {
    if (!text.trim() && !imageFile) return;
    setPosting(true);
    const { error } = await createPost(currentUser.id, text.trim(), imageFile, privacy);
    setPosting(false);
    if (!error) {
      onCreated && onCreated();
      onClose();
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)', borderRadius: 22, width: '100%', maxWidth: 480, padding: 20,
          boxShadow: '0 25px 70px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>নতুন পোস্ট</h3>
          <button onClick={onClose} style={{ background: 'var(--border-soft)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon width={16} height={16} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Avatar name={currentUser.name} src={currentUser.avatar_url} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{currentUser.name}</div>
            <div ref={privacyRef} style={{ position: 'relative', display: 'inline-block', marginTop: 2 }}>
              <button
                onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 8,
                  border: `1px solid var(--border)`, background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {privacy === 'only_me' ? <LockIcon width={11} height={11} /> : <GlobeIcon width={11} height={11} />}
                {privacy === 'only_me' ? 'শুধু আমি' : 'সবাই দেখবে'}
              </button>
              {showPrivacyMenu && (
                <div style={{
                  position: 'absolute', left: 0, top: 26, background: 'var(--bg-surface)', borderRadius: 10,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)', zIndex: 20, overflow: 'hidden', minWidth: 150,
                }}>
                  <button
                    onClick={() => { setPrivacy('public'); setShowPrivacyMenu(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: 'none',
                      background: privacy === 'public' ? 'var(--accent-soft)' : 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%',
                    }}
                  >
                    <GlobeIcon width={13} height={13} /> সবাই দেখবে
                    {privacy === 'public' && <CheckIcon width={12} height={12} color="var(--accent)" style={{ marginLeft: 'auto' }} />}
                  </button>
                  <button
                    onClick={() => { setPrivacy('only_me'); setShowPrivacyMenu(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: 'none',
                      background: privacy === 'only_me' ? 'var(--accent-soft)' : 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%',
                    }}
                  >
                    <LockIcon width={13} height={13} /> শুধু আমি
                    {privacy === 'only_me' && <CheckIcon width={12} height={12} color="var(--accent)" style={{ marginLeft: 'auto' }} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="কী জানাতে চান সবাইকে?"
          rows={4}
          style={{
            width: '100%', border: `1.5px solid var(--border)`, borderRadius: 14, padding: 12,
            fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            background: 'var(--bg-surface-alt)', color: 'var(--text-primary)',
          }}
        />

        {compressing && !imagePreview && (
          <div style={{
            marginTop: 10, padding: 24, borderRadius: 14, background: 'var(--bg-surface-alt)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13,
          }}>
            <LoaderIcon width={16} height={16} /> ছবি প্রস্তুত হচ্ছে...
          </div>
        )}

        {imagePreview && (
          <div style={{ position: 'relative', marginTop: 10 }}>
            <img src={imagePreview} alt="preview" style={{ width: '100%', borderRadius: 14, maxHeight: 280, objectFit: 'cover' }} />
            <button
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <XIcon width={14} height={14} color="#fff" />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: compressing ? 'var(--text-muted)' : 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: compressing ? 'default' : 'pointer' }}>
            <ImageIcon width={18} height={18} /> {compressing ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'ছবি যোগ করুন'}
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={compressing} style={{ display: 'none' }} />
          </label>

          <button
            onClick={handlePost}
            disabled={posting || compressing || (!text.trim() && !imageFile)}
            style={{
              padding: '10px 22px', borderRadius: 12, border: 'none',
              background: (text.trim() || imageFile) ? 'var(--accent-gradient)' : 'var(--border)',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {posting ? <LoaderIcon width={16} height={16} /> : 'পোস্ট করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
