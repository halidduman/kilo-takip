import React, { createContext, useContext, useEffect, useReducer } from 'react';

const AppContext = createContext(null);

// ─── BMR / Kalori Hesaplama ───────────────────────────────────────────────────
export function calcBMR({ weight, height, age, gender }) {
  // Mifflin-St Jeor
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'female' ? base - 161 : base + 5;
}
export function calcTDEE(bmr, activityLevel = 'sedentary') {
  const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  return Math.round(bmr * (factors[activityLevel] ?? 1.2));
}
export function calcDailyCalorieGoal(profile) {
  if (!profile) return 2000;
  const bmr  = calcBMR(profile);
  const tdee = calcTDEE(bmr, profile.activityLevel);
  // weeklyWeightGoal kg/hafta → günlük açık (1 kg yağ ≈ 7700 kcal)
  const dailyDeficit = ((profile.weeklyWeightGoal ?? 0.5) * 7700) / 7;
  return Math.max(1200, Math.round(tdee - dailyDeficit));
}

// ─── IF Protokol Tanımları ────────────────────────────────────────────────────
export const IF_PROTOCOLS = [
  {
    id: '16:8', label: '16:8', fastHours: 16, eatHours: 8,
    desc: 'Başlangıç için ideal. Günde 8 saatlik yemek penceresi.',
    tip: 'Circadian ritimle uyumlu, en popüler protokol.',
    emoji: '⭐',
  },
  {
    id: '18:6', label: '18:6', fastHours: 18, eatHours: 6,
    desc: 'Orta seviye. Daha fazla otofaji ve yağ yakımı.',
    tip: 'Günde 2–3 öğün yeterli.',
    emoji: '🔥',
  },
  {
    id: '20:4', label: '20:4', fastHours: 20, eatHours: 4,
    desc: 'İleri seviye. Savaşçı Diyeti olarak bilinir.',
    tip: 'Genellikle 1–2 büyük öğün.',
    emoji: '⚡',
  },
];

// ─── Today helpers ────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);

const defaultState = {
  // ── Profil ──────────────────────────────────────────────────────────────────
  profile: null,
  // profile shape: { name, weight, height, age, gender, targetWeight, startWeight,
  //   startDate, goal, weeklyWeightGoal, activityLevel, sleepHours, mealCount,
  //   fastingProtocol: '16:8', eatStart: '12:00', eatEnd: '20:00',
  //   accountabilityFriend: { name, phone } }

  // ── Seri & Gamifikasyon ──────────────────────────────────────────────────────
  streak: 0,
  fastingStreak: 0,
  lastActiveDate: null,
  trophies: [],

  // ── Oruç Oturumu ────────────────────────────────────────────────────────────
  fastingSession: null, // { startTime: ISO, targetHours: 16 } | null
  fastingLog: [],       // [{ date, hoursCompleted, completed }]

  // ── Su Takibi ────────────────────────────────────────────────────────────────
  waterLog: { date: null, amountMl: 0, goalMl: 2500 },

  // ── Öğün Log ────────────────────────────────────────────────────────────────
  mealLog: [], // [{ id, date, time, category, name, calories }]

  // ── Kilo Geçmişi ────────────────────────────────────────────────────────────
  weightLog: [],
  lastWeighInDate: null,

  // ── Eski görev sistemi (step / günlük) ──────────────────────────────────────
  tasks: [
    { id: 'walk', label: 'Yürüyüş', subtitle: '10,000 Adım', icon: 'directions_walk', color: 'red', done: false },
  ],
  lastTasksDate: null,

  // ── Görünüm ──────────────────────────────────────────────────────────────────
  darkMode: false,
  accentColor: 'orange',

  // ── Bildirimler ──────────────────────────────────────────────────────────────
  notificationsEnabled: false,
  dailyReminderEnabled: true,
  weeklyReportEnabled: true,

  // ── Hesap Verebilirlik İzleme ─────────────────────────────────────────────
  lastAccountabilityAlert: null, // date string
};

