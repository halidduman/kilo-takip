import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp, IF_PROTOCOLS, calcBMR, calcTDEE } from '../context/AppContext';

const TOTAL_STEPS = 7;

// ─── Tekerlek Picker Bileşeni ────────────────────────────────────────────────
function WheelPicker({ items, value, onChange, unit = '' }) {
  const ITEM_H = 50;
  const VISIBLE = 4; // padding each side
  const idx = items.findIndex(i => String(i) === String(value));
  const startIdx = idx < 0 ? 0 : idx;
  const [offset, setOffset] = useState(-startIdx * ITEM_H);
  const dragRef = useRef({ active: false, startY: 0, startOffset: 0 });

  const clampOffset = useCallback((o) => {
    const min = -(items.length - 1) * ITEM_H;
    const max = 0;
    return Math.max(min, Math.min(max, o));
  }, [items.length]);

  const snap = useCallback((o) => {
    const raw = -o / ITEM_H;
    const snapped = Math.round(raw);
    const clamped = Math.max(0, Math.min(items.length - 1, snapped));
    const newOffset = -clamped * ITEM_H;
    setOffset(newOffset);
    onChange(items[clamped]);
  }, [items, onChange]);

  const onPointerDown = (e) => {
    dragRef.current = { active: true, startY: e.clientY, startOffset: offset };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current.active) return;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(clampOffset(dragRef.current.startOffset + dy));
  };
  const onPointerUp = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    snap(offset);
  };

  const onWheel = (e) => {
    e.preventDefault();
    snap(clampOffset(offset - Math.sign(e.deltaY) * ITEM_H));
  };

  const currentIdx = Math.round(-offset / ITEM_H);

  return (
    <div
      className="picker-wheel"
      style={{ height: `${(VISIBLE * 2 + 1) * ITEM_H}px`, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
    >
      <div className="picker-selector" />
      <div
        className="picker-track"
        style={{ transform: `translateY(${offset + VISIBLE * ITEM_H}px)` }}
      >
        {items.map((item, i) => (
          <div
            key={item}
            className={`picker-item${i === currentIdx ? ' selected' : ''}`}
          >
            {item}{unit && i === currentIdx ? <span style={{ fontSize: '1rem', marginLeft: 4 }}>{unit}</span> : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Yardımcı ────────────────────────────────────────────────────────────────
function range(from, to, step = 1) {
  const arr = [];
  for (let i = from; i <= to; i += step) arr.push(i);
  return arr;
}

const WEIGHTS = range(30, 250, 0.5).map(v => v.toFixed(1));
const HEIGHTS = range(100, 230);
const AGES    = range(10, 100);
const SLEEP_H = range(4, 12, 0.5).map(v => v.toFixed(1));

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

const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'var(--color-on-surface-variant)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '0.5rem',
};
const primaryBtn = (enabled) => ({
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
const secondaryBtn = {
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

// ─── Onboarding Ana Bileşen ──────────────────────────────────────────────────
export default function Onboarding() {
  const { dispatch } = useApp();
  const [step, setStep] = useState(0);

  // Step 0 — Temel Bilgiler
  const [weight, setWeight] = useState('85.0');
  const [height, setHeight] = useState(175);
  const [age, setAge]       = useState(28);
  const [gender, setGender] = useState('male');

  // Step 1 — Hedef Türü
  const [goalType, setGoalType] = useState('lose');

  // Step 2 — Hedef Kilo & Haftalık
  const [targetWeight, setTargetWeight]       = useState('');
  const [weeklyWeightGoal, setWeeklyWeightGoal] = useState(0.5);

  // Step 3 — IF Protokolü
  const [protocol, setProtocol] = useState('16:8');

  // Step 4 — Öğün & Yemek saatleri
  const [mealCount, setMealCount] = useState(3);
  const [eatStart, setEatStart]   = useState('12:00');
  const [eatEnd, setEatEnd]       = useState('20:00');

  // Step 5 — Uyku
  const [sleepHours, setSleepHours] = useState('7.0');

  // Step 6 — Hesap Verebilirlik
  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');

  // BMI + öneri hesapla
  const bmi = weight && height
    ? (parseFloat(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1)
    : null;
  const suggestedTarget = height
    ? Math.round(22.5 * Math.pow(Number(height) / 100, 2))
    : null;

  // IF protokolüne göre yemek penceresini otomatik ayarla
  const selectedProto = IF_PROTOCOLS.find(p => p.id === protocol);
  useEffect(() => {
    if (!selectedProto) return;
    const startH = 12;
    const endH   = startH + selectedProto.eatHours;
    setEatStart(`${String(startH).padStart(2,'0')}:00`);
    setEatEnd(`${String(endH > 24 ? endH - 24 : endH).padStart(2,'0')}:00`);
  }, [protocol]);

  // Kalori tahmini
  const w = parseFloat(weight) || 80;
  const h = Number(height) || 175;
  const a = Number(age) || 28;
  const bmrVal  = calcBMR({ weight: w, height: h, age: a, gender });
  const tdeeVal = calcTDEE(bmrVal);
  const dailyDeficit = Math.round((weeklyWeightGoal * 7700) / 7);
  const calorieGoal  = Math.max(1200, tdeeVal - dailyDeficit);

  function handleFinish() {
    const tw = parseFloat(targetWeight) || suggestedTarget || parseFloat(weight) - 10;
    dispatch({
      type: 'SETUP_PROFILE',
      payload: {
        weight: parseFloat(weight),
        height: Number(height),
        age: Number(age),
        gender,
        targetWeight: tw,
        startWeight: parseFloat(weight),
        startDate: new Date().toISOString().slice(0, 10),
        goal: goalType,
        weeklyWeightGoal,
        activityLevel: 'sedentary',
        sleepHours: parseFloat(sleepHours),
        mealCount,
        fastingProtocol: protocol,
        eatStart,
        eatEnd,
        accountabilityFriend: friendName ? { name: friendName, phone: friendPhone } : null,
      },
    });
  }

  const stepDots = (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem', marginBottom: '2rem' }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? '1.75rem' : '0.45rem',
          height: '0.45rem',
          borderRadius: '999px',
          background: i < step ? 'var(--accent)' : i === step ? 'var(--accent)' : 'var(--color-outline-variant)',
          opacity: i > step ? 0.5 : 1,
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      ))}
    </div>
  );

  const nav = (canGo, onNext, label = 'Devam Et') => (
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
      {step > 0 && (
        <button onClick={() => setStep(s => s - 1)} style={secondaryBtn}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      )}
      <button onClick={onNext} disabled={!canGo} style={{ ...primaryBtn(canGo), flex: 1 }}>
        {label}
        <span className="material-symbols-outlined">{label === 'Devam Et' ? 'arrow_forward' : 'check'}</span>
      </button>
    </div>
  );

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
        position: 'absolute', top: '-6rem', right: '-4rem',
        width: '16rem', height: '16rem',
        background: 'radial-gradient(circle, rgba(255,152,0,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '8%', left: '-4rem',
        width: '14rem', height: '14rem',
        background: 'radial-gradient(circle, rgba(105,246,184,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ flex: 1, padding: '2.5rem 1.5rem 2rem', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        {stepDots}

        {/* ── STEP 0: Temel Bilgiler ────────────────────────────────────────── */}
        {step === 0 && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👋</div>
              <h1 className="headline-font" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>
                Yeni Bir Başlangıç
              </h1>
              <p style={{ color: 'var(--color-on-surface-variant)', lineHeight: 1.6, fontSize: '0.9rem' }}>
                Seni tanıyalım ve kişisel planını hazırlayalım.
              </p>
            </div>

            {/* Cinsiyet */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Cinsiyet</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[{ id: 'male', label: '👨 Erkek' }, { id: 'female', label: '👩 Kadın' }].map(g => (
                  <button key={g.id} onClick={() => setGender(g.id)} style={{
                    flex: 1, padding: '0.875rem',
                    borderRadius: '1rem',
                    border: `2px solid ${gender === g.id ? 'var(--accent)' : 'var(--color-outline-variant)'}`,
                    background: gender === g.id ? 'rgba(135,78,0,0.07)' : 'var(--color-surface-container-low)',
                    fontWeight: 700, fontSize: '0.95rem',
                    color: gender === g.id ? 'var(--accent)' : 'var(--color-on-surface)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'Be Vietnam Pro, sans-serif',
                  }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
              {/* Kilo Picker */}
              <div>
                <label style={labelStyle}>Kilo (kg)</label>
                <div style={{
                  background: 'var(--color-surface-container-low)',
                  borderRadius: '1rem',
                  border: '2px solid var(--color-outline-variant)',
                  overflow: 'hidden',
                }}>
                  <WheelPicker
                    items={WEIGHTS}
                    value={weight}
                    onChange={setWeight}
                    unit="kg"
                  />
                </div>
              </div>
              {/* Boy Picker */}
              <div>
                <label style={labelStyle}>Boy (cm)</label>
                <div style={{
                  background: 'var(--color-surface-container-low)',
                  borderRadius: '1rem',
                  border: '2px solid var(--color-outline-variant)',
                  overflow: 'hidden',
                }}>
                  <WheelPicker
                    items={HEIGHTS}
                    value={height}
                    onChange={setHeight}
                    unit="cm"
                  />
                </div>
              </div>
            </div>

            {/* Yaş Picker */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Yaş</label>
              <div style={{
                background: 'var(--color-surface-container-low)',
                borderRadius: '1rem',
                border: '2px solid var(--color-outline-variant)',
                overflow: 'hidden',
                height: 100,
              }}>
                <WheelPicker items={AGES} value={age} onChange={setAge} unit="yaş" />
              </div>
            </div>

            {/* BMI Önizleme */}
            {bmi && (
              <div className="animate-pop-in" style={{
                padding: '1rem 1.25rem',
                borderRadius: '1rem',
                background: 'var(--color-surface-container-low)',
                border: '1px solid var(--color-outline-variant)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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

            {nav(true, () => setStep(1))}
          </div>
        )}

        {/* ── STEP 1: Hedef Türü ───────────────────────────────────────────── */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</div>
              <h2 className="headline-font" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>
                Hedefin Ne?
              </h2>
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.9rem' }}>
                Sana en uygun planı hazırlayacağız.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
              {[
                { id: 'lose',    icon: 'fitness_center', label: 'Kilo Ver',       desc: 'Yağ yakmak ve zayıflamak istiyorum', emoji: '⚖️' },
                { id: 'healthy', icon: 'spa',            label: 'Sağlıklı Yaşam', desc: 'Düzenli alışkanlıklar edinmek istiyorum', emoji: '🌱' },
                { id: 'muscle',  icon: 'bolt',           label: 'Kas Kazan',      desc: 'Kilo alıp kas kütlemi artırmak istiyorum', emoji: '💪' },
              ].map(g => (
                <button key={g.id} onClick={() => setGoalType(g.id)} style={{
                  padding: '1.125rem',
                  borderRadius: '1.25rem',
                  border: goalType === g.id ? '2px solid var(--accent)' : '2px solid var(--color-outline-variant)',
                  background: goalType === g.id ? 'rgba(135,78,0,0.06)' : 'var(--color-surface-container-lowest)',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}>
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>{g.emoji}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '0.1rem' }}>{g.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-on-surface-variant)' }}>{g.desc}</div>
                  </div>
                  {goalType === g.id && (
                    <span className="material-symbols-outlined" style={{ marginLeft: 'auto', color: 'var(--accent)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                </button>
              ))}
            </div>

            {nav(true, () => setStep(2))}
          </div>
        )}

        {/* ── STEP 2: Hedef Kilo & Haftalık Plan ──────────────────────────── */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏁</div>
              <h2 className="headline-font" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>
                Hedef & Plan
              </h2>
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.9rem' }}>
                Başlangıç: <strong>{weight} kg</strong>
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Hedef Kilo (kg)</label>
              <div style={{
                background: 'var(--color-surface-container-low)',
                borderRadius: '1rem',
                border: '2px solid var(--color-outline-variant)',
                overflow: 'hidden',
              }}>
                <WheelPicker
                  items={WEIGHTS}
                  value={targetWeight || String(suggestedTarget || (parseFloat(weight) - 10).toFixed(1))}
                  onChange={setTargetWeight}
                  unit="kg"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Haftada Kaç Kg Vermek İstiyorsun?</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[0.25, 0.5, 0.75, 1.0].map(v => (
                  <button key={v} onClick={() => setWeeklyWeightGoal(v)} style={{
                    flex: 1,
                    padding: '0.75rem 0.25rem',
                    borderRadius: '0.875rem',
                    border: weeklyWeightGoal === v ? '2px solid var(--accent)' : '2px solid var(--color-outline-variant)',
                    background: weeklyWeightGoal === v ? 'rgba(135,78,0,0.08)' : 'var(--color-surface-container-low)',
                    fontWeight: 800, fontSize: '0.85rem',
                    color: weeklyWeightGoal === v ? 'var(--accent)' : 'var(--color-on-surface)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>
                    {v} kg
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
                💡 <strong>0.5 kg/hafta</strong> sağlıklı ve sürdürülebilir hız
              </div>
            </div>

            {/* Kalori Tahmini */}
            <div style={{
              padding: '1rem 1.25rem',
              borderRadius: '1.25rem',
              background: 'linear-gradient(135deg, rgba(135,78,0,0.07), rgba(255,152,0,0.05))',
              border: '1px solid rgba(135,78,0,0.15)',
              marginBottom: '0.5rem',
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Günlük Kalori Hedefin
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="headline-font" style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent)' }}>
                  {calorieGoal}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>
                  kcal/gün<br />
                  <span style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>TDEE: {tdeeVal}</span> • Açık: {dailyDeficit > 0 ? `-${dailyDeficit}` : '0'}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-on-surface-variant)', marginTop: '0.5rem' }}>
                Mifflin-St Jeor formülü kullanıldı
              </div>
            </div>

            {nav(true, () => setStep(3))}
          </div>
        )}

        {/* ── STEP 3: IF Protokolü ─────────────────────────────────────────── */}
        {step === 3 && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌙</div>
              <h2 className="headline-font" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>
                Aralıklı Oruç
              </h2>
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.9rem' }}>
                Oruç protokolünü seç. <strong style={{ color: 'var(--accent)' }}>16:8 başlangıç için en iyisi.</strong>
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {IF_PROTOCOLS.map(p => (
                <button key={p.id} className={`proto-card${protocol === p.id ? ' selected' : ''}`} onClick={() => setProtocol(p.id)}>
                  <div style={{
                    width: '3rem', height: '3rem', borderRadius: '50%',
                    background: protocol === p.id ? 'var(--accent)' : 'var(--color-surface-container)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem', flexShrink: 0, transition: 'all 0.2s',
                  }}>
                    {p.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
                      <span className="headline-font" style={{ fontWeight: 800, fontSize: '1.1rem', color: protocol === p.id ? 'var(--accent)' : 'var(--color-on-surface)' }}>
                        {p.label}
                      </span>
                      {p.id === '16:8' && (
                        <span style={{
                          background: 'rgba(34,197,94,0.12)', color: '#15803d',
                          padding: '0.1rem 0.5rem', borderRadius: '999px',
                          fontSize: '0.65rem', fontWeight: 700,
                        }}>Önerilen</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-on-surface-variant)', marginBottom: '0.125rem' }}>{p.desc}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-on-surface-variant)', opacity: 0.8 }}>{p.tip}</div>
                  </div>
                  {protocol === p.id && (
                    <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>check_circle</span>
                  )}
                </button>
              ))}
            </div>

            {nav(true, () => setStep(4))}
          </div>
        )}

        {/* ── STEP 4: Öğün & Yemek Saatleri ──────────────────────────────── */}
        {step === 4 && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍽</div>
              <h2 className="headline-font" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>
                Öğün Düzeni
              </h2>
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.9rem' }}>
                Protokolüne göre yemek penceren otomatik ayarlandı.
              </p>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Günde Kaç Öğün Yiyorsun? (maks. 4)</label>
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                {[1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => setMealCount(n)} style={{
                    flex: 1,
                    padding: '1rem 0',
                    borderRadius: '1rem',
                    border: mealCount === n ? '2px solid var(--accent)' : '2px solid var(--color-outline-variant)',
                    background: mealCount === n ? 'rgba(135,78,0,0.08)' : 'var(--color-surface-container-low)',
                    fontWeight: 800, fontSize: '1.25rem',
                    color: mealCount === n ? 'var(--accent)' : 'var(--color-on-surface)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Yemek Başlangıç</label>
                <input
                  type="time" value={eatStart}
                  onChange={e => setEatStart(e.target.value)}
                  className="kg-input"
                  style={{ fontSize: '1.25rem', textAlign: 'center' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Yemek Bitiş</label>
                <input
                  type="time" value={eatEnd}
                  onChange={e => setEatEnd(e.target.value)}
                  className="kg-input"
                  style={{ fontSize: '1.25rem', textAlign: 'center' }}
                />
              </div>
            </div>

            {/* Pencere Özeti */}
            <div style={{
              padding: '0.875rem 1rem',
              borderRadius: '1rem',
              background: 'var(--color-surface-container-low)',
              border: '1px solid var(--color-outline-variant)',
              marginBottom: '0.5rem',
              fontSize: '0.82rem',
              color: 'var(--color-on-surface-variant)',
            }}>
              🌙 Oruç: <strong style={{ color: 'var(--color-on-surface)' }}>{eatEnd} → {eatStart}</strong> •
              🍽 Yemek: <strong style={{ color: 'var(--accent)' }}>{eatStart} → {eatEnd}</strong>
            </div>

            {nav(true, () => setStep(5))}
          </div>
        )}

        {/* ── STEP 5: Uyku Düzeni ─────────────────────────────────────────── */}
        {step === 5 && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>😴</div>
              <h2 className="headline-font" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>
                Uyku Düzenin
              </h2>
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.9rem' }}>
                Uyku kalitesi hem kilo hem de oruç başarısını doğrudan etkiler.
              </p>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Ortalama Uyku Saatin</label>
              <div style={{
                background: 'var(--color-surface-container-low)',
                borderRadius: '1rem',
                border: '2px solid var(--color-outline-variant)',
                overflow: 'hidden',
              }}>
                <WheelPicker items={SLEEP_H} value={sleepHours} onChange={setSleepHours} unit="saat" />
              </div>
            </div>

            {/* Uyku öneri kartı */}
            {(() => {
              const h = parseFloat(sleepHours);
              const quality = h < 6 ? { icon: '😴', txt: 'Az uyku kortizol artırır ve kilo vermeyi zorlaştırır.', color: '#ef4444' }
                : h < 7 ? { icon: '🌙', txt: 'Biraz daha uyumaya çalış. 7-9 saat ideal.', color: '#f97316' }
                : h <= 9 ? { icon: '✨', txt: 'Harika! İdeal uyku süresi hormonal dengeyi korur.', color: '#22c55e' }
                : { icon: '😴', txt: 'Çok fazla uyku da metabolizmayı yavaşlatabilir.', color: '#3b82f6' };
              return (
                <div style={{
                  padding: '1rem', borderRadius: '1rem',
                  background: 'var(--color-surface-container-low)',
                  border: `1px solid ${quality.color}30`,
                  marginBottom: '0.5rem',
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{quality.icon}</span>
                  <div style={{ fontSize: '0.82rem', color: quality.color, lineHeight: 1.5, fontWeight: 500 }}>
                    {quality.txt}
                  </div>
                </div>
              );
            })()}

            {nav(true, () => setStep(6))}
          </div>
        )}

        {/* ── STEP 6: Hesap Verebilirlik ───────────────────────────────────── */}
        {step === 6 && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👥</div>
              <h2 className="headline-font" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>
                Hesap Verebilirlik
              </h2>
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                2 hafta hedefine ulaşamazsan bir arkadaşın haberdar olsun. En güçlü motivasyon!
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Arkadaşının Adı (Opsiyonel)</label>
              <input
                type="text"
                className="kg-input"
                placeholder="Ahmet"
                value={friendName}
                onChange={e => setFriendName(e.target.value)}
                style={{ fontSize: '1.1rem' }}
              />
            </div>

            {friendName && (
              <div className="animate-slide-up" style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>WhatsApp Numarası (Opsiyonel)</label>
                <input
                  type="tel"
                  className="kg-input"
                  placeholder="+90 555 123 45 67"
                  value={friendPhone}
                  onChange={e => setFriendPhone(e.target.value)}
                  style={{ fontSize: '1.1rem' }}
                />
                <div style={{ marginTop: '0.5rem', fontSize: '0.74rem', color: 'var(--color-on-surface-variant)' }}>
                  2 hafta hedef tutturulamazsa sana WhatsApp hazır mesajı açılır 😄
                </div>
              </div>
            )}

            {/* Özet Kutusu */}
            <div style={{
              padding: '1.25rem',
              borderRadius: '1.25rem',
              background: 'linear-gradient(135deg, rgba(135,78,0,0.08), rgba(255,152,0,0.04))',
              border: '1px solid rgba(135,78,0,0.15)',
              marginBottom: '0.5rem',
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                Planın Hazır 🎉
              </div>
              {[
                { k: 'Protokol', v: `${protocol} Aralıklı Oruç` },
                { k: 'Yemek Penceresi', v: `${eatStart} – ${eatEnd}` },
                { k: 'Günlük Kalori', v: `~${calorieGoal} kcal` },
                { k: 'Haftalık Hedef', v: `-${weeklyWeightGoal} kg` },
                { k: 'Uyku Hedefi', v: `${sleepHours} saat` },
              ].map(({ k, v }) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '0.35rem 0',
                  borderBottom: '1px solid var(--color-outline-variant)',
                  fontSize: '0.85rem',
                }}>
                  <span style={{ color: 'var(--color-on-surface-variant)' }}>{k}</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-on-surface)' }}>{v}</span>
                </div>
              ))}
            </div>

            {nav(true, handleFinish, 'Hadi Başlayalım! 🔥')}
          </div>
        )}
      </div>
    </div>
  );
}
