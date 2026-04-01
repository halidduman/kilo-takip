import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function WeighInModal({ onClose }) {
  const { state, dispatch } = useApp();
  const [weight, setWeight] = useState(state.profile?.weight ?? '');
  const [submitted, setSubmitted] = useState(false);

  const diff = weight && state.profile
    ? (parseFloat(weight) - state.profile.weight).toFixed(1)
    : null;

  function handleSubmit() {
    if (!weight || isNaN(weight)) return;
    dispatch({ type: 'LOG_WEIGHT', payload: parseFloat(weight) });
    setSubmitted(true);
    setTimeout(onClose, 1800);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{
          width: '3rem', height: '4px',
          background: 'var(--color-outline-variant)',
          borderRadius: '999px',
          margin: '0 auto 1.5rem'
        }} />

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
              {diff && parseFloat(diff) < 0 ? '🎉' : diff && parseFloat(diff) > 0 ? '💪' : '✅'}
            </div>
            <h3 className="headline-font" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-on-surface)' }}>
              Kaydedildi!
            </h3>
            {diff && parseFloat(diff) < 0 && (
              <p style={{ color: '#22c55e', fontWeight: 600 }}>
                Bu hafta {Math.abs(diff)} kg verdin! Harika gidiyorsun! 🔥
              </p>
            )}
            {diff && parseFloat(diff) > 0 && (
              <p style={{ color: '#f97316', fontWeight: 600 }}>
                {diff} kg aldın. Endişelenme, devam et! 💪
              </p>
            )}
            {diff && parseFloat(diff) == 0 && (
              <p style={{ color: 'var(--color-on-surface-variant)' }}>
                Aynı kaldın. Diyete devam!
              </p>
            )}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚖️</div>
              <h3
                className="headline-font"
                style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '0.25rem' }}
              >
                Haftalık Tartı
              </h3>
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.9rem' }}>
                Bu haftaki kilonu gir, grafiğine ekleyelim.
              </p>
            </div>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <input
                type="number"
                className="kg-input"
                placeholder={state.profile?.weight ?? '85.0'}
                value={weight}
                onChange={e => setWeight(e.target.value)}
                step="0.1"
                min="30"
                max="300"
                autoFocus
                style={{ fontSize: '2rem', textAlign: 'center' }}
              />
              <span style={{
                position: 'absolute', right: '1.25rem', top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-on-surface-variant)',
                fontWeight: 700, fontSize: '1rem'
              }}>kg</span>
            </div>

            {diff !== null && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                background: parseFloat(diff) <= 0
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(249,115,22,0.1)',
                color: parseFloat(diff) <= 0 ? '#16a34a' : '#ea580c',
                fontWeight: 600,
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                textAlign: 'center',
              }}>
                {parseFloat(diff) < 0
                  ? `Geçen haftaya göre ${Math.abs(diff)} kg azaldı ✅`
                  : parseFloat(diff) > 0
                  ? `Geçen haftaya göre ${diff} kg arttı ⚠️`
                  : 'Kilo değişmedi'}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!weight}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '999px',
                background: weight ? 'linear-gradient(135deg, var(--accent), var(--accent-container))' : 'var(--color-surface-container-high)',
                color: weight ? 'var(--accent-on)' : 'var(--color-on-surface-variant)',
                fontWeight: 800,
                fontSize: '1rem',
                border: 'none',
                cursor: weight ? 'pointer' : 'not-allowed',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              Kaydet
            </button>
          </>
        )}
      </div>
    </div>
  );
}
