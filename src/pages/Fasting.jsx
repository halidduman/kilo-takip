import React, { useState } from 'react';
import { useApp, IF_PROTOCOLS, calcDailyCalorieGoal } from '../context/AppContext';
import WaterCounter from '../components/WaterCounter';
import MealLogModal from '../components/MealLogModal';

const MEAL_CATS = [
  { id: 'breakfast', emoji: '🌅', label: 'Kahvaltı',     color: '#f97316' },
  { id: 'lunch',     emoji: '🌞', label: 'Öğle',         color: '#eab308' },
  { id: 'dinner',    emoji: '🌙', label: 'Akşam',        color: '#6366f1' },
  { id: 'snack',     emoji: '🍎', label: 'Atıştırmalık', color: '#22c55e' },
];

function dayLabel(dateStr) {
  const d    = new Date(dateStr);
  const now  = new Date();
  const diff = Math.floor((new Date(now.toDateString()) - new Date(d.toDateString())) / 86400000);
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Dün';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function Fasting() {
  const { state, dispatch } = useApp();
  const { profile, fastingLog, mealLog, fastingStreak, fastingSession } = state;
  const [showMealModal, setShowMealModal]   = useState(false);
  const [mealTab, setMealTab]               = useState('today');   // today | history
  const [selectedCat, setSelectedCat]       = useState(null);

  const today      = new Date().toISOString().slice(0, 10);
  const proto      = IF_PROTOCOLS.find(p => p.id === (profile?.fastingProtocol ?? '16:8')) ?? IF_PROTOCOLS[0];
  const goalCal    = profile ? calcDailyCalorieGoal(profile) : 2000;
  const todayMeals = (mealLog ?? []).filter(m => m.date === today);
  const totalCal   = todayMeals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const calPct     = Math.min(100, Math.round((totalCal / goalCal) * 100));

  // Son 7 gün oruç geçmişi
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const log = (fastingLog ?? []).find(l => l.date === ds);
    return { date: ds, log };
  });

  // Tüm geçmiş öğünler (bugün hariç)
  const historyMeals = [...(mealLog ?? [])]
    .filter(m => m.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Bugünkü kategorilere göre grupla
  const grouped = MEAL_CATS.map(cat => ({
    ...cat,
    items: todayMeals.filter(m => m.category === cat.id),
  }));

  return (
    <div style={{ paddingTop: '3.75rem', paddingBottom: '6rem', minHeight: '100dvh', background: 'var(--color-background)' }}>
      <div style={{ padding: '1rem 1.125rem', maxWidth: '480px', margin: '0 auto' }}>

        {/* ── Başlık ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 className="headline-font" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-on-surface)' }}>
            🌙 Oruç & Beslenme
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-variant)', marginTop: '0.25rem' }}>
            {proto.label} protokolü • {proto.fastHours}s oruç / {proto.eatHours}s yemek
          </p>
        </div>

        {/* ── Haftalık Oruç Geçmişi ────────────────────────────────────────── */}
        <div style={{
          padding: '1.125rem',
          borderRadius: '1.5rem',
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)',
          marginBottom: '0.875rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="section-label" style={{ margin: 0 }}>Son 7 Gün</div>
            {fastingStreak > 0 && (
              <div style={{
                background: 'rgba(249,115,22,0.1)',
                color: '#ea580c',
                padding: '0.2rem 0.625rem',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}>
                🔥 {fastingStreak} günlük seri
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'space-between' }}>
            {last7.map(({ date, log }) => {
              const isToday   = date === today;
              const active    = !!fastingSession && isToday;
              const completed = log?.completed;
              const partial   = log && !log.completed;
              const pctH      = log ? Math.min(100, Math.round((log.hoursCompleted / proto.fastHours) * 100)) : 0;

              return (
                <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
                  {/* Bar */}
                  <div style={{
                    width: '100%',
                    height: '56px',
                    borderRadius: '0.75rem',
                    background: 'var(--color-surface-container)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {(log || active) && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0, left: 0, right: 0,
                        height: `${active ? 30 : pctH}%`,
                        background: completed
                          ? 'linear-gradient(180deg, #22c55e, #16a34a)'
                          : active
                            ? 'linear-gradient(180deg, #f97316, #ea580c)'
                            : 'linear-gradient(180deg, #fbbf24, #d97706)',
                        borderRadius: '0.75rem',
                        transition: 'height 0.5s ease',
                        opacity: active ? 0.7 : 1,
                      }} />
                    )}
                    {completed && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem',
                      }}>✅</div>
                    )}
                    {active && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem',
                      }}>⏳</div>
                    )}
                    {!log && !active && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem',
                      }}>—</div>
                    )}
                  </div>
                  {/* Gün etiketi */}
                  <div style={{
                    fontSize: '0.6rem',
                    fontWeight: isToday ? 800 : 500,
                    color: isToday ? 'var(--accent)' : 'var(--color-on-surface-variant)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}>
                    {isToday ? 'Bug.' : new Date(date).toLocaleDateString('tr-TR', { weekday: 'short' }).slice(0,2)}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Açıklama */}
          <div style={{ marginTop: '0.875rem', display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--color-on-surface-variant)' }}>
            <span>✅ Tamamlandı</span>
            <span style={{ color: '#d97706' }}>🟡 Kısmi</span>
            <span style={{ color: '#ea580c' }}>⏳ Devam ediyor</span>
          </div>
        </div>

        {/* ── Su Takibi ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '0.875rem' }}>
          <WaterCounter compact={false} />
        </div>

        {/* ── Kalori Özeti ─────────────────────────────────────────────────── */}
        <div style={{
          padding: '1.125rem',
          borderRadius: '1.5rem',
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)',
          marginBottom: '0.875rem',
        }}>
          <div className="section-label">Bugünkü Kalori</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.875rem' }}>
            <div>
              <div className="headline-font" style={{
                fontSize: '2.25rem', fontWeight: 800,
                color: totalCal > goalCal ? '#ef4444' : 'var(--color-on-surface)',
              }}>
                {totalCal}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
                / {goalCal} kcal hedef
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                height: '10px', borderRadius: '999px',
                background: 'var(--color-surface-container-highest)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${calPct}%`,
                  borderRadius: '999px',
                  background: calPct > 100
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                    : calPct > 80
                      ? 'linear-gradient(90deg, #f97316, #ea580c)'
                      : 'linear-gradient(90deg, var(--accent), var(--accent-container))',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-on-surface-variant)', marginTop: '0.375rem', textAlign: 'right' }}>
                {calPct <= 100 ? `${goalCal - totalCal} kcal kaldı` : `${totalCal - goalCal} kcal aşıldı ⚠️`}
              </div>
            </div>
          </div>

          {/* Kategorilere göre kalori özeti */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {MEAL_CATS.map(cat => {
              const catCal = todayMeals.filter(m => m.category === cat.id).reduce((s, m) => s + (m.calories ?? 0), 0);
              return (
                <div key={cat.id} style={{
                  flex: 1,
                  padding: '0.5rem 0.25rem',
                  borderRadius: '0.75rem',
                  background: 'var(--color-surface-container-low)',
                  textAlign: 'center',
                  border: '1px solid var(--color-outline-variant)',
                }}>
                  <div style={{ fontSize: '1rem', marginBottom: '0.125rem' }}>{cat.emoji}</div>
                  <div className="headline-font" style={{ fontWeight: 800, fontSize: '0.8rem', color: catCal > 0 ? cat.color : 'var(--color-on-surface-variant)' }}>
                    {catCal > 0 ? catCal : '–'}
                  </div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--color-on-surface-variant)' }}>{cat.label.slice(0,3)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Öğün Listesi ─────────────────────────────────────────────────── */}
        <div style={{
          padding: '1.125rem',
          borderRadius: '1.5rem',
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)',
          marginBottom: '0.875rem',
        }}>
          {/* Tab */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.125rem' }}>
            {['today', 'history'].map(t => (
              <button key={t} onClick={() => setMealTab(t)} style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '0.875rem',
                border: 'none',
                background: mealTab === t ? 'var(--accent)' : 'var(--color-surface-container)',
                color: mealTab === t ? 'var(--accent-on)' : 'var(--color-on-surface-variant)',
                fontWeight: 700, fontSize: '0.82rem',
                cursor: 'pointer',
                fontFamily: 'Be Vietnam Pro, sans-serif',
                transition: 'all 0.2s',
              }}>
                {t === 'today' ? '🍽 Bugün' : '📋 Geçmiş'}
              </button>
            ))}
            <button onClick={() => setShowMealModal(true)} style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '0.875rem',
              border: 'none',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-container))',
              color: 'var(--accent-on)',
              fontWeight: 700, fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              fontFamily: 'Be Vietnam Pro, sans-serif',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
              Ekle
            </button>
          </div>

          {/* Bugün — Kategorilere Göre */}
          {mealTab === 'today' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {grouped.map(cat => (
                <div key={cat.id}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}>
                    <span style={{ fontSize: '1rem' }}>{cat.emoji}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: cat.color }}>{cat.label}</span>
                    {cat.items.length > 0 && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, color: cat.color }}>
                        {cat.items.reduce((s, m) => s + (m.calories ?? 0), 0)} kcal
                      </span>
                    )}
                  </div>
                  {cat.items.length === 0 ? (
                    <button
                      onClick={() => { setShowMealModal(true); }}
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        borderRadius: '0.875rem',
                        border: '1.5px dashed var(--color-outline-variant)',
                        background: 'transparent',
                        color: 'var(--color-on-surface-variant)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0.375rem',
                        fontFamily: 'Be Vietnam Pro, sans-serif',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>add</span>
                      {cat.label} ekle
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {cat.items.map(meal => (
                        <div key={meal.id} style={{
                          display: 'flex', alignItems: 'center',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.875rem',
                          background: 'var(--color-surface-container-low)',
                          gap: '0.625rem',
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-on-surface)' }}>
                              {meal.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-on-surface-variant)' }}>{meal.time}</div>
                          </div>
                          {meal.calories > 0 && (
                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: cat.color }}>{meal.calories} kcal</div>
                          )}
                          <button onClick={() => dispatch({ type: 'DELETE_MEAL', payload: meal.id })} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--color-on-surface-variant)', padding: '0.2rem',
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Geçmiş */}
          {mealTab === 'history' && (
            <div>
              {historyMeals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-on-surface-variant)', fontSize: '0.85rem' }}>
                  Henüz öğün geçmişi yok
                </div>
              ) : (() => {
                // Tarihe göre grupla
                const byDate = {};
                historyMeals.forEach(m => {
                  if (!byDate[m.date]) byDate[m.date] = [];
                  byDate[m.date].push(m);
                });
                return Object.entries(byDate).slice(0, 7).map(([date, meals]) => {
                  const dayTotal = meals.reduce((s, m) => s + (m.calories ?? 0), 0);
                  return (
                    <div key={date} style={{ marginBottom: '1rem' }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                        fontSize: '0.78rem', fontWeight: 700,
                        color: 'var(--color-on-surface-variant)',
                      }}>
                        <span>{dayLabel(date)}</span>
                        {dayTotal > 0 && <span style={{ color: 'var(--accent)' }}>{dayTotal} kcal</span>}
                      </div>
                      {meals.map(meal => {
                        const cat = MEAL_CATS.find(c => c.id === meal.category) ?? MEAL_CATS[0];
                        return (
                          <div key={meal.id} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.45rem 0.75rem',
                            borderRadius: '0.875rem',
                            background: 'var(--color-surface-container-low)',
                            marginBottom: '0.3rem',
                          }}>
                            <span style={{ fontSize: '0.9rem' }}>{cat.emoji}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-on-surface)' }}>{meal.name}</div>
                            </div>
                            {meal.calories > 0 && (
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: cat.color }}>{meal.calories}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* ── Hesap Verebilirlik Bilgisi ────────────────────────────────────── */}
        {profile?.accountabilityFriend?.name && (
          <div style={{
            padding: '1rem 1.125rem',
            borderRadius: '1.25rem',
            background: 'rgba(99,102,241,0.07)',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1.75rem' }}>👥</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-on-surface)' }}>
                {profile.accountabilityFriend.name} izliyor
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-on-surface-variant)' }}>
                2 hafta hedef tutturulamazsa haberdar edilir
              </div>
            </div>
            {profile.accountabilityFriend.phone && (
              <a
                href={`https://wa.me/${profile.accountabilityFriend.phone.replace(/\D/g,'')}?text=Merhaba%20${profile.accountabilityFriend.name}!%20Biraz%20motivasyon%20lazım%20🙈`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '0.5rem 0.875rem',
                  borderRadius: '999px',
                  background: '#25d366',
                  color: 'white',
                  fontWeight: 700, fontSize: '0.75rem',
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>message</span>
                Yaz
              </a>
            )}
          </div>
        )}

      </div>

      {showMealModal && <MealLogModal onClose={() => setShowMealModal(false)} />}
    </div>
  );
}
