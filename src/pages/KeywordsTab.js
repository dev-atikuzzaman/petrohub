// src/pages/KeywordsTab.js
import React, { useState, useRef, useCallback } from 'react';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('ফাইল পড়া যায়নি'));
    reader.readAsDataURL(file);
  });
}

// বড় ছবি (ফোনের ক্যামেরা থেকে সাধারণত ৪-১২MB) resize করে base64 বানানো —
// Gemini-র প্রতি-ছবি সাইজ লিমিট ও Vercel-এর body সাইজ লিমিট মাথায় রেখে
function resizeImageToBase64(file, maxWidth = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      URL.revokeObjectURL(url);
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = () => reject(new Error('ছবি লোড ব্যর্থ'));
    img.src = url;
  });
}

function isImageType(mime) {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mime);
}

function isPdfType(mime) {
  return mime === 'application/pdf';
}

// ──────────────────────────────────────────────
//  Constants
// ──────────────────────────────────────────────

const SECTION_META = [
  { key: 'definition',   label: 'সংজ্ঞা',        emoji: '📖', color: '#3b82f6' }, // নীল
  { key: 'meaning',      label: 'অর্থ',           emoji: '💡', color: '#a855f7' }, // বেগুনি
  { key: 'example',      label: 'উদাহরণ',         emoji: '🔍', color: '#f97316' }, // কমলা
  { key: 'application',  label: 'প্রয়োগ',         emoji: '⚙️', color: '#06b6d4' }, // সায়ান
  { key: 'importance',   label: 'প্রয়োজনীয়তা',  emoji: '🎯', color: '#eab308' }, // হলুদ
  { key: 'benefits',     label: 'উপকারিতা',       emoji: '✅', color: '#22c55e' }, // সবুজ
  { key: 'drawbacks',    label: 'অপকারিতা',       emoji: '⚠️', color: '#ef4444' }, // লাল
  { key: 'limitations',  label: 'সীমাবদ্ধতা',     emoji: '🚧', color: '#f59e0b' }, // অ্যাম্বার
];

// ──────────────────────────────────────────────
//  System prompt for Gemini
// ──────────────────────────────────────────────

function buildSystemPrompt() {
  return `You are an expert knowledge analyst specializing in petroleum engineering, geoscience, and related technical fields. 

Your task:
1. Read the provided content carefully.
2. Identify ALL unique and important terms — both general and technical. Include acronyms, proper nouns, domain-specific vocabulary, and concepts.
3. For EACH term, respond with a structured JSON array.

Return ONLY a valid JSON array. No markdown, no code fences, no preamble. The array format:

[
  {
    "term": "Term name in original language",
    "type": "general | technical",
    "definition": "সংজ্ঞা — বাংলায় সহজ ব্যাখ্যা (2-3 বাক্য)",
    "meaning": "অর্থ — শব্দ বা পদটির গভীর অর্থ ও ব্যুৎপত্তি (বাংলায়)",
    "example": "উদাহরণ — বাস্তব জীবনের একটি উদাহরণ (বাংলায়)",
    "application": "প্রয়োগ — কোথায় ও কীভাবে ব্যবহার হয় (বাংলায়)",
    "importance": "প্রয়োজনীয়তা — কেন গুরুত্বপূর্ণ (বাংলায়)",
    "benefits": "উপকারিতা — সুবিধাগুলো (বাংলায়)",
    "drawbacks": "অপকারিতা — অসুবিধাগুলো যদি থাকে (বাংলায়, না থাকলে 'প্রযোজ্য নয়')",
    "limitations": "সীমাবদ্ধতা — সীমাবদ্ধতা বা চ্যালেঞ্জ (বাংলায়)"
  }
]

Rules:
- Minimum 5 terms, maximum 30 terms per document.
- Prioritize domain-specific / technical terms over very common words.
- All explanations must be in Bangla (Bengali).
- JSON must be valid and parseable.`;
}

// ──────────────────────────────────────────────
//  API call
// ──────────────────────────────────────────────

