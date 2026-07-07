// src/components/Avatar.js
import React from 'react';

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

function colorFromName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Avatar({ name, src, size = 44, onClick, ring = false }) {
  const dim = { width: size, height: size, borderRadius: '50%' };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        onClick={onClick}
        style={{
          ...dim,
          objectFit: 'cover',
          cursor: onClick ? 'pointer' : 'default',
          border: ring ? '2px solid #0ea5e9' : '2px solid #fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        ...dim,
        background: `linear-gradient(135deg, ${colorFromName(name)}, ${colorFromName(name)}cc)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.38,
        cursor: onClick ? 'pointer' : 'default',
        border: ring ? '2px solid #0ea5e9' : '2px solid #fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials(name)}
    </div>
  );
}
