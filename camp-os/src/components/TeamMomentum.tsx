'use client';

import React from 'react';

interface TeamMomentumProps {
  progressPercentage: number;
  completedMissionsCount?: number;
  compact?: boolean;
}

export function TeamMomentumBar({ progressPercentage, compact = false }: TeamMomentumProps) {
  // Derive momentum dots (5 levels)
  const dotsCount = 5;
  const activeDots = Math.min(dotsCount, Math.ceil((progressPercentage / 100) * dotsCount));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: compact ? '0.8rem' : '0.9rem', fontWeight: 800 }}>
        <span>Z2MVP MOMENTUM</span>
        <span style={{ fontFamily: 'IBM Plex Mono', color: 'var(--color-blue)' }}>{progressPercentage}%</span>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        {Array.from({ length: dotsCount }).map((_, i) => (
          <div 
            key={i}
            style={{
              flex: 1,
              height: compact ? '8px' : '12px',
              background: i < activeDots ? 'var(--color-blue)' : 'var(--bg-secondary)',
              border: '1.5px solid var(--border-main)',
              transition: 'background 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function MilestoneBadges({ completedTaskIds = [] }: { completedTaskIds?: string[] }) {
  const milestones = [
    { id: 'm_problem', label: 'المشكلة معرّفة', isDone: completedTaskIds.includes('t_i1') || completedTaskIds.length > 0 },
    { id: 'm_scope', label: 'النطاق محدد', isDone: completedTaskIds.includes('t_s1') || completedTaskIds.length > 1 },
    { id: 'm_prototype', label: 'النموذج يعمل', isDone: completedTaskIds.includes('t_b1') || completedTaskIds.length > 2 },
    { id: 'm_live', label: 'المنتج منشور', isDone: completedTaskIds.includes('t_b3') || completedTaskIds.length > 3 },
    { id: 'm_pitch', label: 'العرض جاهز', isDone: completedTaskIds.includes('t_p1') || completedTaskIds.length > 4 }
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {milestones.map(m => (
        <span 
          key={m.id}
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '0.25rem 0.6rem',
            background: m.isDone ? '#DCFCE7' : 'var(--bg-secondary)',
            color: m.isDone ? 'var(--color-green)' : 'var(--text-muted)',
            border: '1px solid var(--border-main)'
          }}
        >
          {m.label} {m.isDone ? '✓' : ''}
        </span>
      ))}
    </div>
  );
}
