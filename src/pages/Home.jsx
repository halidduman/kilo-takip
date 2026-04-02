import React, { useState, useEffect, useCallback } from 'react';
import { useApp, IF_PROTOCOLS, calcDailyCalorieGoal } from '../context/AppContext';
import Confetti from '../components/Confetti';
import WeighInModal from '../components/WeighInModal';
import AddTaskModal from '../components/AddTaskModal';
import WaterCounter from '../components/WaterCounter';
import MealLogModal from '../components/MealLogModal';

// ── Zaman Yardımcıları ────────────────────────────────────────────────────────
function formatDuration(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function parseHHMM(str) {
  const [h, m] = (str ?? '12:00').split(':').map(Number);
  return h * 60 + m;
}

function getEatingStatus(eatStart, eatEnd) {
  const now   = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startM = parseHHMM(eatStart);
  const endM   = parseHHMM(eatEnd);
  const isEating = startM < endM
    ? nowMin >= startM && nowMin < endM
    : nowMin >= startM || nowMin < endM;
  return { isEating };
}

function minsUntilHHMM(hhmm) {
  const now   = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const target = parseHHMM(hhmm);
  let diff = target - nowMin;
  if (diff < 0) diff += 24 * 60;
  return diff;
}

// ── SVG Ring Progress ─────────────────────────────────────────────────────────
function FastingRing({ pct, isFasting, elapsedMs, targetHours, nextLabel, nextTime }) {
  const R  = 105;
  const C  = 2 * Math.PI * R;
  const offset = C * (1 - Math.min(pct, 1));

  return (
    <div className="fasting-ring-wrap" style={{ padding: '0.5rem 0 1rem' }}>
      <svg width="240" height="240" className="fasting-ring-svg">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#f97316" />
            <stop offset="100%" stopColor="#ff9800" />
          </linearGradient>
          <linearGradient id="eatingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx="120" cy="120" r={R} fill="none"
          stroke="var(--color-surface-container-high)"
          strokeWidth="14" />
        {/* Fill */}
        <circle cx="120" cy="120" r={R} fill="none"
          stroke={`url(#${isFasting ? 'ringGradient' : 'eatingGradient'})`}
          strokeWidth="14" strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>

      {/* Center Content */}
      <div className="fasting-ring-center" style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 180,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '0.68rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          color: isFasting ? '#f97316' : '#16a34a',
          marginBottom: '0.25rem',
        }}>
          {isFasting ? '🌙 Oruç Tutuluyor' : '🍽 Yemek Zamanı'}
        </div>
        <div className="headline-font" style={{
          fontSize: '1.9rem', fontWeight: 800,
          color: 'var(--color-on-surface)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatDuration(elapsedMs)}
        </div>
        <div style={{
          fontSize: '0.72rem',
          color: 'var(--color-on-surface-variant)',
          marginTop: '0.5rem',
          lineHeight: 1.4,
        }}>
          {nextLabel}<br />
          <strong style={{ color: 'var(--color-on-surface)', fontSize: '0.8rem' }}>{nextTime}</strong>
        </div>
      </div>
    </div>
  );
}

// ── Öğün Özet Kartı ───────────────────────────────────────────────────────────
const MEAL_CATS = [
  { id: 'breakfast', emoji: '🌅', label: 'Kahvaltı' },
  { id: 'lunch',     emoji: '🌞', label: 'Öğle'    },
  { id: 'dinner',    emoji: '🌙', label: 'Akşam'   },
  { id: 'snack',     emoji: '🍎', label: 'Ara'     },
];

function TodayMeals({ onAddMeal }) {
  const { state, dispatch } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const todayMeals = (state.mealLog ?? []).filter(m => m.date === today);
  const totalCal   = todayMeals.reduce((s, m) => s + (m.calories ?? 0), 0);

  return (
    <div style={{
      padding: '1rem 1.125rem',
      borderRadius: '1.25rem',
      background: 'var(--color-surface-container-lowest)',
      border: '1px solid var(--color-outline-variant)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-on-surface)' }}>🍴 Bugünkü Öğünler</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-on-surface-variant)' }}>
            {totalCal > 0 ? `Toplam: ${totalCal} kcal` : 'Henüz öğün eklenmedi'}
          </div>
        </div>
        <button onClick={onAddMeal} style={{
          width: '2.25rem', height: '2.25rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-container))',
          border: 'none',
          color: 'var(--accent-on)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add</span>
        </button>
      </div>

      {todayMeals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--color-on-surface-variant)', fontSize: '0.82rem' }}>
          Öğün yok. + ile ekle
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {todayMeals.slice(0, 4).map(meal => {
            const cat = MEAL_CATS.find(c => c.id === meal.category) ?? MEAL_CATS[0];
            return (
              <div key={meal.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.5rem 0.625rem',
                borderRadius: '0.75rem',
                background: 'var(--color-surface-container-low)',
              }}>
                <span style={{ fontSize: '1.1rem' }}>{cat.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-on-surface)' }}>{meal.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)' }}>
                    {cat.label} · {meal.time}
                  </div>
                </div>
                {meal.calories > 0 && (
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--accent)' }}>
                    {meal.calories} kcal
                  </div>
                )}
                <button onClick={() => dispatch({ type: 'DELETE_MEAL', payload: meal.id })} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-on-surface-variant)', padding: '0.25rem',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>close</span>
                </button>
              </div>
            );
          })}
          {todayMeals.length > 4 && (
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
              +{todayMeals.length - 4} öğün daha
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────
export default function Home({ onWeighIn }) {
  const { state, dispatch } = useApp();
  const { profile, fastingSession, fastingStreak, tasks, weightLog } = state;
  const [now, setNow]               = useState(Date.now());
  const [showAddTask, setShowAddTask]   = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState(null);
  const [showConfetti, setShowConfetti]     = useState(false);
  const [justCompleted, setJustCompleted]   = useState(null);

  // Saniyeye bir güncelle
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Oruç bilgileri
  const proto  = IF_PROTOCOLS.find(p => p.id === (profile?.fastingProtocol ?? '16:8')) ?? IF_PROTOCOLS[0];
  const isFastingActive = !!fastingSession;
  const elapsedMs = fastingSession
    ? Math.max(0, now - new Date(fastingSession.startTime).getTime())
    : 0;
  const targetMs = proto.fastHours * 3600000;
  const pct      = isFastingActive ? Math.min(1, elapsedMs / targetMs) : 0;

  // Yemek penceresi bilgisi
  const eatStart = profile?.eatStart ?? '12:00';
  const eatEnd   = profile?.eatEnd   ?? '20:00';
  const { isEating } = getEatingStatus(eatStart, eatEnd);

  // Sıradaki etkinliğe kalan süre metni
  let nextLabel = '', nextTime = '';
  if (isFastingActive) {
    const remaining = Math.max(0, targetMs - elapsedMs);
    nextLabel = remaining > 0 ? 'Oruca bitimine kalan' : 'Hedefine ulaştın! 🎉';
    nextTime  = remaining > 0 ? formatDuration(remaining) : '';
  } else if (isEating) {
    const minsLeft = minsUntilHHMM(eatEnd);
    nextLabel = 'Yemek penceresi bitiyor';
    nextTime  = `${Math.floor(minsLeft / 60)}s ${minsLeft % 60}dk sonra (${eatEnd})`;
  } else {
    const minsToEat = minsUntilHHMM(eatStart);
    nextLabel = 'Yemek penceresine kalan';
    nextTime  = `${Math.floor(minsToEat / 60)}s ${minsToEat % 60}dk (${eatStart})`;
  }

  // Kilo ilerleme
  const progress = profile
    ? Math.max(0, Math.min(100, Math.round(
        ((profile.startWeight - profile.weight) / (profile.startWeight - profile.targetWeight)) * 100
      )))
    : 0;

  // Haftalık tartı kontrolü
  const needsWeighIn = (() => {
    if (!state.lastWeighInDate) return false;
    return Math.floor((new Date() - new Date(state.lastWeighInDate)) / 86400000) >= 7;
  })();

  // Görev toggle
  const handleToggle = useCallback((id, e) => {
    const task = tasks.find(t => t.id === id);
    if (!task?.done) {
      const rect = e.currentTarget.getBoundingClientRect();
      setConfettiOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      setShowConfetti(false);
      requestAnimationFrame(() => setShowConfetti(true));
      setJustCompleted(id);
      setTimeout(() => setJustCompleted(null), 600);
    }
    dispatch({ type: 'TOGGLE_TASK', payload: id });
  }, [tasks, dispatch]);

  // Bugünkü öğün kalori toplamı
  const today = new Date().toISOString().slice(0, 10);
  const todayMeals  = (state.mealLog ?? []).filter(m => m.date === today);
  const totalCal    = todayMeals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const calorieGoal = profile ? calcDailyCalorieGoal(profile) : 2000;

  return (
    <div style={{ paddingTop: '3.75rem', paddingBottom: '6rem', minHeight: '100dvh', background: 'var(--color-background)' }}>
      {showConfetti && <Confetti origin={confettiOrigin} />}

      <div style={{ padding: '1rem 1.125rem', maxWidth: '480px', margin: '0 auto' }}>

        {/* ── Haftalık Tartı Uyarısı ──────────────────────────────────────── */}
        {needsWeighIn && (
          <div className="animate-slide-up" onClick={onWeighIn} style={{
            padding: '0.875rem 1.125rem',
            borderRadius: '1.25rem',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: 'white', marginBottom: '0.875rem',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.875rem',
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚖️</span>
            <div>
              <div style={{ fontWeight: 700 }}>Haftalık Tartı Zamanı!</div>
              <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>Kaç kilo oldun? Gir ve grafiğini güncelle.</div>
            </div>
            <span className="material-symbols-outlined" style={{ marginLeft: 'auto' }}>chevron_right</span>
          </div>
        )}

        {/* ── ANA ODAK: Aralıklı Oruç Dairesi ──────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface-container-lowest)',
          borderRadius: '1.75rem',
          border: '1px solid var(--color-outline-variant)',
          marginBottom: '0.875rem',
          overflow: 'hidden',
          boxShadow: isFastingActive ? '0 8px 32px rgba(255,152,0,0.12)' : 'none',
          transition: 'box-shadow 0.4s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '1.125rem 1.25rem 0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div className="headline-font" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-on-surface)' }}>
                🌙 Aralıklı Oruç
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-on-surface-variant)', marginTop: '0.125rem' }}>
                {proto.label} • {proto.eatHours}s yemek penceresi
              </div>
            </div>
            <div>
              {fastingStreak > 0 && (
                <div style={{
                  background: 'rgba(249,115,22,0.1)',
                  color: '#ea580c',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid rgba(249,115,22,0.25)',
                }}>
                  🔥 {fastingStreak} günlük seri
                </div>
              )}
            </div>
          </div>

          {/* Ring */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <FastingRing
              pct={pct}
              isFasting={isFastingActive}
              elapsedMs={elapsedMs}
              targetHours={proto.fastHours}
              nextLabel={nextLabel}
              nextTime={nextTime}
            />
          </div>

          {/* Kontrol Butonları */}
          <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', gap: '0.75rem' }}>
            {!isFastingActive ? (
              <button
                onClick={() => dispatch({ type: 'START_FAST' })}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f97316, #ff9800)',
                  color: 'white',
                  fontWeight: 800, fontSize: '0.95rem',
                  cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 6px 20px rgba(249,115,22,0.3)',
                  transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                Orucu Başlat
              </button>
            ) : (
              <>
                <button
                  onClick={() => dispatch({ type: 'END_FAST' })}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    borderRadius: '999px',
                    border: '2px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.08)',
                    color: '#dc2626',
                    fontWeight: 700, fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>stop_circle</span>
                  Orucumu Bitir
                </button>
                <div style={{
                  padding: '0.875rem 1rem',
                  borderRadius: '999px',
                  background: 'rgba(249,115,22,0.08)',
                  border: '2px solid rgba(249,115,22,0.2)',
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  fontSize: '0.82rem', fontWeight: 700, color: '#c2410c',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', fontVariationSettings: "'FILL' 1" }}>timer</span>
                  {Math.round(pct * 100)}%
                </div>
              </>
            )}
          </div>

          {/* Yemek Penceresi Bilgisi */}
          <div style={{
            margin: '0 1.25rem 1.25rem',
            padding: '0.75rem 1rem',
            borderRadius: '1rem',
            background: isEating
              ? 'rgba(34,197,94,0.07)'
              : 'rgba(249,115,22,0.05)',
            border: `1px solid ${isEating ? 'rgba(34,197,94,0.2)' : 'rgba(249,115,22,0.15)'}`,
            display: 'flex', alignItems: 'center', gap: '0.625rem',
          }}>
            <span style={{ fontSize: '1.1rem' }}>{isEating ? '🍽' : '🌙'}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-on-surface)' }}>
                {isEating ? `Yemek Zamanı: ${eatStart} – ${eatEnd}` : `Oruç: ${eatEnd} – ${eatStart}`}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)' }}>
                {isEating ? 'Pencerendeki son yemeği planlı ye' : 'Sadece su, çay, kahve (sade) içebilirsin'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Su Sayacı ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '0.875rem' }}>
          <WaterCounter compact />
        </div>

        {/* ── Kilo İlerleme ─────────────────────────────────────────────────── */}
        {profile && (
          <div style={{
            padding: '1rem 1.125rem',
            borderRadius: '1.25rem',
            background: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)',
            marginBottom: '0.875rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ⚖️ Kilo Yolculuğu
              </span>
              <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem' }}>
                %{progress}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '2.75rem', height: '2.75rem', borderRadius: '50%',
                background: 'var(--color-surface-container)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.75rem', color: 'var(--color-on-surface)',
                flexShrink: 0,
              }}>
                {profile.startWeight}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                  <div style={{
                    position: 'absolute', top: '50%', left: `${progress}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '1.5rem', height: '1.5rem', borderRadius: '50%',
                    background: 'var(--color-surface-container-lowest)',
                    border: '2.5px solid var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(135,78,0,0.3)',
                    zIndex: 2,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.7rem', color: 'var(--accent)', fontVariationSettings: "'FILL' 1" }}>person</span>
                  </div>
                </div>
              </div>
              <div style={{
                width: '3rem', height: '3rem', borderRadius: '50%',
                background: 'rgba(34,197,94,0.1)',
                border: '2px solid #22c55e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '1.3rem', fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-on-surface-variant)' }}>
              <span>Başlangıç · {profile.startWeight} kg</span>
              <span style={{ fontWeight: 700, color: 'var(--color-on-surface)' }}>Şimdi · {profile.weight} kg</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>🏁 {profile.targetWeight} kg</span>
            </div>
          </div>
        )}

        {/* ── Bugünkü Öğünler ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: '0.875rem' }}>
          <TodayMeals onAddMeal={() => setShowMealModal(true)} />
        </div>

        {/* ── Adım Görevi ───────────────────────────────────────────────────── */}
        {tasks.length > 0 && (
          <div style={{ marginBottom: '0.875rem' }}>
            <span className="section-label">🦶 Günlük Aktivite</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {tasks.map(task => {
                const isJust = justCompleted === task.id;
                return (
                  <div key={task.id} style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '1.25rem',
                    background: task.done ? 'var(--color-surface-container-low)' : 'var(--color-surface-container-lowest)',
                    border: `1.5px solid ${task.done ? '#dc262640' : 'var(--color-outline-variant)'}`,
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    transition: 'all 0.25s ease',
                    transform: isJust ? 'scale(0.97)' : 'scale(1)',
                  }}>
                    <div style={{
                      width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                      background: '#fff1f2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: '1.2rem', fontVariationSettings: task.done ? "'FILL' 1" : "'FILL' 0" }}>
                        {task.icon}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-on-surface)', textDecoration: task.done ? 'line-through' : 'none' }}>
                        {task.label}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--color-on-surface-variant)' }}>{task.subtitle}</div>
                    </div>
                    <button
                      onClick={(e) => handleToggle(task.id, e)}
                      className={`check-ring ${task.done ? 'done walk' : ''}`}
                      style={{
                        background: task.done ? '#dc2626' : 'transparent',
                        borderColor: task.done ? '#dc2626' : 'var(--color-outline-variant)',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{
                        color: task.done ? 'white' : 'var(--color-on-surface-variant)',
                        fontSize: '1rem',
                        fontVariationSettings: task.done ? "'FILL' 1" : "'FILL' 0",
                      }}>check</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* FAB — Görev Ekle */}
      <button
        onClick={() => setShowAddTask(true)}
        style={{
          position: 'fixed', right: '1.25rem', bottom: '5.5rem',
          width: '3.25rem', height: '3.25rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-container))',
          color: 'var(--accent-on)',
          border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(135,78,0,0.3)',
          zIndex: 50,
          transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="Yeni görev ekle"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.35rem' }}>add</span>
      </button>

      {showAddTask  && <AddTaskModal onClose={() => setShowAddTask(false)} />}
      {showMealModal && <MealLogModal onClose={() => setShowMealModal(false)} />}
    </div>
  );
}
