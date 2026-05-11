import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiUsers, FiPlus, FiTrash2, FiMessageCircle, FiClipboard, FiCoffee, FiChevronRight, FiUserPlus, FiSearch } from 'react-icons/fi';
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
  const searchTimeout = useRef(null);

  useEffect(() => {
    fetchClients();
  }, []);

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

  const goalEmoji = { lose: '🔥', maintain: '⚖️', gain: '💪' };

  return (
    <div className="coach-dash">
      {/* Header */}
      <div className="coach-dash-header">
        <div>
          <h1 className="coach-dash-title">Coach Dashboard</h1>
          <p className="coach-dash-sub">Welcome back, {user?.name?.split(' ')[0]}! 🏅</p>
        </div>
        <button className="btn btn-primary coach-add-btn" onClick={() => setShowAddForm(s => !s)}>
          <FiUserPlus size={16} /> Add Client
        </button>
      </div>

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
            const lastWeight = client.weightLogs?.[0];
            return (
              <div key={client.id} className="coach-client-card card">
                <div className="ccc-main" onClick={() => navigate(`/coach/client/${client.id}`)}>
                  <div className="ccc-avatar">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ccc-info">
                    <div className="ccc-name">{client.name}</div>
                    <div className="ccc-email">{client.email}</div>
                    <div className="ccc-meta">
                      {client.goal && (
                        <span className="ccc-badge">
                          {goalEmoji[client.goal] || '🎯'} {client.goal}
                        </span>
                      )}
                      {lastWeight && (
                        <span className="ccc-badge weight">
                          ⚖️ {lastWeight.weightKg} kg
                        </span>
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
                  <button
                    className="ccc-action-btn chat"
                    onClick={() => navigate(`/coach/chat/${client.id}`)}
                    title="Chat with client"
                  >
                    <FiMessageCircle size={16} /> Chat
                  </button>
                  <button
                    className="ccc-action-btn plan"
                    onClick={() => navigate(`/coach/client/${client.id}`)}
                    title="Assign plans"
                  >
                    <FiClipboard size={16} /> Plans
                  </button>
                  <button
                    className="ccc-action-btn remove"
                    onClick={() => handleRemoveClient(client.id, client.name)}
                    title="Remove client"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
