import React, { createContext, useContext, useEffect, useReducer } from 'react';

const AppContext = createContext(null);

const defaultState = {
  // User profile
  profile: null, // { name, weight, height, age, targetWeight, startWeight, startDate, goal }
  
  // Streak & gamification
  streak: 0,
  lastActiveDate: null, // ISO date string YYYY-MM-DD
  
  // Trophy system
  trophies: [], // earned trophy milestone days
  
  // Daily tasks
  tasks: [
    { id: 'water', label: 'Su İçme', subtitle: '2.5 Litre Hedef', icon: 'water_drop', color: 'blue', done: false },
    { id: 'walk',  label: 'Yürüyüş', subtitle: '10,000 Adım',    icon: 'directions_walk', color: 'red', done: false },
    { id: 'meal',  label: 'Sağlıklı Yemek', subtitle: 'Dengeli Öğünler', icon: 'restaurant', color: 'green', done: false },
  ],
  lastTasksDate: null, // ISO date string
  
  // Weight history
  weightLog: [], // [{ date: 'YYYY-MM-DD', weight: 85.0 }]
  
  // Weekly weigh-in
  lastWeighInDate: null,
  
  // App appearance
  darkMode: false,
  accentColor: 'orange', // orange | blue | green | red
  
  // Notifications
  notificationsEnabled: false,
  dailyReminderEnabled: true,
  weeklyReportEnabled: true,
};

const TROPHY_MILESTONES = [5, 10, 50, 100, 150, 200, 500, 1000];

function reducer(state, action) {
  switch (action.type) {
    case 'SETUP_PROFILE': {
      const today = new Date().toISOString().slice(0, 10);
      return {
        ...state,
        profile: action.payload,
        streak: 1,
        lastActiveDate: today,
        weightLog: [{ date: today, weight: action.payload.weight }],
        lastWeighInDate: today,
      };
    }

    case 'TOGGLE_TASK': {
      const today = new Date().toISOString().slice(0, 10);
      // Reset tasks if new day
      let tasks = state.lastTasksDate !== today
        ? state.tasks.map(t => ({ ...t, done: false }))
        : state.tasks;

      tasks = tasks.map(t =>
        t.id === action.payload ? { ...t, done: !t.done } : t
      );

      // Streak logic: if any task done today, keep/increment streak
      let streak = state.streak;
      let lastActiveDate = state.lastActiveDate;
      if (tasks.some(t => t.done)) {
        const last = lastActiveDate ? new Date(lastActiveDate) : null;
        const now = new Date(today);
        if (!last) {
          streak = 1;
        } else {
          const diff = Math.floor((now - last) / 86400000);
          if (diff === 0) { /* same day, no change */ }
          else if (diff === 1) { streak += 1; }
          else { streak = 1; }
        }
        lastActiveDate = today;
      }

      // Check new trophies
      const trophies = [...state.trophies];
      TROPHY_MILESTONES.forEach(m => {
        if (streak >= m && !trophies.includes(m)) trophies.push(m);
      });

      return { ...state, tasks, lastTasksDate: today, streak, lastActiveDate, trophies };
    }

    case 'ADD_TASK': {
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };
    }

    case 'LOG_WEIGHT': {
      const today = new Date().toISOString().slice(0, 10);
      const log = state.weightLog.filter(e => e.date !== today);
      log.push({ date: today, weight: action.payload });
      // Update profile current weight
      const profile = state.profile ? { ...state.profile, weight: action.payload } : state.profile;
      return { ...state, weightLog: log.sort((a,b) => a.date.localeCompare(b.date)), profile, lastWeighInDate: today };
    }

    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };

    case 'SET_ACCENT':
      return { ...state, accentColor: action.payload };

    case 'SET_NOTIFICATIONS':
      return { ...state, notificationsEnabled: action.payload };

    case 'TOGGLE_DAILY_REMINDER':
      return { ...state, dailyReminderEnabled: !state.dailyReminderEnabled };

    case 'TOGGLE_WEEKLY_REPORT':
      return { ...state, weeklyReportEnabled: !state.weeklyReportEnabled };

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
      const saved = localStorage.getItem('kilotakip_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return init;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('kilotakip_v1', JSON.stringify(state));
  }, [state]);

  // Apply dark mode + accent to <html>
  useEffect(() => {
    const html = document.documentElement;
    if (state.darkMode) html.classList.add('dark');
    else html.classList.remove('dark');
    // Accent classes
    html.classList.remove('accent-orange','accent-blue','accent-green','accent-red');
    html.classList.add(`accent-${state.accentColor}`);
  }, [state.darkMode, state.accentColor]);

  // Check and reset streak at midnight
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (state.lastActiveDate && state.lastActiveDate !== today) {
      const last = new Date(state.lastActiveDate);
      const now  = new Date(today);
      const diff = Math.floor((now - last) / 86400000);
      if (diff > 1 && state.streak > 0) {
        dispatch({ type: 'LOAD', payload: { ...state, streak: 0 } });
      }
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, TROPHY_MILESTONES }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
