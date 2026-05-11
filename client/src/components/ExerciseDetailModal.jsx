import { useEffect } from 'react';
import { FiX, FiCheckCircle, FiZap } from 'react-icons/fi';
import './ExerciseDetailModal.css';

const DIFF_COLORS = { beginner: 'green', intermediate: 'orange', advanced: 'red' };
const CAT_ICONS   = { strength: '🏋️', cardio: '🏃', flexibility: '🧘' };

export default function ExerciseDetailModal({ exercise: ex, onClose }) {
  // Close on Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="edm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="edm-sheet">
        {/* Header */}
        <div className="edm-header">
          <div className="edm-header-left">
            <span className="edm-cat-icon">{CAT_ICONS[ex.cat]}</span>
            <div>
              <h2 className="edm-title">{ex.name}</h2>
              <div className="edm-badges">
                <span className={`edm-diff ${DIFF_COLORS[ex.difficulty]}`}>{ex.difficulty}</span>
                <span className="edm-tag">{ex.bodyPart}</span>
                <span className="edm-tag">{ex.equipment}</span>
                <span className="edm-tag">{ex.cat}</span>
              </div>
            </div>
          </div>
          <button className="edm-close" onClick={onClose} aria-label="Close">
            <FiX size={20} />
          </button>
        </div>

        <div className="edm-body">
          {/* Quick stats */}
          {ex.defaultSets && (
            <div className="edm-stats-row">
              <div className="edm-stat">
                <span className="edm-stat-label">Default Sets</span>
                <span className="edm-stat-value">{ex.defaultSets}</span>
              </div>
              <div className="edm-stat">
                <span className="edm-stat-label">Default Reps</span>
                <span className="edm-stat-value">{ex.defaultReps ?? '—'}</span>
              </div>
              <div className="edm-stat">
                <span className="edm-stat-label">Muscle</span>
                <span className="edm-stat-value" style={{ textTransform: 'capitalize' }}>{ex.muscle}</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="edm-section">
            <h3 className="edm-section-title">
              <FiCheckCircle size={16} /> Step-by-Step Instructions
            </h3>
            <ol className="edm-steps">
              {ex.instructions.map((step, i) => (
                <li key={i} className="edm-step">
                  <span className="edm-step-num">{i + 1}</span>
                  <span className="edm-step-text">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          <div className="edm-section">
            <h3 className="edm-section-title">
              <FiZap size={16} /> Pro Tips
            </h3>
            <ul className="edm-tips">
              {ex.tips.map((tip, i) => (
                <li key={i} className="edm-tip">
                  <span className="edm-tip-dot" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
