import React, { useEffect, useRef } from 'react';

const COLORS = ['#f97316','#ef4444','#3b82f6','#22c55e','#a855f7','#eab308'];

export default function Confetti({ origin }) {
  const ref = useRef([]);

  useEffect(() => {
    const container = document.getElementById('confetti-root');
    if (!container) return;

    const particles = [];
    for (let i = 0; i < 28; i++) {
      const el = document.createElement('div');
      const size = Math.random() * 8 + 6;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const dx = (Math.random() - 0.5) * 200;
      const dy = -(Math.random() * 160 + 60);
      const rot = (Math.random() - 0.5) * 720 + 'deg';

      el.style.cssText = `
        position:fixed;
        left:${origin?.x ?? window.innerWidth/2}px;
        top:${origin?.y ?? window.innerHeight/2}px;
        width:${size}px;
        height:${size * (Math.random() > 0.5 ? 1 : 2)}px;
        background:${color};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        pointer-events:none;
        z-index:9999;
        --dx:${dx}px;
        --dy:${dy}px;
        --rot:${rot};
        animation: confetti-fall 1s ease-out forwards;
      `;
      container.appendChild(el);
      particles.push(el);
    }
    ref.current = particles;

    const timeout = setTimeout(() => {
      particles.forEach(p => p.remove());
    }, 1100);

    return () => {
      clearTimeout(timeout);
      particles.forEach(p => p.remove());
    };
  }, [origin]);

  return null;
}
