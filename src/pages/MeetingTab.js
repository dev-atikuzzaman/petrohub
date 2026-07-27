// src/pages/MeetingTab.js
// ============================================================
// ভিডিও মিটিং — Jitsi Meet (meet.jit.si) ব্যবহার করে
// ============================================================
// কেন Jitsi: Zoom বা Google Meet-এ প্রোগ্রাম্যাটিকভাবে মিটিং বানাতে
// হলে পেইড অ্যাকাউন্ট/API app লাগে (Zoom-এর ফ্রি প্ল্যানেও গ্রুপ কলে
// ৪০ মিনিটের সীমা আছে, আর Google Meet-এর API আসলে Google Workspace
// (পেইড) ছাড়া পাওয়া যায় না)। Jitsi সম্পূর্ণ ফ্রি, ওপেন সোর্স, কোনো
// সাইনআপ/এপিআই কী লাগে না — শুধু ব্রাউজারে একটা স্ক্রিপ্ট লোড করেই
// ভিডিও কল এমবেড করা যায়। ভিডিও/অডিও ডেটা সরাসরি Jitsi-র সার্ভার
// দিয়ে যায়, তাই Supabase-এ কোনো অতিরিক্ত স্টোরেজ/সিংক খরচ পড়ে না।
//
// রুম: প্রতিদিনের জন্য একটা ভাগাভাগি রুম (তারিখ অনুযায়ী নাম) —
// সবাই একই ট্যাবে ঢুকলে স্বয়ংক্রিয়ভাবে একই রুমে মিলিত হবেন, আলাদা
// করে কাউকে লিংক শেয়ার করতে হবে না। চাইলে কাস্টম রুম নামও দেওয়া যায়
// (আলাদা ব্রেকআউট আলোচনার জন্য)।
import React, { useEffect, useRef, useState } from 'react';
import { VideoIcon, UsersIcon, XIcon, LoaderIcon } from '../components/Icons';

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

export default function MeetingTab({ currentUser }) {
  const [inCall, setInCall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [customRoom, setCustomRoom] = useState('');
  const [useCustomRoom, setUseCustomRoom] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [ended, setEnded] = useState(false);

  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const timerRef = useRef(null);

  const roomName = useCustomRoom && customRoom.trim()
    ? `petro-hub-${customRoom.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    : todayRoomName();

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
  }

  async function joinCall() {
    setLoadError('');
    setEnded(false);
    setLoading(true);

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
        roomName,
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

  function handleEndCall(timeUp) {
    cleanup();
    setInCall(false);
    setEnded(true);
    if (timeUp) {
      // সময় শেষ হয়ে যাওয়ার বার্তা — ended state এ দেখানো হবে
    }
  }

  const minutesLeft = HARD_LIMIT_MIN - Math.floor(elapsedSec / 60);
  const showWarning = inCall && Math.floor(elapsedSec / 60) >= SOFT_WARN_MIN;

  if (inCall) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 999, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          background: showWarning ? 'var(--warning)' : 'var(--bg-surface)', flexShrink: 0,
        }}>
          <VideoIcon width={16} height={16} color={showWarning ? '#fff' : 'var(--accent)'} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: showWarning ? '#fff' : 'var(--text-primary)', flex: 1 }}>
            {showWarning
              ? `⏰ আর প্রায় ${Math.max(minutesLeft, 0)} মিনিট বাকি — মিটিং শেষ করার প্রস্তুতি নিন`
              : `লাইভ মিটিং — ${formatClock(elapsedSec)}`}
          </span>
          <button
            onClick={() => handleEndCall(false)}
            style={{ background: 'var(--danger)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
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

      <div style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow)', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, background: 'var(--accent-gradient)', margin: '0 auto 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <VideoIcon width={28} height={28} color="#fff" />
        </div>

        {ended && (
          <div style={{ background: 'var(--info-soft)', color: 'var(--info)', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
            মিটিং শেষ হয়েছে। আবার প্রয়োজন হলে নিচে থেকে আবার যোগ দিন।
          </div>
        )}
        {loadError && (
          <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
            {loadError}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
          <UsersIcon width={14} height={14} color="var(--text-muted)" />
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
            আজকের সবার জন্য একটাই রুম — এই ট্যাবে যে কেউ ঢুকলেই একসাথে দেখা হয়ে যাবে
          </span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
          প্রতি মিটিং সর্বোচ্চ {HARD_LIMIT_MIN} মিনিট পর স্বয়ংক্রিয়ভাবে শেষ হয়ে যাবে — দরকার হলে আবার যোগ দিতে পারবেন
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={useCustomRoom} onChange={(e) => setUseCustomRoom(e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer' }} />
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 600 }}>আলাদা ব্রেকআউট রুম চাই</span>
        </label>

        {useCustomRoom && (
          <input
            value={customRoom}
            onChange={(e) => setCustomRoom(e.target.value)}
            placeholder="রুমের নাম লিখুন (যেমন: টিম-এ)"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)',
              background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', marginBottom: 14,
            }}
          />
        )}

        <button
          onClick={joinCall}
          disabled={loading || (useCustomRoom && !customRoom.trim())}
          style={{
            width: '100%', padding: 13, borderRadius: 12, border: 'none', background: 'var(--accent-gradient)',
            color: '#fff', fontWeight: 700, fontSize: 14.5, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? <LoaderIcon width={18} height={18} /> : <><VideoIcon width={18} height={18} /> মিটিংয়ে যোগ দিন</>}
        </button>
      </div>
    </div>
  );
}
