// src/pages/LeaderboardTab.js
import React, { useMemo, useState } from 'react';
import Avatar from '../components/Avatar';
import { TrophyIcon, MedalIcon, PlusIcon, TrashIcon, XIcon, LoaderIcon } from '../components/Icons';
import { createBadge, deleteBadge, awardBadge, revokeBadge } from '../lib/dataService';

const RANK_STYLES = [
  { bg: 'linear-gradient(135deg,#fde68a,#f59e0b)', color: '#7c4a03', medal: '🥇' },
  { bg: 'linear-gradient(135deg,#e5e7eb,#9ca3af)', color: '#374151', medal: '🥈' },
  { bg: 'linear-gradient(135deg,#fbcfa0,#c2703d)', color: '#5c2e0e', medal: '🥉' },
];

const EMOJI_CHOICES = ['🏅', '🏆', '🌟', '🔥', '💡', '🤝', '🎯', '🚀', '👑', '📚', '🛠️', '💬'];
const COLOR_CHOICES = ['#f59e0b', '#0ea5e9', '#8b5cf6', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

function computeLeaderboard(members, posts) {
  const scoreMap = new Map();
  members.forEach((m) => scoreMap.set(m.id, { member: m, posts: 0, comments: 0, reactionsReceived: 0, score: 0 }));

  posts.forEach((post) => {
    const authorEntry = scoreMap.get(post.user_id);
    if (authorEntry) {
      authorEntry.posts += 1;
      authorEntry.reactionsReceived += (post.reactions || []).length;
    }
    (post.comments || []).forEach((c) => {
      const commenterEntry = scoreMap.get(c.user_id);
      if (commenterEntry) commenterEntry.comments += 1;
    });
  });

  scoreMap.forEach((entry) => {
    entry.score = entry.posts * 5 + entry.comments * 2 + entry.reactionsReceived * 1;
  });

  return Array.from(scoreMap.values())
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);
}

function LeaderRow({ entry, rank, onOpenProfile }) {
  const style = RANK_STYLES[rank - 1];
  return (
    <div
      onClick={() => onOpenProfile && onOpenProfile(entry.member)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        borderRadius: 14, marginBottom: 8, cursor: 'pointer',
        background: style ? `${style.bg}` : 'var(--bg-surface-alt)',
        boxShadow: style ? '0 3px 10px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      <div style={{ width: 26, textAlign: 'center', fontWeight: 800, fontSize: style ? 20 : 14, color: style ? style.color : 'var(--text-muted)' }}>
        {style ? style.medal : rank}
      </div>
      <Avatar name={entry.member.name} src={entry.member.avatar_url} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: style ? style.color : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.member.name}
        </div>
        <div style={{ fontSize: 11.5, color: style ? style.color : 'var(--text-muted)', opacity: 0.85 }}>
          {entry.posts} পোস্ট · {entry.comments} মন্তব্য · {entry.reactionsReceived} রিঅ্যাকশন
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 16, color: style ? style.color : 'var(--accent)' }}>
        {entry.score}
      </div>
    </div>
  );
}

