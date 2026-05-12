import { useState, useEffect, useMemo } from 'react';
import ExerciseDetailModal from '../components/ExerciseDetailModal';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiSearch, FiX, FiPlus, FiTrash2, FiZap, FiChevronRight } from 'react-icons/fi';
import './ExerciseLibrary.css';

const BODY_PARTS = [
  { key: '', label: 'All',        emoji: '🏋️' },
  { key: 'chest',     label: 'Chest',      emoji: '🫁' },
  { key: 'back',      label: 'Back',       emoji: '🔙' },
  { key: 'legs',      label: 'Legs',       emoji: '🦵' },
  { key: 'shoulders', label: 'Shoulders',  emoji: '💪' },
  { key: 'arms',      label: 'Arms',       emoji: '💪' },
  { key: 'core',      label: 'Core',       emoji: '🎯' },
  { key: 'full body', label: 'Full Body',  emoji: '⚡' },
];

const DIFF_META = {
  beginner:     { label: 'Beginner',     cls: 'green'  },
  intermediate: { label: 'Intermediate', cls: 'orange' },
  advanced:     { label: 'Advanced',     cls: 'red'    },
};

const CAT_COLOR = { strength: '#6366f1', cardio: '#f59e0b', flexibility: '#10b981' };
const CAT_ICON  = { strength: '🏋️', cardio: '🏃', flexibility: '🧘' };

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
  const [difficulty, setDifficulty] = useState('');
  const [selected, setSelected]     = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  useEffect(() => { fetchExercises(); }, []);

  async function fetchExercises() {
    try {
      const { data } = await api.get('/exercises');
      setExercises(data);
    } catch { toast.error('Failed to load exercises'); }
    finally  { setLoading(false); }
  }

  const results = useMemo(() => {
    let list = exercises;
    if (query)      list = list.filter(e => e.name?.toLowerCase().includes(query.toLowerCase()) || e.muscle?.toLowerCase().includes(query.toLowerCase()));
    if (bodyPart)   list = list.filter(e => e.bodyPart === bodyPart);
    if (difficulty) list = list.filter(e => e.difficulty === difficulty);
    return list;
  }, [exercises, query, bodyPart, difficulty]);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setStep = (arr, i, val) => { const n = [...arr]; n[i] = val; return n; };

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim())   return toast.error('Exercise name required');
    if (!form.muscle.trim()) return toast.error('Primary muscle required');
    const instructions = form.instructions.map(s => s.trim()).filter(Boolean);
    if (!instructions.length) return toast.error('Add at least one instruction');
    setSaving(true);
    try {
      await api.post('/coach/exercises', {
        ...form, instructions,
        tips: form.tips.map(s => s.trim()).filter(Boolean),
        defaultSets: Number(form.defaultSets) || null,
        defaultReps: form.defaultReps || null,
      });
      toast.success('Exercise added! 🎉');
      setShowCreate(false); setForm(EMPTY_FORM); fetchExercises();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create exercise'); }
    finally { setSaving(false); }
  }

  async function handleDelete(ex, e) {
    e.stopPropagation();
    if (!confirm(`Delete "${ex.name}"?`)) return;
    try {
      await api.delete(`/coach/exercises/${String(ex.id).replace('custom_', '')}`);
      toast.success('Exercise deleted');
      setExercises(prev => prev.filter(x => x.id !== ex.id));
    } catch { toast.error('Failed to delete'); }
  }

  return (
    <div className="el-page">

      {/* ── Hero banner ── */}
      <div className="el-hero">
        <div className="el-hero-inner">
          <div className="el-hero-text">
            <h1>Exercise Library</h1>
            <p>{exercises.length} exercises · step-by-step instructions &amp; tips</p>
          </div>
          {/* Search in hero */}
          <div className="el-hero-search">
            <FiSearch size={18} className="el-hero-search-icon" />
            <input
              className="el-hero-search-input"
              placeholder="Search exercises, muscles…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
            />
            {query && (
              <button className="el-hero-clear" onClick={() => setQuery('')}><FiX size={16} /></button>
            )}
          </div>
        </div>
      </div>

      <div className="el-body">

        {/* ── Body-part tabs ── */}
        <div className="el-tabs-scroll">
          <div className="el-tabs">
            {BODY_PARTS.map(bp => (
              <button
                key={bp.key}
                className={`el-tab ${bodyPart === bp.key ? 'active' : ''}`}
                onClick={() => setBodyPart(bodyPart === bp.key && bp.key ? '' : bp.key)}
              >
                <span className="el-tab-emoji">{bp.emoji}</span>
                <span>{bp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Difficulty quick filter ── */}
        <div className="el-diff-row">
          {['beginner','intermediate','advanced'].map(d => (
            <button
              key={d}
              className={`el-diff-pill ${difficulty === d ? 'active-' + DIFF_META[d].cls : ''}`}
              onClick={() => setDifficulty(difficulty === d ? '' : d)}
            >
              {DIFF_META[d].label}
            </button>
          ))}
          {(bodyPart || difficulty || query) && (
            <button className="el-diff-pill clear" onClick={() => { setBodyPart(''); setDifficulty(''); setQuery(''); }}>
              <FiX size={11} /> Clear
            </button>
          )}
          <span className="el-count-pill">
            {loading ? '…' : results.length} exercise{results.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="el-loading"><div className="spinner" /></div>
        ) : results.length === 0 ? (
          <div className="el-empty">
            <div style={{ fontSize: 48 }}>🔍</div>
            <h3>No exercises found</h3>
            <p>Try a different search or filter</p>
            <button className="btn btn-outline" onClick={() => { setBodyPart(''); setDifficulty(''); setQuery(''); }}>
              Show all exercises
            </button>
          </div>
        ) : (
          <div className="el-grid">
            {results.map(ex => {
              const diff = DIFF_META[ex.difficulty] || DIFF_META.beginner;
              const accentColor = CAT_COLOR[ex.cat] || '#6366f1';
              return (
                <button
                  key={ex.id}
                  className={`el-card ${ex.isCustom ? 'el-card-custom' : ''}`}
                  onClick={() => setSelected(ex)}
                  style={{ '--accent': accentColor }}
                >
                  <div className="el-card-accent" />
                  <div className="el-card-head">
                    <span className="el-card-cat-icon">{CAT_ICON[ex.cat] || '🏋️'}</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {ex.isCustom && <span className="el-custom-badge">Custom</span>}
                      <span className={`el-diff-badge ${diff.cls}`}>{diff.label}</span>
                      {isCoach && ex.isCustom && ex.coachId === user?.id && (
                        <button className="el-delete-btn" onClick={e => handleDelete(ex, e)}>
                          <FiTrash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="el-card-name">{ex.name}</h3>
                  <div className="el-card-tags">
                    {ex.bodyPart && <span className="el-tag">{ex.bodyPart}</span>}
                    {ex.equipment && <span className="el-tag">{ex.equipment}</span>}
                  </div>
                  <div className="el-card-footer">
                    {ex.defaultSets
                      ? <span className="el-card-sets"><FiZap size={11} /> {ex.defaultSets}×{ex.defaultReps ?? '—'}</span>
                      : <span className="el-card-sets" />
                    }
                    <span className="el-card-steps">{(ex.instructions||[]).length} steps</span>
                    <FiChevronRight size={14} className="el-card-arrow" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Coach: Add Exercise CTA ── */}
        {isCoach && !loading && (
          <div className="el-add-cta">
            <div className="el-add-cta-inner">
              <div className="el-add-cta-text">
                <div className="el-add-cta-title">Add a Custom Exercise</div>
                <div className="el-add-cta-sub">Create your own exercise with steps &amp; tips for clients</div>
              </div>
              <button className="el-add-cta-btn" onClick={() => setShowCreate(true)}>
                <FiPlus size={18} /> Add Exercise
              </button>
            </div>
          </div>
        )}

      </div>{/* el-body */}

      {/* ── Detail modal ── */}
      {selected && <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />}

      {/* ── Create Exercise Modal ── */}
      {showCreate && (
        <div className="el-overlay" onClick={() => setShowCreate(false)}>
          <div className="el-modal" onClick={e => e.stopPropagation()}>
            <div className="el-modal-head">
              <h2>Add New Exercise</h2>
              <button className="el-modal-close" onClick={() => setShowCreate(false)}><FiX size={20} /></button>
            </div>

            <form onSubmit={handleCreate} className="el-modal-body">
              <div className="el-form-section">
                <h3>Basic Info</h3>
                <div className="form-group">
                  <label className="form-label">Exercise Name *</label>
                  <input className="form-input" placeholder="e.g. Dumbbell Lateral Raise"
                    value={form.name} onChange={e => setF('name', e.target.value)} required />
                </div>
                <div className="el-form-grid">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-input" value={form.cat} onChange={e => setF('cat', e.target.value)}>
                      <option value="strength">Strength</option>
                      <option value="cardio">Cardio</option>
                      <option value="flexibility">Flexibility</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Difficulty</label>
                    <select className="form-input" value={form.difficulty} onChange={e => setF('difficulty', e.target.value)}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Body Part</label>
                    <select className="form-input" value={form.bodyPart} onChange={e => setF('bodyPart', e.target.value)}>
                      {['chest','back','legs','shoulders','arms','core','full body'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Equipment</label>
                    <select className="form-input" value={form.equipment} onChange={e => setF('equipment', e.target.value)}>
                      {['barbell','dumbbell','bodyweight','machine','cable','other'].map(eq => (
                        <option key={eq} value={eq}>{eq}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Primary Muscle *</label>
                    <input className="form-input" placeholder="e.g. shoulders"
                      value={form.muscle} onChange={e => setF('muscle', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sets × Reps</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input className="form-input" type="number" min="1" max="10" placeholder="Sets"
                        value={form.defaultSets} onChange={e => setF('defaultSets', e.target.value)} />
                      <input className="form-input" placeholder="Reps (e.g. 10-12)"
                        value={form.defaultReps} onChange={e => setF('defaultReps', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="el-form-section">
                <h3>Step-by-Step Instructions *</h3>
                {form.instructions.map((step, i) => (
                  <div key={i} className="el-step-row">
                    <span className="el-step-num">{i + 1}</span>
                    <input className="form-input" placeholder={`Step ${i + 1}…`}
                      value={step} onChange={e => setF('instructions', setStep(form.instructions, i, e.target.value))} />
                    {form.instructions.length > 1 && (
                      <button type="button" className="el-step-rm"
                        onClick={() => setF('instructions', form.instructions.filter((_, j) => j !== i))}>
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm"
                  onClick={() => setF('instructions', [...form.instructions, ''])}>
                  <FiPlus size={13} /> Add Step
                </button>
              </div>

              <div className="el-form-section">
                <h3>Tips <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--text-muted)' }}>(optional)</span></h3>
                {form.tips.map((tip, i) => (
                  <div key={i} className="el-step-row">
                    <span className="el-step-num">💡</span>
                    <input className="form-input" placeholder={`Tip ${i + 1}…`}
                      value={tip} onChange={e => setF('tips', setStep(form.tips, i, e.target.value))} />
                    {form.tips.length > 1 && (
                      <button type="button" className="el-step-rm"
                        onClick={() => setF('tips', form.tips.filter((_, j) => j !== i))}>
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm"
                  onClick={() => setF('tips', [...form.tips, ''])}>
                  <FiPlus size={13} /> Add Tip
                </button>
              </div>

              <div className="el-modal-footer">
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
