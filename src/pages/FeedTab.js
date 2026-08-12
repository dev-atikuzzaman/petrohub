// src/pages/FeedTab.js
import React, { useMemo, useState, useEffect } from 'react';
import PostCard from '../components/PostCard';
import PollCard from '../components/PollCard';
import { PlusIcon, WhatsAppIcon, BookmarkIcon, PollIcon } from '../components/Icons';
import CreatePostModal from '../components/CreatePostModal';
import CreatePollModal from '../components/CreatePollModal';
import { getSavedPostIds, toggleSavePost } from '../lib/dataService';

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

export default function FeedTab({ posts, polls = [], currentUser, onUpdate, onOpenProfile, isAdmin, members = [] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const whatsappLink = process.env.REACT_APP_WHATSAPP_GROUP_LINK;

  useEffect(() => {
    getSavedPostIds(currentUser.id).then((ids) => setSavedIds(new Set(ids)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  async function handleToggleSave(postId, currentlySaved) {
    // আগে UI-তে সাথে সাথে বদলে দেওয়া হচ্ছে (optimistic), তারপর সার্ভারে পাঠানো হচ্ছে
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (currentlySaved) next.delete(postId); else next.add(postId);
      return next;
    });
    const { error } = await toggleSavePost(currentUser.id, postId, currentlySaved);
    if (error) {
      // ব্যর্থ হলে আগের অবস্থায় ফিরিয়ে নেওয়া
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (currentlySaved) next.add(postId); else next.delete(postId);
        return next;
      });
    }
  }

  const topTags = useMemo(() => computeTopTags(posts), [posts]);

  let visiblePosts = activeTag
    ? posts.filter((p) => (p.tags || []).some((t) => t.toLowerCase() === activeTag.toLowerCase()))
    : posts;
  if (showSavedOnly) {
    visiblePosts = visiblePosts.filter((p) => savedIds.has(p.id));
  }

  // পোল শুধু তখনই ফিডে মেশানো হয় যখন কোনো ট্যাগ/সেভ ফিল্টার সক্রিয় নেই
  // (পোল ট্যাগ করা বা সেভ করা যায় না)
  const showPolls = !activeTag && !showSavedOnly;
  const feedItems = useMemo(() => {
    const pinnedPosts = visiblePosts.filter((p) => p.pinned).map((p) => ({ type: 'post', data: p }));
    const rest = visiblePosts.filter((p) => !p.pinned).map((p) => ({ type: 'post', data: p }));
    const pollItems = showPolls ? polls.map((p) => ({ type: 'poll', data: p })) : [];
    const merged = [...rest, ...pollItems].sort(
      (a, b) => new Date(b.data.created_at) - new Date(a.data.created_at)
    );
    return [...pinnedPosts, ...merged];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePosts, polls, showPolls]);

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
        <button
          onClick={() => setShowCreatePoll(true)}
          title="নতুন পোল / জরিপ"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, flexShrink: 0,
            padding: '13px', borderRadius: 14, border: 'none',
            background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)', cursor: 'pointer',
          }}
        >
          <PollIcon width={18} height={18} />
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
        <button
          onClick={() => setShowSavedOnly(!showSavedOnly)}
          title="সেভ করা পোস্ট"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, flexShrink: 0,
            padding: '13px', borderRadius: 14, border: 'none',
            background: showSavedOnly ? 'var(--accent-gradient)' : 'var(--bg-surface-alt)',
            color: showSavedOnly ? '#fff' : 'var(--text-secondary)', cursor: 'pointer',
          }}
        >
          <BookmarkIcon width={18} height={18} fill={showSavedOnly ? '#fff' : 'none'} />
        </button>
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

      {visiblePosts.length === 0 && (!showPolls || polls.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 14 }}>
            {showSavedOnly ? 'কোনো সেভ করা পোস্ট নেই' : activeTag ? `#${activeTag} ট্যাগে কোনো পোস্ট নেই` : 'এখনো কোনো পোস্ট নেই। প্রথম পোস্টটি করুন!'}
          </div>
        </div>
      ) : (
        feedItems.map((item) =>
          item.type === 'poll' ? (
            <PollCard
              key={`poll-${item.data.id}`}
              poll={item.data}
              currentUser={currentUser}
              onUpdate={onUpdate}
              onOpenProfile={onOpenProfile}
              isAdmin={isAdmin}
            />
          ) : (
            <PostCard
              key={item.data.id}
              post={item.data}
              currentUser={currentUser}
              onUpdate={onUpdate}
              onOpenProfile={onOpenProfile}
              onFilterTag={setActiveTag}
              isSaved={savedIds.has(item.data.id)}
              onToggleSave={handleToggleSave}
              isAdmin={isAdmin}
              members={members}
            />
          )
        )
      )}

      {showCreate && (
        <CreatePostModal
          currentUser={currentUser}
          members={members}
          onClose={() => setShowCreate(false)}
          onCreated={onUpdate}
        />
      )}

      {showCreatePoll && (
        <CreatePollModal
          currentUser={currentUser}
          onClose={() => setShowCreatePoll(false)}
          onCreated={onUpdate}
        />
      )}
    </div>
  );
}
