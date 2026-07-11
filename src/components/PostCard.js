// src/components/PostCard.js
import React, { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import { HeartIcon, CommentIcon, SendIcon, TrashIcon, MoreIcon, EditIcon, LockIcon, GlobeIcon, CheckIcon, LoaderIcon, XIcon } from './Icons';
import { toggleReaction, createComment, deletePost, deleteComment, updatePost } from '../lib/dataService';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'এইমাত্র';
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} দিন আগে`;
  return new Date(dateStr).toLocaleDateString('bn-BD');
}

function groupReactions(reactions = []) {
  const counts = {};
  reactions.forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
  return counts;
}

export default function PostCard({ post, currentUser, onUpdate, onOpenProfile }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [showReactors, setShowReactors] = useState(false);
  const [reactorsFilter, setReactorsFilter] = useState('all');

  const menuRef = useRef(null);
  const emojiRef = useRef(null);

  // মেনু বা ইমোজি পিকারের বাইরে ক্লিক করলে সেটা বন্ধ হয়ে যাবে
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowPrivacyMenu(false);
      }
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const myReaction = post.reactions?.find((r) => r.user_id === currentUser.id);
  const reactionCounts = groupReactions(post.reactions);
  const totalReactions = post.reactions?.length || 0;
  const isOwn = post.user_id === currentUser.id;

  const topLevelComments = (post.comments || [])
    .filter((c) => !c.parent_id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  function repliesFor(commentId) {
    return (post.comments || [])
      .filter((c) => c.parent_id === commentId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  async function handleReact(emoji) {
    setShowEmojiPicker(false);
    await toggleReaction(post.id, currentUser.id, emoji);
    onUpdate && onUpdate();
  }

  async function handleSubmitComment() {
    if (!commentText.trim()) return;
    setSubmitting(true);
    await createComment(post.id, currentUser.id, commentText.trim(), replyTo);
    setCommentText('');
    setReplyTo(null);
    setSubmitting(false);
    onUpdate && onUpdate();
  }

  async function handleDeletePost() {
    if (!window.confirm('পোস্টটি মুছে ফেলতে চান?')) return;
    await deletePost(post.id);
    onUpdate && onUpdate();
  }

  async function handleDeleteComment(commentId) {
    await deleteComment(commentId);
    onUpdate && onUpdate();
  }

  async function handleSaveEdit() {
    if (!editText.trim()) return;
    setSavingEdit(true);
    await updatePost(post.id, { text: editText.trim() });
    setSavingEdit(false);
    setIsEditing(false);
    onUpdate && onUpdate();
  }

  function handleCancelEdit() {
    setEditText(post.text);
    setIsEditing(false);
  }

  async function handleChangePrivacy(privacy) {
    setShowPrivacyMenu(false);
    setShowMenu(false);
    setUpdatingPrivacy(true);
    await updatePost(post.id, { privacy });
    setUpdatingPrivacy(false);
    onUpdate && onUpdate();
  }

  return (
    <div style={{
      background: 'var(--bg-surface)', borderRadius: 18, padding: 18, marginBottom: 14,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            name={post.author?.name}
            src={post.author?.avatar_url}
            size={42}
            onClick={() => onOpenProfile && onOpenProfile(post.author)}
          />
          <div>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer' }}
              onClick={() => onOpenProfile && onOpenProfile(post.author)}
            >
              {post.author?.name || 'অজানা সদস্য'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {post.author?.designation ? `${post.author.designation} · ` : ''}
              {timeAgo(post.created_at)}
              {post.edited_at && <span>· এডিট করা হয়েছে</span>}
              {isOwn && (
                post.privacy === 'only_me'
                  ? <LockIcon width={11} height={11} style={{ marginLeft: 2 }} />
                  : <GlobeIcon width={11} height={11} style={{ marginLeft: 2 }} />
              )}
            </div>
          </div>
        </div>

        {isOwn && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => { setShowMenu(!showMenu); setShowPrivacyMenu(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              {updatingPrivacy ? <LoaderIcon width={18} height={18} /> : <MoreIcon width={18} height={18} />}
            </button>
            {showMenu && (
              <div style={{
                position: 'absolute', right: 0, top: 28, background: 'var(--bg-surface)', borderRadius: 12,
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)', zIndex: 10, overflow: 'visible', minWidth: 170,
              }}>
                <button
                  onClick={() => { setShowMenu(false); setIsEditing(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: 'none',
                    background: 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%',
                  }}
                >
                  <EditIcon width={14} height={14} /> এডিট করুন
                </button>

                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: 'none',
                      background: 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%',
                    }}
                  >
                    {post.privacy === 'only_me' ? <LockIcon width={14} height={14} /> : <GlobeIcon width={14} height={14} />}
                    প্রাইভেসি
                  </button>
                  {showPrivacyMenu && (
                    <div style={{
                      position: 'absolute', right: '100%', top: 0, marginRight: 4, background: 'var(--bg-surface)', borderRadius: 10,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)', overflow: 'hidden', minWidth: 150,
                    }}>
                      <button
                        onClick={() => handleChangePrivacy('public')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none',
                          background: post.privacy === 'public' ? 'var(--accent-soft)' : 'none', color: 'var(--text-primary)', fontSize: 13,
                          fontWeight: 600, cursor: 'pointer', width: '100%',
                        }}
                      >
                        <GlobeIcon width={14} height={14} /> সবাই দেখবে
                        {post.privacy === 'public' && <CheckIcon width={13} height={13} color="var(--accent)" style={{ marginLeft: 'auto' }} />}
                      </button>
                      <button
                        onClick={() => handleChangePrivacy('only_me')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none',
                          background: post.privacy === 'only_me' ? 'var(--accent-soft)' : 'none', color: 'var(--text-primary)', fontSize: 13,
                          fontWeight: 600, cursor: 'pointer', width: '100%',
                        }}
                      >
                        <LockIcon width={14} height={14} /> শুধু আমি
                        {post.privacy === 'only_me' && <CheckIcon width={13} height={13} color="var(--accent)" style={{ marginLeft: 'auto' }} />}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setShowMenu(false); handleDeletePost(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: 'none',
                    background: 'none', color: 'var(--danger)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%',
                  }}
                >
                  <TrashIcon width={14} height={14} /> মুছে ফেলুন
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div style={{ marginTop: 12 }}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            autoFocus
            style={{
              width: '100%', border: `1.5px solid var(--accent)`, borderRadius: 12, padding: 10,
              fontSize: 14.5, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              background: 'var(--bg-surface-alt)', color: 'var(--text-primary)',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancelEdit}
              style={{ padding: '7px 16px', borderRadius: 10, border: `1.5px solid var(--border)`, background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              বাতিল
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={savingEdit || !editText.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, border: 'none',
                background: 'var(--accent-gradient)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {savingEdit ? <LoaderIcon width={14} height={14} /> : <CheckIcon width={14} height={14} />} সংরক্ষণ
            </button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 14.5, color: 'var(--text-primary)', lineHeight: 1.6, marginTop: 12, whiteSpace: 'pre-wrap' }}>
          {post.text}
        </p>
      )}

      {post.image_url && (
        <img
          src={post.image_url}
          alt="post"
          style={{ width: '100%', borderRadius: 14, marginTop: 10, maxHeight: 400, objectFit: 'cover' }}
        />
      )}

      {totalReactions > 0 && (
        <div
          onClick={() => { setReactorsFilter('all'); setShowReactors(true); }}
          style={{ display: 'flex', gap: 4, marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', width: 'fit-content' }}
        >
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <span key={emoji}>{emoji} {count}</span>
          ))}
        </div>
      )}

      <div ref={emojiRef} style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid var(--border-soft)`, position: 'relative' }}>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px', borderRadius: 10, border: 'none',
            background: myReaction ? 'var(--danger-soft)' : 'var(--bg-surface-alt)',
            color: myReaction ? 'var(--danger)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {myReaction ? <span>{myReaction.emoji}</span> : <HeartIcon width={16} height={16} />}
          রিয়্যাক্ট
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px', borderRadius: 10, border: 'none', background: 'var(--bg-surface-alt)',
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <CommentIcon width={16} height={16} /> মন্তব্য {post.comments?.length > 0 && `(${post.comments.length})`}
        </button>

        {showEmojiPicker && (
          <div style={{
            position: 'absolute', bottom: 44, left: 0, background: 'var(--bg-surface)', borderRadius: 16,
            padding: '8px 10px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', display: 'flex', gap: 6, zIndex: 10,
          }}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => handleReact(e)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', transition: 'transform 0.15s' }}
                onMouseEnter={(ev) => (ev.target.style.transform = 'scale(1.3)')}
                onMouseLeave={(ev) => (ev.target.style.transform = 'scale(1)')}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {showComments && (
        <div style={{ marginTop: 14 }}>
          {topLevelComments.map((c) => (
            <div key={c.id} style={{ marginTop: 12 }}>
              <CommentRow
                comment={c}
                currentUser={currentUser}
                onReply={() => setReplyTo(c.id)}
                onDelete={() => handleDeleteComment(c.id)}
                onOpenProfile={onOpenProfile}
              />
              {repliesFor(c.id).map((r) => (
                <div key={r.id} style={{ marginLeft: 36, marginTop: 8 }}>
                  <CommentRow
                    comment={r}
                    currentUser={currentUser}
                    onDelete={() => handleDeleteComment(r.id)}
                    onOpenProfile={onOpenProfile}
                  />
                </div>
              ))}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
            <Avatar name={currentUser.name} src={currentUser.avatar_url} size={32} />
            <div style={{ flex: 1, position: 'relative' }}>
              {replyTo && (
                <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>রিপ্লাই করছেন</span>
                  <span onClick={() => setReplyTo(null)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>বাতিল</span>
                </div>
              )}
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                placeholder="মন্তব্য লিখুন..."
                style={{
                  width: '100%', padding: '9px 36px 9px 12px', borderRadius: 20, border: `1.5px solid var(--border)`,
                  fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  background: 'var(--bg-surface-alt)', color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={handleSubmitComment}
                disabled={submitting || !commentText.trim()}
                style={{
                  position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 6,
                }}
              >
                <SendIcon width={16} height={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showReactors && (
        <div
          onClick={() => setShowReactors(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-surface)', borderRadius: 20, width: '100%', maxWidth: 400, maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.3s ease' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '14px 16px 10px', borderBottom: `1px solid var(--border-soft)` }}>
              <button
                onClick={() => setReactorsFilter('all')}
                style={{
                  padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  background: reactorsFilter === 'all' ? 'var(--bg-surface-alt)' : 'none',
                  color: reactorsFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                সব {totalReactions}
              </button>
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => setReactorsFilter(emoji)}
                  style={{
                    padding: '6px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: reactorsFilter === emoji ? 'var(--bg-surface-alt)' : 'none',
                    color: reactorsFilter === emoji ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <span>{emoji}</span> {count}
                </button>
              ))}
              <button onClick={() => setShowReactors(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
                <XIcon width={18} height={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '6px 8px' }}>
              {(post.reactions || [])
                .filter((r) => reactorsFilter === 'all' || r.emoji === reactorsFilter)
                .map((r) => (
                  <div
                    key={r.id}
                    onClick={() => { onOpenProfile && onOpenProfile(r.user); setShowReactors(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-alt)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Avatar name={r.user?.name} src={r.user?.avatar_url} size={38} />
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{r.user?.name || 'অজানা'}</div>
                    <span style={{ fontSize: 18 }}>{r.emoji}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentRow({ comment, currentUser, onReply, onDelete, onOpenProfile }) {
  const isOwn = comment.user_id === currentUser.id;
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Avatar
        name={comment.author?.name}
        src={comment.author?.avatar_url}
        size={30}
        onClick={() => onOpenProfile && onOpenProfile(comment.author)}
      />
      <div style={{ flex: 1 }}>
        <div style={{ background: 'var(--bg-surface-alt)', borderRadius: 14, padding: '8px 12px', display: 'inline-block', maxWidth: '100%' }}>
          <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)' }}>{comment.author?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 1, wordBreak: 'break-word' }}>{comment.text}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4, paddingLeft: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(comment.created_at)}</span>
          {onReply && (
            <span onClick={onReply} style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>
              রিপ্লাই
            </span>
          )}
          {isOwn && (
            <span onClick={onDelete} style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600, cursor: 'pointer' }}>
              মুছুন
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
