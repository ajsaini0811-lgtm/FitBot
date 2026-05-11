import { useState, useEffect } from 'react';
import api from '../utils/api';
import './MyDiet.css';

const MEAL_ICONS = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙',
  snack: '🍎', 'pre-workout': '⚡', 'post-workout': '🔄',
};

export default function MyDiet() {
  const [diet, setDiet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/diet-plan')
      .then(r => setDiet(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mydiet-loading">Loading your diet plan…</div>;

  if (!diet) return (
    <div className="mydiet-page">
      <h1 className="mydiet-title">My Diet Plan</h1>
      <div className="mydiet-empty">
        <p>🥗 No active diet plan yet.</p>
        <p>Ask your coach to assign you a diet plan and it will appear here.</p>
      </div>
    </div>
  );

  const proteinPct = diet.totalCalories ? Math.round((diet.proteinG * 4 / diet.totalCalories) * 100) : 0;
  const carbsPct   = diet.totalCalories ? Math.round((diet.carbsG * 4 / diet.totalCalories) * 100) : 0;
  const fatPct     = diet.totalCalories ? Math.round((diet.fatG * 9 / diet.totalCalories) * 100) : 0;

  return (
    <div className="mydiet-page">
      <div className="mydiet-header">
        <h1 className="mydiet-title">{diet.name}</h1>
        {diet.description && <p className="mydiet-desc">{diet.description}</p>}
        <p className="mydiet-coach">Assigned by your coach: <strong>{diet.coach?.name}</strong></p>
      </div>

      {/* Macro summary */}
      <div className="mydiet-macros card">
        <div className="mydiet-macro-total">
          <span className="mydiet-macro-cal">{diet.totalCalories}</span>
          <span className="mydiet-macro-unit">kcal / day</span>
        </div>
        <div className="mydiet-macro-bars">
          <div className="mydiet-macro-bar-row">
            <span className="mydiet-macro-label protein">Protein</span>
            <div className="mydiet-bar-track">
              <div className="mydiet-bar-fill protein" style={{ width: `${proteinPct}%` }} />
            </div>
            <span className="mydiet-macro-val">{diet.proteinG}g ({proteinPct}%)</span>
          </div>
          <div className="mydiet-macro-bar-row">
            <span className="mydiet-macro-label carbs">Carbs</span>
            <div className="mydiet-bar-track">
              <div className="mydiet-bar-fill carbs" style={{ width: `${carbsPct}%` }} />
            </div>
            <span className="mydiet-macro-val">{diet.carbsG}g ({carbsPct}%)</span>
          </div>
          <div className="mydiet-macro-bar-row">
            <span className="mydiet-macro-label fat">Fat</span>
            <div className="mydiet-bar-track">
              <div className="mydiet-bar-fill fat" style={{ width: `${fatPct}%` }} />
            </div>
            <span className="mydiet-macro-val">{diet.fatG}g ({fatPct}%)</span>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="mydiet-meals">
        {diet.meals?.map(meal => (
          <div key={meal.id} className="mydiet-meal card">
            <div className="mydiet-meal-header">
              <span className="mydiet-meal-icon">{MEAL_ICONS[meal.mealType] || '🍽️'}</span>
              <span className="mydiet-meal-type">{meal.mealType}</span>
              <span className="mydiet-meal-cal">{meal.calories} kcal</span>
            </div>
            <p className="mydiet-meal-foods">{meal.foods}</p>
            {meal.notes && <p className="mydiet-meal-notes">💡 {meal.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
