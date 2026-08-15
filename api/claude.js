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

    const modelName = 'gemini-2.5-flash'; // gemini-2.0-flash বন্ধ হয়ে গেছে (retired), তাই আপডেট করা হলো
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // ফাংশনের 60s লিমিটের আগেই safely বেরিয়ে যাওয়া
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({ error: 'Gemini অনেক সময় নিচ্ছে (৫৫ সেকেন্ডের বেশি)। ফাইলটি ছোট করে বা পরে আবার চেষ্টা করুন।' });
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || JSON.stringify(data);
      console.error('Gemini error:', errMsg);
      return res.status(response.status).json({ error: errMsg });
    }

    // safety block চেক
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
