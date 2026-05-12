import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiUsers, FiPlus, FiTrash2, FiMessageCircle, FiClipboard,
  FiChevronRight, FiUserPlus, FiSearch, FiBarChart2, FiSend, FiX,
  FiActivity, FiTrendingUp,
} from 'react-icons/fi';
import './CoachDashboard.css';

export default function CoachDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [clients,          setClients]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [searchResults,    setSearchResults]    = useState([]);
  const [searching,        setSearching]        = useState(false);
  const [adding,           setAdding]           = useState(false);
  const [showAddModal,     setShowAddModal]     = useState(false);
  const [activeTab,        setActiveTab]        = useState('clients');
  const [analytics,        setAnalytics]        = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [broadcastMsg,     setBroadcastMsg]     = useState('');
  const [broadcasting,     setBroadcasting]     = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    try {
      const { data } = await api.get('/coach/clients');
      setClients(data);
    } catch { toast.error('Failed to load clients'); }
    finally  { setLoading(false); }
  }

  async function fetchAnalytics() {
    if (analytics) return;
    setAnalyticsLoading(true);
    try {
      const { data } = await api.get('/coach-analytics/overview');
      setAnalytics(data);
    } catch { toast.error('Failed to load analytics'); }
    finally  { setAnalyticsLoading(false); }
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    if (tab === 'analytics') fetchAnalytics();
  }

  function handleSearchChange(e) {
    const q = e.target.value;
    setSearchQuery(q);
    setSearchResults([]);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) return;
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/coach/search-users?q=${encodeURIComponent(q.trim())}`);
        setSearchResults(data);
      } catch { setSearchResults([]); }
      finally   { setSearching(false); }
    }, 300);
  }

  async function handleAddClient(u) {
    setAdding(true);
    try {
      const { data } = await api.post('/coach/clients/add', { email: u.email });
      toast.success(`${data.client.name} added! 🎉`);
      setSearchQuery(''); setSearchResults([]); setShowAddModal(false);
      fetchClients();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add client'); }
    finally       { setAdding(false); }
  }

  async function handleRemoveClient(clientId, name) {
    if (!confirm(`Remove ${name} as a client?`)) return;
    try {
      await api.delete(`/coach/clients/${clientId}`);
      toast.success(`${name} removed`);
      setClients(c => c.filter(cl => cl.id !== clientId));
    } catch { toast.error('Failed to remove client'); }
  }

  async function handleBroadcast() {
    if (!broadcastMsg.trim()) return toast.error('Message cannot be empty');
    setBroadcasting(true);
    try {
      const { data } = await api.post('/coach-analytics/broadcast', { message: broadcastMsg.trim() });
      toast.success(`📢 Sent to ${data.sent} client(s)!`);
      setBroadcastMsg('');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to broadcast'); }
    finally       { setBroadcasting(false); }
  }

  const activePlans = clients.filter(c => c.assignedPlans?.length > 0).length;
  const dietPlans   = clients.filter(c => c.assignedDiets?.length > 0).length;
  const GOAL_EMOJI  = { lose: '🔥', maintain: '⚖️', gain: '💪' };

  return (
    <div className="cd-page">

      {/* ── Dark hero ── */}
      <div className="cd-hero">
        <div className="cd-hero-inner">
          <div className="cd-hero-top">
            <div>
              <p className="cd-hero-greeting">Welcome back 👋</p>
              <h1 className="cd-hero-name">{user?.name?.split(' ')[0] ?? 'Coach'}</h1>
            </div>
            <button className="cd-add-btn" onClick={() => setShowAddModal(true)}>
              <FiUserPlus size={17} /> Add Client
            </button>
          </div>

          {/* Stat pills */}
          <div className="cd-hero-stats">
            <div className="cd-stat-pill">
              <FiUsers size={14} />
              <span className="cd-stat-val">{loading ? '…' : clients.length}</span>
              <span className="cd-stat-lbl">Clients</span>
            </div>
            <div className="cd-stat-pill">
              <FiClipboard size={14} />
              <span className="cd-stat-val">{activePlans}</span>
              <span className="cd-stat-lbl">Active Plans</span>
            </div>
            <div className="cd-stat-pill">
              <FiActivity size={14} />
              <span className="cd-stat-val">{dietPlans}</span>
              <span className="cd-stat-lbl">Diet Plans</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="cd-body">

        {/* Tab switcher */}
        <div className="cd-tabs">
          <button className={`cd-tab ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => handleTabChange('clients')}>
            <FiUsers size={14} /> Clients
          </button>
          <button className={`cd-tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => handleTabChange('analytics')}>
            <FiBarChart2 size={14} /> Analytics
          </button>
        </div>

        {/* ═══ CLIENTS TAB ═══ */}
        {activeTab === 'clients' && (
          <>
            {loading ? (
              <div className="cd-loading"><div className="spinner" /></div>
            ) : clients.length === 0 ? (
              <div className="cd-empty">
                <div style={{ fontSize: 56 }}>👥</div>
                <h3>No clients yet</h3>
                <p>Add your first client using the button above</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAddModal(true)}>
                  <FiPlus size={15} /> Add First Client
                </button>
              </div>
            ) : (
              <div className="cd-client-list">
                {clients.map(client => {
                  const lastWeight = client.weightLogs?.[0];
                  return (
                    <div key={client.id} className="cd-client-card">
                      {/* Main clickable area */}
                      <div className="cd-client-main" onClick={() => navigate(`/coach/client/${client.id}`)}>
                        <div className="cd-client-avatar">{client.name.charAt(0).toUpperCase()}</div>
                        <div className="cd-client-info">
                          <div className="cd-client-name">{client.name}</div>
                          <div className="cd-client-email">{client.email}</div>
                          <div className="cd-client-badges">
                            {client.goal && (
                              <span className="cd-badge goal">{GOAL_EMOJI[client.goal] || '🎯'} {client.goal}</span>
                            )}
                            {lastWeight && (
                              <span className="cd-badge weight">⚖️ {lastWeight.weightKg} kg</span>
                            )}
                            {!client.setupDone && (
                              <span className="cd-badge pending">Setup pending</span>
                            )}
                            {client.assignedPlans?.length > 0 && (
                              <span className="cd-badge plan">📋 {client.assignedPlans[0].name}</span>
                            )}
                            {client.assignedDiets?.length > 0 && (
                              <span className="cd-badge diet">🥗 {client.assignedDiets[0].name}</span>
                            )}
                          </div>
                        </div>
                        <FiChevronRight size={18} className="cd-client-arrow" />
                      </div>

                      {/* Action bar */}
                      <div className="cd-client-actions">
                        <button className="cd-act-btn chat" onClick={() => navigate(`/coach/chat/${client.id}`)}>
                          <FiMessageCircle size={15} /> Chat
                        </button>
                        <button className="cd-act-btn plans" onClick={() => navigate(`/coach/client/${client.id}`)}>
                          <FiClipboard size={15} /> Plans
                        </button>
                        <button className="cd-act-btn remove" onClick={() => handleRemoveClient(client.id, client.name)}>
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ═══ ANALYTICS TAB ═══ */}
        {activeTab === 'analytics' && (
          <>
            {analyticsLoading ? (
              <div className="cd-loading"><div className="spinner" /></div>
            ) : analytics ? (
              <>
                {/* Summary */}
                <div className="cd-analytics-stats">
                  <div className="cd-analytics-stat">
                    <div className="cd-as-icon blue"><FiUsers size={18} /></div>
                    <div className="cd-as-val">{analytics.totalClients}</div>
                    <div className="cd-as-lbl">Total Clients</div>
                  </div>
                  <div className="cd-analytics-stat">
                    <div className={`cd-as-icon ${analytics.inactiveClients > 0 ? 'red' : 'green'}`}>
                      <span style={{ fontSize: 18 }}>😴</span>
                    </div>
                    <div className="cd-as-val" style={{ color: analytics.inactiveClients > 0 ? '#ef4444' : undefined }}>
                      {analytics.inactiveClients}
                    </div>
                    <div className="cd-as-lbl">Inactive 3d+</div>
                  </div>
                  <div className="cd-analytics-stat">
                    <div className="cd-as-icon purple"><FiTrendingUp size={18} /></div>
                    <div className="cd-as-val">{analytics.avgWorkoutsPerClient}</div>
                    <div className="cd-as-lbl">Avg workouts/wk</div>
                  </div>
                </div>

                {/* Per-client rows */}
                <div className="cd-section-label">Client Overview</div>
                <div className="cd-analytics-list">
                  {analytics.clients.length === 0 ? (
                    <div className="cd-empty"><p>No client data yet.</p></div>
                  ) : analytics.clients.map(c => (
                    <div key={c.id} className={`cd-ana-row ${c.inactive ? 'inactive' : ''}`}>
                      <div className="cd-ana-avatar">{c.name.charAt(0).toUpperCase()}</div>
                      <div className="cd-ana-info">
                        <div className="cd-ana-name">{c.name}</div>
                        <div className="cd-ana-stats">
                          <span>🍽️ {c.daysSinceLog === null ? 'never logged' : c.daysSinceLog === 0 ? 'logged today' : `${c.daysSinceLog}d ago`}</span>
                          <span>🏋️ {c.workoutsThisWeek}×/wk</span>
                          {c.avgDailyCalories > 0 && <span>🔥 {c.avgDailyCalories} kcal/d</span>}
                          {c.weightChange !== null && (
                            <span style={{ color: c.weightChange <= 0 ? '#22c55e' : '#ef4444' }}>
                              ⚖️ {c.weightChange > 0 ? '+' : ''}{c.weightChange} kg
                            </span>
                          )}
                        </div>
                      </div>
                      {c.inactive && <span className="cd-inactive-tag">Inactive</span>}
                      <button className="cd-act-btn chat" style={{ flex: 'none', padding: '7px 12px' }}
                        onClick={() => navigate(`/coach/chat/${c.id}`)}>
                        <FiMessageCircle size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Broadcast */}
                <div className="cd-section-label" style={{ marginTop: 24 }}>
                  <FiSend size={13} /> Broadcast Message
                </div>
                <div className="cd-broadcast">
                  <p className="cd-broadcast-sub">Send a message + email to all your clients at once.</p>
                  <textarea
                    className="form-input"
                    style={{ width: '100%', resize: 'vertical', fontSize: 14, lineHeight: 1.5 }}
                    placeholder="e.g. 'Great week everyone! Don't forget to log your Sunday weight.'"
                    value={broadcastMsg}
                    onChange={e => setBroadcastMsg(e.target.value)}
                    rows={3}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
                    onClick={handleBroadcast}
                    disabled={broadcasting || !broadcastMsg.trim()}
                  >
                    <FiSend size={14} />
                    {broadcasting ? 'Sending…' : `Broadcast to ${analytics.totalClients} client(s)`}
                  </button>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

      {/* ── Add Client Modal ── */}
      {showAddModal && (
        <div className="cd-overlay" onClick={() => { setShowAddModal(false); setSearchQuery(''); setSearchResults([]); }}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>
            <div className="cd-modal-head">
              <h2>Add New Client</h2>
              <button className="cd-modal-close" onClick={() => { setShowAddModal(false); setSearchQuery(''); setSearchResults([]); }}>
                <FiX size={20} />
              </button>
            </div>
            <div className="cd-modal-body">
              <p className="cd-modal-sub">Search by name to find a registered user and add them as your client.</p>
              <div className="cd-search-box">
                <FiSearch size={16} className="cd-search-icon" />
                <input
                  className="cd-search-input"
                  type="text"
                  placeholder="Type a name… e.g. Ajay"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                />
                {searching && <div className="cd-search-spinner" />}
                {searchQuery && !searching && (
                  <button className="cd-search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                    <FiX size={14} />
                  </button>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="cd-search-results">
                  {searchResults.map(u => (
                    <div key={u.id} className="cd-search-item">
                      <div className="cd-search-avatar">{u.name.charAt(0).toUpperCase()}</div>
                      <div className="cd-search-info">
                        <div className="cd-search-name">{u.name}</div>
                        <div className="cd-search-email">{u.email}</div>
                      </div>
                      <button className="btn btn-primary btn-sm" disabled={adding}
                        onClick={() => handleAddClient(u)}>
                        {adding ? '…' : '+ Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.trim() && !searching && searchResults.length === 0 && (
                <div className="cd-search-empty">
                  No users found matching "<strong>{searchQuery}</strong>"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
