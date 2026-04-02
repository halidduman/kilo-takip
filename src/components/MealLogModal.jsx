import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const CATEGORIES = [
  { id: 'breakfast', label: 'Kahvaltı',      emoji: '🌅', hours: '06:00–11:00' },
  { id: 'lunch',     label: 'Öğle',          emoji: '🌞', hours: '11:00–15:00' },
  { id: 'dinner',    label: 'Akşam',         emoji: '🌙', hours: '15:00–22:00' },
  { id: 'snack',     label: 'Atıştırmalık',  emoji: '🍎', hours: 'Ara öğün'     },
];

const QUICK_FOODS = {
  breakfast: ['Yulaf ezmesi', 'Yumurta', 'Peynir & ekmek', 'Meyve', 'Smoothie'],
  lunch:     ['Tavuk salata', 'Bulgur pilavı', 'Mercimek çorbası', 'Sandviç', 'Makarna'],
  dinner:    ['Izgara et', 'Balık', 'Sebze yemeği', 'Pilav + salata', 'Çorba'],
  snack:     ['Elma', 'Kuruyemiş (avuç)', 'Yoğurt', 'Havuç', 'Protein bar'],
};

export default function MealLogModal({ onClose, defaultCategory }) {
  const { dispatch } = useApp();
  const [category, setCategory] = useState(defaultCategory ?? 'breakfast');
  const [name, setName]         = useState('');
  const [calories, setCalories] = useState('');
  const [time, setTime]         = useState(
    new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  );

  function handleSave() {
    if (!name.trim()) return;
    dispatch({
      type: 'LOG_MEAL',
      payload: {
        category,
        name: name.trim(),
        calories: parseInt(calories) || 0,
        time,
      },
    });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        {/* Handle */}
        <div style={{ width: '2.5rem', height: '0.25rem', background: 'var(--color-outline-variant)', borderRadius: '999px', margin: '0 auto 1.5rem' }} />

        <h3 className="headline-font" style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-on-surface)', marginBottom: '1.25rem' }}>
          Öğün Ekle
        </h3>

        {/* Kategori Seçimi */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span className="section-label">Öğün Türü</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`meal-cat-pill${category === cat.id ? ' active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hızlı Seçim */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span className="section-label">Hızlı Seçim</span>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {QUICK_FOODS[category].map(food => (
              <button
                key={food}
                onClick={() => setName(food)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '999px',
                  border: name === food ? '1.5px solid var(--accent)' : '1.5px solid var(--color-outline-variant)',
                  background: name === food ? 'rgba(135,78,0,0.07)' : 'var(--color-surface-container-low)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: name === food ? 'var(--accent)' : 'var(--color-on-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'Be Vietnam Pro, sans-serif',
                }}
              >
                {food}
              </button>
            ))}
          </div>
        </div>

        {/* Yemek Adı */}
        <div style={{ marginBottom: '0.875rem' }}>
          <span className="section-label">Yemek Adı</span>
          <input
            type="text"
            className="kg-input"
            placeholder="Örn: Tavuk göğsü salata"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ fontSize: '1rem', padding: '0.875rem 1rem' }}
            autoFocus
          />
        </div>

        {/* Kalori & Saat */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div>
            <span className="section-label">Kalori (kcal)</span>
            <input
              type="number"
              className="kg-input"
              placeholder="350"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              min="0" max="5000"
              style={{ fontSize: '1.1rem', padding: '0.875rem 1rem' }}
            />
          </div>
          <div>
            <span className="section-label">Saat</span>
            <input
              type="time"
              className="kg-input"
              value={time}
              onChange={e => setTime(e.target.value)}
              style={{ fontSize: '1rem', padding: '0.875rem 1rem' }}
            />
          </div>
        </div>

        {/* Kaydet */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{
            padding: '0.875rem 1.25rem',
            borderRadius: '999px',
            border: '2px solid var(--color-outline-variant)',
            background: 'transparent',
            color: 'var(--color-on-surface-variant)',
            cursor: 'pointer',
            fontFamily: 'Be Vietnam Pro, sans-serif',
            fontWeight: 600,
          }}>
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            style={{
              flex: 1,
              padding: '0.875rem',
              borderRadius: '999px',
              border: 'none',
              background: name.trim()
                ? 'linear-gradient(135deg, var(--accent), var(--accent-container))'
                : 'var(--color-surface-container-high)',
              color: name.trim() ? 'var(--accent-on)' : 'var(--color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: name.trim() ? '0 6px 20px rgba(135,78,0,0.25)' : 'none',
            }}
          >
            Kaydet 🍴
          </button>
        </div>
      </div>
    </div>
  );
}
