// src/lib/rateLimit.js
// ============================================================
// সাধারণ Rate Limiter (in-memory, per-instance)
// ============================================================
// এই ফাইলটা src/lib এ রাখা হয়েছে (api/ ফোল্ডারে না) যাতে CRA-এর
// টেস্ট রানার (npm test) এটা খুঁজে পায় ও টেস্ট চালাতে পারে — CRA
// ডিফল্টভাবে শুধু src/ ফোল্ডার স্ক্যান করে। api/_admin.js এখান
// থেকে ফাংশনটা import করে ব্যবহার করে, তাই লজিক একই জায়গায় থাকছে,
// duplicate হচ্ছে না।
//
// সীমাবদ্ধতা: Vercel serverless function প্রতিটা রিকোয়েস্টে নতুন
// instance-এ চলতে পারে (cold start) — তাই এই in-memory কাউন্টার
// পুরোপুরি নির্ভরযোগ্য না; কেউ চাইলে বারবার cold-start করিয়ে এটা
// bypass করতে পারবে। তবুও এটা basic abuse (compromised token দিয়ে
// rapid-fire script) থেকে কিছুটা সুরক্ষা দেয়। প্রোডাকশনে সত্যিকারের
// নিশ্চয়তার জন্য Upstash Redis / Vercel KV দিয়ে distributed
// rate-limit বসানো উচিত।
const rateLimitBuckets = new Map();

export function checkRateLimit(key, { maxRequests = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key) || [];
  const recent = bucket.filter((ts) => now - ts < windowMs);

  if (recent.length >= maxRequests) {
    return { allowed: false, retryAfterMs: windowMs - (now - recent[0]) };
  }

  recent.push(now);
  rateLimitBuckets.set(key, recent);
  return { allowed: true };
}

// টেস্টের মধ্যে একটা test case অন্যটাকে প্রভাবিত না করার জন্য এটা
// ব্যবহার করা যায় (production কোডে এটা কল করার দরকার নেই)।
export function _resetRateLimitBuckets() {
  rateLimitBuckets.clear();
}
