// src/lib/mentions.js
import React from 'react';

// টেক্সট আর কার্সার পজিশন থেকে বোঝা যে এখন @মেনশন টাইপ হচ্ছে কিনা —
// হলে কোন অংশ থেকে ম্যাচ শুরু হয়েছে (triggerIndex) আর এখন পর্যন্ত কী
// লেখা হয়েছে (query) রিটার্ন করে
export function detectMentionTrigger(text, cursorPos) {
  const upToCursor = text.slice(0, cursorPos);
  const match = upToCursor.match(/(?:^|\s)@([^\s@]*)$/);
  if (!match) return null;
  const triggerIndex = match.index + (match[0].startsWith('@') ? 0 : 1);
  return { query: match[1], triggerIndex };
}

// ড্রপডাউন থেকে একজনকে বেছে নিলে টেক্সটে "@নাম " বসিয়ে দেওয়া
export function insertMention(text, triggerIndex, cursorPos, member) {
  const before = text.slice(0, triggerIndex);
  const after = text.slice(cursorPos);
  const insertion = `@${member.name} `;
  return { text: before + insertion + after, cursorPos: (before + insertion).length };
}

// টেক্সটে যাদের @মেনশন করা হয়েছে (mentionedMembers) তাদের নামগুলো
// accent রঙে হাইলাইট করে দেখানো
export function renderTextWithMentions(text, mentionedMembers = []) {
  if (!text || !mentionedMembers.length) return text;

  // লম্বা নাম আগে ম্যাচ করানো, যাতে ছোট নাম বড় নামের ভেতরে ভুলভাবে না ধরে
  const names = [...new Set(mentionedMembers.map((m) => m.name).filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!names.length) return text;

  const pattern = new RegExp(`(@(?:${names.map(escapeRegExp).join('|')}))(?=\\s|$)`, 'g');
  const parts = text.split(pattern);

  return parts.map((part, i) =>
    part.startsWith('@') && names.includes(part.slice(1))
      ? <span key={i} style={{ color: 'var(--accent)', fontWeight: 700 }}>{part}</span>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
