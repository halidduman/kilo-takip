import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const QUICK_AMOUNTS = [100, 250, 500];

export default function WaterCounter({ compact = false }) {
  const { state, dispatch } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const wl    = state.waterLog;
  const amount = wl?.date === today ? (wl.amountMl ?? 0) : 0;
  const goal   = wl?.goalMl ?? 2500;
  const pct    = Math.min(100, Math.round((amount / goal) * 100));
  const [ripple, setRipple] = useState(null);

  function addWater(ml) {
    dispatch({ type: 'ADD_WATER', payload: ml });
    setRipple(ml);
    setTimeout(() => setRipple(null), 600);
  }

  const liters = (amount / 1000).toFixed(2);
  const goalL  = (goal / 1000).toFixed(1);

  if (compact) {
    // Küçük kart versiyonu — Home.jsx için
    return (
      <div style={{
        padding: '1rem 1.125rem',
        borderRadius: '1.25rem',
        background: 'var(--color-surface-container-lowest)',
        border: '1px solid var(--color-outline-variant)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '50%',
              background: 'rgba(59,130,246,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: '1.15rem', fontVariationSettings: "'FILL' 1" }}>
                water_drop
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-on-surface)' }}>Su</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)' }}>Günlük hedef</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="headline-font" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2563eb' }}>
              {liters} L
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)' }}>/ {goalL} L</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '8px', borderRadius: '999px',
          background: 'var(--color-surface-container-highest)',
          marginBottom: '0.875rem',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: '999px',
            background: 'linear-gradient(90deg, #60a5fa, #2563eb)',
            transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        </div>

        {/* Quick Add Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {QUICK_AMOUNTS.map(ml => (
            <button
              key={ml}
              className="water-btn"
              onClick={() => addWater(ml)}
              style={{
                transform: ripple === ml ? 'scale(0.93)' : 'scale(1)',
                transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>add</span>
              {ml < 1000 ? `${ml}ml` : `${ml/1000}L`}
            </button>
          ))}
        </div>

        {pct >= 100 && (
          <div className="animate-pop-in" style={{
            marginTop: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.75rem',
            background: 'rgba(59,130,246,0.08)',
            color: '#1d4ed8',
            fontSize: '0.78rem',
            fontWeight: 700,
            textAlign: 'center',
          }}>
            🎉 Günlük su hedefini tamamladın!
          </div>
        )}
      </div>
    );
  }

  // Tam ekran versiyonu — Fasting sayfası için
  return (
    <div style={{
      padding: '1.5rem',
      borderRadius: '1.5rem',
      background: 'var(--color-surface-container-lowest)',
      border: '1px solid var(--color-outline-variant)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-on-surface)' }}>💧 Su Takibi</div>
      </div>

      {/* Büyük dairesel gösterge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: 160, height: 160 }}>
          {/* SVG Ring */}
          <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth="12" />
            <circle
              cx="80" cy="80" r="68" fill="none"
              stroke="#3b82f6" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 68}`}
              strokeDashoffset={`${2 * Math.PI * 68 * (1 - pct / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '1.75rem' }}>💧</span>
            <div className="headline-font" style={{ fontWeight: 800, fontSize: '1.4rem', color: '#2563eb', lineHeight: 1 }}>
              {liters} L
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)' }}>/ {goalL} L</div>
          </div>
        </div>
      </div>

      {/* Hızlı butonlar */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '0.875rem' }}>
        {[100, 250, 500, 1000].map(ml => (
          <button
            key={ml}
            className="water-btn"
            onClick={() => addWater(ml)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>add</span>
            {ml < 1000 ? `${ml}ml` : '1L'}
          </button>
        ))}
      </div>

      <div style={{
        fontSize: '0.78rem',
        color: 'var(--color-on-surface-variant)',
        textAlign: 'center',
      }}>
        {pct >= 100 ? '✅ Günlük hedef tamamlandı! 🎉' : `${goal - amount}ml kaldı`}
      </div>
    </div>
  );
}
