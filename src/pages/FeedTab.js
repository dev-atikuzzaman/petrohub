// src/pages/FeedTab.js
import React, { useState } from 'react';
import PostCard from '../components/PostCard';
import { PlusIcon, WhatsAppIcon } from '../components/Icons';
import CreatePostModal from '../components/CreatePostModal';

export default function FeedTab({ posts, currentUser, onUpdate, onOpenProfile }) {
  const [showCreate, setShowCreate] = useState(false);
  const whatsappLink = process.env.REACT_APP_WHATSAPP_GROUP_LINK;

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

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 14 }}>এখনো কোনো পোস্ট নেই। প্রথম পোস্টটি করুন!</div>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} currentUser={currentUser} onUpdate={onUpdate} onOpenProfile={onOpenProfile} />
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
