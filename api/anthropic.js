// api/anthropic.js — Vercel Serverless Function (Anthropic/Claude API প্রক্সি)
// ANTHROPIC_API_KEY → Vercel Environment Variables-এ সেট করতে হবে
// (ব্রাউজার থেকে সরাসরি api.anthropic.com-এ কল করা যায় না — key গোপন রাখতে
//  এবং CORS এড়াতে এই সার্ভারলেস ফাংশন মাঝে থেকে প্রক্সি করে)

export const config = { api: { bodyParser: { sizeLimit: '25mb' } } };

const ANTHROPIC_TIMEOUT_MS = 55000; // ফাংশনের 60s maxDuration-এর আগেই safely বেরিয়ে যাওয়া

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY Vercel Environment Variables-এ সেট করা নেই' });
  }

  try {
    const { system, messages, max_tokens, model } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'কোনো messages পাওয়া যায়নি' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-sonnet-4-6',
          max_tokens: max_tokens || 4000,
          system,
          messages,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({ error: 'Claude অনেক সময় নিচ্ছে (৫৫ সেকেন্ডের বেশি)। ফাইলটি ছোট করে বা পরে আবার চেষ্টা করুন।' });
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    const rawBody = await response.text();
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch {
      console.error('Anthropic returned non-JSON body:', rawBody.slice(0, 500));
      return res.status(502).json({ error: `Claude সার্ভার থেকে অপ্রত্যাশিত জবাব (HTTP ${response.status})` });
    }

    if (!response.ok) {
      const errMsg = data.error?.message || `Claude API error ${response.status}`;
      console.error('Anthropic error:', errMsg);
      return res.status(response.status).json({ error: errMsg });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
