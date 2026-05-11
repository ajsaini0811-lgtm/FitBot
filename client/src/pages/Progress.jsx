import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFit } from '../context/FitContext';
import { calcBMI, bmiCategory } from '../utils/calculations';
import api from '../utils/api';
import WeightChart from '../components/charts/WeightChart';
import CalorieTrendChart from '../components/charts/CalorieTrendChart';
import './Progress.css';

export default function Progress() {
  const { user } = useAuth();
  const { weekStats, refreshTodayStats } = useFit();
  const [weightLogs, setWeightLogs] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/weight?days=30'),
      api.get('/workout/history?limit=30'),
    ]).then(([w, wk]) => {
      setWeightLogs(w.data);
      setWorkoutHistory(wk.data);
    }).catch(() => {}).finally(() => setLoading(false));
    refreshTodayStats();
  }, []);

  // Workout stats
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30);

  const workoutsThisWeek  = workoutHistory.filter(s => new Date(s.date) >= weekStart).length;
  const workoutsThisMonth = workoutHistory.filter(s => new Date(s.date) >= monthStart).length;

  // Simple streak: count consecutive days from today backwards
  const sessionDates = new Set(workoutHistory.map(s => new Date(s.date).toDateString()));
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (sessionDates.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }

  const latestWeight = weightLogs.at(-1)?.weightKg;
  const firstWeight  = weightLogs[0]?.weightKg;
  const weightChange = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : null;
  const bmi = user?.heightCm && latestWeight ? calcBMI(latestWeight, user.heightCm) : null;

  if (loading) return <div className="page-wrapper"><div className="loading-center"><div className="spinner" /></div></div>;

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <h1 className="heading" style={{ marginBottom: 20 }}>Progress</h1>

        {/* Workout stats */}
        <div className="grid-3" style={{ marginBottom: 16 }}>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--primary)' }}>🏋️</div>
            <div className="stat-value">{workoutsThisWeek}</div>
            <div className="stat-label">Workouts this week</div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>📅</div>
            <div className="stat-value">{workoutsThisMonth}</div>
            <div className="stat-label">Workouts this month</div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--gold)' }}>🔥</div>
            <div className="stat-value">{streak}</div>
            <div className="stat-label">Day streak</div>
          </div>
        </div>

        {/* BMI + weight change */}
        {(bmi || weightChange !== null) && (
          <div className="grid-2" style={{ marginBottom: 16 }}>
            {bmi && (
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>📊</div>
                <div className="stat-value">{bmi}</div>
                <div className="stat-label">BMI — {bmiCategory(bmi)}</div>
              </div>
            )}
            {weightChange !== null && (
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: weightChange <= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: weightChange <= 0 ? 'var(--primary)' : 'var(--danger)' }}>⚖️</div>
                <div className="stat-value" style={{ color: weightChange <= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                  {weightChange > 0 ? '+' : ''}{weightChange} kg
                </div>
                <div className="stat-label">Change (30 days)</div>
              </div>
            )}
          </div>
        )}

        {/* Weight chart */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>⚖️ Weight Trend — Last 30 Days</h3>
          <WeightChart data={weightLogs} goalWeight={user?.goalWeight} />
        </div>

        {/* Calorie trend */}
        {weekStats?.length > 0 && (
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🔥 Calorie Trend — Last 7 Days</h3>
            <CalorieTrendChart data={weekStats} calorieBudget={user?.calorieBudget || 2000} />
          </div>
        )}
      </div>
    </div>
  );
}
