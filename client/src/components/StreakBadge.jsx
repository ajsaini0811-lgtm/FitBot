import { useState, useEffect } from 'react';
import api from '../utils/api';
import './StreakBadge.css';

export default function StreakBadge() {
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    api.get('/stats/streak').then(r => setStreak(r.data)).catch(() => {});
  }, []);

  if (!streak) return null;

  const { days, type } = streak;
  const emoji = days >= 30 ? '🏆' : days >= 14 ? '⚡' : days >= 7 ? '🔥' : days >= 3 ? '✨' : '💪';

  return (
    <div className={`streak-badge ${days >= 7 ? 'streak-hot' : ''}`}>
      <span className="streak-emoji">{emoji}</span>
      <div className="streak-info">
        <span className="streak-days">{days} day{days !== 1 ? 's' : ''}</span>
        <span className="streak-label">{type} streak</span>
      </div>
    </div>
  );
}
