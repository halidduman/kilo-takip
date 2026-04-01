import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const STEPS = ['info', 'goal', 'target'];

export default function Onboarding() {
  const { dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [weight, setWeight]   = useState('');
  const [height, setHeight]   = useState('');
  const [age, setAge]         = useState('');
  const [goalType, setGoalType] = useState('lose'); // lose | healthy | muscle
  const [targetWeight, setTargetWeight] = useState('');

  const bmi = weight && height
    ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)
    : null;

  const suggestedTarget = height
    ? Math.round(22.5 * Math.pow(parseFloat(height) / 100, 2))
    : null;

  function handleStart() {
    if (!weight || !height || !age) return;
    const tw = parseFloat(targetWeight) || suggestedTarget || parseFloat(weight) - 10;
    dispatch({
      type: 'SETUP_PROFILE',
      payload: {
        weight: parseFloat(weight),
        height: parseFloat(height),
        age: parseInt(age),
        targetWeight: tw,
        startWeight: parseFloat(weight),
        startDate: new Date().toISOString().slice(0, 10),
        goal: goalType,
      },
    });
  }

  const canNext0 = weight && height && age;
  const canFinish = targetWeight || suggestedTarget;

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--color-background)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-8rem', right: '-5rem',
        width: '18rem', height: '18rem',
        background: 'radial-gradient(circle, rgba(255,152,0,0.18) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '-4rem',
        width: '14rem', height: '14rem',
        background: 'radial-gradient(circle, rgba(105,246,184,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ flex: 1, padding: '3rem 1.5rem 2rem', maxWidth: '480px', margin: '0 auto', width: '100%' }}>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? '2rem' : '0.5rem',
              height: '0.5rem',
              borderRadius: '999px',
              background: i <= step ? 'var(--accent)' : 'var(--color-outline-variant)',
              transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            }} />
          ))}
        </div>

        {/* STEP 0: Info */}
        {step === 0 && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👋</div>
              <h1 className="headline-font" style={{
                fontSize: '2rem', fontWeight: 800,
                color: 'var(--color-on-surface)', marginBottom: '0.5rem', lineHeight: 1.2
              }}>
                Yeni Bir Başlangıç
              </h1>
              <p style={{ color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>
                Hedeflerine ulaşman için önce seni tanıyalım.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
              <div>
                <label style={labelStyle}>Kilo (kg)</label>
                <input
                  type="number" className="kg-input" placeholder="85"
                  value={weight} onChange={e => setWeight(e.target.value)}
                  min="30" max="300" step="0.1"
                />
              </div>
              <div>
                <label style={labelStyle}>Boy (cm)</label>
                <input
                  type="number" className="kg-input" placeholder="175"
                  value={height} onChange={e => setHeight(e.target.value)}
                  min="100" max="250"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Yaş</label>
              <input
                type="number" className="kg-input" placeholder="28"
                value={age} onChange={e => setAge(e.target.value)}
                min="10" max="120"
              />
            </div>

            {/* BMI preview */}
            {bmi && (
              <div className="animate-pop-in" style={{
                padding: '1rem 1.25rem',
                borderRadius: '1rem',
                background: 'var(--color-surface-container-low)',
                border: '1px solid var(--color-outline-variant)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Vücut Kitle İndeksi
                  </div>
                  <div className="headline-font" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)' }}>
                    {bmi}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: getBmiColor(bmi) }}>
                    {getBmiLabel(bmi)}
                  </div>
                  {suggestedTarget && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '0.25rem' }}>
                      İdeal: ~{suggestedTarget} kg
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(1)}
              disabled={!canNext0}
              style={primaryBtnStyle(canNext0)}
            >
              Devam Et
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}

        {/* STEP 1: Goal type */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎯</div>
              <h2 className="headline-font" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '0.5rem' }}>
                Hedefin Ne?
              </h2>
              <p style={{ color: 'var(--color-on-surface-variant)' }}>
                Sana en uygun planı hazırlayalım.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2rem' }}>
              {GOALS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGoalType(g.id)}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '1.25rem',
                    border: goalType === g.id
                      ? '2px solid var(--accent)'
                      : '2px solid var(--color-outline-variant)',
                    background: goalType === g.id
                      ? 'rgba(135,78,0,0.08)'
                      : 'var(--color-surface-container-low)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: '3rem', height: '3rem',
                    borderRadius: '50%',
                    background: goalType === g.id ? 'var(--accent)' : 'var(--color-surface-container-high)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}>
                    <span className="material-symbols-outlined" style={{
                      color: goalType === g.id ? 'var(--accent-on)' : 'var(--color-on-surface-variant)',
                      fontVariationSettings: "'FILL' 1",
                    }}>{g.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '0.125rem' }}>
                      {g.label}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                      {g.desc}
                    </div>
                  </div>
                  {goalType === g.id && (
                    <span className="material-symbols-outlined" style={{ marginLeft: 'auto', color: 'var(--accent)', fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setStep(0)} style={secondaryBtnStyle}>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button onClick={() => setStep(2)} style={{ ...primaryBtnStyle(true), flex: 1 }}>
                Devam Et
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Target weight */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏁</div>
              <h2 className="headline-font" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '0.5rem' }}>
                Hedef Kilonu Gir
              </h2>
              <p style={{ color: 'var(--color-on-surface-variant)' }}>
                Başlangıç: <strong>{weight} kg</strong>
                {suggestedTarget && <> · VKİ Önerisi: <strong style={{ color: 'var(--accent)' }}>{suggestedTarget} kg</strong></>}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Hedef Kilo (kg)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number" className="kg-input"
                  placeholder={suggestedTarget ?? '75'}
                  value={targetWeight}
                  onChange={e => setTargetWeight(e.target.value)}
                  min="30" max="300" step="0.5"
                  style={{ textAlign: 'center', fontSize: '2rem' }}
                />
              </div>
            </div>

            {suggestedTarget && !targetWeight && (
              <button
                onClick={() => setTargetWeight(String(suggestedTarget))}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '1rem',
                  border: '2px dashed var(--accent)',
                  background: 'rgba(135,78,0,0.05)',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontFamily: 'Be Vietnam Pro, sans-serif',
                }}
              >
                <span className="material-symbols-outlined">auto_fix_high</span>
                VKİ önerisini kullan ({suggestedTarget} kg)
              </button>
            )}

            {/* Journey preview */}
            {(targetWeight || suggestedTarget) && (
              <div className="animate-pop-in" style={{
                padding: '1.25rem',
                borderRadius: '1.25rem',
                background: 'var(--color-surface-container-low)',
                marginBottom: '1.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  <div style={{
                    width: '3rem', height: '3rem', borderRadius: '50%',
                    background: 'var(--color-surface-container)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.9rem',
                    color: 'var(--color-on-surface)',
                    flexShrink: 0,
                  }}>
                    {weight}
                  </div>
                  <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'var(--color-surface-container-high)', overflow: 'hidden' }}>
                    <div style={{ width: '0%', height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-container))' }} />
                  </div>
                  <div style={{
                    width: '3.5rem', height: '3.5rem', borderRadius: '50%',
                    background: 'rgba(105,246,184,0.2)',
                    border: '2px solid #69f6b8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span className="material-symbols-outlined" style={{ color: '#006947', fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                  <span>Başlangıç</span>
                  <span style={{ color: '#006947', fontWeight: 700 }}>{targetWeight || suggestedTarget} kg 🏆</span>
                </div>
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--color-surface-container)', fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>
                  📉 Vermesi gereken: <strong style={{ color: 'var(--accent)' }}>
                    {(parseFloat(weight) - (parseFloat(targetWeight) || suggestedTarget)).toFixed(1)} kg
                  </strong>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setStep(1)} style={secondaryBtnStyle}>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button
                onClick={handleStart}
                disabled={!canFinish}
                style={{ ...primaryBtnStyle(canFinish), flex: 1 }}
              >
                Hadi Başlayalım! 🔥
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Helpers --- */
const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'var(--color-on-surface-variant)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '0.5rem',
};

