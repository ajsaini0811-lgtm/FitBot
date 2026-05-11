import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import EXERCISES from '../utils/exercises';
import './CoachCreatePlan.css';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const emptyExercise = () => ({ name: '', sets: '', reps: '', weightNote: '', duration: '', notes: '' });
const emptyDay = (i) => ({ dayName: DAY_NAMES[i] || `Day ${i + 1}`, dayNumber: i + 1, exercises: [emptyExercise()] });

export default function CoachCreatePlan({ clientId, clientName, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState([emptyDay(0)]);
  const [saving, setSaving] = useState(false);

  function addDay() {
    setDays(d => [...d, emptyDay(d.length)]);
  }

  function removeDay(i) {
    setDays(d => d.filter((_, idx) => idx !== i));
  }

  function updateDay(i, field, val) {
    setDays(d => d.map((day, idx) => idx === i ? { ...day, [field]: val } : day));
  }

  function addExercise(dayIdx) {
    setDays(d => d.map((day, idx) =>
      idx === dayIdx ? { ...day, exercises: [...day.exercises, emptyExercise()] } : day
    ));
  }

  function removeExercise(dayIdx, exIdx) {
    setDays(d => d.map((day, idx) =>
      idx === dayIdx ? { ...day, exercises: day.exercises.filter((_, i) => i !== exIdx) } : day
    ));
  }

  function updateExercise(dayIdx, exIdx, field, val) {
    setDays(d => d.map((day, idx) =>
      idx === dayIdx
        ? { ...day, exercises: day.exercises.map((ex, i) => i === exIdx ? { ...ex, [field]: val } : ex) }
        : day
    ));
  }

  async function handleSave() {
    if (!name.trim()) { toast.error('Plan name is required'); return; }
    if (days.some(d => d.exercises.some(e => !e.name.trim()))) {
      toast.error('All exercises must have a name');
      return;
    }

    setSaving(true);
    try {
      await api.post('/coach/plans', {
        userId: clientId,
        name: name.trim(),
        description: description.trim() || undefined,
        days: days.map(d => ({
          dayName: d.dayName,
          dayNumber: d.dayNumber,
          exercises: d.exercises.map(e => ({
            name: e.name,
            sets: e.sets ? Number(e.sets) : null,
            reps: e.reps || null,
            weightNote: e.weightNote || null,
            duration: e.duration || null,
            notes: e.notes || null,
          })),
        })),
      });
      toast.success('Workout plan created!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ccp-form card">
      <div className="ccp-form-header">
        <h3 className="ccp-form-title">New Workout Plan for {clientName}</h3>
        <button className="ccp-close" onClick={onClose}><FiX size={18} /></button>
      </div>

      <div className="form-group">
        <label className="form-label">Plan Name *</label>
        <input className="form-input" placeholder="e.g. 6-Week Hypertrophy Program"
          value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Description (optional)</label>
        <input className="form-input" placeholder="Brief notes about this plan..."
          value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      {days.map((day, dayIdx) => (
        <div key={dayIdx} className="ccp-day">
          <div className="ccp-day-header">
            <select
              className="ccp-day-select"
              value={day.dayName}
              onChange={e => updateDay(dayIdx, 'dayName', e.target.value)}
            >
              {DAY_NAMES.map(d => <option key={d}>{d}</option>)}
              <option>Rest Day</option>
              <option>Push Day</option>
              <option>Pull Day</option>
              <option>Leg Day</option>
              <option>Cardio Day</option>
            </select>
            {days.length > 1 && (
              <button className="ccp-remove-day" onClick={() => removeDay(dayIdx)}>
                <FiTrash2 size={14} />
              </button>
            )}
          </div>

          {day.exercises.map((ex, exIdx) => (
            <div key={exIdx} className="ccp-exercise">
              <div className="ccp-ex-row">
                <input
                  className="form-input ccp-ex-name"
                  placeholder="Exercise name"
                  list={`exercises-${dayIdx}-${exIdx}`}
                  value={ex.name}
                  onChange={e => updateExercise(dayIdx, exIdx, 'name', e.target.value)}
                />
                <datalist id={`exercises-${dayIdx}-${exIdx}`}>
                  {EXERCISES.map(e => <option key={e.id} value={e.name} />)}
                </datalist>
                <input className="form-input ccp-ex-short" placeholder="Sets" type="number"
                  value={ex.sets} onChange={e => updateExercise(dayIdx, exIdx, 'sets', e.target.value)} />
                <input className="form-input ccp-ex-short" placeholder="Reps (e.g. 8-12)"
                  value={ex.reps} onChange={e => updateExercise(dayIdx, exIdx, 'reps', e.target.value)} />
                {day.exercises.length > 1 && (
                  <button className="ccp-remove-ex" onClick={() => removeExercise(dayIdx, exIdx)}>
                    <FiX size={14} />
                  </button>
                )}
              </div>
              <div className="ccp-ex-row">
                <input className="form-input" placeholder="Weight note (e.g. Start light)"
                  value={ex.weightNote} onChange={e => updateExercise(dayIdx, exIdx, 'weightNote', e.target.value)} />
                <input className="form-input" placeholder="Duration (e.g. 30 min)"
                  value={ex.duration} onChange={e => updateExercise(dayIdx, exIdx, 'duration', e.target.value)} />
              </div>
            </div>
          ))}

          <button className="ccp-add-ex-btn" onClick={() => addExercise(dayIdx)}>
            <FiPlus size={14} /> Add exercise
          </button>
        </div>
      ))}

      <button className="ccp-add-day-btn" onClick={addDay}>
        <FiPlus size={14} /> Add day
      </button>

      <div className="ccp-form-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Create Plan'}
        </button>
      </div>
    </div>
  );
}