async function extractKeywordsFromGemini({ text, imageBase64, imageMime, pdfBase64 }) {
  const contentParts = [];

  if (imageBase64) {
    contentParts.push({
      type: 'image',
      source: { type: 'base64', media_type: imageMime, data: imageBase64 },
    });
    contentParts.push({ type: 'text', text: 'এই ইমেজ থেকে সব গুরুত্বপূর্ণ টার্ম আইডেন্টিফাই করুন।' });
  } else if (pdfBase64) {
    contentParts.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
    });
    contentParts.push({ type: 'text', text: 'এই PDF থেকে সব গুরুত্বপূর্ণ টার্ম আইডেন্টিফাই করুন।' });
  } else {
    contentParts.push({
      type: 'text',
      text: `নিচের কন্টেন্ট থেকে গুরুত্বপূর্ণ টার্মগুলো আইডেন্টিফাই করুন:\n\n${text}`,
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 65000);
  let res;
  try {
    res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        max_tokens: 8000,
        system: buildSystemPrompt(),
        messages: [{ role: 'user', content: contentParts }],
      }),
      signal: controller.signal,
    });
  } catch (fetchErr) {
    if (fetchErr.name === 'AbortError') {
      throw new Error('বিশ্লেষণ করতে অনেক সময় লাগছে (৬৫ সেকেন্ডের বেশি)। ছোট ফাইল দিয়ে বা আবার চেষ্টা করুন।');
    }
    throw new Error('নেটওয়ার্ক সমস্যা — ইন্টারনেট সংযোগ চেক করুন।');
  } finally {
    clearTimeout(timeoutId);
  }

  const rawBody = await res.text();

  if (!res.ok) {
    let msg = '';
    try {
      const err = JSON.parse(rawBody);
      msg = (typeof err.error === 'string' && err.error) || err.error?.message || '';
    } catch {
      // JSON না — Vercel/Gemini-এর নিজস্ব timeout বা এরর পেজ হতে পারে
    }
    throw new Error(msg || `API error ${res.status}`);
  }

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    throw new Error('সার্ভার থেকে অপ্রত্যাশিত জবাব পাওয়া গেছে। আবার চেষ্টা করুন।');
  }
  const raw = data.content?.map(b => b.text || '').join('');

  // Strip any accidental markdown fences
  const clean = raw.replace(/```json|```/gi, '').trim();
  return JSON.parse(clean);
}

// ──────────────────────────────────────────────
//  Sub-components
// ──────────────────────────────────────────────

function TermCard({ term, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '10px 14px',
        borderRadius: 12, border: '1.5px solid',
        borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
        background: isSelected ? 'var(--accent-soft)' : 'var(--bg-surface)',
        cursor: 'pointer', transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
        background: term.type === 'technical' ? '#dbeafe' : '#dcfce7',
        color: term.type === 'technical' ? '#1d4ed8' : '#16a34a',
        flexShrink: 0,
      }}>
        {term.type === 'technical' ? 'Tech' : 'Gen'}
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
        {term.term}
      </span>
      {isSelected && (
        <span style={{ fontSize: 16, flexShrink: 0 }}>›</span>
      )}
    </button>
  );
}

