import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './AuthPage.css';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = email, 2 = otp + new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const otpRefs = useRef([]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success('Reset code sent! Check your inbox.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter the full 6-digit code');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp: code, newPassword });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──
  if (done) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">💪</div>
          <h1>FitBot</h1>
        </div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 className="auth-title">Password Reset!</h2>
        <p className="auth-subtitle">Your password has been updated successfully. You can now sign in with your new password.</p>
        <Link to="/login" className="btn btn-primary btn-lg" style={{ display: 'block', marginTop: 24 }}>
          Go to Sign In
        </Link>
      </div>
    </div>
  );

  // ── Step 2: OTP + new password ──
  if (step === 2) return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💪</div>
          <h1>FitBot</h1>
        </div>
        <h2 className="auth-title">Enter reset code</h2>
        <p className="auth-subtitle">We sent a 6-digit code to <strong>{email}</strong></p>

        <form onSubmit={handleReset}>
          <div className="otp-grid" style={{ marginBottom: 20 }}>
            {otp.map((v, i) => (
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

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          Didn't get the code?{' '}
          <button className="btn btn-ghost btn-sm" onClick={() => { setStep(1); setOtp(['','','','','','']); }}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );

  // ── Step 1: Enter email ──
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💪</div>
          <h1>FitBot</h1>
          <p>Your personal fitness companion</p>
        </div>
        <h2 className="auth-title">Forgot password?</h2>
        <p className="auth-subtitle">Enter your registered email and we'll send you a reset code.</p>

        <form onSubmit={handleSendCode}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Code'}
          </button>
        </form>

        <div className="auth-footer">
          Remember it? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
