// src/pages/MeetingTab.js
// ============================================================
// ভিডিও মিটিং — Jitsi Meet (meet.jit.si) ব্যবহার করে
// ============================================================
// দুই ধরনের রুম:
//  ১) সবার জন্য উন্মুক্ত — প্রতিদিনের একটা শেয়ার্ড রুম, যে কেউ ঢুকতে পারবেন
//  ২) টপিক-ভিত্তিক প্রাইভেট রুম — নির্দিষ্ট কয়েকজন সদস্যকে বেছে নিয়ে তৈরি,
//     শুধু creator ও আমন্ত্রিতরাই এই রুমের অস্তিত্ব দেখতে পাবেন (RLS দিয়ে
//     নিয়ন্ত্রিত)। ভিডিও/অডিও এখনও Jitsi-র সার্ভার দিয়েই যায়, তাই এখানেও
//     কোনো ভারী Supabase স্টোরেজ খরচ নেই — শুধু topic + রুমের নাম +
//     আমন্ত্রিতদের id সংরক্ষণ করা হয় (নগণ্য পরিমাণ ডেটা)।
import React, { useEffect, useRef, useState } from 'react';
import Avatar from '../components/Avatar';
import { VideoIcon, UsersIcon, XIcon, LoaderIcon, PlusIcon, TrashIcon, SearchIcon } from '../components/Icons';
import { getMyMeetingRooms, createMeetingRoom, deleteMeetingRoom } from '../lib/dataService';

const JITSI_DOMAIN = 'meet.jit.si';
const SOFT_WARN_MIN = 35; // এই সময়ে হলুদ সতর্কতা দেখানো হবে
const HARD_LIMIT_MIN = 40; // এই সময়ে কল স্বয়ংক্রিয়ভাবে শেষ হয়ে যাবে

function todayRoomName() {
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `petro-knowledge-hub-${dateStr}`;
}

