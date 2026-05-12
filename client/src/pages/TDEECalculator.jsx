import { useState } from 'react';
import { FiZap, FiActivity } from 'react-icons/fi';
import './TDEECalculator.css';

const ACTIVITY = [
  { key: 'sedentary',    label: 'Sedentary',      sub: 'Little or no exercise',      mult: 1.2   },
  { key: 'light',        label: 'Lightly Active',  sub: '1–3 days/week',             mult: 1.375 },
  { key: 'moderate',     label: 'Moderately Active',sub: '3–5 days/week',            mult: 1.55  },
  { key: 'active',       label: 'Very Active',     sub: '6–7 days/week',              mult: 1.725 },
  { key: 'extra_active', label: 'Athlete',         sub: 'Twice a day / hard training',mult: 1.9   },
];

const GOALS = [
  { key: 'lose',     label: '🔥 Lose Weight',   adj: -500 },
  { key: 'maintain', label: '⚖️ Maintain',       adj: 0    },
  { key: 'gain',     label: '💪 Build Muscle',   adj: +300 },
];

export default function TDEECalculator() {
  const [form, setForm] = useState({
    age: '', weight: '', height: '', gender: 'male',
    activity: 'moderate', goal: 'maintain',
  });
  const [result, setResult] = useState(null);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setResult(null); };

  function calculate() {
    const age = Number(form.age), weight = Number(form.weight), height = Number(form.height);
    if (!age || !weight || !height) return;
    // Mifflin-St Jeor BMR
    let bmr = form.gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
    const actMult = ACTIVITY.find(a => a.key === form.activity)?.mult || 1.55;
    const tdee    = Math.round(bmr * actMult);
    const adj     = GOALS.find(g => g.key === form.goal)?.adj || 0;
    const target  = tdee + adj;
    // Macros: protein = 2g/kg, fat = 25% calories, carbs = rest
    const protein = Math.round(weight * 2);
    const fat     = Math.round((target * 0.25) / 9);
    const carbs   = Math.round((target - protein * 4 - fat * 9) / 4);
    setResult({ bmr: Math.round(bmr), tdee, target, protein, fat, carbs });
  }

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ maxWidth: 560 }}>
        <h1 className="heading" style={{ marginBottom: 4 }}>TDEE Calculator</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
          Find your Total Daily Energy Expenditure and ideal macro split.
        </p>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div className="tdee-grid">
            <div className="form-group">
              <label className="form-label">Age (years)</label>
              <input className="form-input" type="number" placeholder="25" value={form.age} onChange={e => set('age', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" type="number" placeholder="70" value={form.weight} onChange={e => set('weight', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input className="form-input" type="number" placeholder="175" value={form.height} onChange={e => set('height', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Activity Level</label>
            <div className="tdee-activity-list">
              {ACTIVITY.map(a => (
                <button key={a.key} type="button"
                  className={`tdee-activity-btn ${form.activity === a.key ? 'active' : ''}`}
                  onClick={() => set('activity', a.key)}>
                  <span className="tdee-act-label">{a.label}</span>
                  <span className="tdee-act-sub">{a.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Goal</label>
            <div className="tdee-goal-row">
              {GOALS.map(g => (
                <button key={g.key} type="button"
                  className={`tdee-goal-btn ${form.goal === g.key ? 'active' : ''}`}
                  onClick={() => set('goal', g.key)}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginBottom: 20 }} onClick={calculate}>
          <FiZap size={16} /> Calculate My TDEE
        </button>

        {result && (
          <div className="tdee-result">
            <div className="tdee-result-hero">
              <div className="tdee-main-cal">{result.target}</div>
              <div className="tdee-main-label">calories / day</div>
              <div className="tdee-sub-stats">
                <span>BMR: <strong>{result.bmr}</strong></span>
                <span>TDEE: <strong>{result.tdee}</strong></span>
              </div>
            </div>
            <div className="tdee-macros">
              <div className="tdee-macro protein">
                <div className="tdee-macro-val">{result.protein}g</div>
                <div className="tdee-macro-lbl">Protein</div>
                <div className="tdee-macro-bar"><div style={{ width: `${Math.min(100,(result.protein*4/result.target)*100)}%` }} /></div>
              </div>
              <div className="tdee-macro carbs">
                <div className="tdee-macro-val">{result.carbs}g</div>
                <div className="tdee-macro-lbl">Carbs</div>
                <div className="tdee-macro-bar"><div style={{ width: `${Math.min(100,(result.carbs*4/result.target)*100)}%` }} /></div>
              </div>
              <div className="tdee-macro fat">
                <div className="tdee-macro-val">{result.fat}g</div>
                <div className="tdee-macro-lbl">Fat</div>
                <div className="tdee-macro-bar"><div style={{ width: `${Math.min(100,(result.fat*9/result.target)*100)}%` }} /></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