export default function LeaderboardTab({ members, posts, badges, memberBadges, currentUser, isAdmin, onOpenProfile, onUpdate }) {
  const [showAdmin, setShowAdmin] = useState(false);
  const [creatingBadge, setCreatingBadge] = useState(false);
  const [badgeForm, setBadgeForm] = useState({ name: '', description: '', icon: '🏅', color: '#f59e0b' });
  const [awardForm, setAwardForm] = useState({ badgeId: '', userId: '', note: '' });
  const [awarding, setAwarding] = useState(false);
  const [error, setError] = useState('');

  const leaderboard = useMemo(() => computeLeaderboard(members, posts), [members, posts]);

  const badgesByType = useMemo(() => {
    const map = new Map();
    badges.forEach((b) => map.set(b.id, { badge: b, recipients: [] }));
    memberBadges.forEach((mb) => {
      const entry = map.get(mb.badge_id);
      if (entry) entry.recipients.push(mb);
    });
    return Array.from(map.values());
  }, [badges, memberBadges]);

  async function handleCreateBadge() {
    setError('');
    if (!badgeForm.name.trim()) { setError('ব্যাজের নাম দিন'); return; }
    setCreatingBadge(true);
    const { error } = await createBadge(currentUser.id, badgeForm);
    setCreatingBadge(false);
    if (error) { setError(error.message); return; }
    setBadgeForm({ name: '', description: '', icon: '🏅', color: '#f59e0b' });
    onUpdate && onUpdate();
  }

  async function handleDeleteBadgeType(badgeId) {
    if (!window.confirm('এই ব্যাজটি মুছে ফেললে সবার কাছ থেকে এটি সরে যাবে। নিশ্চিত?')) return;
    await deleteBadge(badgeId);
    onUpdate && onUpdate();
  }

  async function handleAward() {
    setError('');
    if (!awardForm.badgeId || !awardForm.userId) { setError('ব্যাজ ও সদস্য দুটোই বাছাই করুন'); return; }
    setAwarding(true);
    const { error } = await awardBadge(awardForm.badgeId, awardForm.userId, currentUser.id, awardForm.note);
    setAwarding(false);
    if (error) { setError(error.message.includes('duplicate') ? 'এই সদস্য ইতিমধ্যে এই ব্যাজ পেয়েছেন' : error.message); return; }
    setAwardForm({ badgeId: '', userId: '', note: '' });
    onUpdate && onUpdate();
  }

  async function handleRevoke(memberBadgeId) {
    await revokeBadge(memberBadgeId);
    onUpdate && onUpdate();
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)',
    background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13.5, boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 14px 90px' }}>
      {/* ---------- টপ কন্ট্রিবিউটর লিডারবোর্ড ---------- */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: 18, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <TrophyIcon width={19} height={19} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: 'var(--text-primary)' }}>টপ কন্ট্রিবিউটর লিডারবোর্ড</h3>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 12 }}>
          পয়েন্ট হিসাব: প্রতি পোস্ট ৫, প্রতি মন্তব্য ২, প্রতি রিঅ্যাকশন ১
        </div>
        {leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 13 }}>
            এখনো কোনো activity নেই
          </div>
        ) : (
          leaderboard.slice(0, 20).map((entry, i) => (
            <LeaderRow key={entry.member.id} entry={entry} rank={i + 1} onOpenProfile={onOpenProfile} />
          ))
        )}
      </div>

      {/* ---------- ব্যাজ / স্বীকৃতি ---------- */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MedalIcon width={19} height={19} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: 'var(--text-primary)' }}>ব্যাজ ও স্বীকৃতি</h3>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, border: 'none',
                background: showAdmin ? 'var(--accent-gradient)' : 'var(--bg-surface-alt)',
                color: showAdmin ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {showAdmin ? <XIcon width={13} height={13} /> : <PlusIcon width={13} height={13} />}
              {showAdmin ? 'বন্ধ করুন' : 'পরিচালনা'}
            </button>
          )}
        </div>

        {isAdmin && showAdmin && (
          <div style={{ background: 'var(--bg-surface-alt)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
            {error && <div style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 10 }}>{error}</div>}

            {/* নতুন ব্যাজ তৈরি */}
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>নতুন ব্যাজ তৈরি করুন</div>
            <input
              placeholder="ব্যাজের নাম (যেমন: টপ কন্ট্রিবিউটর)"
              value={badgeForm.name}
              onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <input
              placeholder="বিবরণ (ঐচ্ছিক)"
              value={badgeForm.description}
              onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  onClick={() => setBadgeForm({ ...badgeForm, icon: e })}
                  style={{
                    fontSize: 18, padding: '4px 8px', borderRadius: 8, cursor: 'pointer',
                    border: badgeForm.icon === e ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                    background: 'var(--bg-surface)',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {COLOR_CHOICES.map((c) => (
                <button
                  key={c}
                  onClick={() => setBadgeForm({ ...badgeForm, color: c })}
                  style={{
                    width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', background: c,
                    border: badgeForm.color === c ? '2.5px solid var(--text-primary)' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
            <button
              onClick={handleCreateBadge}
              disabled={creatingBadge}
              style={{
                width: '100%', padding: 10, borderRadius: 10, border: 'none', background: 'var(--accent-gradient)',
                color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 16,
              }}
            >
              {creatingBadge ? <LoaderIcon width={15} height={15} /> : 'ব্যাজ তৈরি করুন'}
            </button>

            {/* সদস্যকে ব্যাজ দেওয়া */}
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>সদস্যকে ব্যাজ দিন</div>
            <select
              value={awardForm.badgeId}
              onChange={(e) => setAwardForm({ ...awardForm, badgeId: e.target.value })}
              style={{ ...inputStyle, marginBottom: 8 }}
            >
              <option value="">-- ব্যাজ বাছাই করুন --</option>
              {badges.map((b) => (
                <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
              ))}
            </select>
            <select
              value={awardForm.userId}
              onChange={(e) => setAwardForm({ ...awardForm, userId: e.target.value })}
              style={{ ...inputStyle, marginBottom: 8 }}
            >
              <option value="">-- সদস্য বাছাই করুন --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <input
              placeholder="নোট (ঐচ্ছিক)"
              value={awardForm.note}
              onChange={(e) => setAwardForm({ ...awardForm, note: e.target.value })}
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            <button
              onClick={handleAward}
              disabled={awarding}
              style={{
                width: '100%', padding: 10, borderRadius: 10, border: 'none', background: 'var(--accent)',
                color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              {awarding ? <LoaderIcon width={15} height={15} /> : 'ব্যাজ দিন'}
            </button>
          </div>
        )}

        {badgesByType.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 13 }}>
            এখনো কোনো ব্যাজ তৈরি হয়নি
          </div>
        ) : (
          badgesByType.map(({ badge, recipients }) => (
            <div key={badge.id} style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{badge.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>{badge.name}</div>
                    {badge.description && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{badge.description}</div>}
                  </div>
                </div>
                {isAdmin && showAdmin && (
                  <button onClick={() => handleDeleteBadgeType(badge.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}>
                    <TrashIcon width={15} height={15} />
                  </button>
                )}
              </div>
              {recipients.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>এখনো কেউ পায়নি</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {recipients.map((mb) => (
                    <div
                      key={mb.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface-alt)', borderRadius: 20, padding: '4px 10px 4px 4px' }}
                    >
                      <Avatar name={mb.user?.name} src={mb.user?.avatar_url} size={24} onClick={() => onOpenProfile && onOpenProfile(mb.user)} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => onOpenProfile && onOpenProfile(mb.user)}>
                        {mb.user?.name}
                      </span>
                      {isAdmin && showAdmin && (
                        <button onClick={() => handleRevoke(mb.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                          <XIcon width={12} height={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
