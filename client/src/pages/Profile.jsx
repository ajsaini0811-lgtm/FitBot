import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { calcBMR, calcTDEE, calcCalorieGoal, calcMacros, calcBMI, bmiCategory, activityLabel, goalLabel } from '../utils/calculations';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Profile.css';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',   label: 'Sedentary' },
  { value: 'light',       label: 'Lightly Active' },
  { value: 'moderate',    label: 'Moderately Active' },
  { value: 'active',      label: 'Very Active' },
  { value: 'very_active', label: 'Extra Active' },
];

export default function Profile() {
  const { user, updateUser, logout } = useAuth();

  const [form, setForm] = useState({
    name:         user?.name         || '',
    coachName:    user?.coachName    || '',
    age:          user?.age          || '',
    gender:       user?.gender       || 'male',
    heightCm:     user?.heightCm     || '',
    weightKg:     user?.weightKg     || '',
    goalWeight:   user?.goalWeight   || '',
    goal:         user?.goal         || 'maintain',
    activityLevel: user?.activityLevel || 'moderate',
  });
  const [loading, setLoading] = useState(false);

  // Delete account modal state
  const [deleteStep, setDeleteStep] = useState(0); // 0=hidden, 1=warning, 2=otp
  const [deleteOtp, setDeleteOtp] = useState(['', '', '', '', '', '']);
  const [deleteSending, setDeleteSending] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const otpRefs = useRef([]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Live-compute new calorie budget
  const getPreview = () => {
    if (!form.age || !form.gender || !form.heightCm || !form.weightKg) return null;
    const bmr = calcBMR(+form.weightKg, +form.heightCm, +form.age, form.gender);
    const tdee = calcTDEE(bmr, form.activityLevel);
    const cal = calcCalorieGoal(tdee, form.goal);
    return { cal, macros: calcMacros(cal) };
  };

  const preview = getPreview();
  const bmi = form.heightCm && form.weightKg ? calcBMI(+form.weightKg, +form.heightCm) : null;

  const handleRequestDelete = async () => {
    setDeleteSending(true);
    try {
      await api.post('/auth/request-delete');
      toast.success('Verification code sent to your email!');
      setDeleteStep(2);
      setDeleteOtp(['', '', '', '', '', '']);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send code');
    } finally {
      setDeleteSending(false);
    }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...deleteOtp];
    next[i] = val;
    setDeleteOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !deleteOtp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleConfirmDelete = async () => {
    const code = deleteOtp.join('');
    if (code.length < 6) return toast.error('Enter the full 6-digit code');
    setDeleteLoading(true);
    try {
      await api.delete('/auth/account', { data: { otp: code } });
      toast.success('Account deleted.');
      logout();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deletion failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/profile', form);
      updateUser(res.data);
      toast.success('Profile updated! ✅');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <h1 className="heading" style={{ marginBottom: 24 }}>My Profile</h1>

        <form onSubmit={handleSave}>
          {/* Personal */}
          <div className="card profile-section">
            <h2 className="profile-section-title">Personal Info</h2>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Coach's Name (optional)</label>
              <input className="form-input" placeholder="e.g. Ravi Sir" value={form.coachName} onChange={e => set('coachName', e.target.value)} />
            </div>
          </div>

          {/* Body Stats */}
          <div className="card profile-section">
            <h2 className="profile-section-title">Body Stats</h2>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Age</label>
                <input className="form-input" type="number" min="10" max="100" value={form.age} onChange={e => set('age', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-input form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input className="form-input" type="number" value={form.heightCm} onChange={e => set('heightCm', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Current Weight (kg)</label>
                <input className="form-input" type="number" value={form.weightKg} onChange={e => set('weightKg', e.target.value)} />
              </div>
            </div>
            {bmi && (
              <div className="bmi-display">
                BMI: <strong>{bmi}</strong>
                <span className={`badge ${bmi < 18.5 ? 'badge-blue' : bmi < 25 ? 'badge-green' : bmi < 30 ? 'badge-gold' : 'badge-red'}`} style={{ marginLeft: 8 }}>{bmiCategory(bmi)}</span>
              </div>
            )}
          </div>

          {/* Goals */}
          <div className="card profile-section">
            <h2 className="profile-section-title">Fitness Goals</h2>
            <div className="form-group">
              <label className="form-label">Goal</label>
              <select className="form-input form-select" value={form.goal} onChange={e => set('goal', e.target.value)}>
                <option value="lose">Lose Fat</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain">Build Muscle</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Goal Weight (kg, optional)</label>
              <input className="form-input" type="number" placeholder="65" value={form.goalWeight} onChange={e => set('goalWeight', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Activity Level</label>
              <select className="form-input form-select" value={form.activityLevel} onChange={e => set('activityLevel', e.target.value)}>
                {ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {preview && (
              <div className="calorie-preview">
                <div className="preview-row">
                  <span>📊 New daily calorie target:</span>
                  <strong style={{ color: 'var(--primary)' }}>{preview.cal} kcal</strong>
                </div>
                <div className="preview-row muted">
                  <span>🥩 Protein: {preview.macros.proteinGoalG}g</span>
                  <span>🍚 Carbs: {preview.macros.carbGoalG}g</span>
                  <span>🫒 Fat: {preview.macros.fatGoalG}g</span>
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>

        {/* Sign out */}
        <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={logout}>Sign Out</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => setDeleteStep(1)}>Delete Account</button>
        </div>

        {/* Delete Account Modal */}
        {deleteStep > 0 && (
          <div className="delete-modal-overlay" onClick={() => setDeleteStep(0)}>
            <div className="delete-modal card" onClick={e => e.stopPropagation()}>

              {/* Step 1 — Warning */}
              {deleteStep === 1 && (
                <>
                  <div className="delete-modal-icon">⚠️</div>
                  <h3 className="delete-modal-title">Delete your account?</h3>
                  <p className="delete-modal-sub">
                    This will <strong>permanently erase</strong> all your data — food logs, workouts, weight history, and progress. This cannot be undone.
                  </p>
                  <p className="delete-modal-sub">
                    We'll send a verification code to <strong>{user?.email}</strong> to confirm.
                  </p>
                  <div className="delete-modal-actions">
                    <button className="btn btn-outline" onClick={() => setDeleteStep(0)}>Cancel</button>
                    <button className="btn btn-danger" onClick={handleRequestDelete} disabled={deleteSending}>
                      {deleteSending ? 'Sending…' : 'Send Verification Code'}
                    </button>
                  </div>
                </>
              )}

              {/* Step 2 — Enter OTP */}
              {deleteStep === 2 && (
                <>
                  <div className="delete-modal-icon">📧</div>
                  <h3 className="delete-modal-title">Enter verification code</h3>
                  <p className="delete-modal-sub">
                    We sent a 6-digit code to <strong>{user?.email}</strong>. Enter it below to confirm deletion.
                  </p>
                  <div className="otp-grid" style={{ marginBottom: 20 }}>
                    {deleteOtp.map((v, i) => (
                      <input
                        key={i}
                        className="otp-input form-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={v}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKey(i, e)}
                        ref={el => otpRefs.current[i] = el}
                      />
                    ))}
                  </div>
                  <div className="delete-modal-actions">
                    <button className="btn btn-outline" onClick={() => setDeleteStep(1)}>Back</button>
                    <button className="btn btn-danger" onClick={handleConfirmDelete} disabled={deleteLoading}>
                      {deleteLoading ? 'Deleting…' : 'Delete My Account'}
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
                    Didn't get the code?{' '}
                    <button className="btn btn-ghost btn-sm" onClick={handleRequestDelete} disabled={deleteSending}>
                      {deleteSending ? 'Sending…' : 'Resend'}
                    </button>
                  </p>
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
