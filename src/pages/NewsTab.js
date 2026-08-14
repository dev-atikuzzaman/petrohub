// src/pages/NewsTab.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { LoaderIcon, SearchIcon, RefreshIcon, ExternalLinkIcon, TrendingUpIcon, GlobeIcon, NewsIcon } from '../components/Icons';

const CATEGORIES = [
  { key: 'all', label: 'সব' },
  { key: 'bangladesh', label: 'বাংলাদেশ' },
  { key: 'international', label: 'আন্তর্জাতিক' },
  { key: 'business', label: 'ব্যবসা' },
  { key: 'technology', label: 'প্রযুক্তি' },
  { key: 'trending', label: 'ট্রেন্ডিং' },
];

const CATEGORY_COLOR = {
  bangladesh: '#166534',
  international: '#1e3a5f',
  business: '#7c2d12',
  technology: '#5b21b6',
  trending: '#b45309',
};

function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'এইমাত্র';
  if (min < 60) return `${min} মিনিট আগে`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ঘণ্টা আগে`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} দিন আগে`;
  return new Date(iso).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
}

export default function NewsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async (isManualRefresh) => {
    if (isManualRefresh) setRefreshing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch('/api/news', { signal: controller.signal });
      if (!res.ok) throw new Error(`সার্ভার থেকে ${res.status} পাওয়া গেছে`);
      const data = await res.json();
      setItems(data.items || []);
      setUpdatedAt(data.updatedAt || null);
      setError(null);
    } catch (err) {
      console.error('❌ news load failed:', err);
      setError(err.name === 'AbortError' ? 'নিউজ লোড করতে অনেক সময় লাগছে। আবার চেষ্টা করুন।' : 'নিউজ লোড করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), 5 * 60 * 1000); // প্রতি ৫ মিনিটে অটো রিফ্রেশ
    return () => clearInterval(interval);
  }, [load]);

  const filtered = useMemo(() => {
    let list = items;
    if (activeCategory !== 'all') {
      list = list.filter((it) => it.category === activeCategory || (it.topics && it.topics.includes(activeCategory)));
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((it) => it.title.toLowerCase().includes(q) || (it.description || '').toLowerCase().includes(q) || it.source.toLowerCase().includes(q));
    }
    return list;
  }, [items, activeCategory, query]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 14px 90px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <NewsIcon width={19} height={19} /> নিউজ ফিড
          </h2>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            {updatedAt ? `সর্বশেষ আপডেট: ${timeAgo(updatedAt)}` : 'দেশি-বিদেশি সংবাদপত্র ও BBC, Al Jazeera, Google News'}
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          title="রিফ্রেশ করুন"
          style={{
            background: 'var(--bg-surface-alt)', border: 'none', borderRadius: 10, padding: 9, cursor: refreshing ? 'default' : 'pointer',
            display: 'flex', color: 'var(--text-secondary)', flexShrink: 0,
          }}
        >
          <RefreshIcon width={16} height={16} style={refreshing ? { animation: 'spin 0.9s linear infinite' } : undefined} />
        </button>
      </div>

      {/* সার্চ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface-alt)', borderRadius: 12,
        padding: '9px 12px', marginBottom: 14,
      }}>
        <SearchIcon width={15} height={15} color="var(--text-muted)" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="নিউজ খুঁজুন..."
          style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 13.5, color: 'var(--text-primary)' }}
        />
      </div>

      {/* ক্যাটাগরি ফিল্টার */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, overflowX: 'auto' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              background: activeCategory === cat.key ? 'var(--accent-gradient)' : 'var(--bg-surface-alt)',
              color: activeCategory === cat.key ? '#fff' : 'var(--text-secondary)', whiteSpace: 'nowrap',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <LoaderIcon width={26} height={26} color="var(--accent)" />
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 10 }}>খবর লোড হচ্ছে...</div>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 13, marginBottom: 12 }}>{error}</div>
          <button
            onClick={() => load(true)}
            style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
          কোনো খবর পাওয়া যায়নি।
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((item, idx) => {
            const color = CATEGORY_COLOR[item.category] || '#334155';
            return (
              <a
                key={`${item.link}-${idx}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', gap: 12, background: 'var(--bg-surface)', borderRadius: 16, padding: 12,
                  border: '1.5px solid var(--border-soft)', boxShadow: 'var(--shadow)', textDecoration: 'none',
                }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    style={{ width: 84, height: 84, borderRadius: 12, objectFit: 'cover', flexShrink: 0, background: 'var(--bg-surface-alt)' }}
                  />
                ) : (
                  <div style={{
                    width: 84, height: 84, borderRadius: 12, flexShrink: 0, background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                  }}>
                    {item.category === 'trending' ? <TrendingUpIcon width={26} height={26} /> : <GlobeIcon width={24} height={24} />}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#fff', background: color, borderRadius: 20, padding: '2px 9px',
                    }}>
                      {item.source}
                    </span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{timeAgo(item.pubDate)}</span>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {item.title}
                  </div>
                  {item.description && (
                    <div style={{
                      fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {item.description}
                    </div>
                  )}
                </div>
                <ExternalLinkIcon width={14} height={14} color="var(--text-muted)" style={{ flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }} />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
