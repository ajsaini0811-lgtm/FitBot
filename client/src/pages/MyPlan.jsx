import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './MyPlan.css';

export default function MyPlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/plan')
      .then(r => setPlan(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="myplan-loading">Loading your plan…</div>;

  if (!plan) return (
    <div className="myplan-page">
      <h1 className="myplan-title">My Workout Plan</h1>
      <div className="myplan-empty">
        <p>📋 No active workout plan yet.</p>
        <p>Ask your coach to assign you a plan and it will appear here.</p>
      </div>
    </div>
  );

  return (
    <div className="myplan-page">
      <div className="myplan-header">
        <h1 className="myplan-title">{plan.name}</h1>
        {plan.description && <p className="myplan-desc">{plan.description}</p>}
        <p className="myplan-coach">Assigned by your coach: <strong>{plan.coach?.name}</strong></p>
      </div>

      {plan.days?.map(day => (
        <div key={day.id} className="myplan-day card">
          <div className="myplan-day-name">📅 {day.dayName}</div>
          {day.exercises?.length === 0 ? (
            <p className="myplan-rest">Rest day — recover and recharge! 💪</p>
          ) : (
            <div className="myplan-exercises">
              {day.exercises.map((ex, i) => (
                <div key={ex.id} className="myplan-ex">
                  <div className="myplan-ex-num">{i + 1}</div>
                  <div className="myplan-ex-info">
                    <div className="myplan-ex-name">{ex.name}</div>
                    <div className="myplan-ex-meta">
                      {ex.sets && ex.reps && (
                        <span className="myplan-tag green">{ex.sets} sets × {ex.reps} reps</span>
                      )}
                      {ex.duration && <span className="myplan-tag blue">{ex.duration}</span>}
                      {ex.weightNote && <span className="myplan-tag gray">{ex.weightNote}</span>}
                      {ex.notes && <span className="myplan-tag gray">{ex.notes}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
