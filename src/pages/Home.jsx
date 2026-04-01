import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import Confetti from '../components/Confetti';
import WeighInModal from '../components/WeighInModal';
import AddTaskModal from '../components/AddTaskModal';

const TASK_PALETTE = {
  blue:   { bg: '#eff6ff', icon: '#2563eb', check: '#2563eb' },
  red:    { bg: '#fff1f2', icon: '#dc2626', check: '#dc2626' },
  green:  { bg: '#f0fdf4', icon: '#16a34a', check: '#16a34a' },
  orange: { bg: '#fff7ed', icon: '#ea580c', check: '#ea580c' },
  purple: { bg: '#faf5ff', icon: '#9333ea', check: '#9333ea' },
  pink:   { bg: '#fdf4ff', icon: '#db2777', check: '#db2777' },
};

export default function Home({ onWeighIn }) {
  const { state, dispatch } = useApp();
  const { profile, streak, tasks, weightLog } = state;
  const [confettiOrigin, setConfettiOrigin]   = useState(null);
  const [showConfetti, setShowConfetti]         = useState(false);
  const [showAddTask, setShowAddTask]           = useState(false);
  const [justCompleted, setJustCompleted]       = useState(null);

  const progress = profile
    ? Math.max(0, Math.min(100, Math.round(
        ((profile.startWeight - profile.weight) /
         (profile.startWeight - profile.targetWeight)) * 100
      )))
    : 0;

  const doneTasks   = tasks.filter(t => t.done).length;
  const totalTasks  = tasks.length;
  const allDone     = doneTasks === totalTasks;

  const handleToggle = useCallback((id, e) => {
    const task = tasks.find(t => t.id === id);
    if (!task?.done) {
      // Trigger confetti on complete
      const rect = e.currentTarget.getBoundingClientRect();
      setConfettiOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      setShowConfetti(false);
      requestAnimationFrame(() => setShowConfetti(true));
      setJustCompleted(id);
      setTimeout(() => setJustCompleted(null), 600);
    }
    dispatch({ type: 'TOGGLE_TASK', payload: id });
  }, [tasks, dispatch]);

  // Greeting based on streak
  const greeting = streak >= 100 ? '🏆 Efsane formdasın!'
    : streak >= 50  ? '🌟 İnanılmaz bir seri!'
    : streak >= 10  ? '🔥 Harika gidiyorsun!'
    : streak >= 3   ? '💪 Devam et, alışkanlık oluşuyor!'
    : 'Bugün hedeflerine bir adım daha!';

  // Check if weekly weigh-in needed
  const needsWeighIn = (() => {
    if (!state.lastWeighInDate) return false;
    const last = new Date(state.lastWeighInDate);
    const now  = new Date();
    return Math.floor((now - last) / 86400000) >= 7;
  })();

  return (
    <div style={{ paddingTop: '4rem', paddingBottom: '6rem', minHeight: '100dvh' }}>
      {showConfetti && <Confetti origin={confettiOrigin} />}

      <div style={{ padding: '1.25rem', maxWidth: '480px', margin: '0 auto' }}>

        {/* Weekly weigh-in banner */}
        {needsWeighIn && (
          <div
            className="animate-slide-up"
            onClick={onWeighIn}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '1.25rem',
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              color: 'white',
              marginBottom: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
            }}
          >
            <span style={{ fontSize: '1.75rem' }}>⚖️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Haftalık Tartı Zamanı!</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>Kaç kilo oldun? Gir ve grafiğini güncelle.</div>
            </div>
            <span className="material-symbols-outlined" style={{ marginLeft: 'auto' }}>chevron_right</span>
          </div>
        )}

        {/* Hero banner */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '1.5rem',
          borderRadius: '1.5rem',
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-container) 100%)',
          marginBottom: '1.25rem',
          boxShadow: '0 8px 32px rgba(135,78,0,0.2)',
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{
              color: 'var(--accent-on)', opacity: 0.85,
              fontSize: '0.8rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: '0.25rem',
            }}>
              {streak} Günlük Seri 🔥
            </p>
            <h2 className="headline-font" style={{
              fontSize: '1.6rem', fontWeight: 800,
              color: 'var(--accent-on)', lineHeight: 1.25,
              marginBottom: '0.875rem',
            }}>
              {greeting}
            </h2>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              padding: '0.5rem 0.875rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.3)',
            }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent-on)', fontSize: '1rem', fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span style={{ color: 'var(--accent-on)', fontSize: '0.8rem', fontWeight: 700 }}>
                {doneTasks}/{totalTasks} görev tamamlandı
              </span>
            </div>
          </div>
          {/* Big fire bg icon */}
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute', right: '-1rem', bottom: '-1.5rem',
              fontSize: '8rem', opacity: 0.15,
              color: 'var(--accent-on)',
              fontVariationSettings: "'FILL' 1",
              transform: 'rotate(10deg)',
            }}
          >
            local_fire_department
          </span>
        </div>

        {/* Progress card */}
        {profile && (
          <div style={{
            padding: '1.25rem',
            borderRadius: '1.25rem',
            background: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)',
            borderOpacity: 0.2,
            marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Yolculuğun
              </span>
              <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>
                %{progress} Tamamlandı
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {/* Start bubble */}
              <div style={{
                width: '3rem', height: '3rem', borderRadius: '50%',
                background: 'var(--color-surface-container)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.8rem',
                color: 'var(--color-on-surface)',
                flexShrink: 0,
              }}>
                {profile.startWeight}
              </div>

              {/* Track */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                  {/* Current position marker */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${progress}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '1.5rem', height: '1.5rem',
                    borderRadius: '50%',
                    background: 'var(--color-surface-container-lowest)',
                    border: '2.5px solid var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(135,78,0,0.3)',
                    zIndex: 2,
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: '0.75rem', color: 'var(--accent)',
                      fontVariationSettings: "'FILL' 1",
                    }}>person</span>
                  </div>
                </div>
              </div>

              {/* Goal bubble */}
              <div
                className={allDone ? 'animate-glow' : ''}
                style={{
                  width: '3.5rem', height: '3.5rem', borderRadius: '50%',
                  background: 'rgba(105,246,184,0.15)',
                  border: '2px solid #69f6b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                <span className="material-symbols-outlined" style={{
                  color: '#006947', fontSize: '1.4rem',
                  fontVariationSettings: "'FILL' 1",
                }}>emoji_events</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-on-surface-variant)' }}>
              <span>Başlangıç · {profile.startWeight} kg</span>
              <span style={{ color: '#006947', fontWeight: 700 }}>🏁 {profile.targetWeight} kg</span>
            </div>
          </div>
        )}

        {/* Daily tasks */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 className="headline-font" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-on-surface)' }}>
                Günlük Görevler
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-variant)', marginTop: '0.125rem' }}>
                Alışkanlıklarını tamamla, seri kur!
              </p>
            </div>
            {allDone && (
              <div className="animate-pop-in" style={{
                background: 'rgba(34,197,94,0.12)',
                color: '#16a34a',
                padding: '0.375rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                ✅ Hepsi tamam!
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.map(task => {
              const palette = TASK_PALETTE[task.color] || TASK_PALETTE.purple;
              const isJust  = justCompleted === task.id;

              return (
                <div
                  key={task.id}
                  style={{
                    padding: '1rem 1.125rem',
                    borderRadius: '1.25rem',
                    background: task.done
                      ? 'var(--color-surface-container-low)'
                      : 'var(--color-surface-container-lowest)',
                    border: `1.5px solid ${task.done ? palette.check + '40' : 'var(--color-outline-variant)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    transition: 'all 0.25s ease',
                    transform: isJust ? 'scale(0.97)' : 'scale(1)',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '2.75rem', height: '2.75rem', borderRadius: '50%',
                    background: palette.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'transform 0.3s',
                    transform: task.done ? 'scale(0.9)' : 'scale(1)',
                  }}>
                    <span className="material-symbols-outlined" style={{
                      color: palette.icon, fontSize: '1.25rem',
                      fontVariationSettings: task.done ? "'FILL' 1" : "'FILL' 0",
                    }}>
                      {task.icon}
                    </span>
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 700,
                      color: task.done ? 'var(--color-on-surface-variant)' : 'var(--color-on-surface)',
                      textDecoration: task.done ? 'line-through' : 'none',
                      fontSize: '0.95rem',
                    }}>
                      {task.label}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-on-surface-variant)', marginTop: '0.1rem' }}>
                      {task.subtitle}
                    </div>
                  </div>

                  {/* Check button */}
                  <button
                    onClick={(e) => handleToggle(task.id, e)}
                    className={`check-ring ${task.done ? 'done' : ''} ${task.color}`}
                    style={{
                      background: task.done ? palette.check : 'transparent',
                      borderColor: task.done ? palette.check : 'var(--color-outline-variant)',
                    }}
                    aria-label={task.done ? 'Tamamlandı, geri al' : 'Tamamla'}
                  >
                    <span className="material-symbols-outlined" style={{
                      color: task.done ? 'white' : 'var(--color-on-surface-variant)',
                      fontSize: '1.1rem',
                      fontVariationSettings: task.done ? "'FILL' 1, 'wght' 700" : "'FILL' 0",
                      transition: 'all 0.2s',
                    }}>
                      check
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick stats row */}
        {weightLog.length > 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
            <StatCard
              icon="trending_down"
              label="Toplam Verilen"
              value={`${(profile.startWeight - profile.weight).toFixed(1)} kg`}
              color="#22c55e"
            />
            <StatCard
              icon="flag"
              label="Kalan"
              value={`${Math.max(0, profile.weight - profile.targetWeight).toFixed(1)} kg`}
              color="var(--accent)"
            />
          </div>
        )}

      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddTask(true)}
        style={{
          position: 'fixed',
          right: '1.25rem',
          bottom: '5.5rem',
          width: '3.5rem', height: '3.5rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-container))',
          color: 'var(--accent-on)',
          border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(135,78,0,0.35)',
          zIndex: 50,
          transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="Yeni görev ekle"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>add</span>
      </button>

      {showAddTask && <AddTaskModal onClose={() => setShowAddTask(false)} />}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      padding: '1rem',
      borderRadius: '1.25rem',
      background: 'var(--color-surface-container-lowest)',
      border: '1px solid var(--color-outline-variant)',
    }}>
      <span className="material-symbols-outlined" style={{ color, fontSize: '1.25rem', fontVariationSettings: "'FILL' 1", marginBottom: '0.5rem', display: 'block' }}>
        {icon}
      </span>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', fontWeight: 600, marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div className="headline-font" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-on-surface)' }}>
        {value}
      </div>
    </div>
  );
}
