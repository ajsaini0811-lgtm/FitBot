import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiX } from 'react-icons/fi';
import './CoachCreateDiet.css';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout'];
const emptyMeal = () => ({ mealType: 'breakfast', foods: '', calories: '', notes: '' });

export default function CoachCreateDiet({ clientId, clientName, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalCalories, setTotalCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [meals, setMeals] = useState([emptyMeal()]);
  const [saving, setSaving] = useState(false);

  function addMeal() {
    setMeals(m => [...m, emptyMeal()]);
  }

  function removeMeal(i) {
    setMeals(m => m.filter((_, idx) => idx !== i));
  }

  function updateMeal(i, field, val) {
    setMeals(m => m.map((meal, idx) => idx === i ? { ...meal, [field]: val } : meal));
  }

  const derivedTotal = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);

  async function handleSave() {
    if (!name.trim()) { toast.error('Diet plan name is required'); return; }
    if (!totalCalories && !derivedTotal) { toast.error('Total calories are required'); return; }
    if (meals.some(m => !m.foods.trim())) { toast.error('All meals must have food descriptions'); return; }

    setSaving(true);
    try {
      await api.post('/coach/diets', {
        userId: clientId,
        name: name.trim(),
        description: description.trim() || undefined,
        totalCalories: Number(totalCalories) || derivedTotal,
        proteinG: Number(proteinG) || 0,
        carbsG: Number(carbsG) || 0,
        fatG: Number(fatG) || 0,
        meals: meals.map(m => ({
          mealType: m.mealType,
          foods: m.foods,
          calories: Number(m.calories) || 0,
          notes: m.notes || null,
        })),
      });
      toast.success('Diet plan created!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create diet plan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ccd-form card">
      <div className="ccd-form-header">
        <h3 className="ccd-form-title">New Diet Plan for {clientName}</h3>
        <button className="ccd-close" onClick={onClose}><FiX size={18} /></button>
      </div>

      <div className="form-group">
        <label className="form-label">Diet Plan Name *</label>
        <input className="form-input" placeholder="e.g. High-Protein Cutting Diet"
          value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Description (optional)</label>
        <input className="form-input" placeholder="Notes about this diet plan..."
          value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      {/* Macros */}
      <div className="ccd-macros-row">
        <div className="form-group">
          <label className="form-label">Total Calories *</label>
          <input className="form-input" type="number" placeholder={`${derivedTotal || 'e.g. 2000'}`}
            value={totalCalories} onChange={e => setTotalCalories(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Protein (g)</label>
          <input className="form-input" type="number" placeholder="150"
            value={proteinG} onChange={e => setProteinG(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Carbs (g)</label>
          <input className="form-input" type="number" placeholder="200"
            value={carbsG} onChange={e => setCarbsG(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Fat (g)</label>
          <input className="form-input" type="number" placeholder="65"
            value={fatG} onChange={e => setFatG(e.target.value)} />
        </div>
      </div>

      {derivedTotal > 0 && (
        <p className="ccd-derived-note">
          Sum from meals: <strong>{derivedTotal} kcal</strong>
          {!totalCalories && ' (will be used as total)'}
        </p>
      )}

      {/* Meals */}
      <div className="ccd-meals-label">Meals</div>
      {meals.map((meal, i) => (
        <div key={i} className="ccd-meal-row">
          <select
            className="ccd-meal-type"
            value={meal.mealType}
            onChange={e => updateMeal(i, 'mealType', e.target.value)}
          >
            {MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className="form-input ccd-meal-foods" placeholder="Foods (e.g. 2 eggs, oats, banana)"
            value={meal.foods} onChange={e => updateMeal(i, 'foods', e.target.value)} />
          <input className="form-input ccd-meal-cal" type="number" placeholder="kcal"
            value={meal.calories} onChange={e => updateMeal(i, 'calories', e.target.value)} />
          {meals.length > 1 && (
            <button className="ccd-remove-meal" onClick={() => removeMeal(i)}>
              <FiX size={14} />
            </button>
          )}
        </div>
      ))}

      <button className="ccd-add-meal-btn" onClick={addMeal}>
        <FiPlus size={14} /> Add meal
      </button>

      <div className="ccd-form-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Create Diet Plan'}
        </button>
      </div>
    </div>
  );
}
