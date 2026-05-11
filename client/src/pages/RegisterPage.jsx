import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPage.css';

export default function RegisterPage() {
  const { register, verifyRegistration } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
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

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return toast.error('Please enter the full 6-digit code');
    setLoading(true);
    try {
      const user = await verifyRegistration(form.email, code);
      toast.success(`Welcome to FitBot, ${user.name.split(' ')[0]}! 🎉`);
      navigate('/setup', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💪</div>
          <h1>FitBot</h1>
        </div>
        <h2 className="auth-title">Check your email!</h2>
        <p className="auth-subtitle">We sent a 6-digit code to <strong>{form.email}</strong></p>

        <form onSubmit={handleVerify}>
          <div className="otp-grid">
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
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Verifying…' : 'Verify & Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Didn't get the code? <button className="btn btn-ghost btn-sm" onClick={() => { setStep(1); setOtp(['','','','','','']); }}>Go back</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💪</div>
          <h1>FitBot</h1>
          <p>Your personal fitness companion</p>
        </div>

        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Start tracking your fitness journey today — it's free!</p>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Ajay Saini" required
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min. 6 characters" required minLength={6}
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
