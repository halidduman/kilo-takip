import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Dot,
} from 'recharts';
import { useApp } from '../context/AppContext';

const TROPHY_DATA = [
  { days: 5,    icon: 'military_tech',    label: 'Başlangıç',   color: '#f97316' },
  { days: 10,   icon: 'star',             label: 'Düzenli',     color: '#eab308' },
  { days: 50,   icon: 'workspace_premium',label: 'Azimli',      color: '#22c55e' },
  { days: 100,  icon: 'emoji_events',     label: 'Efsane 100',  color: '#3b82f6' },
  { days: 150,  icon: 'diamond',          label: 'Elmas',       color: '#a855f7' },
  { days: 200,  icon: 'local_fire_department', label: 'Alev',  color: '#ef4444' },
  { days: 500,  icon: 'rocket_launch',    label: 'Roket',       color: '#06b6d4' },
  { days: 1000, icon: 'crown',            label: 'Kral/Kraliçe',color: '#f59e0b' },
];

const RANGE_OPTS = ['1H', '1A', '3A', 'Tümü'];
const RANGE_DAYS = { '1H': 7, '1A': 30, '3A': 90, 'Tümü': Infinity };

export default function Statistics() {
  const { state, TROPHY_MILESTONES } = useApp();
  const { profile, weightLog, streak, trophies, tasks } = state;
  const [range, setRange] = useState('1A');

  // Filtered weight data for chart
  const chartData = useMemo(() => {
    if (!weightLog.length) return [];
    const days = RANGE_DAYS[range];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return weightLog
      .filter(e => days === Infinity || new Date(e.date) >= cutoff)
      .map(e => ({
        date: e.date,
        weight: e.weight,
        label: new Date(e.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      }));
  }, [weightLog, range]);

  // ETA calculation (estimated arrival)
  const eta = useMemo(() => {
    if (!profile || weightLog.length < 2) return null;
    const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    const last  = sorted[sorted.length - 1];
    const daysPassed = Math.max(1, Math.floor((new Date(last.date) - new Date(first.date)) / 86400000));
    const kgLost = first.weight - last.weight;
    if (kgLost <= 0) return null;
    const ratePerDay = kgLost / daysPassed;
    const remaining  = last.weight - profile.targetWeight;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / ratePerDay);
  }, [weightLog, profile]);

  // ETA reference line date for chart
  const etaDate = useMemo(() => {
    if (!eta || !weightLog.length) return null;
    const last = new Date(weightLog[weightLog.length - 1].date);
    last.setDate(last.getDate() + eta);
    return last.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [eta, weightLog]);

  const currentWeight = profile?.weight ?? null;
  const startWeight   = profile?.startWeight ?? null;
  const targetWeight  = profile?.targetWeight ?? null;
  const totalLost     = startWeight && currentWeight ? (startWeight - currentWeight).toFixed(1) : null;
  const remaining     = currentWeight && targetWeight ? Math.max(0, currentWeight - targetWeight).toFixed(1) : null;

  const walkDone  = tasks.find(t => t.id === 'walk')?.done;
  const waterDone = tasks.find(t => t.id === 'water')?.done;

  // Motivational message based on progress
  const motivationMsg = useMemo(() => {
    if (!weightLog.length || weightLog.length < 3) return null;
    const recent = [...weightLog].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 3);
    const gained = recent[0].weight - recent[recent.length - 1].weight;
    if (gained > 1) return {
      icon: '⚠️',
      text: 'Diyette her şey yolunda mı? Biraz kilo almışız sanki. Toparlanma vakti!',
      color: '#f97316',
      bg: 'rgba(249,115,22,0.08)',
    };
    if (gained > 0.3) return {
      icon: '💪',
      text: 'Hafif bir artış var. Yürüyüşleri artır, su içmeyi unutma!',
      color: '#eab308',
      bg: 'rgba(234,179,8,0.08)',
    };
    return null;
  }, [weightLog]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'var(--color-surface-container-lowest)',
        border: '1px solid var(--color-outline-variant)',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginBottom: '0.25rem' }}>
          {payload[0]?.payload?.label}
        </div>
        <div className="headline-font" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
          {payload[0]?.value} kg
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingTop: '4rem', paddingBottom: '6rem', minHeight: '100dvh' }}>
      <div style={{ padding: '1.25rem', maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}>
          <h1 className="headline-font" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-on-surface)' }}>
            İstatistikler
          </h1>
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>
            İlerlemenin özeti ve başarıların
          </p>
        </div>

        {/* Motivational message */}
        {motivationMsg && (
          <div className="animate-slide-up" style={{
            padding: '1rem 1.25rem',
            borderRadius: '1.25rem',
            background: motivationMsg.bg,
            border: `1.5px solid ${motivationMsg.color}30`,
            marginBottom: '1.25rem',
            display: 'flex',
            gap: '0.875rem',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{motivationMsg.icon}</span>
            <p style={{ color: motivationMsg.color, fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.5 }}>
              {motivationMsg.text}
            </p>
          </div>
        )}

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <MiniStat label="Seri" value={`${streak} 🔥`} color="var(--accent)" />
          <MiniStat label="Verilen" value={totalLost ? `${totalLost}kg` : '—'} color="#22c55e" />
          <MiniStat label="Kalan" value={remaining ? `${remaining}kg` : '—'} color="#3b82f6" />
        </div>

        {/* ETA card */}
        {eta !== null && (
          <div className="animate-slide-up" style={{
            padding: '1.25rem',
            borderRadius: '1.25rem',
            background: 'linear-gradient(135deg, rgba(105,246,184,0.15), rgba(0,105,71,0.08))',
            border: '1.5px solid rgba(105,246,184,0.4)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <span style={{ fontSize: '2rem', flexShrink: 0 }}>🏁</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#006947', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                Tahmini Varış
              </div>
              <div className="headline-font" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-on-surface)' }}>
                {eta === 0 ? '🎉 Hedefe ulaştın!' : `~${eta} gün`}
              </div>
              {etaDate && eta > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-variant)', marginTop: '0.2rem' }}>
                  📅 Tahmini tarih: {etaDate}
                </div>
              )}
              {walkDone && (
                <div style={{ fontSize: '0.78rem', color: '#22c55e', marginTop: '0.35rem', fontWeight: 600 }}>
                  ✅ Bugün yürüdün! Süre kısalıyor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chart */}
        <div style={{
          padding: '1.25rem',
          borderRadius: '1.5rem',
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 className="headline-font" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-on-surface)' }}>
                Kilo Grafiği
              </h3>
              {totalLost && parseFloat(totalLost) > 0 && (
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#22c55e' }}>
                  ↓ {totalLost} kg verildi
                </span>
              )}
            </div>
            {/* Range selector */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-surface-container-low)', borderRadius: '0.75rem', padding: '0.25rem' }}>
              {RANGE_OPTS.map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    padding: '0.3rem 0.625rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: range === r ? 'var(--accent)' : 'transparent',
                    color: range === r ? 'var(--accent-on)' : 'var(--color-on-surface-variant)',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Be Vietnam Pro, sans-serif',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {chartData.length < 2 ? (
            <div style={{
              height: '10rem', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-on-surface-variant)', fontSize: '0.875rem',
              gap: '0.5rem',
            }}>
              <span style={{ fontSize: '2rem' }}>📊</span>
              <span>Haftalık tartı girdikçe grafik dolacak</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant)', fontFamily: 'Be Vietnam Pro' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant)', fontFamily: 'Be Vietnam Pro' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {targetWeight && (
                  <ReferenceLine
                    y={targetWeight}
                    stroke="#69f6b8"
                    strokeDasharray="6 3"
                    strokeWidth={2}
                    label={{ value: `Hedef ${targetWeight}kg`, position: 'insideTopRight', fontSize: 10, fill: '#006947', fontWeight: 700 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--accent)"
                  strokeWidth={3}
                  dot={<CustomDot />}
                  activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--color-surface-container-lowest)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Trophies */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="headline-font" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-on-surface)' }}>
              Başarılar 🏆
            </h3>
            <div style={{
              background: 'rgba(105,246,184,0.15)',
              color: '#005a3c',
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              {trophies.length}/{TROPHY_DATA.length} Kazanıldı
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            {TROPHY_DATA.map(t => {
              const earned = trophies.includes(t.days);
              return (
                <div
                  key={t.days}
                  className={earned ? 'animate-pop-in' : 'trophy-locked'}
                  style={{
                    padding: '1rem',
                    borderRadius: '1.25rem',
                    background: earned
                      ? 'var(--color-surface-container-lowest)'
                      : 'var(--color-surface-container)',
                    border: earned ? `1.5px solid ${t.color}40` : '1.5px solid transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '0.625rem',
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{
                    width: '3.25rem', height: '3.25rem',
                    borderRadius: '50%',
                    background: earned
                      ? `linear-gradient(135deg, ${t.color}33, ${t.color}66)`
                      : 'var(--color-surface-container-high)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: earned ? `0 4px 16px ${t.color}40` : 'none',
                  }}>
                    <span className="material-symbols-outlined" style={{
                      color: earned ? t.color : 'var(--color-outline)',
                      fontSize: '1.4rem',
                      fontVariationSettings: earned ? "'FILL' 1" : "'FILL' 0",
                    }}>
                      {t.icon}
                    </span>
                  </div>
                  <div>
                    <div style={{
                      fontWeight: 700, fontSize: '0.8rem',
                      color: earned ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                    }}>
                      {t.days} Gün
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-on-surface-variant)', marginTop: '0.1rem' }}>
                      {earned ? t.label : streak < t.days ? `${t.days - streak} gün kaldı` : '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{
      padding: '0.875rem',
      borderRadius: '1rem',
      background: 'var(--color-surface-container-lowest)',
      border: '1px solid var(--color-outline-variant)',
      textAlign: 'center',
    }}>
      <div className="headline-font" style={{ fontSize: '1.1rem', fontWeight: 800, color }}>
        {value}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)', fontWeight: 600, marginTop: '0.2rem' }}>
        {label}
      </div>
    </div>
  );
}

function CustomDot(props) {
  const { cx, cy, index, data } = props;
  const isLast = data && index === data.length - 1;
  return (
    <circle
      cx={cx} cy={cy}
      r={isLast ? 5 : 3}
      fill={isLast ? 'var(--accent)' : 'var(--accent-container)'}
      stroke={isLast ? 'var(--color-surface-container-lowest)' : 'transparent'}
      strokeWidth={2}
    />
  );
}
