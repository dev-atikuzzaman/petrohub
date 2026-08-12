// src/components/MemberBadges.js
import React from 'react';

// awardedBadges: member_badges rows (with joined `badge`) ফিল্টার করা একটা নির্দিষ্ট user_id এর জন্য
export default function MemberBadges({ awardedBadges = [], size = 'md' }) {
  if (!awardedBadges.length) return null;

  const isSmall = size === 'sm';

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {awardedBadges.map((mb) => (
        <span
          key={mb.id}
          title={mb.badge?.description || mb.badge?.name}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: isSmall ? '2px 8px' : '4px 10px',
            borderRadius: 999,
            fontSize: isSmall ? 11 : 12.5,
            fontWeight: 700,
            background: `${mb.badge?.color || '#f59e0b'}22`,
            color: mb.badge?.color || '#f59e0b',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{mb.badge?.icon || '🏅'}</span>
          {mb.badge?.name}
        </span>
      ))}
    </div>
  );
}
