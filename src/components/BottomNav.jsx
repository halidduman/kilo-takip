import React from 'react';

export default function BottomNav({ page, setPage }) {
  const items = [
    { id: 'stats',    icon: 'bar_chart',       label: 'İstatistikler' },
    { id: 'home',     icon: 'home',             label: 'Ana Sayfa' },
    { id: 'settings', icon: 'settings',         label: 'Ayarlar' },
  ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Ana navigasyon">
      {items.map(item => (
        <button
          key={item.id}
          className={`nav-item${page === item.id ? ' active' : ''}`}
          onClick={() => setPage(item.id)}
          aria-label={item.label}
          aria-current={page === item.id ? 'page' : undefined}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontVariationSettings: page === item.id
                ? "'FILL' 1, 'wght' 600"
                : "'FILL' 0, 'wght' 400",
              fontSize: '1.5rem',
            }}
          >
            {item.icon}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
