// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import AuthScreen from './components/AuthScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import Avatar from './components/Avatar';
import ProfileModal from './components/ProfileModal';
import Marquee from './components/Marquee';
import DateTimeBar from './components/DateTimeBar';
import FeedTab from './pages/FeedTab';
import MembersTab from './pages/MembersTab';
import StatsTab from './pages/StatsTab';
import LeaderboardTab from './pages/LeaderboardTab';
import JobBoardTab from './pages/JobBoardTab';
import AdminPanel from './pages/AdminPanel';
import NotesTab from './pages/NotesTab';
import WebsitesTab from './pages/WebsitesTab';
import NewsTab from './pages/NewsTab';
import ImportantUpdatesTab from './pages/ImportantUpdatesTab';
import DocumentsTab from './pages/DocumentsTab';
import SettingsTab from './pages/SettingsTab';
import MeetingTab from './pages/MeetingTab';
import KeywordsTab from './pages/KeywordsTab';
import PRLCalculatorTab from './pages/PRLCalculatorTab';
import { ThemeProvider } from './lib/ThemeContext';
import { getAllProfiles, getPostsWithDetails, subscribeToPosts, subscribeToProfiles, getBadges, getMemberBadges, getPollsWithDetails, getJobPostings } from './lib/dataService';
import { HomeIcon, UsersIcon, ChartIcon, WifiOffIcon, LoaderIcon, NoteIcon, BellIcon, FolderIcon, GlobeIcon, VideoIcon, TrophyIcon, BriefcaseIcon, SearchIcon, NewsIcon, TagIcon, GraduationIcon, CalendarIcon } from './components/Icons';
import GlobalSearchModal from './components/GlobalSearchModal';

