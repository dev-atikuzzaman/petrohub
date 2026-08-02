// src/pages/FeedTab.js
import React, { useMemo, useState } from 'react';
import PostCard from '../components/PostCard';
import { PlusIcon, WhatsAppIcon } from '../components/Icons';
import CreatePostModal from '../components/CreatePostModal';

function computeTopTags(posts, limit = 10) {
  const counts = new Map();
  posts.forEach((p) => {
    (p.tags || []).forEach((t) => {
      const key = t.toLowerCase();
      const existing = counts.get(key);
      counts.set(key, { tag: existing ? existing.tag : t, count: (existing?.count || 0) + 1 });
    });
  });
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export default function FeedTab({ posts, currentUser, onUpdate, onOpenProfile }) {
  const [showCreate, setShowCreate] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const whatsappLink = process.env.REACT_APP_WHATSAPP_GROUP_LINK;

  const topTags = useMemo(() => computeTopTags(posts), [posts]);

  const visiblePosts = activeTag
    ? posts.filter((p) => (p.tags || []).some((t) => t.toLowerCase() === activeTag.toLowerCase()))
    : posts;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 14px 90px' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '13px', borderRadius: 14, border: 'none',
            background: 'var(--accent-gradient)', color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 16px rgba(14,165,233,0.25)',
          }}
        >
          <PlusIcon width={18} height={18} /> নতুন পোস্ট
        </button>
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 16px', borderRadius: 14, background: '#25D366', color: '#fff',
              fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 6px 16px rgba(37,211,102,0.3)',
            }}
          >
            <WhatsAppIcon width={18} height={18} />
          </a>
        )}
      </div>

      {topTags.length > 0 && (
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
          <button
            onClick={() => setActiveTag(null)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
              background: !activeTag ? 'var(--accent-gradient)' : 'var(--bg-surface-alt)',
              color: !activeTag ? '#fff' : 'var(--text-secondary)',
            }}
          >
            সব
          </button>
          {topTags.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag?.toLowerCase() === tag.toLowerCase() ? null : tag)}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                background: activeTag?.toLowerCase() === tag.toLowerCase() ? 'var(--accent-gradient)' : 'var(--bg-surface-alt)',
                color: activeTag?.toLowerCase() === tag.toLowerCase() ? '#fff' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              #{tag} <span style={{ opacity: 0.7 }}>{count}</span>
            </button>
          ))}
        </div>
      )}

      {visiblePosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 14 }}>
            {activeTag ? `#${activeTag} ট্যাগে কোনো পোস্ট নেই` : 'এখনো কোনো পোস্ট নেই। প্রথম পোস্টটি করুন!'}
          </div>
        </div>
      ) : (
        visiblePosts.map((post) => (
          <PostCard key={post.id} post={post} currentUser={currentUser} onUpdate={onUpdate} onOpenProfile={onOpenProfile} onFilterTag={setActiveTag} />
        ))
      )}

      {showCreate && (
        <CreatePostModal
          currentUser={currentUser}
          onClose={() => setShowCreate(false)}
          onCreated={onUpdate}
        />
      )}
    </div>
  );
}
