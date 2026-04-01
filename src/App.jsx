import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import WeighInModal from './components/WeighInModal';

function AppShell() {
  const { state } = useApp();
  const [page, setPage] = useState('home');
  const [showWeighIn, setShowWeighIn] = useState(false);

  // Check weekly weigh-in on mount
  useEffect(() => {
    if (!state.profile) return;
    const last = state.lastWeighInDate ? new Date(state.lastWeighInDate) : null;
    const now  = new Date();
    if (!last || Math.floor((now - last) / 86400000) >= 7) {
      const timer = setTimeout(() => setShowWeighIn(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Schedule push notifications
  useEffect(() => {
    if (!state.notificationsEnabled || !state.dailyReminderEnabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const REMINDER_MESSAGES = [
      { hour: 9,  msg: 'Günaydın! 🌅 Bugünkü hedeflerini gözden geçir. Su içmek ile başla!' },
      { hour: 13, msg: 'Öğle vakti! 🥗 Öğlen yemeğini sağlıklı seç. Yarım günün harika geçti mi?' },
      { hour: 20, msg: 'Akşam oldu! 🌙 Bugünkü görevlerini tamamladın mı? Serini koruyalım 🔥' },
    ];

    const timers = REMINDER_MESSAGES.map(({ hour, msg }) => {
      const now      = new Date();
      const target   = new Date();
      target.setHours(hour, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const delay = target - now;
      return setTimeout(() => {
        new Notification('KiloTakip 🔥', { body: msg, icon: '/favicon.svg' });
      }, delay);
    });

    return () => timers.forEach(clearTimeout);
  }, [state.notificationsEnabled, state.dailyReminderEnabled]);

  // Not set up yet → show onboarding
  if (!state.profile) {
    return <Onboarding />;
  }

  return (
    <>
      <TopBar />

      {page === 'home'     && <Home onWeighIn={() => setShowWeighIn(true)} />}
      {page === 'stats'    && <Statistics />}
      {page === 'settings' && <Settings />}

      <BottomNav page={page} setPage={setPage} />

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
