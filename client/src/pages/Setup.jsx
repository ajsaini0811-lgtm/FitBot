import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { calcBMR, calcTDEE, calcCalorieGoal, calcMacros, calcBMI, bmiCategory } from '../utils/calculations';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Setup.css';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',   label: 'Sedentary',         desc: 'Desk job, little or no exercise' },
  { value: 'light',       label: 'Lightly Active',     desc: 'Light exercise 1–3 days/week' },
  { value: 'moderate',    label: 'Moderately Active',  desc: 'Moderate exercise 3–5 days/week' },
  { value: 'active',      label: 'Very Active',        desc: 'Hard exercise 6–7 days/week' },
  { value: 'very_active', label: 'Extra Active',       desc: 'Hard exercise + physical job' },
];

const GOAL_OPTIONS = [
  { value: 'lose',     label: '🔥 Lose Fat',       desc: '500 kcal deficit/day, ~0.5 kg/week' },
  { value: 'maintain', label: '⚖️ Maintain Weight', desc: 'Eat at your TDEE to stay the same' },
  { value: 'gain',     label: '💪 Build Muscle',    desc: '300 kcal surplus for lean muscle gain' },
];

// User flow: steps 1–6 (role=USER)
const USER_TOTAL  = 6;
// Coach flow: steps 1–3 (role=COACH)
const COACH_TOTAL = 3;

