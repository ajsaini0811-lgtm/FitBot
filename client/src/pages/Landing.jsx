import { Link } from 'react-router-dom';
import { FiMessageCircle, FiTrendingUp, FiActivity, FiTarget } from 'react-icons/fi';
import './Landing.css';

const FEATURES = [
  { icon: FiMessageCircle, title: 'Chat to Log', desc: 'Just type what you ate or did at the gym. FitBot handles the rest.' },
  { icon: FiTarget, title: 'Smart Calorie Goals', desc: 'Your personalised TDEE-based calorie and macro targets, calculated for you.' },
  { icon: FiActivity, title: 'Workout Tracking', desc: 'Log strength, cardio, and flexibility sessions with sets, reps, and weights.' },
  { icon: FiTrendingUp, title: 'Progress Charts', desc: 'See your weight trend, weekly calories, and workout frequency at a glance.' },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-logo">💪 FitBot</div>
        <div className="landing-nav-links">
          <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">🏆 Your personal fitness companion</div>
        <h1 className="hero-title">Track Fitness.<br />Stay on Target.</h1>
        <p className="hero-sub">FitBot makes it effortless to log meals, workouts, and body stats through a friendly chat interface — no spreadsheets, no complexity.</p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg">Start for Free →</Link>
          <Link to="/login" className="btn btn-outline btn-lg">I have an account</Link>
        </div>
        <div className="hero-preview">
          <div className="chat-preview">
            <div className="preview-msg bot">💪 Hey! What would you like to do today?</div>
            <div className="preview-chips">
              <span>🍽️ Log a Meal</span><span>🏋️ Log Workout</span><span>📊 Summary</span>
            </div>
            <div className="preview-msg user">🍽️ Log a Meal</div>
            <div className="preview-msg bot">Which meal? Breakfast, Lunch, Dinner, or Snack?</div>
            <div className="preview-msg user">Breakfast — 2 idlis</div>
            <div className="preview-msg bot">✅ Logged! 200g Idli = 156 kcal. 🎯 1,844 remaining today.</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2 className="section-title">Everything you need, nothing you don't</h2>
        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card card">
              <div className="feature-icon"><Icon size={22} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <h2>Ready to crush your goals?</h2>
        <p>Join FitBot and start logging in seconds. Your coach will love you for it.</p>
        <Link to="/register" className="btn btn-primary btn-lg">Get Started Free →</Link>
      </section>

      <footer className="landing-footer">
        <p>© 2025 FitBot. Built for athletes, by athletes. 💪</p>
      </footer>
    </div>
  );
}