const TROPHY_MILESTONES = [5, 10, 50, 100, 150, 200, 500, 1000];

function reducer(state, action) {
  switch (action.type) {

    // ── Profil Kurulumu ──────────────────────────────────────────────────────
    case 'SETUP_PROFILE': {
      const today = todayStr();
      const profile = action.payload;
      return {
        ...state,
        profile,
        streak: 1,
        lastActiveDate: today,
        weightLog: [{ date: today, weight: profile.weight }],
        lastWeighInDate: today,
        waterLog: { date: today, amountMl: 0, goalMl: 2500 },
      };
    }

    // ── Oruç Başlat ──────────────────────────────────────────────────────────
    case 'START_FAST': {
      const proto = IF_PROTOCOLS.find(p => p.id === (state.profile?.fastingProtocol ?? '16:8'));
      return {
        ...state,
        fastingSession: {
          startTime: new Date().toISOString(),
          targetHours: proto?.fastHours ?? 16,
        },
      };
    }

    // ── Oruç Bitir ───────────────────────────────────────────────────────────
    case 'END_FAST': {
      if (!state.fastingSession) return state;
      const started   = new Date(state.fastingSession.startTime);
      const now       = new Date();
      const hoursCompleted = (now - started) / 3600000;
      const targetH   = state.fastingSession.targetHours;
      const completed = hoursCompleted >= targetH * 0.9; // %90 tamamlama = sayılır
      const today     = todayStr();

      const log = [...state.fastingLog.filter(e => e.date !== today),
        { date: today, hoursCompleted: Math.round(hoursCompleted * 10) / 10, completed }];

      // Fasting streak
      const lastFastDate = state.fastingLog.length
        ? state.fastingLog[state.fastingLog.length - 1]?.date
        : null;
      let fastingStreak = state.fastingStreak ?? 0;
      if (completed) {
        if (lastFastDate) {
          const diff = Math.floor((new Date(today) - new Date(lastFastDate)) / 86400000);
          fastingStreak = diff <= 1 ? fastingStreak + 1 : 1;
        } else {
          fastingStreak = 1;
        }
      }

      const trophies = [...state.trophies];
      TROPHY_MILESTONES.forEach(m => {
        if (fastingStreak >= m && !trophies.includes(`fast_${m}`)) trophies.push(`fast_${m}`);
      });

      return {
        ...state,
        fastingSession: null,
        fastingLog: log,
        fastingStreak,
        trophies,
      };
    }

    // ── Su Ekle ──────────────────────────────────────────────────────────────
    case 'ADD_WATER': {
      const today = todayStr();
      const wl    = state.waterLog;
      const reset = wl.date !== today;
      const newAmt = reset ? action.payload : (wl.amountMl + action.payload);
      return {
        ...state,
        waterLog: { date: today, amountMl: Math.min(newAmt, 5000), goalMl: wl.goalMl },
      };
    }

    case 'SET_WATER_GOAL': {
      return { ...state, waterLog: { ...state.waterLog, goalMl: action.payload } };
    }

    // ── Öğün Ekle ────────────────────────────────────────────────────────────
    case 'LOG_MEAL': {
      const meal = {
        id: Date.now().toString(),
        date: todayStr(),
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        ...action.payload,
      };
      return { ...state, mealLog: [meal, ...state.mealLog] };
    }

    case 'DELETE_MEAL': {
      return { ...state, mealLog: state.mealLog.filter(m => m.id !== action.payload) };
    }

    // ── Görev Tamamla (Adım vs) ──────────────────────────────────────────────
    case 'TOGGLE_TASK': {
      const today = todayStr();
      let tasks   = state.lastTasksDate !== today
        ? state.tasks.map(t => ({ ...t, done: false }))
        : state.tasks;
      tasks = tasks.map(t => t.id === action.payload ? { ...t, done: !t.done } : t);

      let streak = state.streak;
      let lastActiveDate = state.lastActiveDate;
      if (tasks.some(t => t.done)) {
        const last = lastActiveDate ? new Date(lastActiveDate) : null;
        const now  = new Date(today);
        if (!last) { streak = 1; }
        else {
          const diff = Math.floor((now - last) / 86400000);
          if (diff === 1) streak += 1;
          else if (diff > 1) streak = 1;
        }
        lastActiveDate = today;
      }

      const trophies = [...state.trophies];
      TROPHY_MILESTONES.forEach(m => {
        if (streak >= m && !trophies.includes(m)) trophies.push(m);
      });

      return { ...state, tasks, lastTasksDate: today, streak, lastActiveDate, trophies };
    }

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };

    // ── Kilo Kayıt ───────────────────────────────────────────────────────────
    case 'LOG_WEIGHT': {
      const today = todayStr();
      const log   = state.weightLog.filter(e => e.date !== today);
      log.push({ date: today, weight: action.payload });
      const profile = state.profile ? { ...state.profile, weight: action.payload } : state.profile;
      return {
        ...state,
        weightLog: log.sort((a, b) => a.date.localeCompare(b.date)),
        profile,
        lastWeighInDate: today,
      };
    }

    // ── Görünüm ──────────────────────────────────────────────────────────────
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    case 'SET_ACCENT':
      return { ...state, accentColor: action.payload };

    // ── Bildirimler ───────────────────────────────────────────────────────────
    case 'SET_NOTIFICATIONS':
      return { ...state, notificationsEnabled: action.payload };
    case 'TOGGLE_DAILY_REMINDER':
      return { ...state, dailyReminderEnabled: !state.dailyReminderEnabled };
    case 'TOGGLE_WEEKLY_REPORT':
      return { ...state, weeklyReportEnabled: !state.weeklyReportEnabled };

    // ── Hesap Verebilirlik ───────────────────────────────────────────────────
    case 'SET_ACCOUNTABILITY_ALERT':
      return { ...state, lastAccountabilityAlert: action.payload };

    // ── Reset / Load ─────────────────────────────────────────────────────────
    case 'RESET_DATA':
      return { ...defaultState };
    case 'LOAD':
      return action.payload;

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, defaultState, (init) => {
    try {
      const saved = localStorage.getItem('kilotakip_v2');
      if (saved) return JSON.parse(saved);
      // try legacy key
      const legacy = localStorage.getItem('kilotakip_v1');
      if (legacy) {
        const old = JSON.parse(legacy);
        return { ...init, ...old, waterLog: init.waterLog };
      }
    } catch {}
    return init;
  });

  useEffect(() => {
    localStorage.setItem('kilotakip_v2', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const html = document.documentElement;
    if (state.darkMode) html.classList.add('dark');
    else html.classList.remove('dark');
    html.classList.remove('accent-orange', 'accent-blue', 'accent-green', 'accent-red');
    html.classList.add(`accent-${state.accentColor}`);
  }, [state.darkMode, state.accentColor]);

  // Streak sıfırlama
  useEffect(() => {
    const today = todayStr();
    if (state.lastActiveDate && state.lastActiveDate !== today) {
      const diff = Math.floor(
        (new Date(today) - new Date(state.lastActiveDate)) / 86400000
      );
      if (diff > 1 && state.streak > 0) {
        dispatch({ type: 'LOAD', payload: { ...state, streak: 0 } });
      }
    }
  }, []);

  // Su log günlük sıfırlama
  useEffect(() => {
    const today = todayStr();
    if (state.waterLog?.date && state.waterLog.date !== today) {
      dispatch({ type: 'LOAD', payload: {
        ...state,
        waterLog: { ...state.waterLog, date: today, amountMl: 0 },
      }});
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, TROPHY_MILESTONES, IF_PROTOCOLS }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
