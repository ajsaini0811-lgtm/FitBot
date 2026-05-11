import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMessageCircle, FiActivity, FiTrendingUp, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useFit } from '../context/FitContext';
import CalorieRing from '../components/charts/CalorieRing';
import CalorieTrendChart from '../components/charts/CalorieTrendChart';
import './Dashboard.css';

function MacroBar({ label, consumed, goal, color }) {
  const pct = goal > 0 ? Math.min(100, Math.round((consumed / goal) * 100)) : 0;
  return (
    <div className="macro-row">
      <div className="macro-info">
        <span className="macro-name">{label}</span>
        <span className="macro-vals">{consumed}g / {goal}g</span>
      </div>
      <div className="macro-bar">
        <div className="macro-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { todayStats, weekStats, loadingStats, refreshTodayStats } = useFit();

  useEffect(() => { refreshTodayStats(); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loadingStats && !todayStats) {
    return <div className="page-wrapper"><div className="loading-center"><div className="spinner" /></div></div>;
  }

  const stats = todayStats || { caloriesIn: 0, proteinG: 0, carbsG: 0, fatG: 0, workoutCount: 0, calorieBudget: user?.calorieBudget || 2000, proteinGoalG: user?.proteinGoalG || 150, carbGoalG: user?.carbGoalG || 200, fatGoalG: user?.fatGoalG || 65 };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        {/* Greeting */}
        <div className="dashboard-greeting">
          <div>
            <h1 className="heading">{greeting}! 👋</h1>
            <p className="greeting-sub">
              {user?.coachName ? `Coach ${user.coachName} is counting on you!` : 'Let\'s make today count.'}
            </p>
          </div>
          <Link to="/chat" className="btn btn-primary btn-sm">
            <FiMessageCircle size={14} /> Open Chat
          </Link>
        </div>

        {/* Top row: Calorie Ring + Quick Stats */}
        <div className="dashboard-top">
          <div className="card dash-ring-card">
            <h3 className="dash-section-title">Today's Calories</h3>
            <CalorieRing consumed={stats.caloriesIn} budget={stats.calorieBudget} />
            <div className="calorie-row">
              <div className="calorie-chip consumed">{stats.caloriesIn} <span>eaten</span></div>
              <div className="calorie-chip remaining">{Math.max(0, stats.calorieBudget - stats.caloriesIn)} <span>left</span></div>
            </div>
          </div>

          <div className="dash-side">
            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--primary)' }}>🏋️</div>
              <div className="stat-value">{stats.workoutCount}</div>
              <div className="stat-label">Workout{stats.workoutCount !== 1 ? 's' : ''} today</div>
            </div>
            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>⚖️</div>
              <div className="stat-value">{stats.currentWeightKg ? `${stats.currentWeightKg}` : '—'}</div>
              <div className="stat-label">Weight (kg)</div>
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="card dash-macros">
          <h3 className="dash-section-title">Macros Today</h3>
          <MacroBar label="Protein 🥩" consumed={stats.proteinG} goal={stats.proteinGoalG} color="var(--accent)" />
          <MacroBar label="Carbs 🍚"   consumed={stats.carbsG}   goal={stats.carbGoalG}   color="var(--gold)" />
          <MacroBar label="Fat 🫒"     consumed={stats.fatG}     goal={stats.fatGoalG}     color="var(--danger)" />
        </div>

        {/* Weekly trend */}
        {weekStats?.length > 0 && (
          <div className="card dash-trend">
            <h3 className="dash-section-title">Calorie Trend — Last 7 Days</h3>
            <CalorieTrendChart data={weekStats} calorieBudget={stats.calorieBudget} />
          </div>
        )}

        {/* Quick actions */}
        <div className="grid-2">
          <Link to="/food" className="card quick-action-card">
            <span className="qa-icon">🍽️</span>
            <span>Food Log</span>
          </Link>
          <Link to="/workout" className="card quick-action-card">
            <span className="qa-icon">🏋️</span>
            <span>Workout Log</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
