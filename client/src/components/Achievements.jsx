import { useState, useEffect } from 'react';
import api from '../utils/api';
import './Achievements.css';

export default function Achievements() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/achievements')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="achievements-wrap">
      <div className="loading-center"><div className="spinner" /></div>
    </div>
  );

  if (!data) return null;

  const { achievements, earned, total } = data;

  return (
    <div className="achievements-wrap">
      <div className="achievements-header">
        <div>
          <h3 className="achievements-title">🏅 Achievements</h3>
          <p className="achievements-sub">{earned} of {total} earned</p>
        </div>
        <div className="achievements-progress-pill">
          <div
            className="achievements-progress-fill"
            style={{ width: `${Math.round((earned / total) * 100)}%` }}
          />
          <span className="achievements-progress-label">{Math.round((earned / total) * 100)}%</span>
        </div>
      </div>

      <div className="achievements-grid">
        {achievements.map(a => (
          <div
            key={a.id}
            className={`achievement-card ${a.earned ? 'earned' : 'locked'}`}
            title={a.earned ? a.desc : `🔒 ${a.desc}`}
          >
            <div className="achievement-emoji">{a.earned ? a.emoji : '🔒'}</div>
            <div className="achievement-title">{a.title}</div>
            <div className="achievement-desc">{a.desc}</div>
            {a.earned && <div className="achievement-earned-tag">Earned</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
