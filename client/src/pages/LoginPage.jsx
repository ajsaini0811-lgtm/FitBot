import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [shake, setShake]   = useState(false);

  const handleChange = (k, v) => {
    setError('');
    setForm(f => ({ ...f, [k]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 💪`);
      navigate(user.setupDone ? (user.role === 'COACH' ? '/coach' : '/chat') : '/setup', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Incorrect email or password';
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💪</div>
          <h1>FitBot</h1>
          <p>Your personal fitness companion</p>
        </div>

        <h2 className="auth-title">Welcome back!</h2>
        <p className="auth-subtitle">Sign in to track your fitness journey</p>

        <form onSubmit={handleSubmit} className={shake ? 'auth-shake' : ''}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className={`form-input ${error ? 'input-error' : ''}`}
              type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => handleChange('email', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className={`form-input ${error ? 'input-error' : ''}`}
              type="password" placeholder="••••••••" required
              value={form.password} onChange={e => handleChange('password', e.target.value)}
            />
          </div>

          {/* Inline error banner */}
          {error && (
            <div className="auth-error-banner">
              <span className="auth-error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: error ? 12 : 8 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer" style={{ flexDirection: 'column', gap: 8 }}>
          <Link to="/forgot-password" style={{ color: 'var(--text-muted)', fontSize: 13 }}>Forgot your password?</Link>
          <span>Don't have an account? <Link to="/register">Create one free</Link></span>
        </div>
      </div>
    </div>
  );
}