function loadJitsiScript() {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) { resolve(); return; }
    const script = document.createElement('script');
    script.src = `https://${JITSI_DOMAIN}/external_api.js`;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Jitsi স্ক্রিপ্ট লোড করা যায়নি — ইন্টারনেট সংযোগ চেক করুন'));
    document.body.appendChild(script);
  });
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function MeetingTab({ currentUser, members = [] }) {
  const [inCall, setInCall] = useState(false);
  const [activeTopic, setActiveTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [ended, setEnded] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [createError, setCreateError] = useState('');

  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const timerRef = useRef(null);
  const pendingRoomRef = useRef(null);

  useEffect(() => {
    loadRooms();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRooms() {
    setLoadingRooms(true);
    const data = await getMyMeetingRooms();
    setRooms(data);
    setLoadingRooms(false);
  }

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
  }

  async function joinCall(roomName, topicLabel) {
    setLoadError('');
    setEnded(false);
    setLoading(true);
    pendingRoomRef.current = roomName;
    setActiveTopic(topicLabel);

    try {
      await loadJitsiScript();
    } catch (err) {
      setLoading(false);
      setLoadError(err.message);
      return;
    }

    setInCall(true);
    setElapsedSec(0);

    // DOM বসার জন্য এক টিক অপেক্ষা করা
    setTimeout(() => {
      if (!containerRef.current) return;

      const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName: pendingRoomRef.current,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        userInfo: { displayName: currentUser?.name || 'সদস্য' },
        configOverwrite: {
          prejoinPageEnabled: true,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
          SHOW_JITSI_WATERMARK: false,
        },
      });

      apiRef.current = api;
      setLoading(false);

      api.addEventListener('videoConferenceLeft', () => {
        handleEndCall(false);
      });

      timerRef.current = setInterval(() => {
        setElapsedSec((prev) => {
          const next = prev + 1;
          if (next >= HARD_LIMIT_MIN * 60) {
            handleEndCall(true);
          }
          return next;
        });
      }, 1000);
    }, 200);
  }

  function handleEndCall() {
    cleanup();
    setInCall(false);
    setEnded(true);
  }

  async function handleCreateRoom() {
    setCreateError('');
    if (!newTopic.trim()) {
      setCreateError('টপিকের নাম লিখুন');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setCreateError('অন্তত একজন সদস্য বেছে নিন');
      return;
    }
    setCreatingRoom(true);
    const { error } = await createMeetingRoom(currentUser.id, newTopic, selectedMemberIds);
    setCreatingRoom(false);
    if (error) {
      setCreateError(error.message);
    } else {
      setNewTopic('');
      setSelectedMemberIds([]);
      setMemberSearch('');
      setShowCreateForm(false);
      loadRooms();
    }
  }

  async function handleDeleteRoom(id) {
    if (!window.confirm('এই টপিক মিটিং মুছে ফেলবেন?')) return;
    await deleteMeetingRoom(id);
    loadRooms();
  }

  function toggleMember(id) {
    setSelectedMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const minutesLeft = HARD_LIMIT_MIN - Math.floor(elapsedSec / 60);
  const showWarning = inCall && Math.floor(elapsedSec / 60) >= SOFT_WARN_MIN;

  const filteredMembers = members.filter(
    (m) => m.id !== currentUser.id && m.name?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  function memberName(id) {
    return members.find((m) => m.id === id)?.name || 'সদস্য';
  }

  if (inCall) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 999, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          background: showWarning ? 'var(--warning)' : 'var(--bg-surface)', flexShrink: 0,
        }}>
          <VideoIcon width={16} height={16} color={showWarning ? '#fff' : 'var(--accent)'} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: showWarning ? '#fff' : 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {showWarning
              ? `⏰ আর প্রায় ${Math.max(minutesLeft, 0)} মিনিট বাকি — মিটিং শেষ করার প্রস্তুতি নিন`
              : `${activeTopic} — ${formatClock(elapsedSec)}`}
          </span>
          <button
            onClick={handleEndCall}
            style={{ background: 'var(--danger)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
          >
            <XIcon width={13} height={13} /> শেষ করুন
          </button>
        </div>
        <div ref={containerRef} style={{ flex: 1 }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 14px 90px' }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>ভিডিও মিটিং</h2>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>সরাসরি ব্রাউজার থেকে ভিডিও কল — সম্পূর্ণ ফ্রি</div>
      </div>

      {ended && (
        <div style={{ background: 'var(--info-soft)', color: 'var(--info)', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
          মিটিং শেষ হয়েছে। আবার প্রয়োজন হলে আবার যোগ দিন।
        </div>
      )}
      {loadError && (
        <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
          {loadError}
        </div>
      )}

      {/* ১. সবার জন্য উন্মুক্ত রুম */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow)', textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, background: 'var(--accent-gradient)', margin: '0 auto 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <VideoIcon width={28} height={28} color="#fff" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
          <UsersIcon width={14} height={14} color="var(--text-muted)" />
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
            আজকের সবার জন্য একটাই রুম — যে কেউ ঢুকতে পারবেন
          </span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
          প্রতি মিটিং সর্বোচ্চ {HARD_LIMIT_MIN} মিনিট পর স্বয়ংক্রিয়ভাবে শেষ হয়ে যাবে
        </div>

        <button
          onClick={() => joinCall(todayRoomName(), 'সবার জন্য উন্মুক্ত মিটিং')}
          disabled={loading}
          style={{
            width: '100%', padding: 13, borderRadius: 12, border: 'none', background: 'var(--accent-gradient)',
            color: '#fff', fontWeight: 700, fontSize: 14.5, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? <LoaderIcon width={18} height={18} /> : <><VideoIcon width={18} height={18} /> উন্মুক্ত মিটিংয়ে যোগ দিন</>}
        </button>
      </div>

      {/* ২. টপিক-ভিত্তিক প্রাইভেট রুম */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: 18, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)' }}>টপিক-ভিত্তিক মিটিং</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>নির্দিষ্ট আগ্রহী সদস্যদের নিয়ে আলাদা রুম</div>
          </div>
          <button
            onClick={() => { setShowCreateForm(!showCreateForm); setCreateError(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, border: 'none', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
          >
            <PlusIcon width={13} height={13} /> নতুন
          </button>
        </div>

        {showCreateForm && (
          <div style={{ marginTop: 14, background: 'var(--bg-surface-alt)', borderRadius: 14, padding: 14 }}>
            {createError && (
              <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '8px 12px', borderRadius: 8, fontSize: 12.5, marginBottom: 10 }}>
                {createError}
              </div>
            )}
            <input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="টপিকের নাম (যেমন: প্রসেস সেফটি আলোচনা)"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', marginBottom: 10 }}
            />

            <div style={{ position: 'relative', marginBottom: 8 }}>
              <SearchIcon width={14} height={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="সদস্য খুঁজুন..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 32px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 10, border: '1px solid var(--border-soft)', borderRadius: 10 }}>
              {filteredMembers.length === 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: 12, textAlign: 'center' }}>কোনো সদস্য পাওয়া যায়নি</div>
              )}
              {filteredMembers.map((m) => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border-soft)' }}>
                  <input type="checkbox" checked={selectedMemberIds.includes(m.id)} onChange={() => toggleMember(m.id)} style={{ width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }} />
                  <Avatar name={m.name} src={m.avatar_url} size={26} />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{m.name}</span>
                </label>
              ))}
            </div>

            {selectedMemberIds.length > 0 && (
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
                বাছাই করা হয়েছে: {selectedMemberIds.map(memberName).join(', ')}
              </div>
            )}

            <button
              onClick={handleCreateRoom}
              disabled={creatingRoom}
              style={{ width: '100%', padding: 11, borderRadius: 10, border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {creatingRoom ? <LoaderIcon width={15} height={15} /> : 'মিটিং রুম তৈরি করুন'}
            </button>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          {loadingRooms ? (
            <div style={{ textAlign: 'center', padding: 20 }}><LoaderIcon width={20} height={20} color="var(--accent)" /></div>
          ) : rooms.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>
              এখনো কোনো টপিক মিটিং নেই
            </div>
          ) : (
            rooms.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.topic}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {r.created_by === currentUser.id ? 'আপনি তৈরি করেছেন' : `${memberName(r.created_by)} তৈরি করেছেন`} · {r.invited_user_ids.length + 1} জন
                  </div>
                </div>
                <button
                  onClick={() => joinCall(r.room_name, r.topic)}
                  style={{ padding: '7px 12px', borderRadius: 9, border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                >
                  যোগ দিন
                </button>
                {r.created_by === currentUser.id && (
                  <button
                    onClick={() => handleDeleteRoom(r.id)}
                    style={{ background: 'var(--danger-soft)', border: 'none', borderRadius: 9, padding: 7, cursor: 'pointer', color: 'var(--danger)', flexShrink: 0, display: 'flex' }}
                  >
                    <TrashIcon width={13} height={13} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
