// api/news.js
// ============================================================
// নিউজ অ্যাগ্রিগেটর — বিভিন্ন RSS সোর্স থেকে খবর টেনে এনে
// একটা normalized JSON আকারে ফেরত দেয়। ব্রাউজার থেকে সরাসরি
// RSS ফিচ করলে CORS-এ আটকে যায়, তাই এই সার্ভারলেস ফাংশন
// ব্যাকএন্ডে ফিচ করে ক্লায়েন্টকে সহজ JSON দেয়।
// ============================================================

// ---- সোর্স তালিকা ------------------------------------------------
// category: 'bangladesh' | 'international' | 'business' | 'technology' | 'trending'
const SOURCES = [
  // বাংলাদেশি সংবাদপত্র
  { id: 'prothomalo', name: 'প্রথম আলো', url: 'https://www.prothomalo.com/feed/', category: 'bangladesh', lang: 'bn' },
  { id: 'dailystar', name: 'The Daily Star', url: 'https://www.thedailystar.net/frontpage/rss.xml', category: 'bangladesh', lang: 'en' },
  { id: 'kalerkantho', name: 'কালের কণ্ঠ', url: 'https://www.kalerkantho.com/rss.xml', category: 'bangladesh', lang: 'bn' },
  { id: 'jugantor', name: 'যুগান্তর', url: 'https://www.jugantor.com/feed/rss.xml', category: 'bangladesh', lang: 'bn' },
  { id: 'bdnews24', name: 'bdnews24', url: 'https://bdnews24.com/?widgetName=rssfeed&widgetId=1150&getXmlFeed=true', category: 'bangladesh', lang: 'bn' },
  { id: 'banglanews24', name: 'বাংলা নিউজ ২৪', url: 'https://www.banglanews24.com/rss/rss.xml', category: 'bangladesh', lang: 'bn' },
  { id: 'bbcbangla', name: 'বিবিসি বাংলা', url: 'https://feeds.bbci.co.uk/bengali/rss.xml', category: 'bangladesh', lang: 'bn' },

  // আন্তর্জাতিক
  { id: 'bbcworld', name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'international', lang: 'en' },
  { id: 'bbctop', name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'international', lang: 'en' },
  { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'international', lang: 'en' },
  { id: 'reuters', name: 'Reuters', url: 'https://news.google.com/rss/search?q=when:24h+allinurl:reuters.com&hl=en-US&gl=US&ceid=US:en', category: 'international', lang: 'en' },
  { id: 'guardian', name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'international', lang: 'en' },

  // ব্যবসা ও প্রযুক্তি
  { id: 'bbcbusiness', name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'business', lang: 'en' },
  { id: 'bbctech', name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', category: 'technology', lang: 'en' },

  // গুগল ট্রেন্ডিং / টপ নিউজ
  { id: 'google_bd', name: 'Google News (BD)', url: 'https://news.google.com/rss?hl=bn-BD&gl=BD&ceid=BD:bn', category: 'trending', lang: 'bn' },
  { id: 'google_world', name: 'Google News (World)', url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', category: 'trending', lang: 'en' },
];

const PER_SOURCE_LIMIT = 12;
const TOTAL_LIMIT = 200;
const FETCH_TIMEOUT_MS = 4500; // retry যোগ হয়েছে বলে কমানো হলো (২ attempt মিলিয়ে Vercel-এর ১০সে সীমার মধ্যে থাকতে)

// ---- ছোট্ট RSS/Atom পার্সার (কোনো এক্সট্রা প্যাকেজ ছাড়াই) ------

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(str) {
  if (!str) return '';
  return decodeEntities(String(str).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function matchTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(re);
  return m ? m[1].trim() : '';
}

function extractLink(block) {
  // RSS: <link>https://...</link>  |  Atom: <link href="https://..." />
  const plain = block.match(/<link>([\s\S]*?)<\/link>/i);
  if (plain && plain[1] && plain[1].trim()) return decodeEntities(plain[1].trim());
  const hrefAlt = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i);
  if (hrefAlt) return decodeEntities(hrefAlt[1]);
  const href = block.match(/<link[^>]*href=["']([^"']+)["']/i);
  if (href) return decodeEntities(href[1]);
  const guid = block.match(/<guid[^>]*isPermaLink=["']true["'][^>]*>([\s\S]*?)<\/guid>/i);
  if (guid) return decodeEntities(guid[1].trim());
  return '';
}

function extractImage(block) {
  const enclosure = block.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image[^"']*["']/i)
    || block.match(/<enclosure[^>]*type=["']image[^"']*["'][^>]*url=["']([^"']+)["']/i)
    || block.match(/<enclosure[^>]*url=["']([^"']+)["']/i);
  if (enclosure) return enclosure[1];
  const mediaContent = block.match(/<media:content[^>]*url=["']([^"']+)["']/i);
  if (mediaContent) return mediaContent[1];
  const mediaThumb = block.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i);
  if (mediaThumb) return mediaThumb[1];
  const imgInHtml = block.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (imgInHtml) return imgInHtml[1];
  return null;
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str.trim());
  return isNaN(d.getTime()) ? null : d;
}

function parseFeed(xml, source) {
  if (!xml) return [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];

  const items = blocks.slice(0, PER_SOURCE_LIMIT).map((block) => {
    const rawTitle = matchTag(block, 'title');
    const description = matchTag(block, 'description') || matchTag(block, 'summary') || matchTag(block, 'content:encoded') || matchTag(block, 'content');
    const pubDateStr = matchTag(block, 'pubDate') || matchTag(block, 'published') || matchTag(block, 'updated') || matchTag(block, 'dc:date');
    const date = parseDate(pubDateStr);

    return {
      title: stripTags(rawTitle),
      link: extractLink(block),
      description: stripTags(description).slice(0, 220),
      image: extractImage(block),
      pubDate: date ? date.toISOString() : null,
      source: source.name,
      sourceId: source.id,
      category: source.category,
      lang: source.lang,
    };
  }).filter((it) => it.title && it.link);

  return items;
}

async function fetchFeed(source, attempt = 1) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7',
        Referer: 'https://www.google.com/',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = parseFeed(xml, source);
    if (items.length === 0 && attempt < 2) {
      // খালি রেজাল্ট এলে একবার রিট্রাই করি (সাময়িক bot-protection হতে পারে)
      return fetchFeed(source, attempt + 1);
    }
    return { source, items, ok: true };
  } catch (err) {
    if (attempt < 2) return fetchFeed(source, attempt + 1);
    return { source, items: [], ok: false, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

// সহজ in-memory ক্যাশ (একই সার্ভারলেস ইনস্ট্যান্সে পরবর্তী কলগুলোর জন্য) —
// serverless instance রিসাইকেল হলে এমনিই রিসেট হয়ে যায়, ক্ষতি নেই।
let cache = { data: null, timestamp: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000; // ৫ মিনিট

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');

  const now = Date.now();
  if (cache.data && now - cache.timestamp < CACHE_TTL_MS) {
    res.status(200).json(cache.data);
    return;
  }

  try {
    const results = await Promise.all(SOURCES.map(fetchFeed));

    const allItems = results.flatMap((r) => r.items);
    allItems.sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    });

    // একই লিংক দুইবার থাকলে বাদ
    const seen = new Set();
    const deduped = [];
    for (const item of allItems) {
      if (seen.has(item.link)) continue;
      seen.add(item.link);
      deduped.push(item);
      if (deduped.length >= TOTAL_LIMIT) break;
    }

    const failedSources = results.filter((r) => !r.ok).map((r) => ({ id: r.source.id, name: r.source.name, error: r.error }));

    const payload = {
      updatedAt: new Date().toISOString(),
      count: deduped.length,
      items: deduped,
      sources: SOURCES.map((s) => ({ id: s.id, name: s.name, category: s.category, lang: s.lang })),
      failedSources,
    };

    cache = { data: payload, timestamp: now };
    res.status(200).json(payload);
  } catch (err) {
    console.error('❌ news aggregation failed:', err.message);
    if (cache.data) {
      res.status(200).json(cache.data);
    } else {
      res.status(500).json({ error: 'নিউজ লোড করা যায়নি', message: err.message });
    }
  }
}