// SettingsIcon inline যোগ করা হলো
const SettingsIcon = (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;

// টুলস গ্রুপের জন্য ইনলাইন WrenchIcon
const WrenchIcon = (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;

function AppShell() {
  const { profile, user, signOut, isAdmin, isApproved, loading: authLoading, passwordRecovery } = useAuth();
  const [tab, setTab] = useState('feed');
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [badges, setBadges] = useState([]);
  const [memberBadges, setMemberBadges] = useState([]);
  const [polls, setPolls] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [profileEditIntent, setProfileEditIntent] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const loadData = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'development') console.log('🔄 loadData called');
      const [profilesData, postsData, badgesData, memberBadgesData, pollsData, jobsData] = await Promise.all([
        getAllProfiles(), getPostsWithDetails(), getBadges(), getMemberBadges(), getPollsWithDetails(), getJobPostings(),
      ]);
      if (process.env.NODE_ENV === 'development') console.log('✅ loadData fetched:', postsData.length, 'posts,', profilesData.length, 'profiles');
      setMembers(profilesData);
      setPosts(postsData);
      setBadges(badgesData);
      setMemberBadges(memberBadgesData);
      setPolls(pollsData);
      setJobs(jobsData);
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

  // ইমেইলের রিসেট লিংক থেকে এলে সরাসরি অ্যাপে না ঢুকিয়ে আগে এই স্ক্রিন
  // দেখানো হয় — অন্য সব চেকের (loading/login) আগে, কারণ recovery লিংকে
  // ক্লিক করলে Supabase একটা সাময়িক সেশনও তৈরি করে দেয়
  if (passwordRecovery) {
    return <ResetPasswordScreen />;
  }

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
            style={{ padding: '11px 24px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#ffffff', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
          >
            লগআউট করুন
          </button>
        </div>
      </div>
    );
  }

  const NAV_GROUPS = [
    { key: 'feed', label: 'ফিড', icon: HomeIcon },
    {
      key: 'knowledge', label: 'নলেজ হাব', icon: GraduationIcon,
      children: [
        { key: 'keywords', label: 'কীওয়ার্ড', icon: TagIcon },
        { key: 'news', label: 'নিউজ', icon: NewsIcon },
        { key: 'websites', label: 'ওয়েবসাইট', icon: GlobeIcon },
        { key: 'documents', label: 'ডকুমেন্ট', icon: FolderIcon },
        { key: 'notes', label: 'নোট', icon: NoteIcon },
      ],
    },
    {
      key: 'community', label: 'কমিউনিটি', icon: UsersIcon,
      children: [
        { key: 'members', label: 'সদস্য', icon: UsersIcon },
        { key: 'leaderboard', label: 'স্বীকৃতি', icon: TrophyIcon },
        { key: 'jobs', label: 'সুযোগ', icon: BriefcaseIcon },
      ],
    },
    {
      key: 'tools', label: 'টুলস', icon: WrenchIcon,
      children: [
        { key: 'meeting', label: 'মিটিং', icon: VideoIcon },
        { key: 'stats', label: 'পরিসংখ্যান', icon: ChartIcon },
        { key: 'prl', label: 'PRL ক্যালকুলেটর', icon: CalendarIcon },
      ],
    },
    { key: 'updates', label: 'আপডেট', icon: BellIcon },
    { key: 'settings', label: 'সেটিংস', icon: SettingsIcon },
  ];

  // বর্তমান leaf ট্যাব (tab) থেকে কোন গ্রুপে আছি সেটা বের করা — আলাদা state না রেখে
  // derive করলে GlobalSearchModal সরাসরি leaf tab-এ নেভিগেট করলেও গ্রুপ হাইলাইট ঠিক থাকে
  const activeGroup = NAV_GROUPS.find((g) => (g.children ? g.children.some((c) => c.key === tab) : g.key === tab)) || NAV_GROUPS[0];

  function handleGroupClick(group) {
    if (!group.children) {
      setTab(group.key);
    } else if (!group.children.some((c) => c.key === tab)) {
      setTab(group.children[0].key);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'inherit', transition: 'background 0.2s ease' }}>
      <style>{`
        @keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
        @keyframes slideUp { from { opacity:0; transform: translateY(20px);} to {opacity:1; transform:translateY(0);} }
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
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
            <div style={{ fontWeight: 800, fontSize: 15.5, color: 'var(--text-primary)', lineHeight: 1.1 }}>Petro Knowledge Hub</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{members.length} জন সদস্য</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowSearch(true)}
            title="সার্চ করুন"
            style={{ background: 'var(--bg-surface-alt)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}
          >
            <SearchIcon width={17} height={17} />
          </button>
          <Avatar name={profile.name} src={profile.avatar_url} size={36} onClick={() => setViewingProfile(profile)} />
        </div>
      </header>

      <DateTimeBar />
      <Marquee />

      {activeGroup.children && (
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none',
          padding: '10px 14px', background: 'var(--bg-surface-alt)',
          borderBottom: '1px solid var(--border)',
        }}>
          {activeGroup.children.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                background: tab === key ? 'var(--accent)' : 'var(--bg-surface)',
                border: `1px solid ${tab === key ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 20, padding: '7px 14px', cursor: 'pointer',
                color: tab === key ? '#ffffff' : 'var(--text-secondary)',
                fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
              }}
            >
              <Icon width={14} height={14} />
              {label}
            </button>
          ))}
        </div>
      )}

      <main>
        {dataLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <LoaderIcon width={28} height={28} color="var(--accent)" />
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 10 }}>ডেটা লোড হচ্ছে...</div>
          </div>
        ) : tab === 'feed' ? (
          <FeedTab posts={posts} polls={polls} currentUser={profile} onUpdate={loadData} onOpenProfile={(p) => p && setViewingProfile(members.find((m) => m.id === p.id) || p)} isAdmin={isAdmin} members={members} />
        ) : tab === 'news' ? (
          <NewsTab />
        ) : tab === 'members' ? (
          <MembersTab members={members} onOpenProfile={setViewingProfile} />
        ) : tab === 'leaderboard' ? (
          <LeaderboardTab
            members={members}
            posts={posts}
            badges={badges}
            memberBadges={memberBadges}
            currentUser={profile}
            isAdmin={isAdmin}
            onOpenProfile={(p) => p && setViewingProfile(members.find((m) => m.id === p.id) || p)}
            onUpdate={loadData}
          />
        ) : tab === 'jobs' ? (
          <JobBoardTab jobs={jobs} currentUser={profile} isAdmin={isAdmin} onOpenProfile={(p) => p && setViewingProfile(members.find((m) => m.id === p.id) || p)} onUpdate={loadData} />
        ) : tab === 'updates' ? (
          <ImportantUpdatesTab currentUser={profile} />
        ) : tab === 'notes' ? (
          <NotesTab currentUser={profile} />
        ) : tab === 'websites' ? (
          <WebsitesTab />
        ) : tab === 'documents' ? (
          <DocumentsTab currentUser={profile} />
        ) : tab === 'meeting' ? (
          <MeetingTab currentUser={profile} members={members} />
        ) : tab === 'prl' ? (
          <PRLCalculatorTab />
        ) : tab === 'keywords' ? (
          <KeywordsTab />
        ) : tab === 'settings' ? (
          <SettingsTab
            currentUser={profile}
            onEditProfile={() => { setProfileEditIntent(true); setViewingProfile(profile); }}
            onOpenSearch={() => setShowSearch(true)}
            onOpenAdminPanel={() => setShowAdminPanel(true)}
            isAdmin={isAdmin}
          />
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
        <div style={{ display: 'flex', minWidth: 'max-content', padding: '0 4px' }}>
          {NAV_GROUPS.map((group) => {
            const { key, label, icon: Icon } = group;
            const isActive = activeGroup.key === key;
            return (
              <button
                key={key}
                onClick={() => handleGroupClick(group)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  background: isActive ? 'var(--accent-soft)' : 'none',
                  border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 12,
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  minWidth: 60, flexShrink: 0,
                }}
              >
                <Icon width={20} height={20} />
                <span style={{ fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {viewingProfile && (
        <ProfileModal
          profile={members.find((m) => m.id === viewingProfile.id) || viewingProfile}
          isOwnProfile={viewingProfile.id === profile.id}
          initialEditing={profileEditIntent}
          memberBadges={memberBadges.filter((mb) => mb.user_id === viewingProfile.id)}
          onClose={() => { setViewingProfile(null); setProfileEditIntent(false); }}
          onUpdated={() => { loadData(); }}
        />
      )}

      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} currentUser={profile} posts={posts} members={members} />}

      {showSearch && (
        <GlobalSearchModal
          onClose={() => setShowSearch(false)}
          onNavigateTab={(tabKey) => setTab(tabKey)}
          onOpenProfile={(member) => setViewingProfile(member)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
