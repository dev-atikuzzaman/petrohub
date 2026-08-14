// src/pages/KeywordAnalyzerTab.js
import React, { useState, useRef } from 'react';
import { LoaderIcon, SearchIcon, DownloadIcon, XIcon, TagIcon } from '../components/Icons';

// ── শেয়ার আইকন (inline) ─────────────────────────────────────────────────────
const ShareIcon = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const CopyIcon = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const UploadIcon = (p) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const KeyIcon = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

// ── ফাইল → base64 ──────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = () => rej(new Error('ফাইল পড়তে সমস্যা হয়েছে'));
    r.readAsDataURL(file);
  });
}

// ── ফাইল → text (plain text ফাইলের জন্য) ─────────────────────────────────
function fileToText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error('টেক্সট পড়তে সমস্যা হয়েছে'));
    r.readAsText(file);
  });
}

// ── ফাইল ধরন নির্ধারণ ──────────────────────────────────────────────────────
function getFileCategory(file) {
  const { type, name } = file;
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'pdf';
  if (type.startsWith('audio/') || type.startsWith('video/')) return 'media';
  if (
    type.startsWith('text/') ||
    name.endsWith('.txt') || name.endsWith('.md') ||
    name.endsWith('.csv') || name.endsWith('.json') ||
    name.endsWith('.xml') || name.endsWith('.html') ||
    name.endsWith('.js') || name.endsWith('.py')
  ) return 'text';
  return 'other';
}

// ── Claude API কল ──────────────────────────────────────────────────────────
async function analyzeWithClaude(file) {
  const category = getFileCategory(file);
  const systemPrompt = `তুমি একজন বিশেষজ্ঞ keyword বিশ্লেষক। ডকুমেন্ট/ফাইল থেকে সবচেয়ে গুরুত্বপূর্ণ General ও Technical keyword গুলো চিহ্নিত করো।

প্রতিটি keyword এর জন্য নিচের JSON স্ট্রাকচারে তথ্য দাও:
{
  "keywords": [
    {
      "term": "keyword এর নাম",
      "type": "general অথবা technical",
      "category": "বিষয়শ্রেণী (যেমন: Finance, Engineering, Medical, Legal ইত্যাদি)",
      "definition": "সংজ্ঞা - ২-৩ বাক্যে সহজ ব্যাখ্যা",
      "meaning": "অর্থ - বাংলায় সরল অর্থ",
      "example": "উদাহরণ - বাস্তব প্রয়োগের উদাহরণ",
      "applications": "প্রয়োগক্ষেত্র - কোথায় কোথায় ব্যবহৃত হয়",
      "benefits": "উপকারিতা - এই বিষয়টির সুবিধা",
      "drawbacks": "অপকারিতা বা সীমাবদ্ধতা - এই বিষয়টির অসুবিধা",
      "usage": "ব্যবহার - কীভাবে ব্যবহার করা হয়",
      "limitations": "সীমাবদ্ধতা - কী কী সীমাবদ্ধতা আছে"
    }
  ],
  "document_summary": "ডকুমেন্টের সংক্ষিপ্ত বিবরণ ২-৩ বাক্যে",
  "total_keywords": সংখ্যা,
  "general_count": সংখ্যা,
  "technical_count": সংখ্যা
}

শুধুমাত্র valid JSON রিটার্ন করো। কোনো পূর্বকথা বা ব্যাখ্যা যোগ করো না। কমপক্ষে ৮-১৫টি keyword চিহ্নিত করো।`;

  let messages = [];

  if (category === 'image') {
    const base64 = await fileToBase64(file);
    const mediaType = file.type || 'image/jpeg';
    messages = [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: 'এই ছবি/ডকুমেন্ট থেকে সকল গুরুত্বপূর্ণ General ও Technical keyword চিহ্নিত করো এবং নির্দিষ্ট JSON ফরম্যাটে বিস্তারিত তথ্য দাও।' }
      ]
    }];
  } else if (category === 'pdf') {
    const base64 = await fileToBase64(file);
    messages = [{
      role: 'user',
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: 'এই PDF ডকুমেন্ট থেকে সকল গুরুত্বপূর্ণ General ও Technical keyword চিহ্নিত করো এবং নির্দিষ্ট JSON ফরম্যাটে বিস্তারিত তথ্য দাও।' }
      ]
    }];
  } else if (category === 'text') {
    const text = await fileToText(file);
    const truncated = text.slice(0, 12000);
    messages = [{
      role: 'user',
      content: `নিচের টেক্সট থেকে সকল গুরুত্বপূর্ণ General ও Technical keyword চিহ্নিত করো এবং নির্দিষ্ট JSON ফরম্যাটে বিস্তারিত তথ্য দাও:\n\n${truncated}`
    }];
  } else if (category === 'media') {
    messages = [{
      role: 'user',
      content: `ফাইলের নাম: "${file.name}" (অডিও/ভিডিও ফাইল)। এই ফাইলের নাম ও ধরনের ভিত্তিতে সম্ভাব্য General ও Technical keyword চিহ্নিত করো এবং নির্দিষ্ট JSON ফরম্যাটে বিস্তারিত তথ্য দাও।`
    }];
  } else {
    const text = await fileToText(file).catch(() => `ফাইলের নাম: ${file.name}`);
    messages = [{
      role: 'user',
      content: `নিচের কন্টেন্ট থেকে সকল গুরুত্বপূর্ণ keyword চিহ্নিত করো:\n\n${text.slice(0, 8000)}`
    }];
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'API সমস্যা হয়েছে');
  }

  const data = await response.json();
  const rawText = data.content.map(b => b.text || '').join('');
  const clean = rawText.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    // JSON পার্স ব্যর্থ হলে কাঁচা টেক্সট থেকে বের করার চেষ্টা
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('ফলাফল পার্স করতে ব্যর্থ');
  }
}

