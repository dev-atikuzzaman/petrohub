// src/components/GlobalSearchModal.js
import React, { useEffect, useRef, useState } from 'react';
import Avatar from './Avatar';
import { XIcon, SearchIcon, LoaderIcon, HomeIcon, NoteIcon, FolderIcon, BellIcon, UsersIcon } from './Icons';
import { globalSearch } from '../lib/dataService';

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

const SECTIONS = [
  { key: 'posts', label: 'পোস্ট', icon: HomeIcon, tab: 'feed' },
  { key: 'notes', label: 'নোট', icon: NoteIcon, tab: 'notes' },
  { key: 'documents', label: 'ডকুমেন্ট', icon: FolderIcon, tab: 'documents' },
  { key: 'updates', label: 'গুরুত্বপূর্ণ আপডেট', icon: BellIcon, tab: 'updates' },
  { key: 'members', label: 'সদস্য', icon: UsersIcon, tab: 'members' },
];

export default function GlobalSearchModal({ onClose, onNavigateTab, onOpenProfile }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const data = await globalSearch(query);
      setResults(data);
      setLoading(false);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function goToTab(tabKey) {
    onNavigateTab(tabKey);
    onClose();
  }

  function openMember(member) {
    onOpenProfile(member);
    onClose();
  }

  const totalResults = results
    ? results.posts.length + results.notes.length + results.documents.length + results.updates.length + results.members.length
    : 0;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--bg-surface)', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.25s ease', marginTop: '4vh' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-soft)', flexShrink: 0 }}>
          <SearchIcon width={17} height={17} color="var(--text-muted)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="পোস্ট, নোট, ডকুমেন্ট, আপডেট বা সদস্য খুঁজুন..."
            style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 14.5, color: 'var(--text-primary)' }}
          />
          {loading && <LoaderIcon width={16} height={16} color="var(--accent)" />}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
            <XIcon width={19} height={19} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '8px 10px 16px' }}>
          {!query.trim() ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '30px 16px' }}>
              টাইপ করা শুরু করুন — সব জায়গায় একসাথে খোঁজা হবে
            </div>
          ) : !loading && totalResults === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '30px 16px' }}>
              "{query}" এর জন্য কিছু পাওয়া যায়নি
            </div>
          ) : (
            results && SECTIONS.map(({ key, label, icon: Icon, tab }) => {
              const items = results[key];
              if (!items || items.length === 0) return null;
              return (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    <Icon width={12} height={12} /> {label}
                  </div>

                  {key === 'members' ? (
                    items.map((m) => (
                      <div key={m.id} onClick={() => openMember(m)} style={rowStyle}>
                        <Avatar name={m.name} src={m.avatar_url} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.designation || ''} {(m.current_company || m.company) ? `· ${m.current_company || m.company}` : ''}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : key === 'posts' ? (
                    items.map((p) => (
                      <div key={p.id} onClick={() => goToTab(tab)} style={rowStyle}>
                        <Avatar name={p.author?.name} src={p.author?.avatar_url} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{p.author?.name}</div>
                          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truncate(p.text, 70)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    items.map((item) => (
                      <div key={item.id} onClick={() => goToTab(tab)} style={rowStyle}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon width={14} height={14} color="var(--accent)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truncate(item.body || item.description, 70)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const rowStyle = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
};
