import { useState, useMemo } from 'react';
import EXERCISES, { searchExercises } from '../utils/exercises';
import ExerciseDetailModal from '../components/ExerciseDetailModal';
import { FiSearch, FiX, FiFilter } from 'react-icons/fi';
import './ExerciseLibrary.css';

const BODY_PARTS = ['', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full body'];
const CATEGORIES = ['', 'strength', 'cardio', 'flexibility'];
const DIFFICULTIES = ['', 'beginner', 'intermediate', 'advanced'];
const EQUIPMENT    = ['', 'barbell', 'dumbbell', 'bodyweight', 'machine', 'cable', 'none'];

const MUSCLE_ICONS = {
  chest: '🫁', back: '🦵', legs: '🦿', shoulders: '💪',
  arms: '💪', core: '🎯', 'full body': '🏋️', glutes: '🍑',
  biceps: '💪', triceps: '💪',
};

const DIFF_COLORS = { beginner: 'green', intermediate: 'orange', advanced: 'red' };
const CAT_ICONS   = { strength: '🏋️', cardio: '🏃', flexibility: '🧘' };

export default function ExerciseLibrary() {
  const [query, setQuery]       = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [cat, setCat]           = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [equipment, setEquipment]   = useState('');
  const [selected, setSelected]     = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(
    () => searchExercises({ q: query, bodyPart, cat, difficulty, equipment }),
    [query, bodyPart, cat, difficulty, equipment]
  );

  const hasFilters = bodyPart || cat || difficulty || equipment;

  function clearAll() {
    setQuery('');
    setBodyPart('');
    setCat('');
    setDifficulty('');
    setEquipment('');
  }

  return (
    <div className="ex-lib">
      <div className="ex-lib-header">
        <h1 className="ex-lib-title">Exercise Library</h1>
        <p className="ex-lib-sub">{EXERCISES.length} exercises with step-by-step instructions</p>
      </div>

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
          {query && (
            <button className="ex-clear-btn" onClick={() => setQuery('')}>
              <FiX size={14} />
            </button>
          )}
        </div>
        <button
          className={`ex-filter-toggle ${hasFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(s => !s)}
        >
          <FiFilter size={16} />
          Filters {hasFilters ? `(${[bodyPart,cat,difficulty,equipment].filter(Boolean).length})` : ''}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="ex-filters">
          <div className="ex-filter-group">
            <label>Body Part</label>
            <select value={bodyPart} onChange={e => setBodyPart(e.target.value)}>
              {BODY_PARTS.map(b => <option key={b} value={b}>{b || 'All'}</option>)}
            </select>
          </div>
          <div className="ex-filter-group">
            <label>Category</label>
            <select value={cat} onChange={e => setCat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All'}</option>)}
            </select>
          </div>
          <div className="ex-filter-group">
            <label>Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d || 'All'}</option>)}
            </select>
          </div>
          <div className="ex-filter-group">
            <label>Equipment</label>
            <select value={equipment} onChange={e => setEquipment(e.target.value)}>
              {EQUIPMENT.map(eq => <option key={eq} value={eq}>{eq || 'All'}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button className="ex-clear-filters" onClick={clearAll}>
              <FiX size={12} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Quick muscle chips */}
      <div className="ex-muscle-chips">
        {['chest','back','legs','shoulders','arms','core','full body'].map(bp => (
          <button
            key={bp}
            className={`ex-chip ${bodyPart === bp ? 'active' : ''}`}
            onClick={() => setBodyPart(bodyPart === bp ? '' : bp)}
          >
            {MUSCLE_ICONS[bp]} {bp}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="ex-results-info">
        {results.length === EXERCISES.length
          ? `All ${results.length} exercises`
          : `${results.length} result${results.length !== 1 ? 's' : ''}`}
      </div>

      {/* Exercise grid */}
      {results.length === 0 ? (
        <div className="ex-empty">
          <p>No exercises match your search.</p>
          <button className="btn btn-outline" onClick={clearAll}>Clear filters</button>
        </div>
      ) : (
        <div className="ex-grid">
          {results.map(ex => (
            <button key={ex.id} className="ex-card" onClick={() => setSelected(ex)}>
              <div className="ex-card-top">
                <span className="ex-cat-icon">{CAT_ICONS[ex.cat]}</span>
                <span className={`ex-diff-badge ${DIFF_COLORS[ex.difficulty]}`}>
                  {ex.difficulty}
                </span>
              </div>
              <h3 className="ex-card-name">{ex.name}</h3>
              <div className="ex-card-meta">
                <span className="ex-tag">{ex.bodyPart}</span>
                <span className="ex-tag">{ex.equipment}</span>
              </div>
              {ex.defaultSets && (
                <p className="ex-card-sets">
                  {ex.defaultSets} sets × {ex.defaultReps ?? '—'} reps
                </p>
              )}
              <p className="ex-card-steps">
                {ex.instructions.length} steps · {ex.tips.length} tips
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
