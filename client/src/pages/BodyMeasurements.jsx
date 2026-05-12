import { useState, useEffect } from 'react';
import { FiPlusCircle, FiTrendingDown, FiTrendingUp, FiMinus } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './BodyMeasurements.css';

const FIELDS = [
  { key: 'waistCm',  label: 'Waist',  unit: 'cm', icon: '🎯' },
  { key: 'chestCm',  label: 'Chest',  unit: 'cm', icon: '💪' },
  { key: 'hipsCm',   label: 'Hips',   unit: 'cm', icon: '🔵' },
  { key: 'armsCm',   label: 'Arms',   unit: 'cm', icon: '💪' },
  { key: 'thighsCm', label: 'Thighs', unit: 'cm', icon: '🦵' },
];

export default function BodyMeasurements() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ waistCm: '', chestCm: '', hipsCm: '', armsCm: '', thighsCm: '', noteText: '' });

  async function load() {
    try {
      const { data } = await api.get('/measurements');
      setLogs(data);
    } catch { toast.error('Could not load measurements'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    const payload = {};
    FIELDS.forEach(f => { if (form[f.key]) payload[f.key] = Number(form[f.key]); });
    if (form.noteText) payload.noteText = form.noteText;
    if (!Object.keys(payload).length) { toast.error('Enter at least one measurement'); return; }
    setSaving(true);
    try {
      await api.post('/measurements', payload);
      toast.success('Measurements saved!');
      setForm({ waistCm: '', chestCm: '', hipsCm: '', armsCm: '', thighsCm: '', noteText: '' });
      setShowForm(false);
      load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  }

  // Latest and previous entries for trend
  const latest = logs[0];
  const prev   = logs[1];

  function trend(field) {
    if (!latest || !prev) return null;
    const diff = (latest[field] ?? 0) - (prev[field] ?? 0);
    if (!diff) return null;
    return diff;
  }

  if (loading) return (
    <div className="page-wrapper"><div className="loading-center"><div className="spinner" /></div></div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-content bm-page">

        {/* Header */}
        <div className="bm-header">
          <div>
            <h1 className="heading" style={{ margin: 0 }}>Body Measurements</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Track your body changes over time</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(s => !s)}>
            <FiPlusCircle size={15} /> {showForm ? 'Cancel' : 'Log Today'}
          </button>
        </div>

        {/* Log form */}
        {showForm && (
          <div className="card bm-form-card">
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, marginBottom: 16 }}>New Entry</h3>
            <form onSubmit={submit}>
              <div className="bm-grid">
                {FIELDS.map(f => (
                  <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{f.icon} {f.label} ({f.unit})</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.1"
                      placeholder="—"
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Notes (optional)</label>
                <input className="form-input" type="text" placeholder="e.g. post-morning, fasted"
                  value={form.noteText} onChange={e => setForm(p => ({ ...p, noteText: e.target.value }))} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={saving}>
                {saving ? 'Saving…' : 'Save Measurements'}
              </button>
            </form>
          </div>
        )}

        {/* Current snapshot */}
        {latest && (
          <div className="bm-snapshot">
            <div className="bm-snapshot-title">📊 Current Measurements</div>
            <div className="bm-snap-grid">
              {FIELDS.map(f => {
                const val = latest[f.key];
                const t   = trend(f.key);
                if (!val) return null;
                return (
                  <div key={f.key} className="bm-snap-item">
                    <div className="bm-snap-icon">{f.icon}</div>
                    <div className="bm-snap-val">{val}<span>cm</span></div>
                    <div className="bm-snap-label">{f.label}</div>
                    {t !== null && (
                      <div className={`bm-trend ${t < 0 ? 'down' : 'up'}`}>
                        {t < 0 ? <FiTrendingDown size={11} /> : <FiTrendingUp size={11} />}
                        {Math.abs(t).toFixed(1)}cm
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* History */}
        <h2 className="bm-section-title">History</h2>
        {logs.length === 0 ? (
          <div className="card bm-empty">
            <div style={{ fontSize: 40, marginBottom: 12 }}>📏</div>
            <p>No measurements yet. Log your first entry to start tracking!</p>
          </div>
        ) : (
          <div className="bm-history">
            {logs.map((log, i) => (
              <div key={log.id} className={`card bm-log-card ${i === 0 ? 'latest' : ''}`}>
                <div className="bm-log-date">
                  {i === 0 && <span className="bm-badge">Latest</span>}
                  {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="bm-log-values">
                  {FIELDS.map(f => log[f.key] != null && (
                    <div key={f.key} className="bm-log-val">
                      <span className="bm-log-lbl">{f.label}</span>
                      <span className="bm-log-num">{log[f.key]}cm</span>
                    </div>
                  ))}
                </div>
                {log.noteText && <div className="bm-log-note">📝 {log.noteText}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
