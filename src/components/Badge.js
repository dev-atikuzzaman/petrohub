// src/components/Badge.js
import React from 'react';

export default function Badge({ children, tone = 'default' }) {
  const tones = {
    default: { bg: 'var(--bg-surface-alt)', color: 'var(--text-secondary)' },
    success: { bg: 'var(--success-soft)', color: 'var(--success)' },
    danger: { bg: 'var(--danger-soft)', color: 'var(--danger)' },
    info: { bg: 'var(--info-soft)', color: 'var(--info)' },
    warning: { bg: 'var(--warning-soft)', color: 'var(--warning)' },
    admin: { bg: 'var(--admin-soft)', color: 'var(--admin-color)' },
  };
  const t = tones[tone] || tones.default;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: t.bg,
        color: t.color,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
