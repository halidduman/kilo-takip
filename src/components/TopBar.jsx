import React from 'react';
import { useApp } from '../context/AppContext';

const FLAME_COLORS = {
  none:   { emoji: '🔥', color: '#9ca3af' },
  normal: { emoji: '🔥', color: '#f97316' },
  water:  { emoji: '🔥', color: '#ea580c' },
  walk:   { emoji: '🔥', color: '#dc2626' },
};

export default function TopBar() {
  const { state } = useApp();
  const { profile, streak, tasks } = state;

  const waterDone = tasks.find(t => t.id === 'water')?.done;
  const walkDone  = tasks.find(t => t.id === 'walk')?.done;

  let flameLevel = 'none';
  if (streak > 0) {
    if (walkDone) flameLevel = 'walk';
    else if (waterDone) flameLevel = 'water';
    else flameLevel = 'normal';
  }

  const flame = FLAME_COLORS[flameLevel];

  return (
    <header className="top-bar">
      {/* Current weight */}
      <span
        className="headline-font font-bold text-lg"
        style={{ color: 'var(--accent)' }}
      >
        {profile?.weight ?? '--'}kg
      </span>

      {/* Streak + flame */}
      <button
        className="flex items-center gap-1 streak-badge animate-flame"
        style={{ color: flame.color, background: 'none', border: 'none', cursor: 'default' }}
        aria-label={`${streak} günlük seri`}
      >
        <span style={{ fontSize: '1.4rem' }}>{flame.emoji}</span>
        <span>{streak}</span>
      </button>

      {/* Target weight */}
      <span
        className="headline-font font-bold text-lg"
        style={{ color: 'var(--color-on-surface-variant)' }}
      >
        {profile?.targetWeight ?? '--'}kg
      </span>
    </header>
  );
}
