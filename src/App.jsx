import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import Fasting from './pages/Fasting';
import WeighInModal from './components/WeighInModal';

function AppShell() {
  const { state, dispatch } = useApp();
  const [page, setPage]           = useState('home');
  const [showWeighIn, setShowWeighIn] = useState(false);

  const isFastingActive = !!state.fastingSession;

  // ── Haftalık tartı kontrolü ─────────────────────────────────────────────────
  useEffect(() => {
    if (!state.profile) return;
    const last = state.lastWeighInDate ? new Date(state.lastWeighInDate) : null;
    const now  = new Date();
    if (!last || Math.floor((now - last) / 86400000) >= 7) {
      const t = setTimeout(() => setShowWeighIn(true), 1800);
      return () => clearTimeout(t);
    }
  }, []);

  // ── Bildirim Sistemi ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.profile) return;
    if (!state.notificationsEnabled || !state.dailyReminderEnabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const proto = state.profile?.fastingProtocol ?? '16:8';
    const eatStart = state.profile?.eatStart ?? '12:00';
    const eatEnd   = state.profile?.eatEnd   ?? '20:00';

    const REMINDERS = [
      {
        hour: parseInt(eatStart.split(':')[0]),
        min:  parseInt(eatStart.split(':')[1]),
        msg:  `🍽 Yemek penceresine girildi! ${eatStart}–${eatEnd} arası yiyebilirsin.`,
      },
      {
        hour: parseInt(eatEnd.split(':')[0]),
        min:  Math.max(0, parseInt(eatEnd.split(':')[1]) - 30),
        msg:  `⚠️ 30 dakika sonra yemek penceresi kapanıyor! Son yemeğini planla.`,
      },
      {
        hour: 9, min: 0,
        msg:  '💧 Günaydın! Oruç süresinde bol su içmeyi unutma.',
      },
      {
        hour: 14, min: 0,
        msg:  '💧 Öğle hatırlatıcı! Bugün ne kadar su içtin?',
      },
      {
        hour: 20, min: 0,
        msg:  `⚖️ Akşam check-in! Aralıklı oruç ${proto} uyguluyor musun?`,
      },
    ];

    const timers = REMINDERS.map(({ hour, min, msg }) => {
      const now    = new Date();
      const target = new Date();
      target.setHours(hour, min, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const delay = target - now;
      return setTimeout(() => {
        new Notification('KiloTakip 🌙', { body: msg, icon: '/favicon.svg' });
      }, delay);
    });

    return () => timers.forEach(clearTimeout);
  }, [state.notificationsEnabled, state.dailyReminderEnabled, state.profile]);

  // ── Hesap Verebilirlik Kontrolü ────────────────────────────────────────────
  useEffect(() => {
    if (!state.profile?.accountabilityFriend?.name) return;
    if (!state.weightLog || state.weightLog.length < 2) return;

    const today = new Date().toISOString().slice(0, 10);

    // Son 14 günde kilo verdim mi?
    const last14 = state.weightLog
      .filter(e => {
        const diff = Math.floor(
          (new Date(today) - new Date(e.date)) / 86400000
        );
        return diff <= 14;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    if (last14.length < 2) return;

    const firstWeight = last14[0].weight;
    const lastWeight  = last14[last14.length - 1].weight;
    const weightLost  = firstWeight - lastWeight;

    // Hedeften çok uzak mı? (2 haftada 0'dan az)
    const noWeightLoss = weightLost <= 0;

    // Son 7 günde görev tamamlama oranı < %30?
    const waterOk = (() => {
      if (!state.waterLog?.date) return true;
      const today = new Date().toISOString().slice(0, 10);
      const diff  = Math.floor((new Date(today) - new Date(state.waterLog.date)) / 86400000);
      if (diff > 7) return false; // 7 günden eski kayıt
      const pct = (state.waterLog.amountMl / (state.waterLog.goalMl || 2500)) * 100;
      return pct >= 30;
    })();

    const shouldAlert = noWeightLoss && !waterOk;

    if (!shouldAlert) return;

    // Aynı gün tekrar alert gönderme
    if (state.lastAccountabilityAlert === today) return;

    dispatch({ type: 'SET_ACCOUNTABILITY_ALERT', payload: today });

    // WhatsApp mesajı hazırla
    const friend = state.profile.accountabilityFriend;
    if (friend.phone) {
      const phone   = friend.phone.replace(/\D/g, '');
      const message = encodeURIComponent(
        `Merhaba ${friend.name}! 😅 Kankan bugün de biraz yatışta, haberin olsun! Son 2 haftadır hedeflerine ulaşamıyor. Ona bir motivasyon mesajı atsana? 💪`
      );
      const waUrl = `https://wa.me/${phone}?text=${message}`;

      // Bildirim + link
      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification('⚠️ Hesap Verebilirlik Uyarısı', {
          body: `${friend.name}'e mesaj gönderilmesi gerekiyor! 2 haftadır hedef yok.`,
          icon: '/favicon.svg',
        });
        notif.onclick = () => window.open(waUrl, '_blank');
      }
    }
  }, [state.weightLog, state.waterLog]);

  // ── Onboarding ──────────────────────────────────────────────────────────────
  if (!state.profile) return <Onboarding />;

  return (
    <>
      <TopBar />

      {page === 'home'     && <Home    onWeighIn={() => setShowWeighIn(true)} />}
      {page === 'stats'    && <Statistics />}
      {page === 'fasting'  && <Fasting />}
      {page === 'settings' && <Settings />}

      <BottomNav
        page={page}
        setPage={setPage}
        fastingActive={isFastingActive}
      />

      {showWeighIn && <WeighInModal onClose={() => setShowWeighIn(false)} />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
