// src/components/PollCard.js
import React, { useState } from 'react';
import Avatar from './Avatar';
import { PollIcon, CheckIcon, TrashIcon, LoaderIcon } from './Icons';
import { votePoll, retractVote, deletePoll } from '../lib/dataService';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'এইমাত্র';
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} দিন আগে`;
  return new Date(dateStr).toLocaleDateString('bn-BD');
}

export default function PollCard({ poll, currentUser, onUpdate, onOpenProfile, isAdmin }) {
  const [submitting, setSubmitting] = useState(null); // optionId যেটার জন্য অপেক্ষা করা হচ্ছে

  const options = poll.poll_options || [];
  const totalVotes = options.reduce((sum, o) => sum + (o.poll_votes || []).length, 0);
  const myVote = options.find((o) => (o.poll_votes || []).some((v) => v.user_id === currentUser.id));
  const isOwn = poll.user_id === currentUser.id;

  async function handleVote(optionId) {
    if (submitting) return;
    setSubmitting(optionId);
    if (myVote && myVote.id === optionId) {
      await retractVote(poll.id, currentUser.id);
    } else {
      await votePoll(poll.id, optionId, currentUser.id);
    }
    setSubmitting(null);
    onUpdate && onUpdate();
  }

  async function handleDelete() {
    if (!window.confirm('এই পোলটি মুছে ফেলতে চান?')) return;
    await deletePoll(poll.id);
    onUpdate && onUpdate();
  }

  return (
    <div style={{
      background: 'var(--bg-surface)', borderRadius: 18, padding: 18, marginBottom: 14,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', animation: 'fadeIn 0.3s ease',
      border: '1.5px solid var(--accent-soft)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={poll.author?.name} src={poll.author?.avatar_url} size={42} onClick={() => onOpenProfile && onOpenProfile(poll.author)} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => onOpenProfile && onOpenProfile(poll.author)}>
              {poll.author?.name || 'অজানা সদস্য'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <PollIcon width={11} height={11} /> পোল · {timeAgo(poll.created_at)}
            </div>
          </div>
        </div>
        {(isOwn || isAdmin) && (
          <button onClick={handleDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <TrashIcon width={16} height={16} />
          </button>
        )}
      </div>

      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 14, lineHeight: 1.4 }}>
        {poll.question}
      </div>

      {options.map((opt) => {
        const voteCount = (opt.poll_votes || []).length;
        const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
        const isMine = myVote?.id === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => handleVote(opt.id)}
            disabled={submitting === opt.id}
            style={{
              position: 'relative', width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 12,
              border: isMine ? '1.5px solid var(--accent)' : '1.5px solid var(--border)', background: 'var(--bg-surface-alt)',
              marginBottom: 8, cursor: 'pointer', overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`,
              background: isMine ? 'var(--accent-soft)' : 'var(--border-soft)', transition: 'width 0.4s ease', zIndex: 0,
            }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: isMine ? 700 : 600, color: 'var(--text-primary)' }}>
                {submitting === opt.id ? <LoaderIcon width={13} height={13} /> : isMine && <CheckIcon width={13} height={13} color="var(--accent)" />}
                {opt.option_text}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {pct}% ({voteCount})
              </span>
            </div>
          </button>
        );
      })}

      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
        মোট {totalVotes} ভোট
      </div>
    </div>
  );
}
