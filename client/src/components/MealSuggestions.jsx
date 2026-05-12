import { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw, FiPlusCircle, FiCheck } from 'react-icons/fi';
import { useFit } from '../context/FitContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './MealSuggestions.css';

function getMealType() {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return 'breakfast';
  if (h >= 11 && h < 15) return 'lunch';
  if (h >= 15 && h < 18) return 'snack';
  return 'dinner';
}

export default function MealSuggestions() {
  const { refreshTodayStats } = useFit();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [logged,  setLogged]  = useState({});   // { index: true } when logged

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const r = await api.get('/stats/meal-suggestions');
      setData(r.data);
      setLogged({});
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function logMeal(suggestion, idx) {
    if (logged[idx]) return;
    try {
      await api.post('/food', {
        mealType: getMealType(),
        foodName: suggestion.name,
        quantity:  100,
        calories:  suggestion.cal,
        proteinG:  suggestion.protein,
        carbsG:    suggestion.carbs,
        fatG:      suggestion.fat,
      });
      setLogged(p => ({ ...p, [idx]: true }));
      refreshTodayStats();
      toast.success(`✅ Logged: ${suggestion.name}`);
    } catch {
      toast.error('Failed to log meal');
    }
  }

  // Don't render anything while loading for the first time
  if (loading && !data) return null;
  if (!data) return null;

  const allLogged = data.suggestions.length > 0 && data.suggestions.every((_, i) => logged[i]);

  return (
    <div className="ms-wrap">
      {/* Header */}
      <div className="ms-header">
        <div className="ms-header-left">
          <span className="ms-title">🍽️ Meal Suggestions</span>
          {data.label && <span className="ms-label">{data.label}</span>}
        </div>
        <button
          className={`ms-refresh ${loading ? 'spinning' : ''}`}
          onClick={() => load(true)}
          title="Get new suggestions"
          disabled={loading}
        >
          <FiRefreshCw size={14} />
        </button>
      </div>

      {/* Remaining calories message */}
      <p className="ms-message">{data.message}</p>

      {/* Goal hit */}
      {data.suggestions.length === 0 && (
        <div className="ms-done">
          🎯 You've hit your calorie goal! Great discipline.
        </div>
      )}

      {/* Cards */}
      {data.suggestions.length > 0 && (
        <div className="ms-grid">
          {data.suggestions.map((s, i) => (
            <div key={i} className={`ms-card ${logged[i] ? 'ms-card-logged' : ''}`}>
              <div className="ms-card-top">
                <span className="ms-emoji">{s.emoji || '🍽️'}</span>
                <div className="ms-card-body">
                  <div className="ms-food-name">{s.name}</div>
                  <div className="ms-macros">
                    <span className="ms-kcal">🔥 {s.cal} kcal</span>
                    <span className="ms-p">P {s.protein}g</span>
                    <span className="ms-c">C {s.carbs}g</span>
                    <span className="ms-f">F {s.fat}g</span>
                  </div>
                  {s.reasons?.length > 0 && (
                    <div className="ms-reasons">
                      {s.reasons.map((r, ri) => (
                        <span key={ri} className="ms-reason-tag">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                className={`ms-log-btn ${logged[i] ? 'logged' : ''}`}
                onClick={() => logMeal(s, i)}
                disabled={logged[i]}
              >
                {logged[i]
                  ? <><FiCheck size={13} /> Logged</>
                  : <><FiPlusCircle size={13} /> Log this</>
                }
              </button>
            </div>
          ))}
        </div>
      )}

      {allLogged && (
        <div className="ms-all-logged">
          ✅ All suggestions logged! <button className="ms-more-btn" onClick={() => load(true)}>Get more ideas →</button>
        </div>
      )}
    </div>
  );
}
