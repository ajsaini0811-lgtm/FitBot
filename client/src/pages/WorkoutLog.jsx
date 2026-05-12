import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiMessageCircle, FiClock } from 'react-icons/fi';
import { format, subDays, addDays } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import RestTimer from '../components/RestTimer';
import './WorkoutLog.css';

const CAT_EMOJI = { strength: '💪', cardio: '🏃', flexibility: '🧘' };

export default function WorkoutLog() {
  const [date, setDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('today');
  const [showTimer, setShowTimer] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');
  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  useEffect(() => { fetchSessions(); }, [dateStr]);
  useEffect(() => { if (tab === 'history') fetchHistory(); }, [tab]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/workout/session?date=${dateStr}`);
      setSessions(res.data);
    } catch { toast.error('Failed to load workouts'); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/workout/history?limit=20');
      setHistory(res.data);
    } catch {}
  };

  const deleteSession = async (id) => {
    if (!confirm('Delete this workout session?')) return;
    try {
      await api.delete(`/workout/session/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Session deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="wl-header">
          <h1 className="heading">Workout Log</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setShowTimer(true)} title="Rest Timer">
              <FiClock size={14} /> Rest Timer
            </button>
            <Link to="/chat" className="btn btn-primary btn-sm"><FiMessageCircle size={14} /> Log via Chat</Link>
          </div>
        </div>

        {showTimer && <RestTimer onClose={() => setShowTimer(false)} />}

        {/* Tabs */}
        <div className="wl-tabs">
          <button className={`wl-tab ${tab === 'today' ? 'active' : ''}`} onClick={() => setTab('today')}>Today</button>
          <button className={`wl-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
        </div>

        {tab === 'today' && (
          <>
            {/* Date Nav */}
            <div className="date-nav card">
              <button className="date-nav-btn" onClick={() => setDate(d => subDays(d, 1))}>‹</button>
              <div className="date-nav-label">
                <div className="date-main">{isToday ? 'Today' : format(date, 'EEEE')}</div>
                <div className="date-sub">{format(date, 'MMMM d, yyyy')}</div>
              </div>
              <button className="date-nav-btn" onClick={() => setDate(d => addDays(d, 1))} disabled={isToday}>›</button>
            </div>

            {loading && <div className="loading-center"><div className="spinner" /></div>}

            {!loading && sessions.length === 0 && (
              <div className="empty-state">
                <div style={{ fontSize: 48 }}>🏋️</div>
                <h3>No workouts logged</h3>
                <p>Use FitBot chat to log your workout session step by step.</p>
                <Link to="/chat" className="btn btn-primary" style={{ marginTop: 16 }}>Open Chat →</Link>
              </div>
            )}

            {!loading && sessions.map(session => (
              <div key={session.id} className="session-card card">
                <div className="session-header">
                  <div>
                    <div className="session-name">{session.name || 'Workout Session'}</div>
                    <div className="session-time">{format(new Date(session.date), 'h:mm a')} · {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''}</div>
                  </div>
                  <button className="del-btn" onClick={() => deleteSession(session.id)}><FiTrash2 size={15} /></button>
                </div>
                <div className="exercise-list">
                  {session.exercises.map(ex => (
                    <div key={ex.id} className="exercise-row">
                      <span className="ex-emoji">{CAT_EMOJI[ex.category] || '🏃'}</span>
                      <div className="ex-info">
                        <span className="ex-name">{ex.name}</span>
                        <span className="ex-detail">
                          {ex.sets ? `${ex.sets} × ${ex.reps} reps${ex.weightKg ? ` @ ${ex.weightKg}kg` : ' (bodyweight)'}` : ''}
                          {ex.durationMin ? `${ex.durationMin} min` : ''}
                          {ex.distanceKm ? ` · ${ex.distanceKm}km` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'history' && (
          <>
            {history.length === 0 && (
              <div className="empty-state"><div style={{ fontSize: 48 }}>📋</div><h3>No history yet</h3><p>Log your first workout from the chat!</p></div>
            )}
            {history.map(session => (
              <div key={session.id} className="session-card card">
                <div className="session-header">
                  <div>
                    <div className="session-name">{session.name || 'Workout Session'}</div>
                    <div className="session-time">{format(new Date(session.date), 'EEE, MMM d · h:mm a')} · {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="exercise-list">
                  {session.exercises.map(ex => (
                    <div key={ex.id} className="exercise-row">
                      <span className="ex-emoji">{CAT_EMOJI[ex.category] || '🏃'}</span>
                      <div className="ex-info">
                        <span className="ex-name">{ex.name}</span>
                        <span className="ex-detail">
                          {ex.sets ? `${ex.sets} × ${ex.reps} reps${ex.weightKg ? ` @ ${ex.weightKg}kg` : ''}` : ''}
                          {ex.durationMin ? `${ex.durationMin} min` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
