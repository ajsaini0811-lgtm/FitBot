import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './WaterTracker.css';

export default function WaterTracker() {
  const [total, setTotal] = useState(0);
  const GOAL = 8;

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/water/today');
      setTotal(data.total);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    try {
      const { data } = await api.post('/water', { glasses: 1 });
      setTotal(data.total);
      if (data.total === GOAL) toast.success('🎉 Daily water goal reached!');
    } catch {}
  };

  const undo = async () => {
    if (total === 0) return;
    try {
      const { data } = await api.delete('/water/undo');
      setTotal(data.total);
    } catch {}
  };

  const pct = Math.min(100, Math.round((total / GOAL) * 100));
  const filled = Math.min(total, GOAL);

  return (
    <div className="water-card card">
      <div className="water-header">
        <div className="water-title">💧 Water Intake</div>
        <div className="water-count">{total} / {GOAL} glasses</div>
      </div>

      {/* Glass grid */}
      <div className="water-glasses">
        {Array.from({ length: GOAL }).map((_, i) => (
          <button
            key={i}
            className={`water-glass ${i < filled ? 'filled' : ''}`}
            onClick={add}
            title="Log a glass"
          >
            💧
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="water-bar-wrap">
        <div className="water-bar">
          <div className="water-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="water-pct">{pct}%</span>
      </div>

      <div className="water-actions">
        <button className="btn btn-primary btn-sm water-add-btn" onClick={add}>
          + Add Glass
        </button>
        {total > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={undo}>
            Undo
          </button>
        )}
      </div>
    </div>
  );
}
