import React from 'react';

const NAV_ITEMS = [
  { id: 'stats',    icon: 'bar_chart',      label: 'Grafik'  },
  { id: 'home',     icon: 'home',           label: 'Ana Sayfa' },
  { id: 'fasting',  icon: 'no_meals',       label: 'Oruç'    },
  { id: 'settings', icon: 'settings',       label: 'Ayarlar' },
];

export default function BottomNav({ page, setPage, fastingActive }) {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Ana navigasyon">
      {NAV_ITEMS.map(item => {
        const isActive = page === item.id;
        const showDot  = item.id === 'fasting' && fastingActive;
        return (
          <button
            key={item.id}
            className={`nav-item${isActive ? ' active' : ''}`}
            onClick={() => setPage(item.id)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            style={{ position: 'relative' }}
          >
            {/* Oruç aktifken küçük turuncu nokta */}
            {showDot && (
              <div style={{
                position: 'absolute',
                top: '0.25rem',
                right: 'calc(50% - 0.85rem)',
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                background: '#f97316',
                animation: 'pulse-ring 2s ease infinite',
              }} />
            )}
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: isActive
                  ? "'FILL' 1, 'wght' 600"
                  : "'FILL' 0, 'wght' 400",
                fontSize: '1.45rem',
                color: item.id === 'fasting' && fastingActive && !isActive
                  ? '#f97316'
                  : undefined,
              }}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