function TermDetail({ term }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
          {term.term}
        </h2>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: term.type === 'technical' ? '#dbeafe' : '#dcfce7',
          color: term.type === 'technical' ? '#1d4ed8' : '#16a34a',
        }}>
          {term.type === 'technical' ? '🔬 Technical' : '📝 General'}
        </span>
      </div>

      {SECTION_META.map(({ key, label, emoji, color }) => (
        <div key={key} style={{
          background: 'var(--bg-surface)', borderRadius: 14,
          border: `1.5px solid ${color}40`, overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px',
            background: `${color}1f`,
            borderBottom: `1px solid ${color}33`,
            fontSize: 12.5, fontWeight: 800, color,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: 8,
              background: `${color}2b`, border: `1px solid ${color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, flexShrink: 0,
            }}>
              {emoji}
            </span>
            {label}
          </div>
          <div style={{
            fontSize: 14, lineHeight: 1.75,
            color: 'var(--text-primary)',
            borderLeft: `3px solid ${color}`,
            margin: '10px 12px 12px',
            padding: '10px 12px',
            background: `${color}0d`,
            borderRadius: 10,
          }}>
            {term[key] || '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
//  Main component
// ──────────────────────────────────────────────

export default function KeywordsTab() {
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'file'
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'technical' | 'general'
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  const handleFile = useCallback((f) => {
    if (!f) return;
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv',
    ];
    if (!allowed.includes(f.type) && !f.name.match(/\.(txt|csv|md|log)$/i)) {
      setError('সাপোর্টেড ফরম্যাট: ছবি (JPG/PNG/GIF/WEBP), PDF, টেক্সট ফাইল');
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError('ফাইল ১৫MB-র চেয়ে ছোট হতে হবে।');
      return;
    }
    setFile(f);
    setError(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleAnalyze = useCallback(async () => {
    if (inputMode === 'text' && !text.trim()) {
      setError('টেক্সট লিখুন বা ফাইল আপলোড করুন।');
      return;
    }
    if (inputMode === 'file' && !file) {
      setError('একটি ফাইল সিলেক্ট করুন।');
      return;
    }

    setLoading(true);
    setError(null);
    setTerms([]);
    setSelectedTerm(null);

    try {
      let payload = {};

      if (inputMode === 'text') {
        payload.text = text.trim();
      } else if (file) {
        if (isImageType(file.type)) {
          payload.imageBase64 = await resizeImageToBase64(file);
          payload.imageMime = 'image/jpeg';
        } else if (isPdfType(file.type)) {
          payload.pdfBase64 = await fileToBase64(file);
        } else {
          // plain text / csv
          const raw = await file.text();
          payload.text = raw;
        }
      }

      const result = await extractKeywordsFromGemini(payload);
      setTerms(Array.isArray(result) ? result : []);
      if (result.length > 0) setSelectedTerm(result[0]);
    } catch (err) {
      setError(`বিশ্লেষণ ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [inputMode, text, file]);

  const filteredTerms = terms.filter(t => {
    const matchType = filter === 'all' || t.type === filter;
    const matchSearch = !search || t.term.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const techCount = terms.filter(t => t.type === 'technical').length;
  const genCount = terms.filter(t => t.type === 'general').length;

  return (
    <div style={{ padding: '16px 12px 120px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
          🔑 কীওয়ার্ড বিশ্লেষক
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          যেকোনো ডকুমেন্ট, ছবি বা টেক্সট আপলোড করুন — AI স্বয়ংক্রিয়ভাবে গুরুত্বপূর্ণ টার্ম বের করে বিস্তারিত জানাবে।
        </p>
      </div>

      {/* Input Mode Toggle */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 16,
        background: 'var(--bg-surface)', borderRadius: 14, padding: 4,
        border: '1px solid var(--border)',
      }}>
        {[
          { key: 'text', label: '✏️ টেক্সট লিখুন' },
          { key: 'file', label: '📎 ফাইল আপলোড' },
        ].map(m => (
          <button
            key={m.key}
            onClick={() => { setInputMode(m.key); setError(null); }}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
              fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
              background: inputMode === m.key ? 'var(--accent)' : 'transparent',
              color: inputMode === m.key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Text Input */}
      {inputMode === 'text' && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="এখানে টেক্সট পেস্ট করুন — বাংলা বা ইংরেজি, যেকোনো বিষয়ের..."
          rows={7}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, resize: 'vertical',
            border: '1.5px solid var(--border)', background: 'var(--bg-surface)',
            color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.7,
            fontFamily: 'inherit', boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      )}

      {/* File Upload */}
      {inputMode === 'file' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 16, padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
            background: dragOver ? 'var(--accent-soft)' : 'var(--bg-surface)',
            transition: 'all 0.2s',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.txt,.csv,.md,.log"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          {file ? (
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>
                {isImageType(file.type) ? '🖼️' : isPdfType(file.type) ? '📄' : '📝'}
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
                {file.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(1)} KB
              </div>
              <button
                onClick={e => { e.stopPropagation(); setFile(null); }}
                style={{
                  marginTop: 10, padding: '5px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-base)',
                  color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
                }}
              >
                পরিবর্তন করুন
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 40, marginBottom: 10 }}>☁️</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>
                ফাইল টেনে আনুন বা ক্লিক করুন
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                JPG · PNG · GIF · WEBP · PDF · TXT · CSV
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 12,
          background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c',
          fontSize: 13, fontWeight: 600,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          width: '100%', marginTop: 14, padding: '14px 0', borderRadius: 14,
          border: 'none', fontWeight: 900, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
          background: loading ? 'var(--bg-surface-alt)' : 'var(--accent)',
          color: loading ? 'var(--text-muted)' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s',
        }}
      >
        {loading ? (
          <>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 16 }}>⟳</span>
            বিশ্লেষণ চলছে...
          </>
        ) : '🔍 কীওয়ার্ড বের করুন'}
      </button>

      {/* Results */}
      {terms.length > 0 && (
        <div style={{ marginTop: 24 }}>

          {/* Stats bar */}
          <div style={{
            display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--text-primary)' }}>
              {terms.length} টি টার্ম পাওয়া গেছে
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: '#dbeafe', color: '#1d4ed8',
              }}>
                🔬 Technical: {techCount}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: '#dcfce7', color: '#16a34a',
              }}>
                📝 General: {genCount}
              </span>
            </div>
          </div>

          {/* Filter + Search */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', gap: 4, background: 'var(--bg-surface)',
              borderRadius: 12, padding: 3, border: '1px solid var(--border)',
            }}>
              {[
                { key: 'all', label: 'সব' },
                { key: 'technical', label: '🔬 টেকনিক্যাল' },
                { key: 'general', label: '📝 জেনারেল' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: '6px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 12, transition: 'all 0.15s',
                    background: filter === f.key ? 'var(--accent)' : 'transparent',
                    color: filter === f.key ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="টার্ম খুঁজুন..."
              style={{
                flex: 1, minWidth: 140, padding: '8px 14px', borderRadius: 12,
                border: '1.5px solid var(--border)', background: 'var(--bg-surface)',
                color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          {/* Two-column layout: list + detail */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

            {/* Term list */}
            <div style={{
              width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6,
              maxHeight: 600, overflowY: 'auto',
              scrollbarWidth: 'thin',
            }}>
              {filteredTerms.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>
                  কোনো টার্ম পাওয়া যায়নি
                </div>
              ) : filteredTerms.map((t, i) => (
                <TermCard
                  key={i}
                  term={t}
                  isSelected={selectedTerm?.term === t.term}
                  onClick={() => setSelectedTerm(t)}
                />
              ))}
            </div>

            {/* Detail panel */}
            <div style={{
              flex: 1, minWidth: 0, maxHeight: 600, overflowY: 'auto',
              scrollbarWidth: 'thin',
            }}>
              {selectedTerm ? (
                <TermDetail term={selectedTerm} />
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 13,
                }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>👈</div>
                  বাম থেকে একটি টার্ম সিলেক্ট করুন
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
