import { useState, useEffect, useRef } from 'react';
import { FiX, FiPlay, FiPause, FiRefreshCw } from 'react-icons/fi';
import './RestTimer.css';

const PRESETS = [30, 60, 90, 120];

export default function RestTimer({ onClose }) {
  const [selected, setSelected] = useState(60);
  const [timeLeft, setTimeLeft]  = useState(60);
  const [running,  setRunning]   = useState(false);
  const [done,     setDone]      = useState(false);
  const intervalRef = useRef(null);
  const audioCtxRef = useRef(null);

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      [0, 150, 300].forEach(delay => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay / 1000);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.2);
        osc.start(ctx.currentTime + delay / 1000);
        osc.stop(ctx.currentTime + delay / 1000 + 0.25);
      });
    } catch {}
  }

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(intervalRef.current); setRunning(false); setDone(true); beep(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function pick(s) { setSelected(s); setTimeLeft(s); setRunning(false); setDone(false); }
  function toggle() { if (done) return; setRunning(r => !r); }
  function reset()  { clearInterval(intervalRef.current); setTimeLeft(selected); setRunning(false); setDone(false); }

  const pct = ((selected - timeLeft) / selected) * 100;
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="rt-overlay" onClick={onClose}>
      <div className="rt-card" onClick={e => e.stopPropagation()}>
        <div className="rt-header">
          <span className="rt-title">⏱ Rest Timer</span>
          <button className="rt-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        {/* Presets */}
        <div className="rt-presets">
          {PRESETS.map(s => (
            <button key={s} className={`rt-preset ${selected === s ? 'active' : ''}`} onClick={() => pick(s)}>
              {s}s
            </button>
          ))}
        </div>

        {/* Ring */}
        <div className="rt-ring-wrap">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="54" fill="none" stroke="var(--gray-light)" strokeWidth="8" />
            <circle cx="64" cy="64" r="54" fill="none"
              stroke={done ? '#22c55e' : '#6366f1'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              transform="rotate(-90 64 64)"
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />
          </svg>
          <div className="rt-time">{done ? '✅' : `${mins}:${secs}`}</div>
        </div>

        {done && <div className="rt-done-msg">Rest done! Time to lift 💪</div>}

        <div className="rt-controls">
          <button className="rt-btn secondary" onClick={reset}><FiRefreshCw size={16} /></button>
          <button className={`rt-btn primary ${done ? 'disabled' : ''}`} onClick={toggle} disabled={done}>
            {running ? <FiPause size={20} /> : <FiPlay size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