const primaryBtnStyle = (enabled) => ({
  width: '100%',
  padding: '1rem 1.5rem',
  borderRadius: '999px',
  border: 'none',
  background: enabled
    ? 'linear-gradient(135deg, var(--accent), var(--accent-container))'
    : 'var(--color-surface-container-high)',
  color: enabled ? 'var(--accent-on)' : 'var(--color-on-surface-variant)',
  fontWeight: 800,
  fontSize: '1rem',
  cursor: enabled ? 'pointer' : 'not-allowed',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  transition: 'opacity 0.2s',
  boxShadow: enabled ? '0 8px 24px rgba(135,78,0,0.25)' : 'none',
});

const secondaryBtnStyle = {
  padding: '1rem',
  borderRadius: '999px',
  border: '2px solid var(--color-outline-variant)',
  background: 'transparent',
  color: 'var(--color-on-surface-variant)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Be Vietnam Pro, sans-serif',
};

const GOALS = [
  { id: 'lose',    icon: 'fitness_center', label: 'Kilo Ver',       desc: 'Yağ yakmak ve zayıflamak istiyorum' },
  { id: 'healthy', icon: 'spa',            label: 'Sağlıklı Yaşam', desc: 'Düzenli alışkanlıklar edinmek istiyorum' },
  { id: 'muscle',  icon: 'bolt',           label: 'Kas Kazan',      desc: 'Kilo alıp kas kütlemi artırmak istiyorum' },
];

function getBmiLabel(bmi) {
  const b = parseFloat(bmi);
  if (b < 18.5) return 'Zayıf';
  if (b < 25)   return '✅ Normal';
  if (b < 30)   return '⚠️ Fazla Kilolu';
  return '🔴 Obez';
}
function getBmiColor(bmi) {
  const b = parseFloat(bmi);
  if (b < 18.5) return '#3b82f6';
  if (b < 25)   return '#22c55e';
  if (b < 30)   return '#f97316';
  return '#ef4444';
}