export default function Setup() {
  const { updateUser, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [role, setRole]     = useState('USER'); // 'USER' | 'COACH'

  // Shared user data
  const [data, setData] = useState({
    age: '', gender: '', heightCm: '', weightKg: '',
    goalWeight: '', goal: 'maintain', activityLevel: 'moderate', coachName: '',
  });

  // Coach data
  const [coachData, setCoachData] = useState({ specialization: '', bio: '' });

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const setC = (k, v) => setCoachData(d => ({ ...d, [k]: v }));

  const TOTAL_STEPS = role === 'COACH' ? COACH_TOTAL : USER_TOTAL;

  const canNext = () => {
    if (step === 1) return true; // role selection always valid
    if (role === 'COACH') return true; // coach steps 2+ are optional
    // User steps
    if (step === 2) return data.age && data.gender;
    if (step === 3) return data.heightCm && data.weightKg;
    if (step === 4) return data.goal;
    if (step === 5) return data.activityLevel;
    return true;
  };

  const getSummary = () => {
    if (!data.age || !data.gender || !data.heightCm || !data.weightKg) return null;
    const bmr = calcBMR(+data.weightKg, +data.heightCm, +data.age, data.gender);
    const tdee = calcTDEE(bmr, data.activityLevel);
    const cal = calcCalorieGoal(tdee, data.goal);
    const macros = calcMacros(cal);
    const bmi = calcBMI(+data.weightKg, +data.heightCm);
    return { tdee, cal, macros, bmi, bmiCat: bmiCategory(bmi) };
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let payload;
      if (role === 'COACH') {
        payload = {
          role: 'COACH',
          specialization: coachData.specialization || undefined,
          bio: coachData.bio || undefined,
        };
      } else {
        payload = { ...data };
      }

      const updated = await api.put('/profile', payload);
      updateUser(updated.data);
      toast.success(role === 'COACH' ? 'Coach profile saved! 🏅' : 'Profile saved! Let\'s go! 🚀');
      navigate(role === 'COACH' ? '/coach' : '/chat', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const isLastStep = step === TOTAL_STEPS;
  const userSummary = role === 'USER' && step === USER_TOTAL ? getSummary() : null;

  return (
    <div className="setup-page">
      <div className="setup-card card">
        {/* Progress bar */}
        <div className="setup-progress-bar">
          <div className="setup-progress-fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
        <div className="setup-step-label">Step {step} of {TOTAL_STEPS}</div>

        {/* ── Step 1: Role Selection ── */}
        {step === 1 && (
          <div className="setup-step">
            <div className="setup-emoji">🤔</div>
            <h2>How are you using FitBot?</h2>
            <p className="setup-sub">Choose your role — you can always change it later from your profile.</p>
            <div className="role-cards">
              <div
                className={`role-card ${role === 'USER' ? 'active' : ''}`}
                onClick={() => setRole('USER')}
              >
                <span className="role-icon">🏋️</span>
                <div className="role-label">I'm Training</div>
                <div className="role-desc">Track calories, workouts, and weight. Get a plan from your coach.</div>
              </div>
              <div
                className={`role-card ${role === 'COACH' ? 'active' : ''}`}
                onClick={() => setRole('COACH')}
              >
                <span className="role-icon">🏅</span>
                <div className="role-label">I'm a Coach</div>
                <div className="role-desc">Manage clients, assign workout and diet plans, and chat with them.</div>
              </div>
            </div>
          </div>
        )}

        {/* ── COACH Steps ── */}

        {/* Coach Step 2: Profile */}
        {role === 'COACH' && step === 2 && (
          <div className="setup-step">
            <div className="setup-emoji">📋</div>
            <h2>Your coach profile</h2>
            <p className="setup-sub">Help clients know what you specialise in. Both fields are optional.</p>
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input className="form-input" placeholder="e.g. Strength & Conditioning, Weight Loss..."
                value={coachData.specialization} onChange={e => setC('specialization', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Short Bio</label>
              <textarea className="form-input" rows={3} placeholder="Tell your clients a bit about yourself..."
                value={coachData.bio} onChange={e => setC('bio', e.target.value)}
                style={{ resize: 'vertical', minHeight: 80 }} />
            </div>
          </div>
        )}

        {/* Coach Step 3: Done */}
        {role === 'COACH' && step === 3 && (
          <div className="setup-step">
            <div className="setup-emoji">🎉</div>
            <h2>You're all set, Coach {user?.name?.split(' ')[0]}!</h2>
            <p className="setup-sub">Your coach dashboard is ready. Start by adding your first client.</p>
            <div className="coach-summary-list">
              <div className="coach-sum-item">✅ Manage clients by email</div>
              <div className="coach-sum-item">✅ Assign workout & diet plans</div>
              <div className="coach-sum-item">✅ Chat with clients in real-time</div>
              <div className="coach-sum-item">✅ View client progress & logs</div>
            </div>
          </div>
        )}

        {/* ── USER Steps ── */}

        {/* User Step 2: About You */}
        {role === 'USER' && step === 2 && (
          <div className="setup-step">
            <div className="setup-emoji">👋</div>
            <h2>Let's get to know you</h2>
            <p className="setup-sub">This helps us calculate your personalised calorie targets.</p>
            <div className="form-group">
              <label className="form-label">Your Age</label>
              <input className="form-input" type="number" min="10" max="100" placeholder="25"
                value={data.age} onChange={e => set('age', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <div className="gender-toggle">
                {['male', 'female', 'other'].map(g => (
                  <button key={g} type="button"
                    className={`gender-btn ${data.gender === g ? 'active' : ''}`}
                    onClick={() => set('gender', g)}>
                    {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⚧ Other'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Step 3: Body Stats */}
        {role === 'USER' && step === 3 && (
          <div className="setup-step">
            <div className="setup-emoji">📏</div>
            <h2>Your body stats</h2>
            <p className="setup-sub">We use these to calculate your BMR and calorie needs.</p>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input className="form-input" type="number" min="100" max="250" placeholder="170"
                value={data.heightCm} onChange={e => set('heightCm', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Current Weight (kg)</label>
              <input className="form-input" type="number" min="30" max="300" placeholder="70"
                value={data.weightKg} onChange={e => set('weightKg', e.target.value)} />
            </div>
          </div>
        )}

        {/* User Step 4: Goal */}
        {role === 'USER' && step === 4 && (
          <div className="setup-step">
            <div className="setup-emoji">🎯</div>
            <h2>What's your goal?</h2>
            <p className="setup-sub">This determines your daily calorie target.</p>
            {GOAL_OPTIONS.map(opt => (
              <div key={opt.value}
                className={`option-card ${data.goal === opt.value ? 'active' : ''}`}
                onClick={() => set('goal', opt.value)}>
                <div className="option-label">{opt.label}</div>
                <div className="option-desc">{opt.desc}</div>
              </div>
            ))}
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Goal Weight (optional, kg)</label>
              <input className="form-input" type="number" placeholder="65"
                value={data.goalWeight} onChange={e => set('goalWeight', e.target.value)} />
            </div>
          </div>
        )}

        {/* User Step 5: Activity */}
        {role === 'USER' && step === 5 && (
          <div className="setup-step">
            <div className="setup-emoji">🏃</div>
            <h2>How active are you?</h2>
            <p className="setup-sub">Be honest — this is the biggest factor in your calorie calculation!</p>
            {ACTIVITY_OPTIONS.map(opt => (
              <div key={opt.value}
                className={`option-card ${data.activityLevel === opt.value ? 'active' : ''}`}
                onClick={() => set('activityLevel', opt.value)}>
                <div className="option-label">{opt.label}</div>
                <div className="option-desc">{opt.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* User Step 6 (Summary) */}
        {role === 'USER' && step === USER_TOTAL && (
          <div className="setup-step">
            {userSummary ? (
              <>
                <div className="setup-emoji">🎉</div>
                <h2>You're all set, {user?.name?.split(' ')[0]}!</h2>
                <p className="setup-sub">Here's your personalised fitness profile:</p>
                <div className="summary-grid">
                  <div className="summary-box">
                    <div className="summary-num" style={{ color: 'var(--primary)' }}>{userSummary.cal}</div>
                    <div className="summary-lbl">kcal/day target</div>
                  </div>
                  <div className="summary-box">
                    <div className="summary-num" style={{ color: 'var(--accent)' }}>{userSummary.macros.proteinGoalG}g</div>
                    <div className="summary-lbl">Protein goal</div>
                  </div>
                  <div className="summary-box">
                    <div className="summary-num" style={{ color: 'var(--gold)' }}>{userSummary.macros.carbGoalG}g</div>
                    <div className="summary-lbl">Carbs goal</div>
                  </div>
                  <div className="summary-box">
                    <div className="summary-num" style={{ color: 'var(--danger)' }}>{userSummary.macros.fatGoalG}g</div>
                    <div className="summary-lbl">Fat goal</div>
                  </div>
                </div>
                <div className="summary-bmi">
                  <span>BMI: <strong>{userSummary.bmi}</strong></span>
                  <span className={`badge ${userSummary.bmi < 18.5 ? 'badge-blue' : userSummary.bmi < 25 ? 'badge-green' : userSummary.bmi < 30 ? 'badge-gold' : 'badge-red'}`}>
                    {userSummary.bmiCat}
                  </span>
                </div>
                <p className="setup-sub" style={{ marginTop: 12, fontSize: 13 }}>Based on TDEE of {userSummary.tdee} kcal/day.</p>
              </>
            ) : (
              <>
                <div className="setup-emoji">🏅</div>
                <h2>Do you have a coach?</h2>
                <p className="setup-sub">Optional — enter your coach's name as a reminder of who you're accountable to!</p>
                <div className="form-group">
                  <label className="form-label">Coach's Name (optional)</label>
                  <input className="form-input" placeholder="e.g. Ravi Sir"
                    value={data.coachName} onChange={e => set('coachName', e.target.value)} />
                </div>
                <div className="coach-tip">
                  <span>💡</span>
                  <span>Your coach will be proud when they see your consistent logs!</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="setup-nav">
          {step > 1 && (
            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          {!isLastStep ? (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              Continue →
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving…' : role === 'COACH' ? '🏅 Set Up Dashboard' : '🚀 Let\'s Go!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
