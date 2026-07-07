// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import AuthScreen from './components/AuthScreen';
import Avatar from './components/Avatar';
import ProfileModal from './components/ProfileModal';
import Marquee from './components/Marquee';
import FeedTab from './pages/FeedTab';
import MembersTab from './pages/MembersTab';
import StatsTab from './pages/StatsTab';
import AdminPanel from './pages/AdminPanel';
import NotesTab from './pages/NotesTab';
import WebsitesTab from './pages/WebsitesTab';
import ImportantUpdatesTab from './pages/ImportantUpdatesTab';
import DocumentsTab from './pages/DocumentsTab';
import SettingsTab from './pages/SettingsTab';
import { getAllProfiles, getPostsWithDetails, subscribeToPosts, subscribeToProfiles } from './lib/dataService';
import { HomeIcon, UsersIcon, ChartIcon, LogOutIcon, ShieldIcon, WifiOffIcon, LoaderIcon, NoteIcon, BellIcon, FolderIcon, GlobeIcon } from './components/Icons';

// SettingsIcon inline যোগ করা হলো
const SettingsIcon = (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;

function AppShell() {
  const { profile, user, signOut, isAdmin, isApproved, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('feed');
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [profileEditIntent, setProfileEditIntent] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const loadData = useCallback(async () => {
    try {
      console.log('🔄 loadData called');
      const [profilesData, postsData] = await Promise.all([getAllProfiles(), getPostsWithDetails()]);
      console.log('✅ loadData fetched:', postsData.length, 'posts,', profilesData.length, 'profiles');
      setMembers(profilesData);
      setPosts(postsData);
    } catch (err) {
      console.error('❌ loadData failed:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubPosts = subscribeToPosts(() => loadData());
    const unsubProfiles = subscribeToProfiles(() => loadData());

    // Safety-net: realtime মাঝে মাঝে miss করতে পারে (tab background এ থাকলে,
    // বা connection blip হলে) — তাই প্রতি ০.৫ সেকেন্ডে একবার lightweight refresh
    const fallbackInterval = setInterval(() => {
      if (document.visibilityState === 'visible') loadData();
    }, 500);

    // Tab আবার visible হলে সাথে সাথে একবার refresh করা (background থেকে ফেরার পর)
    function handleVisibility() {
      if (document.visibilityState === 'visible') loadData();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubPosts();
      unsubProfiles();
      clearInterval(fallbackInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  useEffect(() => {
    function goOnline() { setIsOnline(true); }
    function goOffline() { setIsOnline(false); }
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <LoaderIcon width={32} height={32} color="var(--accent)" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <LoaderIcon width={28} height={28} color="var(--accent)" />
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>প্রোফাইল লোড হচ্ছে...</div>
      </div>
    );
  }

  // Approval pending screen
  if (!isApproved) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0ea5e9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 24, padding: '40px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
          <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: '#0f172a' }}>অনুমোদনের অপেক্ষায়</h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: '0 0 24px' }}>
            আপনার account তৈরি হয়েছে। Admin অনুমোদন দেওয়ার পর আপনি Petro Knowledge Hub এ প্রবেশ করতে পারবেন।
          </p>
          <div style={{ background: '#f0f9ff', borderRadius: 14, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#0284c7' }}>
            📧 {user?.email}
          </div>
          <button
            onClick={signOut}
            style={{ padding: '11px 24px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
          >
            লগআউট করুন
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'feed', label: 'ফিড', icon: HomeIcon },
    { key: 'members', label: 'সদস্য', icon: UsersIcon },
    { key: 'updates', label: 'আপডেট', icon: BellIcon },
    { key: 'notes', label: 'নোট', icon: NoteIcon },
    { key: 'websites', label: 'ওয়েবসাইট', icon: GlobeIcon },
    { key: 'documents', label: 'ডকুমেন্ট', icon: FolderIcon },
    { key: 'stats', label: 'পরিসংখ্যান', icon: ChartIcon },
    { key: 'settings', label: 'সেটিংস', icon: SettingsIcon },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'inherit', transition: 'background 0.2s ease' }}>
      <style>{`
        @keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
        @keyframes slideUp { from { opacity:0; transform: translateY(20px);} to {opacity:1; transform:translateY(0);} }
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }

        .bottom-nav-inner {
          display: flex;
          min-width: max-content;
          padding: 0 4px;
          margin: 0 auto;
        }
        .bottom-nav-btn { min-width: 56px; flex-shrink: 0; }

        @media (min-width: 640px) {
          .bottom-nav-inner {
            width: 100%;
            max-width: 900px;
            min-width: 0;
            justify-content: space-evenly;
          }
          .bottom-nav-btn { flex: 1 1 0; min-width: 0; padding-left: 6px; padding-right: 6px; }
        }
      `}</style>

      {!isOnline && (
        <div style={{ background: 'var(--warning-soft)', color: 'var(--warning)', padding: '8px 16px', textAlign: 'center', fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <WifiOffIcon width={14} height={14} /> অফলাইনে আছেন — নতুন তথ্য পেতে ইন্টারনেট সংযোগ দিন
        </div>
      )}

      <header style={{
        position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-header)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎓</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text-primary)', lineHeight: 1.1 }}>Petro Knowledge Hub</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{members.length} জন সদস্য</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isAdmin && (
            <button
              onClick={() => setShowAdminPanel(true)}
              title="Admin Panel"
              style={{ background: 'var(--admin-soft)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', display: 'flex' }}
            >
              <ShieldIcon width={17} height={17} color="var(--admin-color)" />
            </button>
          )}
          <Avatar name={profile.name} src={profile.avatar_url} size={36} onClick={() => setViewingProfile(profile)} />
          <button
            onClick={signOut}
            title="লগআউট"
            style={{ background: 'var(--bg-surface-alt)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}
          >
            <LogOutIcon width={16} height={16} />
          </button>
        </div>
      </header>

      <Marquee />

      <main>
        {dataLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <LoaderIcon width={28} height={28} color="var(--accent)" />
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 10 }}>ডেটা লোড হচ্ছে...</div>
          </div>
        ) : tab === 'feed' ? (
          <FeedTab posts={posts} currentUser={profile} onUpdate={loadData} onOpenProfile={(p) => p && setViewingProfile(members.find((m) => m.id === p.id) || p)} />
        ) : tab === 'members' ? (
          <MembersTab members={members} onOpenProfile={setViewingProfile} />
        ) : tab === 'updates' ? (
          <ImportantUpdatesTab currentUser={profile} />
        ) : tab === 'notes' ? (
          <NotesTab currentUser={profile} />
        ) : tab === 'websites' ? (
          <WebsitesTab />
        ) : tab === 'documents' ? (
          <DocumentsTab currentUser={profile} />
        ) : tab === 'settings' ? (
          <SettingsTab currentUser={profile} onEditProfile={() => { setProfileEditIntent(true); setViewingProfile(profile); }} />
        ) : (
          <StatsTab members={members} posts={posts} />
        )}
      </main>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-header)',
        backdropFilter: 'blur(12px)', borderTop: '1px solid var(--border)',
        padding: '6px 4px calc(6px + env(safe-area-inset-bottom))', zIndex: 50,
        overflowX: 'auto', overflowY: 'hidden',
      }}>
        <div className="bottom-nav-inner">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className="bottom-nav-btn"
              onClick={() => setTab(key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                background: tab === key ? 'var(--accent-soft)' : 'none',
                border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 12,
                color: tab === key ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <Icon width={20} height={20} />
              <span style={{ fontSize: 9.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {viewingProfile && (
        <ProfileModal
          profile={members.find((m) => m.id === viewingProfile.id) || viewingProfile}
          isOwnProfile={viewingProfile.id === profile.id}
          initialEditing={profileEditIntent}
          onClose={() => { setViewingProfile(null); setProfileEditIntent(false); }}
          onUpdated={() => { loadData(); }}
        />
      )}

      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
