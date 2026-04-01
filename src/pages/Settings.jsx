import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import WeighInModal from '../components/WeighInModal';

const ACCENT_COLORS = [
  { id: 'orange', label: 'Turuncu', hex: '#ff9800' },
  { id: 'blue',   label: 'Mavi',   hex: '#0846ed' },
  { id: 'green',  label: 'Yeşil',  hex: '#006947' },
  { id: 'red',    label: 'Kırmızı',hex: '#b02500' },
];

export default function Settings() {
  const { state, dispatch } = useApp();
  const { profile, darkMode, accentColor, notificationsEnabled, dailyReminderEnabled, weeklyReportEnabled } = state;
  const [showWeighIn, setShowWeighIn]     = useState(false);
  const [editWeight, setEditWeight]       = useState('');
  const [showReset, setShowReset]         = useState(false);
  const [showEditWeight, setShowEditWeight] = useState(false);

  async function handleNotifications() {
    if (!('Notification' in window)) {
      alert('Bu tarayıcı bildirimleri desteklemiyor.');
      return;
    }
    if (notificationsEnabled) {
      dispatch({ type: 'SET_NOTIFICATIONS', payload: false });
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      dispatch({ type: 'SET_NOTIFICATIONS', payload: true });
      new Notification('KiloTakip 🔥', {
        body: 'Bildirimler açıldı! Seni motive etmeye hazırız.',
        icon: '/favicon.svg',
      });
    } else {
      alert('Bildirim izni reddedildi. Tarayıcı ayarlarından etkinleştirin.');
    }
  }

  function handleResetConfirm() {
    dispatch({ type: 'RESET_DATA' });
    setShowReset(false);
  }

  const bmi = profile
    ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
    : null;

  return (
    <div style={{ paddingTop: '4rem', paddingBottom: '6rem', minHeight: '100dvh' }}>
      <div style={{ padding: '1.25rem', maxWidth: '480px', margin: '0 auto' }}>

        <div style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}>
          <h1 className="headline-font" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-on-surface)' }}>
            Ayarlar
          </h1>
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>
            Hesap ve uygulama tercihlerin
          </p>
        </div>

        {/* Profile card */}
        {profile && (
          <div style={{
            padding: '1.25rem',
            borderRadius: '1.5rem',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-container))',
            marginBottom: '1.25rem',
            color: 'var(--accent-on)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  Profil
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div className="headline-font" style={{ fontSize: '1.4rem', fontWeight: 800 }}>{profile.weight}</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.75, fontWeight: 600 }}>kg</div>
                  </div>
                  <div>
                    <div className="headline-font" style={{ fontSize: '1.4rem', fontWeight: 800 }}>{profile.height}</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.75, fontWeight: 600 }}>cm</div>
                  </div>
                  <div>
                    <div className="headline-font" style={{ fontSize: '1.4rem', fontWeight: 800 }}>{profile.age}</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.75, fontWeight: 600 }}>yaş</div>
                  </div>
                </div>
                {bmi && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.85 }}>
                    VKİ: <strong>{bmi}</strong> · Hedef: <strong>{profile.targetWeight} kg</strong>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowWeighIn(true)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '0.75rem',
                  padding: '0.5rem 0.875rem',
                  color: 'var(--accent-on)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontFamily: 'Be Vietnam Pro, sans-serif',
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span>
                Tartıl
              </button>
            </div>
            {/* Decorative */}
            <span className="material-symbols-outlined" style={{
              position: 'absolute', right: '-1rem', bottom: '-1rem',
              fontSize: '7rem', opacity: 0.1, fontVariationSettings: "'FILL' 1",
              color: 'var(--accent-on)',
            }}>monitor_weight</span>
          </div>
        )}

        {/* Appearance */}
        <Section icon="palette" title="Görünüm">
          <SettingRow
            label="Karanlık Mod"
            sublabel="Göz dostu koyu tema"
            icon="dark_mode"
          >
            <button
              className={`toggle${darkMode ? ' on' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
              aria-label="Karanlık mod"
            />
          </SettingRow>

          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-outline-variant)', opacity: 0.2, marginTop: '0', marginBottom: '0' }} />
          <div style={{ paddingTop: '0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem' }}>
              Tema Rengi
            </div>
            <div style={{ display: 'flex', gap: '0.875rem', marginTop: '0.25rem' }}>
              {ACCENT_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => dispatch({ type: 'SET_ACCENT', payload: c.id })}
                  title={c.label}
                  style={{
                    width: '2.75rem', height: '2.75rem',
                    borderRadius: '50%',
                    background: c.hex,
                    border: accentColor === c.id ? '3px solid var(--color-on-surface)' : '3px solid transparent',
                    outline: accentColor === c.id ? `2.5px solid ${c.hex}` : 'none',
                    outlineOffset: '3px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: accentColor === c.id ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: accentColor === c.id ? `0 4px 12px ${c.hex}60` : 'none',
                  }}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section icon="notifications" title="Bildirimler">
          <SettingRow
            label="Push Bildirimleri"
            sublabel="Gün içinde hatırlatma al"
            icon="notifications_active"
          >
            <button
              className={`toggle${notificationsEnabled ? ' on' : ''}`}
              onClick={handleNotifications}
              aria-label="Push bildirimleri"
            />
          </SettingRow>

          {notificationsEnabled && (
            <>
              <Divider />
              <SettingRow
                label="Günlük Hatırlatıcı"
                sublabel="09:00, 13:00, 20:00"
                icon="schedule"
              >
                <button
                  className={`toggle${dailyReminderEnabled ? ' on' : ''}`}
                  onClick={() => dispatch({ type: 'TOGGLE_DAILY_REMINDER' })}
                />
              </SettingRow>
              <Divider />
              <SettingRow
                label="Haftalık Rapor"
                sublabel="Her pazartesi sabahı"
                icon="calendar_today"
              >
                <button
                  className={`toggle${weeklyReportEnabled ? ' on' : ''}`}
                  onClick={() => dispatch({ type: 'TOGGLE_WEEKLY_REPORT' })}
                />
              </SettingRow>
            </>
          )}
        </Section>

        {/* Info */}
        <Section icon="info" title="Uygulama Bilgisi">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>Sürüm</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>1.0.0</span>
          </div>
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>Veri Depolama</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>Yerel (localStorage)</span>
          </div>
        </Section>

        {/* Danger zone */}
        <div style={{ marginTop: '0.25rem' }}>
          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              style={{
                width: '100%', padding: '1rem',
                borderRadius: '1rem',
                border: '1.5px solid var(--color-error)',
                background: 'transparent',
                color: 'var(--color-error)',
                fontWeight: 700, fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                fontFamily: 'Be Vietnam Pro, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete_forever</span>
              Tüm Verileri Sıfırla
            </button>
          ) : (
            <div style={{
              padding: '1.25rem',
              borderRadius: '1.25rem',
              background: 'rgba(176,37,0,0.06)',
              border: '1.5px solid var(--color-error)',
            }}>
              <p style={{ fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '1rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                ⚠️ Tüm veriler (kilo geçmişi, seri, başarılar) silinecek. Emin misin?
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowReset(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1.5px solid var(--color-outline-variant)', background: 'transparent', color: 'var(--color-on-surface)', fontWeight: 700, cursor: 'pointer', fontFamily: 'Be Vietnam Pro, sans-serif' }}
                >
                  İptal
                </button>
                <button
                  onClick={handleResetConfirm}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', background: 'var(--color-error)', color: 'var(--on-error, white)', fontWeight: 700, cursor: 'pointer', fontFamily: 'Be Vietnam Pro, sans-serif' }}
                >
                  Sıfırla
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', paddingTop: '2rem', paddingBottom: '1rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }}>
            KiloTakip · Sürüm 1.0.0
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-outline)', marginTop: '0.25rem' }}>
            Seninle her adımda 🔥
          </p>
        </div>
      </div>

      {showWeighIn && <WeighInModal onClose={() => setShowWeighIn(false)} />}
    </div>
  );
}

/* Sub-components */
function Section({ icon, title, children }) {
  return (
    <div style={{
      padding: '1.25rem',
      borderRadius: '1.5rem',
      background: 'var(--color-surface-container-lowest)',
      border: '1px solid var(--color-outline-variant)',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: '1.2rem', fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
        <h2 className="headline-font" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function SettingRow({ icon, label, sublabel, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface-variant)', fontSize: '1.1rem' }}>
          {icon}
        </span>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-on-surface)', fontSize: '0.9rem' }}>{label}</div>
          {sublabel && <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '0.1rem' }}>{sublabel}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div style={{
      height: '1px',
      background: 'var(--color-outline-variant)',
      opacity: 0.25,
      margin: '0.875rem 0',
    }} />
  );
}
