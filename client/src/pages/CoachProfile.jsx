import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiUsers, FiClipboard, FiMessageCircle, FiAward, FiEdit2 } from 'react-icons/fi';
import './CoachProfile.css';

export default function CoachProfile() {
  const { user, updateUser, logout } = useAuth();

  const [form, setForm] = useState({
    name:           user?.name           || '',
    specialization: user?.specialization || '',
    bio:            user?.bio            || '',
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  // Delete account
  const [deleteStep, setDeleteStep]     = useState(0);
  const [deleteOtp, setDeleteOtp]       = useState(['', '', '', '', '', '']);
  const [deleteSending, setDeleteSending] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      const { data } = await api.get('/coach-analytics/overview');
      setStats(data);
    } catch {}
    finally { setLoading(false); }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/profile', form);
      updateUser(res.data);
      toast.success('Profile updated! ✅');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally { setSaving(false); }
  }

  const handleRequestDelete = async () => {
    setDeleteSending(true);
    try {
      await api.post('/auth/request-delete');
      toast.success('Verification code sent to your email!');
      setDeleteStep(2);
      setDeleteOtp(['', '', '', '', '', '']);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send code');
    } finally { setDeleteSending(false); }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...deleteOtp]; next[i] = val; setDeleteOtp(next);
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
    } finally { setDeleteLoading(false); }
  };

  // Total sessions = sum of workoutsThisWeek across all clients (approximate)
  const totalSessions = stats?.clients?.reduce((s, c) => s + (c.workoutsThisWeek || 0), 0) ?? 0;
  const activeClients = stats?.clients?.filter(c => !c.inactive).length ?? 0;

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ maxWidth: 700 }}>
        <h1 className="heading" style={{ marginBottom: 24 }}>Coach Profile</h1>

        {/* Coach stat cards */}
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: '#f0fdf4', color: 'var(--primary)' }}><FiUsers size={20} /></div>
            <div className="stat-value">{stats?.totalClients ?? '—'}</div>
            <div className="stat-label">Total Clients</div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><FiAward size={20} /></div>
            <div className="stat-value">{loading ? '—' : activeClients}</div>
            <div className="stat-label">Active Clients</div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><FiClipboard size={20} /></div>
            <div className="stat-value">{loading ? '—' : totalSessions}</div>
            <div className="stat-label">Sessions This Week</div>
          </div>
        </div>

        {/* Client activity breakdown */}
        {stats?.clients?.length > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📊 Client Activity (This Week)</h3>
            <div className="cp-client-table">
              {stats.clients.map(c => (
                <div key={c.id} className={`cp-client-row ${c.inactive ? 'inactive' : ''}`}>
                  <div className="cp-client-avatar">{c.name.charAt(0).toUpperCase()}</div>
                  <div className="cp-client-info">
                    <div className="cp-client-name">{c.name}</div>
                    <div className="cp-client-stats">
                      <span>🏋️ {c.workoutsThisWeek} workouts</span>
                      <span>🍽️ {c.daysSinceLog === null ? 'never logged' : c.daysSinceLog === 0 ? 'logged today' : `${c.daysSinceLog}d since log`}</span>
                      {c.avgDailyCalories > 0 && <span>🔥 {c.avgDailyCalories} kcal/d avg</span>}
                    </div>
                  </div>
                  {c.inactive && <span className="cp-inactive-tag">Inactive</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit profile form */}
        <form onSubmit={handleSave}>
          <div className="card profile-section" style={{ padding: 20, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
              <FiEdit2 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Coach Info
            </h2>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input className="form-input"
                placeholder="e.g. Strength & Conditioning, Weight Loss, HIIT…"
                value={form.specialization}
                onChange={e => set('specialization', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={4}
                placeholder="Tell your clients about your experience and approach…"
                value={form.bio}
                onChange={e => set('bio', e.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.6 }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
            {saving ? 'Saving…' : '✅ Save Changes'}
          </button>
        </form>

        {/* Sign out */}
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-ghost" style={{ width: '100%' }} onClick={logout}>
            Sign Out
          </button>
        </div>

        {/* Delete account */}
        <div className="card" style={{ padding: 20, marginTop: 16, borderColor: '#fca5a5' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>⚠️ Delete Account</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Permanently deletes your coach account, all your groups and client links. This cannot be undone.
          </p>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteStep(1)}>Delete my account</button>
        </div>

        {/* Delete modal */}
        {deleteStep > 0 && (
          <div className="delete-modal-overlay" onClick={() => setDeleteStep(0)}>
            <div className="delete-modal" onClick={e => e.stopPropagation()}>
              {deleteStep === 1 && (
                <>
                  <div className="delete-modal-icon">⚠️</div>
                  <h2 className="delete-modal-title">Delete Account?</h2>
                  <p className="delete-modal-sub">
                    This will permanently delete your account and all associated data.
                    We'll send a verification code to <strong>{user?.email}</strong>.
                  </p>
                  <div className="delete-modal-actions">
                    <button className="btn btn-outline" onClick={() => setDeleteStep(0)}>Cancel</button>
                    <button className="btn btn-danger" onClick={handleRequestDelete} disabled={deleteSending}>
                      {deleteSending ? 'Sending…' : 'Send Code'}
                    </button>
                  </div>
                </>
              )}
              {deleteStep === 2 && (
                <>
                  <div className="delete-modal-icon">🔐</div>
                  <h2 className="delete-modal-title">Enter Verification Code</h2>
                  <p className="delete-modal-sub">Check your email for the 6-digit code.</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0' }}>
                    {deleteOtp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => (otpRefs.current[i] = el)}
                        className="form-input"
                        style={{ width: 44, textAlign: 'center', fontSize: 20, fontWeight: 700, padding: '8px 0' }}
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKey(i, e)}
                        inputMode="numeric"
                      />
                    ))}
                  </div>
                  <div className="delete-modal-actions">
                    <button className="btn btn-outline" onClick={() => setDeleteStep(0)}>Cancel</button>
                    <button className="btn btn-danger" onClick={handleConfirmDelete} disabled={deleteLoading}>
                      {deleteLoading ? 'Deleting…' : 'Confirm Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
