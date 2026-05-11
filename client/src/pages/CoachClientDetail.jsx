import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMessageCircle, FiPlus, FiTrash2, FiActivity, FiCoffee } from 'react-icons/fi';
import CoachCreatePlan from './CoachCreatePlan';
import CoachCreateDiet from './CoachCreateDiet';
import './CoachClientDetail.css';

export default function CoachClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview'); // overview | plans | diet
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showCreateDiet, setShowCreateDiet] = useState(false);
  const [checkinDay, setCheckinDay] = useState(null);
  const [savingCheckin, setSavingCheckin] = useState(false);

  useEffect(() => { fetchClient(); }, [clientId]);

  useEffect(() => {
    if (client) setCheckinDay(client.checkinDay ?? null);
  }, [client]);

  async function fetchClient() {
    try {
      const { data } = await api.get(`/coach/clients/${clientId}`);
      setClient(data);
    } catch {
      toast.error('Failed to load client');
      navigate('/coach');
    } finally {
      setLoading(false);
    }
  }

  async function deletePlan(planId) {
    if (!confirm('Delete this workout plan?')) return;
    try {
      await api.delete(`/coach/plans/${planId}`);
      toast.success('Plan deleted');
      fetchClient();
    } catch { toast.error('Failed to delete plan'); }
  }

  async function saveCheckinDay(day) {
    setSavingCheckin(true);
    try {
      await api.put(`/coach/clients/${client.id}/checkin`, { checkinDay: day });
      setCheckinDay(day);
      toast.success(day === null ? 'Check-in schedule removed' : 'Check-in day saved!');
    } catch { toast.error('Failed to save check-in day'); }
    finally { setSavingCheckin(false); }
  }

  async function deleteDiet(dietId) {
    if (!confirm('Delete this diet plan?')) return;
    try {
      await api.delete(`/coach/diets/${dietId}`);
      toast.success('Diet deleted');
      fetchClient();
    } catch { toast.error('Failed to delete diet'); }
  }

  if (loading) return <div className="ccd-loading">Loading…</div>;
  if (!client) return null;

  const latestWeight = client.weightLogs?.[0];

  return (
    <div className="ccd-page">
      {/* Header */}
      <div className="ccd-header">
        <button className="ccd-back" onClick={() => navigate('/coach')}>
          <FiArrowLeft size={18} />
        </button>
        <div className="ccd-avatar">{client.name.charAt(0).toUpperCase()}</div>
        <div className="ccd-title-info">
          <h1 className="ccd-name">{client.name}</h1>
          <p className="ccd-email">{client.email}</p>
        </div>
        <button className="ccd-chat-btn" onClick={() => navigate(`/coach/chat/${client.id}`)}>
          <FiMessageCircle size={16} /> Chat
        </button>
      </div>

      {/* Stats strip */}
      <div className="ccd-stats">
        {client.weightKg && <div className="ccd-stat"><span>{client.weightKg} kg</span><label>Weight</label></div>}
        {client.heightCm && <div className="ccd-stat"><span>{client.heightCm} cm</span><label>Height</label></div>}
        {client.goal && <div className="ccd-stat"><span style={{ textTransform: 'capitalize' }}>{client.goal}</span><label>Goal</label></div>}
        {client.calorieBudget && <div className="ccd-stat"><span>{client.calorieBudget}</span><label>kcal target</label></div>}
        {latestWeight && <div className="ccd-stat"><span>{latestWeight.weightKg} kg</span><label>Last log</label></div>}
      </div>

      {/* Tabs */}
      <div className="ccd-tabs">
        {['overview', 'plans', 'diet'].map(t => (
          <button key={t} className={`ccd-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? '📊 Overview' : t === 'plans' ? '📋 Workout' : '🥗 Diet'}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="ccd-content">
          <h3 className="ccd-section-h">Recent Weight Logs</h3>
          {client.weightLogs?.length === 0 ? (
            <p className="ccd-empty-txt">No weight logs yet</p>
          ) : (
            <div className="ccd-log-list">
              {client.weightLogs.slice(0, 10).map(log => (
                <div key={log.id} className="ccd-log-item">
                  <span className="ccd-log-val">⚖️ {log.weightKg} kg</span>
                  <span className="ccd-log-date">{new Date(log.loggedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Check-in Schedule */}
          <h3 className="ccd-section-h" style={{ marginTop: 20 }}>📅 Weekly Check-in Day</h3>
          <div className="ccd-checkin-wrap">
            <p className="ccd-checkin-sub">Client gets an email reminder on this day each week.</p>
            <div className="ccd-checkin-days">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <button
                  key={i}
                  className={`ccd-day-btn ${checkinDay === i ? 'active' : ''}`}
                  onClick={() => saveCheckinDay(checkinDay === i ? null : i)}
                  disabled={savingCheckin}
                >
                  {d}
                </button>
              ))}
            </div>
            {checkinDay !== null && (
              <p className="ccd-checkin-set">
                ✅ Reminder set for {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][checkinDay]}s
              </p>
            )}
          </div>

          <h3 className="ccd-section-h" style={{ marginTop: 20 }}>Recent Workouts</h3>
          {client.workoutSessions?.length === 0 ? (
            <p className="ccd-empty-txt">No workout sessions yet</p>
          ) : (
            <div className="ccd-log-list">
              {client.workoutSessions.slice(0, 5).map(session => (
                <div key={session.id} className="ccd-log-item">
                  <div>
                    <span className="ccd-log-val">🏋️ {session.name || 'Workout Session'}</span>
                    <span className="ccd-log-date"> — {session.exercises?.length} exercise(s)</span>
                  </div>
                  <span className="ccd-log-date">{new Date(session.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workout Plans tab */}
      {tab === 'plans' && (
        <div className="ccd-content">
          <div className="ccd-tab-header">
            <h3 className="ccd-section-h">Workout Plans</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreatePlan(true)}>
              <FiPlus size={14} /> New Plan
            </button>
          </div>

          {showCreatePlan && (
            <CoachCreatePlan
              clientId={client.id}
              clientName={client.name}
              onClose={() => setShowCreatePlan(false)}
              onSaved={() => { setShowCreatePlan(false); fetchClient(); }}
            />
          )}

          {client.assignedPlans?.length === 0 ? (
            <p className="ccd-empty-txt">No workout plans assigned yet. Create one above.</p>
          ) : (
            client.assignedPlans.map(plan => (
              <div key={plan.id} className="ccd-plan-card">
                <div className="ccd-plan-header">
                  <div>
                    <div className="ccd-plan-name">{plan.name}</div>
                    {plan.description && <div className="ccd-plan-desc">{plan.description}</div>}
                    <span className={`ccd-plan-badge ${plan.isActive ? 'active' : ''}`}>
                      {plan.isActive ? '✅ Active' : '⏸ Inactive'}
                    </span>
                  </div>
                  <button className="ccd-delete-btn" onClick={() => deletePlan(plan.id)}>
                    <FiTrash2 size={15} />
                  </button>
                </div>
                {plan.days?.map(day => (
                  <div key={day.id} className="ccd-day">
                    <div className="ccd-day-name">📅 {day.dayName}</div>
                    {day.exercises?.map(ex => (
                      <div key={ex.id} className="ccd-ex-item">
                        <span className="ccd-ex-name">{ex.name}</span>
                        {ex.sets && <span className="ccd-ex-detail">{ex.sets}×{ex.reps || '—'}</span>}
                        {ex.duration && <span className="ccd-ex-detail">{ex.duration}</span>}
                        {ex.weightNote && <span className="ccd-ex-note">{ex.weightNote}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* Diet tab */}
      {tab === 'diet' && (
        <div className="ccd-content">
          <div className="ccd-tab-header">
            <h3 className="ccd-section-h">Diet Plans</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateDiet(true)}>
              <FiPlus size={14} /> New Diet
            </button>
          </div>

          {showCreateDiet && (
            <CoachCreateDiet
              clientId={client.id}
              clientName={client.name}
              onClose={() => setShowCreateDiet(false)}
              onSaved={() => { setShowCreateDiet(false); fetchClient(); }}
            />
          )}

          {client.assignedDiets?.length === 0 ? (
            <p className="ccd-empty-txt">No diet plans assigned yet. Create one above.</p>
          ) : (
            client.assignedDiets.map(diet => (
              <div key={diet.id} className="ccd-plan-card">
                <div className="ccd-plan-header">
                  <div>
                    <div className="ccd-plan-name">{diet.name}</div>
                    {diet.description && <div className="ccd-plan-desc">{diet.description}</div>}
                    <div className="ccd-diet-macros">
                      <span>🔥 {diet.totalCalories} kcal</span>
                      <span>🥩 {diet.proteinG}g P</span>
                      <span>🌾 {diet.carbsG}g C</span>
                      <span>🥑 {diet.fatG}g F</span>
                    </div>
                    <span className={`ccd-plan-badge ${diet.isActive ? 'active' : ''}`}>
                      {diet.isActive ? '✅ Active' : '⏸ Inactive'}
                    </span>
                  </div>
                  <button className="ccd-delete-btn" onClick={() => deleteDiet(diet.id)}>
                    <FiTrash2 size={15} />
                  </button>
                </div>
                {diet.meals?.map(meal => (
                  <div key={meal.id} className="ccd-day">
                    <div className="ccd-day-name" style={{ textTransform: 'capitalize' }}>
                      {meal.mealType} — {meal.calories} kcal
                    </div>
                    <div className="ccd-ex-item">
                      <span className="ccd-ex-name">{meal.foods}</span>
                    </div>
                    {meal.notes && <div className="ccd-ex-note" style={{ marginLeft: 8 }}>{meal.notes}</div>}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
