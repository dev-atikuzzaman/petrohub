// api/claude.js — Vercel Serverless Function (Gemini API proxy)
// GEMINI_API_KEY → Vercel Environment Variables-এ সেট করুন

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY Vercel Environment Variables-এ সেট করা নেই' });
  }

  try {
    const { system, messages, max_tokens } = req.body;

    const parts = [];

    // System prompt
    if (system) {
      parts.push({ text: system + '\n\n' });
    }

    // Messages → Gemini parts
    for (const msg of (messages || [])) {
      if (typeof msg.content === 'string') {
        parts.push({ text: msg.content });
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === 'text') {
            parts.push({ text: block.text });
          } else if (block.type === 'image' && block.source?.type === 'base64') {
            parts.push({
              inline_data: {
                mime_type: block.source.media_type || 'image/jpeg',
                data: block.source.data,
              }
            });
          } else if (block.type === 'document' && block.source?.type === 'base64') {
            parts.push({
              inline_data: {
                mime_type: 'application/pdf',
                data: block.source.data,
              }
            });
          }
        }
      }
    }

    if (parts.length === 0) {
      return res.status(400).json({ error: 'কোনো content পাওয়া যায়নি' });
    }

    const geminiBody = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: max_tokens || 4000,
        temperature: 0.3,
      },
    };

    // মডেল অগ্রাধিকার: lite মডেল হালকা, তাই ফ্রি-টিয়ারে কম busy/rate-limit হয় —
    // সেটা দিয়ে আগে চেষ্টা, ব্যর্থ হলে regular flash দিয়ে fallback
    const MODEL_CHAIN = ['gemini-flash-lite-latest', 'gemini-flash-latest'];
    const MAX_RETRIES_PER_MODEL = 2; // busy (503) হলে প্রতি মডেলে সর্বোচ্চ ২ বার
    const DEADLINE_MS = Date.now() + 50000; // ফাংশনের 60s লিমিটের ভেতরেই safely শেষ করা

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    async function callGemini(modelName) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const remaining = DEADLINE_MS - Date.now();
      const timeoutId = setTimeout(() => controller.abort(), Math.max(remaining, 5000));
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody),
          signal: controller.signal,
        });
        const data = await response.json();
        return { ok: response.ok, status: response.status, data };
      } finally {
        clearTimeout(timeoutId);
      }
    }

    function isBusyError(status, data) {
      if (status === 503) return true;
      const msg = (data?.error?.message || '').toLowerCase();
      return msg.includes('overloaded') || msg.includes('high demand') || msg.includes('unavailable');
    }

    let result = null;
    let lastError = null;

    outer:
    for (const modelName of MODEL_CHAIN) {
      for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
        if (Date.now() >= DEADLINE_MS) break outer;

        let attemptResult;
        try {
          attemptResult = await callGemini(modelName);
        } catch (fetchErr) {
          if (fetchErr.name === 'AbortError') {
            return res.status(504).json({ error: 'Gemini অনেক সময় নিচ্ছে। ফাইলটি ছোট করে বা পরে আবার চেষ্টা করুন।' });
          }
          lastError = fetchErr.message;
          continue;
        }

        if (attemptResult.ok) {
          result = attemptResult.data;
          break outer;
        }

        lastError = attemptResult.data?.error?.message || `Gemini API error ${attemptResult.status}`;

        if (isBusyError(attemptResult.status, attemptResult.data) && Date.now() < DEADLINE_MS) {
          await sleep(1200 * attempt); // ১.২s, ২.৪s — সাময়িক busy অবস্থা কাটার সময় দেওয়া
          continue;
        }

        // busy না হলে (যেমন invalid key, safety block ইত্যাদি) সাথে সাথে fallback মডেলে চলে যাওয়া
        break;
      }
    }

    if (!result) {
      console.error('Gemini error (all attempts failed):', lastError);
      return res.status(503).json({ error: lastError || 'Gemini সার্ভার এই মুহূর্তে ব্যস্ত। কিছুক্ষণ পর আবার চেষ্টা করুন।' });
    }

    const data = result;
    const candidate = data.candidates?.[0];
    if (!candidate) {
      return res.status(500).json({ error: 'Gemini কোনো response দেয়নি। ফাইলটি পরিবর্তন করে আবার চেষ্টা করুন।' });
    }

    if (candidate.finishReason === 'SAFETY') {
      return res.status(400).json({ error: 'Gemini safety filter-এ ব্লক হয়েছে। অন্য ফাইল দিয়ে চেষ্টা করুন।' });
    }

    const text = candidate.content?.parts?.[0]?.text || '';
    if (!text) {
      return res.status(500).json({ error: 'Gemini খালি response দিয়েছে।' });
    }

    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
