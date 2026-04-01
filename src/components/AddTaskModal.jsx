import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function AddTaskModal({ onClose }) {
  const { dispatch } = useApp();
  const [label, setLabel]   = useState('');
  const [subtitle, setSub]  = useState('');
  const [icon, setIcon]     = useState('check_circle');
  const [color, setColor]   = useState('purple');

  const ICONS = [
    'check_circle','star','favorite','bolt','spa','fitness_center',
    'self_improvement','bedtime','coffee','local_pizza','sports_soccer',
    'directions_bike','pool','book_2','medication',
  ];
  const COLORS = [
    { id: 'purple', label: 'Mor',    hex: '#a855f7' },
    { id: 'blue',   label: 'Mavi',   hex: '#3b82f6' },
    { id: 'green',  label: 'Yeşil',  hex: '#22c55e' },
    { id: 'orange', label: 'Turuncu',hex: '#f97316' },
    { id: 'red',    label: 'Kırmızı',hex: '#ef4444' },
    { id: 'pink',   label: 'Pembe',  hex: '#ec4899' },
  ];

  function handleAdd() {
    if (!label.trim()) return;
    dispatch({
      type: 'ADD_TASK',
      payload: {
        id: `custom_${Date.now()}`,
        label: label.trim(),
        subtitle: subtitle.trim() || 'Görev',
        icon,
        color,
        done: false,
        custom: true,
      },
    });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div style={{
          width: '3rem', height: '4px',
          background: 'var(--color-outline-variant)',
          borderRadius: '999px',
          margin: '0 auto 1.5rem'
        }} />

        <h3 className="headline-font" style={{
          fontSize: '1.4rem', fontWeight: 800,
          color: 'var(--color-on-surface)', marginBottom: '1.25rem'
        }}>
          ➕ Yeni Görev Ekle
        </h3>

        {/* Task name */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
            Görev Adı
          </label>
          <input
            className="kg-input"
            style={{ fontSize: '1rem', padding: '0.875rem 1rem' }}
            placeholder="Örn: Meditasyon"
            value={label}
            onChange={e => setLabel(e.target.value)}
            autoFocus
          />
        </div>

        {/* Subtitle */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
            Hedef (isteğe bağlı)
          </label>
          <input
            className="kg-input"
            style={{ fontSize: '1rem', padding: '0.875rem 1rem' }}
            placeholder="Örn: 10 Dakika"
            value={subtitle}
            onChange={e => setSub(e.target.value)}
          />
        </div>

        {/* Icon picker */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
            İkon
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {ICONS.map(ic => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                style={{
                  width: '2.75rem', height: '2.75rem',
                  borderRadius: '0.75rem',
                  border: icon === ic ? '2px solid var(--accent)' : '2px solid var(--color-outline-variant)',
                  background: icon === ic ? 'rgba(135,78,0,0.1)' : 'var(--color-surface-container-low)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: icon === ic ? 'var(--accent)' : 'var(--color-on-surface-variant)' }}>
                  {ic}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
            Renk
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                title={c.label}
                style={{
                  width: '2.5rem', height: '2.5rem',
                  borderRadius: '50%',
                  background: c.hex,
                  border: color === c.id ? '3px solid var(--color-on-surface)' : '3px solid transparent',
                  outline: color === c.id ? `2px solid ${c.hex}` : 'none',
                  outlineOffset: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!label.trim()}
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '999px',
            background: label.trim()
              ? 'linear-gradient(135deg, var(--accent), var(--accent-container))'
              : 'var(--color-surface-container-high)',
            color: label.trim() ? 'var(--accent-on)' : 'var(--color-on-surface-variant)',
            fontWeight: 800,
            fontSize: '1rem',
            border: 'none',
            cursor: label.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          Görevi Ekle
        </button>
      </div>
    </div>
  );
}
