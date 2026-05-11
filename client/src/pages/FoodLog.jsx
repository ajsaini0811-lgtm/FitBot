import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiTrash2, FiMessageCircle } from 'react-icons/fi';
import { format, subDays, addDays } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './FoodLog.css';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_EMOJI = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙', snack: '🍎' };

export default function FoodLog() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');

  useEffect(() => { fetchLogs(); }, [dateStr]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/food?date=${dateStr}`);
      setLogs(res.data);
    } catch { toast.error('Failed to load food log'); }
    finally { setLoading(false); }
  };

  const deleteEntry = async (id) => {
    if (!confirm('Remove this entry?')) return;
    try {
      await api.delete(`/food/${id}`);
      setLogs(prev => prev.filter(l => l.id !== id));
      toast.success('Removed');
    } catch { toast.error('Failed to delete'); }
  };

  // Group by meal type
  const grouped = MEAL_ORDER.reduce((acc, meal) => {
    acc[meal] = logs.filter(l => l.mealType === meal);
    return acc;
  }, {});

  const totals = logs.reduce((acc, l) => ({
    calories: acc.calories + l.calories,
    protein:  acc.protein  + l.proteinG,
    carbs:    acc.carbs    + l.carbsG,
    fat:      acc.fat      + l.fatG,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const budget = user?.calorieBudget || 2000;
  const remaining = budget - Math.round(totals.calories);

  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="page-wrapper">
      <div className="page-content">
        {/* Header */}
        <div className="foodlog-header">
          <h1 className="heading">Food Log</h1>
          <Link to="/chat" className="btn btn-primary btn-sm"><FiMessageCircle size={14} /> Log via Chat</Link>
        </div>

        {/* Date Nav */}
        <div className="date-nav card">
          <button className="date-nav-btn" onClick={() => setDate(d => subDays(d, 1))}>‹</button>
          <div className="date-nav-label">
            <div className="date-main">{isToday ? 'Today' : format(date, 'EEEE')}</div>
            <div className="date-sub">{format(date, 'MMMM d, yyyy')}</div>
          </div>
          <button className="date-nav-btn" onClick={() => setDate(d => addDays(d, 1))} disabled={isToday}>›</button>
        </div>

        {/* Calorie summary */}
        <div className="calorie-summary card">
          <div className="cal-item">
            <div className="cal-val">{Math.round(totals.calories)}</div>
            <div className="cal-lbl">Eaten</div>
          </div>
          <div className="cal-divider">—</div>
          <div className="cal-item">
            <div className="cal-val">{budget}</div>
            <div className="cal-lbl">Budget</div>
          </div>
          <div className="cal-divider">=</div>
          <div className="cal-item">
            <div className="cal-val" style={{ color: remaining >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
              {Math.abs(remaining)}
            </div>
            <div className="cal-lbl">{remaining >= 0 ? 'Remaining' : 'Over'}</div>
          </div>
        </div>

        {/* Macro row */}
        <div className="macro-chips">
          <span className="macro-chip protein">🥩 {Math.round(totals.protein)}g protein</span>
          <span className="macro-chip carbs">🍚 {Math.round(totals.carbs)}g carbs</span>
          <span className="macro-chip fat">🫒 {Math.round(totals.fat)}g fat</span>
        </div>

        {loading && <div className="loading-center"><div className="spinner" /></div>}

        {/* Meals */}
        {!loading && MEAL_ORDER.map(meal => (
          <div key={meal} className="meal-section">
            <div className="meal-title">
              <span>{MEAL_EMOJI[meal]} {meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
              <span className="meal-cal">{Math.round(grouped[meal].reduce((s, l) => s + l.calories, 0))} kcal</span>
            </div>
            {grouped[meal].length === 0 ? (
              <div className="meal-empty">Nothing logged yet</div>
            ) : grouped[meal].map(entry => (
              <div key={entry.id} className="food-entry card">
                <div className="food-entry-info">
                  <div className="food-entry-name">{entry.foodName}</div>
                  <div className="food-entry-meta">{entry.quantity}g · P:{Math.round(entry.proteinG)}g · C:{Math.round(entry.carbsG)}g · F:{Math.round(entry.fatG)}g</div>
                </div>
                <div className="food-entry-right">
                  <span className="food-kcal">{Math.round(entry.calories)} kcal</span>
                  <button className="del-btn" onClick={() => deleteEntry(entry.id)}><FiTrash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {!loading && logs.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: 48 }}>🍽️</div>
            <h3>Nothing logged yet</h3>
            <p>Use the chat to log your meals for {isToday ? 'today' : format(date, 'MMMM d')}.</p>
            <Link to="/chat" className="btn btn-primary" style={{ marginTop: 16 }}>Open Chat →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
