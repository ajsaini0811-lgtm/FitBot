import { useState, useEffect } from 'react';
import api from '../utils/api';
import './MealSuggestions.css';

export default function MealSuggestions() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get('/stats/meal-suggestions').then(r => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="meal-sug-card card">
      <button className="meal-sug-toggle" onClick={() => setOpen(o => !o)}>
        <span>🍽️ Meal Suggestions</span>
        <span className="meal-sug-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="meal-sug-body">
          <p className="meal-sug-message">{data.message}</p>
          {data.suggestions.length > 0 ? (
            <div className="meal-sug-list">
              {data.suggestions.map((s, i) => (
                <div key={i} className="meal-sug-item">
                  <div className="msi-name">{s.name}</div>
                  <div className="msi-macros">
                    <span className="msi-cal">🔥 {s.cal} kcal</span>
                    <span className="msi-p">P {s.protein}g</span>
                    <span className="msi-c">C {s.carbs}g</span>
                    <span className="msi-f">F {s.fat}g</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