// ── কার্ড রং ─────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  general: { bg: '#e0f2fe', border: '#0284c7', badge: '#0ea5e9', text: '#0c4a6e' },
  technical: { bg: '#fef3c7', border: '#d97706', badge: '#f59e0b', text: '#78350f' },
};

// ── শেয়ার টেক্সট তৈরি ───────────────────────────────────────────────────
function buildShareText(result) {
  const lines = [
    `🔑 Keyword বিশ্লেষণ রিপোর্ট`,
    `📄 ${result.document_summary || ''}`,
    `📊 মোট: ${result.total_keywords} | General: ${result.general_count} | Technical: ${result.technical_count}`,
    `${'─'.repeat(40)}`,
  ];
  result.keywords.forEach((kw, i) => {
    lines.push(`\n${i + 1}. ${kw.term} [${kw.type?.toUpperCase()}]`);
    lines.push(`📌 অর্থ: ${kw.meaning}`);
    lines.push(`📖 সংজ্ঞা: ${kw.definition}`);
    lines.push(`💡 উদাহরণ: ${kw.example}`);
    lines.push(`🎯 প্রয়োগক্ষেত্র: ${kw.applications}`);
    lines.push(`✅ উপকারিতা: ${kw.benefits}`);
    lines.push(`⚠️ অপকারিতা: ${kw.drawbacks}`);
    lines.push(`🔧 ব্যবহার: ${kw.usage}`);
    lines.push(`🚧 সীমাবদ্ধতা: ${kw.limitations}`);
  });
  lines.push(`\n— Petro Knowledge Hub`);
  return lines.join('\n');
}

