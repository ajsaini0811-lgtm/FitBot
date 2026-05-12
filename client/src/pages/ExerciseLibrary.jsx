import { useState, useEffect, useMemo } from 'react';
import ExerciseDetailModal from '../components/ExerciseDetailModal';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiSearch, FiX, FiFilter, FiPlus, FiTrash2 } from 'react-icons/fi';
import './ExerciseLibrary.css';

const BODY_PARTS  = ['', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full body'];
const CATEGORIES  = ['', 'strength', 'cardio', 'flexibility'];
const DIFFICULTIES = ['', 'beginner', 'intermediate', 'advanced'];
const EQUIPMENT   = ['', 'barbell', 'dumbbell', 'bodyweight', 'machine', 'cable', 'other'];

const MUSCLE_ICONS = {
  chest: '🫁', back: '🦵', legs: '🦿', shoulders: '💪',
  arms: '💪', core: '🎯', 'full body': '🏋️',
};
const DIFF_COLORS = { beginner: 'green', intermediate: 'orange', advanced: 'red' };
const CAT_ICONS   = { strength: '🏋️', cardio: '🏃', flexibility: '🧘' };

const EMPTY_FORM = {
  name: '', cat: 'strength', muscle: '', bodyPart: 'chest',
  difficulty: 'beginner', equipment: 'bodyweight',
  instructions: [''], tips: [''],
  defaultSets: '3', defaultReps: '10',
};

export default function ExerciseLibrary() {
  const { user } = useAuth();
  const isCoach = user?.role === 'COACH';

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState('');
  const [bodyPart, setBodyPart]   = useState('');
  const [cat, setCat]             = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [equipment, setEquipment]   = useState('');
  const [selected, setSelected]     = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Create exercise modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  useEffect(() => { fetchExercises(); }, []);

  async function fetchExercises() {
    try {
      const { data } = await api.get('/exercises');
      setExercises(data);
    } catch {
      toast.error('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  }

  const results = useMemo(() => {
    let list = exercises;
    if (query)      list = list.filter(e => e.name?.toLowerCase().includes(query.toLowerCase()) || e.muscle?.toLowerCase().includes(query.toLowerCase()));
    if (bodyPart)   list = list.filter(e => e.bodyPart === bodyPart);
    if (cat)        list = list.filter(e => e.cat === cat);
    if (difficulty) list = list.filter(e => e.difficulty === difficulty);
    if (equipment)  list = list.filter(e => e.equipment === equipment);
    return list;
  }, [exercises, query, bodyPart, cat, difficulty, equipment]);

  const hasFilters = bodyPart || cat || difficulty || equipment;

  function clearAll() {
    setQuery(''); setBodyPart(''); setCat(''); setDifficulty(''); setEquipment('');
  }

  // ── Form helpers ────────────────────────────────────────
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function setStep(arr, i, val) {
    const next = [...arr];
    next[i] = val;
    return next;
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Exercise name is required');
    if (!form.muscle.trim()) return toast.error('Primary muscle is required');
    const instructions = form.instructions.map(s => s.trim()).filter(Boolean);
    const tips = form.tips.map(s => s.trim()).filter(Boolean);
    if (instructions.length === 0) return toast.error('Add at least one instruction step');
    setSaving(true);
    try {
      await api.post('/coach/exercises', {
        ...form,
        instructions,
        tips,
        defaultSets: Number(form.defaultSets) || null,
        defaultReps: form.defaultReps || null,
      });
      toast.success('Exercise added to the library!');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      fetchExercises();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create exercise');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ex, e) {
    e.stopPropagation();
    if (!confirm(`Delete "${ex.name}" from the library?`)) return;
    try {
      const id = String(ex.id).replace('custom_', '');
      await api.delete(`/coach/exercises/${id}`);
      toast.success('Exercise deleted');
      setExercises(prev => prev.filter(e => e.id !== ex.id));
    } catch {
      toast.error('Failed to delete exercise');
    }
  }

  return (
    <div className="ex-lib">
      <div className="ex-lib-header">
        <div>
          <h1 className="ex-lib-title">Exercise Library</h1>
          <p className="ex-lib-sub">{exercises.length} exercises with step-by-step instructions</p>
        </div>
        {isCoach && (
          <button className="btn btn-primary" style={{ gap: 6, flexShrink: 0 }} onClick={() => setShowCreate(true)}>
            <FiPlus size={16} /> Add Exercise
          </button>
        )}
      </div>

      {/* Coach floating add button on mobile */}
      {isCoach && (
        <button className="ex-fab" onClick={() => setShowCreate(true)} title="Add Exercise">
          <FiPlus size={24} />
        </button>
      )}

      {/* Search bar */}
      <div className="ex-search-row">
        <div className="ex-search-box">
          <FiSearch size={16} className="ex-search-icon" />
          <input
            className="ex-search-input"
            placeholder="Search by name or muscle..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && <button className="ex-clear-btn" onClick={() => setQuery('')}><FiX size={14} /></button>}
        </div>
        <button className={`ex-filter-toggle ${hasFilters ? 'active' : ''}`} onClick={() => setShowFilters(s => !s)}>
          <FiFilter size={16} />
          Filters {hasFilters ? `(${[bodyPart,cat,difficulty,equipment].filter(Boolean).length})` : ''}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="ex-filters">
          {[
            { label: 'Body Part', val: bodyPart, set: setBodyPart, opts: BODY_PARTS },
            { label: 'Category',  val: cat,      set: setCat,      opts: CATEGORIES },
            { label: 'Difficulty',val: difficulty,set: setDifficulty, opts: DIFFICULTIES },
            { label: 'Equipment', val: equipment, set: setEquipment,  opts: EQUIPMENT },
          ].map(({ label, val, set, opts }) => (
            <div key={label} className="ex-filter-group">
              <label>{label}</label>
              <select value={val} onChange={e => set(e.target.value)}>
                {opts.map(o => <option key={o} value={o}>{o || 'All'}</option>)}
              </select>
            </div>
          ))}
          {hasFilters && <button className="ex-clear-filters" onClick={clearAll}><FiX size={12} /> Clear filters</button>}
        </div>
      )}

      {/* Quick muscle chips */}
      <div className="ex-muscle-chips">
        {['chest','back','legs','shoulders','arms','core','full body'].map(bp => (
          <button key={bp} className={`ex-chip ${bodyPart === bp ? 'active' : ''}`} onClick={() => setBodyPart(bodyPart === bp ? '' : bp)}>
            {MUSCLE_ICONS[bp]} {bp}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="ex-results-info">
        {loading ? 'Loading…' : results.length === exercises.length
          ? `All ${results.length} exercises`
          : `${results.length} result${results.length !== 1 ? 's' : ''}`}
      </div>

      {/* Exercise grid */}
      {loading ? (
        <div className="ex-empty"><div className="spinner" /></div>
      ) : results.length === 0 ? (
        <div className="ex-empty">
          <p>No exercises match your search.</p>
          <button className="btn btn-outline" onClick={clearAll}>Clear filters</button>
        </div>
      ) : (
        <div className="ex-grid">
          {results.map(ex => (
            <button key={ex.id} className={`ex-card ${ex.isCustom ? 'ex-card-custom' : ''}`} onClick={() => setSelected(ex)}>
              <div className="ex-card-top">
                <span className="ex-cat-icon">{CAT_ICONS[ex.cat]}</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {ex.isCustom && <span className="ex-custom-badge">Custom</span>}
                  <span className={`ex-diff-badge ${DIFF_COLORS[ex.difficulty]}`}>{ex.difficulty}</span>
                  {isCoach && ex.isCustom && ex.coachId === user?.id && (
                    <button className="ex-delete-btn" onClick={e => handleDelete(ex, e)} title="Delete exercise">
                      <FiTrash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="ex-card-name">{ex.name}</h3>
              <div className="ex-card-meta">
                <span className="ex-tag">{ex.bodyPart}</span>
                <span className="ex-tag">{ex.equipment}</span>
              </div>
              {ex.defaultSets && (
                <p className="ex-card-sets">{ex.defaultSets} sets × {ex.defaultReps ?? '—'} reps</p>
              )}
              <p className="ex-card-steps">{(ex.instructions||[]).length} steps · {(ex.tips||[]).length} tips</p>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />}

      {/* ── Create Exercise Modal (coach only) ── */}
      {showCreate && (
        <div className="ex-create-overlay" onClick={() => setShowCreate(false)}>
          <div className="ex-create-modal" onClick={e => e.stopPropagation()}>
            <div className="ex-create-header">
              <h2>Add New Exercise</h2>
              <button className="ex-close-btn" onClick={() => setShowCreate(false)}><FiX size={20} /></button>
            </div>

            <form onSubmit={handleCreate} className="ex-create-form">
              {/* Basic info */}
              <div className="ex-create-section">
                <h3>Basic Info</h3>
                <div className="form-group">
                  <label className="form-label">Exercise Name *</label>
                  <input className="form-input" placeholder="e.g. Dumbbell Lateral Raise" value={form.name} onChange={e => setF('name', e.target.value)} required />
                </div>
                <div className="ex-create-grid">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-input" value={form.cat} onChange={e => setF('cat', e.target.value)}>
                      <option value="strength">Strength</option>
                      <option value="cardio">Cardio</option>
                      <option value="flexibility">Flexibility</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Difficulty *</label>
                    <select className="form-input" value={form.difficulty} onChange={e => setF('difficulty', e.target.value)}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Body Part *</label>
                    <select className="form-input" value={form.bodyPart} onChange={e => setF('bodyPart', e.target.value)}>
                      {['chest','back','legs','shoulders','arms','core','full body'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Equipment *</label>
                    <select className="form-input" value={form.equipment} onChange={e => setF('equipment', e.target.value)}>
                      {['barbell','dumbbell','bodyweight','machine','cable','other'].map(eq => (
                        <option key={eq} value={eq}>{eq}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Primary Muscle *</label>
                    <input className="form-input" placeholder="e.g. shoulders" value={form.muscle} onChange={e => setF('muscle', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Sets</label>
                    <input className="form-input" type="number" min="1" max="10" value={form.defaultSets} onChange={e => setF('defaultSets', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Reps</label>
                    <input className="form-input" placeholder="e.g. 10-12" value={form.defaultReps} onChange={e => setF('defaultReps', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="ex-create-section">
                <h3>Step-by-Step Instructions *</h3>
                {form.instructions.map((step, i) => (
                  <div key={i} className="ex-step-row">
                    <span className="ex-step-num">{i + 1}</span>
                    <input
                      className="form-input"
                      placeholder={`Step ${i + 1}…`}
                      value={step}
                      onChange={e => setF('instructions', setStep(form.instructions, i, e.target.value))}
                    />
                    {form.instructions.length > 1 && (
                      <button type="button" className="ex-step-remove" onClick={() => setF('instructions', form.instructions.filter((_, j) => j !== i))}>
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setF('instructions', [...form.instructions, ''])}>
                  <FiPlus size={13} /> Add Step
                </button>
              </div>

              {/* Tips */}
              <div className="ex-create-section">
                <h3>Tips <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--text-muted)' }}>(optional)</span></h3>
                {form.tips.map((tip, i) => (
                  <div key={i} className="ex-step-row">
                    <span className="ex-step-num">💡</span>
                    <input
                      className="form-input"
                      placeholder={`Tip ${i + 1}…`}
                      value={tip}
                      onChange={e => setF('tips', setStep(form.tips, i, e.target.value))}
                    />
                    {form.tips.length > 1 && (
                      <button type="button" className="ex-step-remove" onClick={() => setF('tips', form.tips.filter((_, j) => j !== i))}>
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setF('tips', [...form.tips, ''])}>
                  <FiPlus size={13} /> Add Tip
                </button>
              </div>

              <div className="ex-create-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : '✅ Save Exercise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
