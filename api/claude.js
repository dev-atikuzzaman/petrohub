// api/claude.js — Vercel Serverless Function (Gemini API proxy)
// ব্রাউজার → এই proxy → Google Gemini API
// GEMINI_API_KEY → Vercel Environment Variables-এ সেট করুন

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY কনফিগার করা নেই' });

  try {
    const { system, messages, max_tokens } = req.body;

    // Gemini-র জন্য parts তৈরি করো
    const parts = [];

    // System prompt যোগ
    if (system) {
      parts.push({ text: system + '\n\n' });
    }

    // Messages থেকে content বের করো
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        parts.push({ text: msg.content });
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === 'text') {
            parts.push({ text: block.text });
          } else if (block.type === 'image' && block.source?.type === 'base64') {
            parts.push({
              inline_data: {
                mime_type: block.source.media_type,
                data: block.source.data,
              }
            });
          } else if (block.type === 'document' && block.source?.type === 'base64') {
            // PDF → Gemini inline_data
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

    const geminiBody = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: max_tokens || 4000,
        temperature: 0.3,
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API error' });
    }

    // Gemini response → Claude-এর মতো ফরম্যাটে রূপান্তর করো
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