// ── মূল কম্পোনেন্ট ────────────────────────────────────────────────────────
export default function KeywordAnalyzerTab() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null); // বিস্তারিত দেখার keyword
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState('all'); // all | general | technical
  const inputRef = useRef();

  // ── ফাইল নির্বাচন ──────────────────────────────────────────────────────
  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    setSelected(null);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError('');
      setSelected(null);
      if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f));
      else setPreview(null);
    }
  }

  // ── বিশ্লেষণ শুরু ──────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSelected(null);
    try {
      const res = await analyzeWithClaude(file);
      setResult(res);
    } catch (e) {
      setError(e.message || 'কোনো সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  }

  // ── কপি ────────────────────────────────────────────────────────────────
  async function handleCopy() {
    if (!result) return;
    const text = buildShareText(result);
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // ── শেয়ার (Web Share API) ──────────────────────────────────────────────
  async function handleShare() {
    if (!result) return;
    const text = buildShareText(result);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Keyword বিশ্লেষণ', text });
      } catch {}
    } else {
      await handleCopy();
    }
  }

  // ── ডাউনলোড .txt ───────────────────────────────────────────────────────
  function handleDownload() {
    if (!result) return;
    const text = buildShareText(result);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── ফিল্টারড কীওয়ার্ড ─────────────────────────────────────────────────
  const filtered = result?.keywords?.filter(kw =>
    filter === 'all' ? true : kw.type === filter
  ) || [];

  // ── ফাইল আইকন ──────────────────────────────────────────────────────────
  function FileEmoji({ file }) {
    if (!file) return null;
    const cat = getFileCategory(file);
    const icons = { image: '🖼️', pdf: '📄', text: '📝', media: '🎵', other: '📎' };
    return <span style={{ fontSize: 28 }}>{icons[cat] || '📎'}</span>;
  }

  return (
    <div style={{ padding: '16px 14px 100px', maxWidth: 640, margin: '0 auto' }}>

      {/* ── শিরোনাম ── */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--accent-gradient)', borderRadius: 16,
          padding: '8px 18px', marginBottom: 8 }}>
          <KeyIcon style={{ color: '#fff' }} />
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>AI Keyword Analyzer</span>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>
          যেকোনো ফাইল আপলোড করুন — AI স্বয়ংক্রিয়ভাবে কিওয়ার্ড বিশ্লেষণ করবে
        </p>
      </div>

      {/* ── আপলোড এরিয়া ── */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${file ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 18, padding: '24px 16px', textAlign: 'center',
          cursor: 'pointer', marginBottom: 14,
          background: file ? 'var(--accent-soft)' : 'var(--bg-surface)',
          transition: 'all 0.2s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          accept="image/*,.pdf,.txt,.md,.csv,.json,.xml,.html,.js,.py,audio/*,video/*"
          onChange={handleFileChange}
        />

        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {preview
              ? <img src={preview} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 12 }} />
              : <FileEmoji file={file} />
            }
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', maxWidth: 200,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(1)} KB • {getFileCategory(file).toUpperCase()}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--accent)', marginTop: 2 }}>পরিবর্তন করতে ট্যাপ করুন</div>
            </div>
          </div>
        ) : (
          <div>
            <UploadIcon style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>ফাইল আপলোড করুন</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              📷 ছবি &nbsp;|&nbsp; 📄 PDF &nbsp;|&nbsp; 📝 টেক্সট &nbsp;|&nbsp; 🎵 অডিও
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>ড্র্যাগ করুন বা ট্যাপ করুন</div>
          </div>
        )}
      </div>

      {/* ── বিশ্লেষণ বাটন ── */}
      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          background: !file || loading ? 'var(--border)' : 'var(--accent-gradient)',
          color: !file || loading ? 'var(--text-muted)' : '#fff',
          fontWeight: 800, fontSize: 15, cursor: !file || loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s', marginBottom: 16,
        }}
      >
        {loading
          ? <><LoaderIcon width={18} height={18} /> বিশ্লেষণ চলছে...</>
          : <><SearchIcon width={18} height={18} /> কিওয়ার্ড বিশ্লেষণ করুন</>
        }
      </button>

      {/* ── লোডিং ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            🤖 AI ডকুমেন্ট পড়ছে ও keyword চিহ্নিত করছে...
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
            কিছুক্ষণ অপেক্ষা করুন
          </div>
        </div>
      )}

      {/* ── ত্রুটি ── */}
      {error && (
        <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)',
          borderRadius: 12, padding: '12px 14px', color: 'var(--danger)',
          fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── ফলাফল ── */}
      {result && (
        <div style={{ animation: 'slideUp 0.3s ease' }}>

          {/* সারাংশ কার্ড */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 16, marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>
              📋 ডকুমেন্ট সারাংশ
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
              {result.document_summary}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'মোট', value: result.total_keywords, color: '#6366f1' },
                { label: 'General', value: result.general_count, color: '#0ea5e9' },
                { label: 'Technical', value: result.technical_count, color: '#f59e0b' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: color + '18', border: `1px solid ${color}40`,
                  borderRadius: 10, padding: '6px 12px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 17, color }}>{value}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* শেয়ার/ডাউনলোড বাটন */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <button onClick={handleCopy} style={{
              flex: 1, padding: '10px 8px', borderRadius: 12,
              border: '1.5px solid var(--border)', background: 'var(--bg-surface)',
              color: 'var(--text-primary)', fontWeight: 700, fontSize: 12.5,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <CopyIcon /> {copied ? '✅ কপি হয়েছে!' : 'কপি করুন'}
            </button>
            <button onClick={handleShare} style={{
              flex: 1, padding: '10px 8px', borderRadius: 12,
              border: '1.5px solid #25d366', background: '#25d36614',
              color: '#128c3e', fontWeight: 700, fontSize: 12.5,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <ShareIcon style={{ color: '#128c3e' }} /> শেয়ার করুন
            </button>
            <button onClick={handleDownload} style={{
              flex: 1, padding: '10px 8px', borderRadius: 12,
              border: '1.5px solid var(--accent)', background: 'var(--accent-soft)',
              color: 'var(--accent)', fontWeight: 700, fontSize: 12.5,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <DownloadIcon width={15} height={15} /> ডাউনলোড
            </button>
          </div>

          {/* ফিল্টার */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[['all', 'সব'], ['general', 'General'], ['technical', 'Technical']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} style={{
                padding: '7px 14px', borderRadius: 20, border: 'none',
                background: filter === val ? 'var(--accent-gradient)' : 'var(--bg-surface)',
                color: filter === val ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                border: filter === val ? 'none' : '1px solid var(--border)',
              }}>
                {label} {val === 'all' ? `(${result.total_keywords})` :
                  val === 'general' ? `(${result.general_count})` : `(${result.technical_count})`}
              </button>
            ))}
          </div>

          {/* কিওয়ার্ড কার্ডস */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((kw, i) => {
              const col = TYPE_COLORS[kw.type] || TYPE_COLORS.general;
              const isOpen = selected === i;
              return (
                <div key={i} style={{
                  background: 'var(--bg-surface)', border: `1.5px solid ${isOpen ? col.border : 'var(--border)'}`,
                  borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s',
                }}>
                  {/* কার্ড হেডার */}
                  <button
                    onClick={() => setSelected(isOpen ? null : i)}
                    style={{
                      width: '100%', background: 'none', border: 'none',
                      padding: '13px 14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 10,
                      background: col.bg, border: `1px solid ${col.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0 }}>
                      <TagIcon width={15} height={15} style={{ color: col.border }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                        {kw.term}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                        {kw.meaning}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{
                        background: col.badge, color: '#fff',
                        borderRadius: 8, padding: '2px 8px', fontSize: 10.5, fontWeight: 700,
                      }}>
                        {kw.type?.toUpperCase()}
                      </span>
                      {kw.category && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{kw.category}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 16, color: 'var(--text-muted)', marginLeft: 4 }}>
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* বিস্তারিত প্যানেল */}
                  {isOpen && (
                    <div style={{
                      borderTop: `1px solid ${col.border}30`,
                      padding: '14px', background: col.bg + '44',
                      animation: 'fadeIn 0.2s ease',
                    }}>
                      {[
                        { icon: '📖', label: 'সংজ্ঞা', value: kw.definition },
                        { icon: '💡', label: 'উদাহরণ', value: kw.example },
                        { icon: '🎯', label: 'প্রয়োগক্ষেত্র', value: kw.applications },
                        { icon: '✅', label: 'উপকারিতা', value: kw.benefits },
                        { icon: '⚠️', label: 'অপকারিতা', value: kw.drawbacks },
                        { icon: '🔧', label: 'ব্যবহার', value: kw.usage },
                        { icon: '🚧', label: 'সীমাবদ্ধতা', value: kw.limitations },
                      ].map(({ icon, label, value }) => (
                        value && (
                          <div key={label} style={{ marginBottom: 10 }}>
                            <div style={{
                              fontSize: 11.5, fontWeight: 800, color: col.text,
                              marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5,
                            }}>
                              {icon} {label}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6,
                              background: 'var(--bg-surface)', borderRadius: 10,
                              padding: '8px 12px', borderLeft: `3px solid ${col.border}`,
                            }}>
                              {value}
                            </div>
                          </div>
                        )
                      ))}

                      {/* এই keyword শেয়ার */}
                      <button
                        onClick={async () => {
                          const text = [
                            `🔑 ${kw.term} [${kw.type?.toUpperCase()}]`,
                            `📌 অর্থ: ${kw.meaning}`,
                            `📖 সংজ্ঞা: ${kw.definition}`,
                            `💡 উদাহরণ: ${kw.example}`,
                            `🎯 প্রয়োগক্ষেত্র: ${kw.applications}`,
                            `✅ উপকারিতা: ${kw.benefits}`,
                            `⚠️ অপকারিতা: ${kw.drawbacks}`,
                            `🔧 ব্যবহার: ${kw.usage}`,
                            `🚧 সীমাবদ্ধতা: ${kw.limitations}`,
                            `— Petro Knowledge Hub`,
                          ].join('\n');
                          if (navigator.share) {
                            try { await navigator.share({ title: kw.term, text }); } catch {}
                          } else {
                            await navigator.clipboard.writeText(text).catch(() => {});
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }
                        }}
                        style={{
                          width: '100%', padding: '10px', borderRadius: 12,
                          border: `1.5px solid ${col.border}`, background: 'var(--bg-surface)',
                          color: col.text, fontWeight: 700, fontSize: 12.5,
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', gap: 6, marginTop: 4,
                        }}
                      >
                        <ShareIcon style={{ color: col.border }} />
                        এই কিওয়ার্ড শেয়ার করুন
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* নীচের শেয়ার বাটন (সব keyword) */}
          <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
            <button onClick={handleShare} style={{
              flex: 1, padding: '13px', borderRadius: 14,
              border: 'none', background: '#25d366',
              color: '#fff', fontWeight: 800, fontSize: 13.5,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}>
              📤 সব কিওয়ার্ড শেয়ার করুন
            </button>
            <button onClick={handleDownload} style={{
              flex: 1, padding: '13px', borderRadius: 14,
              border: 'none', background: 'var(--accent-gradient)',
              color: '#fff', fontWeight: 800, fontSize: 13.5,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}>
              💾 .txt সেভ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
