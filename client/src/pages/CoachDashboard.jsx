import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiUsers, FiPlus, FiTrash2, FiMessageCircle, FiClipboard, FiCoffee, FiChevronRight, FiUserPlus, FiSearch, FiBarChart2, FiSend } from 'react-icons/fi';
import './CoachDashboard.css';

export default function CoachDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('clients'); // clients | analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchAnalytics() {
    if (analytics) return; // already loaded
    setAnalyticsLoading(true);
    try {
      const { data } = await api.get('/coach-analytics/overview');
      setAnalytics(data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setAnalyticsLoading(false); }
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    if (tab === 'analytics') fetchAnalytics();
  }

  async function handleBroadcast() {
    if (!broadcastMsg.trim()) return toast.error('Message cannot be empty');
    setBroadcasting(true);
    try {
      const { data } = await api.post('/coach-analytics/broadcast', { message: broadcastMsg.trim() });
      toast.success(`📢 Message sent to ${data.sent} client(s)!`);
      setBroadcastMsg('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to broadcast');
    } finally { setBroadcasting(false); }
  }

  async function fetchClients() {
    try {
      const { data } = await api.get('/coach/clients');
      setClients(data);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(e) {
    const q = e.target.value;
    setSearchQuery(q);
    setSearchResults([]);
    clearTimeout(searchTimeout.current);
    if (q.trim().length < 1) return;
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/coach/search-users?q=${encodeURIComponent(q.trim())}`);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  async function handleAddClient(selectedUser) {
    setAdding(true);
    try {
      const { data } = await api.post('/coach/clients/add', { email: selectedUser.email });
      toast.success(`${data.client.name} added as a client!`);
      setSearchQuery('');
      setSearchResults([]);
      setShowAddForm(false);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add client');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveClient(clientId, name) {
    if (!confirm(`Remove ${name} as a client?`)) return;
    try {
      await api.delete(`/coach/clients/${clientId}`);
      toast.success(`${name} removed`);
      setClients(c => c.filter(cl => cl.id !== clientId));
    } catch {
      toast.error('Failed to remove client');
    }
  }

  return (
    <div className="coach-dash">
      {/* Header */}
      <div className="coach-dash-header">
        <div>
          <h1 className="coach-dash-title">Coach Dashboard</h1>
          <p className="coach-dash-sub">Welcome back, {user?.name?.split(' ')[0]}! 🏅</p>
        </div>
        {activeTab === 'clients' && (
          <button className="btn btn-primary coach-add-btn" onClick={() => setShowAddForm(s => !s)}>
            <FiUserPlus size={16} /> Add Client
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="coach-tab-row">
        <button className={`coach-tab-btn ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => handleTabChange('clients')}>
          <FiUsers size={14} /> Clients
        </button>
        <button className={`coach-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => handleTabChange('analytics')}>
          <FiBarChart2 size={14} /> Analytics
        </button>
      </div>

      {/* ── CLIENTS TAB ── */}
      {activeTab === 'clients' && (
        <>
          {/* Add Client Form */}
          {showAddForm && (
            <div className="coach-add-form card">
              <h3 className="coach-add-title">Add a new client</h3>
              <p className="coach-add-sub">Search by name to find and add a client.</p>
              <div className="coach-search-wrap">
                <div className="coach-search-input-row">
                  <FiSearch size={16} className="coach-search-icon" />
                  <input
                    className="form-input coach-search-input"
                    type="text"
                    placeholder="Type a name, e.g. Ajay…"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    autoFocus
                  />
                  {searching && <div className="coach-search-spinner" />}
                </div>
                {searchResults.length > 0 && (
                  <div className="coach-search-results">
                    {searchResults.map(u => (
                      <div key={u.id} className="coach-search-result-item" onClick={() => !adding && handleAddClient(u)}>
                        <div className="csr-avatar">{u.name.charAt(0).toUpperCase()}</div>
                        <div className="csr-info">
                          <div className="csr-name">{u.name}</div>
                          <div className="csr-email">{u.email}</div>
                        </div>
                        <button className="btn btn-primary btn-sm csr-add-btn" disabled={adding}>
                          {adding ? '…' : '+ Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery.trim().length > 0 && !searching && searchResults.length === 0 && (
                  <div className="coach-search-empty">No users found matching "{searchQuery}"</div>
                )}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="coach-stats-row">
            <div className="coach-stat-card">
              <FiUsers size={20} className="coach-stat-icon" />
              <div>
                <div className="coach-stat-num">{clients.length}</div>
                <div className="coach-stat-lbl">Clients</div>
              </div>
            </div>
            <div className="coach-stat-card">
              <FiClipboard size={20} className="coach-stat-icon" />
              <div>
                <div className="coach-stat-num">
                  {clients.filter(c => c.assignedPlans?.length > 0).length}
                </div>
                <div className="coach-stat-lbl">Active Plans</div>
              </div>
            </div>
            <div className="coach-stat-card">
              <FiCoffee size={20} className="coach-stat-icon" />
              <div>
                <div className="coach-stat-num">
                  {clients.filter(c => c.assignedDiets?.length > 0).length}
                </div>
                <div className="coach-stat-lbl">Diet Plans</div>
              </div>
            </div>
          </div>

          {/* Client list */}
          <div className="coach-section-title">
            <FiUsers size={16} /> Your Clients ({clients.length})
          </div>

          {loading ? (
            <div className="coach-loading">Loading clients…</div>
          ) : clients.length === 0 ? (
            <div className="coach-empty">
              <p>No clients yet.</p>
              <p>Add your first client using their registered email address.</p>
              <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
                <FiPlus size={16} /> Add First Client
              </button>
            </div>
          ) : (
            <div className="coach-client-list">
              {clients.map(client => {
                const gEmoji = { lose: '🔥', maintain: '⚖️', gain: '💪' };
                const lastWeight = client.weightLogs?.[0];
                return (
                  <div key={client.id} className="coach-client-card card">
                    <div className="ccc-main" onClick={() => navigate(`/coach/client/${client.id}`)}>
                      <div className="ccc-avatar">{client.name.charAt(0).toUpperCase()}</div>
                      <div className="ccc-info">
                        <div className="ccc-name">{client.name}</div>
                        <div className="ccc-email">{client.email}</div>
                        <div className="ccc-meta">
                          {client.goal && (
                            <span className="ccc-badge">{gEmoji[client.goal] || '🎯'} {client.goal}</span>
                          )}
                          {lastWeight && (
                            <span className="ccc-badge weight">⚖️ {lastWeight.weightKg} kg</span>
                          )}
                          {!client.setupDone && (
                            <span className="ccc-badge gray">Setup pending</span>
                          )}
                        </div>
                        <div className="ccc-plans">
                          {client.assignedPlans?.length > 0 && (
                            <span className="ccc-plan-tag green">📋 {client.assignedPlans[0].name}</span>
                          )}
                          {client.assignedDiets?.length > 0 && (
                            <span className="ccc-plan-tag orange">🥗 {client.assignedDiets[0].name}</span>
                          )}
                        </div>
                      </div>
                      <FiChevronRight size={20} className="ccc-arrow" />
                    </div>
                    <div className="ccc-actions">
                      <button className="ccc-action-btn chat" onClick={() => navigate(`/coach/chat/${client.id}`)}>
                        <FiMessageCircle size={16} /> Chat
                      </button>
                      <button className="ccc-action-btn plan" onClick={() => navigate(`/coach/client/${client.id}`)}>
                        <FiClipboard size={16} /> Plans
                      </button>
                      <button className="ccc-action-btn remove" onClick={() => handleRemoveClient(client.id, client.name)}>
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === 'analytics' && (
        <>
          {analyticsLoading ? (
            <div className="coach-loading">Loading analytics…</div>
          ) : analytics ? (
            <>
              {/* Summary cards */}
              <div className="coach-stats-row" style={{ marginBottom: 20 }}>
                <div className="coach-stat-card">
                  <FiUsers size={20} className="coach-stat-icon" />
                  <div>
                    <div className="coach-stat-num">{analytics.totalClients}</div>
                    <div className="coach-stat-lbl">Total Clients</div>
                  </div>
                </div>
                <div className="coach-stat-card" style={{ borderColor: analytics.inactiveClients > 0 ? '#fca5a5' : undefined }}>
                  <span style={{ fontSize: 20 }}>😴</span>
                  <div>
                    <div className="coach-stat-num" style={{ color: analytics.inactiveClients > 0 ? '#ef4444' : undefined }}>
                      {analytics.inactiveClients}
                    </div>
                    <div className="coach-stat-lbl">Inactive (3+ days)</div>
                  </div>
                </div>
                <div className="coach-stat-card">
                  <span style={{ fontSize: 20 }}>🏋️</span>
                  <div>
                    <div className="coach-stat-num">{analytics.avgWorkoutsPerClient}</div>
                    <div className="coach-stat-lbl">Avg workouts/week</div>
                  </div>
                </div>
              </div>

              {/* Per-client table */}
              <div className="coach-section-title"><FiBarChart2 size={16} /> Client Overview</div>
              <div className="coach-analytics-table">
                {analytics.clients.length === 0 ? (
                  <div className="coach-empty"><p>No client data yet.</p></div>
                ) : analytics.clients.map(c => (
                  <div key={c.id} className={`coach-analytics-row ${c.inactive ? 'inactive' : ''}`}>
                    <div className="car-avatar">{c.name.charAt(0).toUpperCase()}</div>
                    <div className="car-info">
                      <div className="car-name">{c.name}</div>
                      <div className="car-stats">
                        <span title="Days since food log">
                          🍽️ {c.daysSinceLog === null ? 'never' : `${c.daysSinceLog}d ago`}
                        </span>
                        <span title="Workouts this week">
                          🏋️ {c.workoutsThisWeek}×/wk
                        </span>
                        <span title="Avg daily calories">
                          🔥 {c.avgDailyCalories} kcal/d
                        </span>
                        {c.weightChange !== null && (
                          <span style={{ color: c.weightChange <= 0 ? '#22c55e' : '#ef4444' }}>
                            ⚖️ {c.weightChange > 0 ? '+' : ''}{c.weightChange} kg
                          </span>
                        )}
                      </div>
                    </div>
                    {c.inactive && <span className="car-inactive-badge">Inactive</span>}
                    <button className="ccc-action-btn chat" style={{ padding: '6px 10px', flex: 'none' }}
                      onClick={() => navigate(`/coach/chat/${c.id}`)}>
                      <FiMessageCircle size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Broadcast */}
              <div className="coach-section-title" style={{ marginTop: 24 }}><FiSend size={16} /> Broadcast Message</div>
              <div className="coach-broadcast card">
                <p className="coach-broadcast-sub">Send a message + email to all your clients at once.</p>
                <textarea
                  className="form-input coach-broadcast-textarea"
                  placeholder="Write your message here… e.g. 'Great work this week! Remember to log your Sunday weight.'"
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                  rows={4}
                />
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={handleBroadcast}
                  disabled={broadcasting || !broadcastMsg.trim()}
                >
                  <FiSend size={14} />
                  {broadcasting ? 'Sending…' : `Send to all ${analytics.totalClients} client(s)`}
                </button>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
