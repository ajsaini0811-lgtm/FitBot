import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiUsers, FiPlus, FiMessageCircle, FiTrash2, FiX } from 'react-icons/fi';
import './CoachGroups.css';

export default function CoachGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCoach = user?.role === 'COACH';

  const [groups, setGroups]     = useState([]);
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]         = useState({ name: '', description: '', memberIds: [] });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
    if (isCoach) fetchClients();
  }, []);

  async function fetchGroups() {
    try {
      const { data } = await api.get('/groups');
      setGroups(data);
    } catch { toast.error('Failed to load groups'); }
    finally { setLoading(false); }
  }

  async function fetchClients() {
    try {
      const { data } = await api.get('/coach/clients');
      setClients(data);
    } catch {}
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Group name is required');
    setCreating(true);
    try {
      const { data } = await api.post('/groups', form);
      setGroups(prev => [data, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '', memberIds: [] });
      toast.success('Group created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create group');
    } finally { setCreating(false); }
  }

  async function deleteGroup(id, name) {
    if (!confirm(`Delete "${name}"? All messages will be lost.`)) return;
    try {
      await api.delete(`/groups/${id}`);
      setGroups(prev => prev.filter(g => g.id !== id));
      toast.success('Group deleted');
    } catch { toast.error('Failed to delete group'); }
  }

  function toggleMember(id) {
    setForm(f => ({
      ...f,
      memberIds: f.memberIds.includes(id)
        ? f.memberIds.filter(m => m !== id)
        : [...f.memberIds, id],
    }));
  }

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ maxWidth: 700 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 className="heading" style={{ margin: 0 }}>
              {isCoach ? 'Client Groups' : 'My Groups'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {isCoach ? 'Create groups to broadcast updates to multiple clients at once.'
                       : 'Groups your coach has added you to.'}
            </p>
          </div>
          {isCoach && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              <FiPlus size={15} /> New Group
            </button>
          )}
        </div>

        {/* Create Group Modal */}
        {showCreate && (
          <div className="cg-modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="cg-modal" onClick={e => e.stopPropagation()}>
              <div className="cg-modal-header">
                <h2>Create New Group</h2>
                <button onClick={() => setShowCreate(false)}><FiX size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Group Name *</label>
                  <input className="form-input" placeholder="e.g. Morning Batch, Fat Loss Group…"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <input className="form-input" placeholder="What's this group for?"
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Add Members ({form.memberIds.length} selected)</label>
                  <div className="cg-client-list">
                    {clients.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No clients yet. Add clients first.</p>
                    ) : clients.map(c => (
                      <label key={c.id} className={`cg-client-item ${form.memberIds.includes(c.id) ? 'selected' : ''}`}>
                        <input type="checkbox" checked={form.memberIds.includes(c.id)}
                          onChange={() => toggleMember(c.id)} style={{ display: 'none' }} />
                        <div className="cg-client-avatar">{c.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
                        </div>
                        {form.memberIds.includes(c.id) && <span className="cg-check">✓</span>}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Creating…' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Groups list */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48 }}>👥</div>
            <h3>{isCoach ? 'No groups yet' : 'No groups yet'}</h3>
            <p>{isCoach ? 'Create a group to send updates to multiple clients at once.'
                        : 'Your coach hasn\'t added you to any groups yet.'}</p>
            {isCoach && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
                <FiPlus size={15} /> Create First Group
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groups.map(g => {
              const lastMsg = g.messages?.[0];
              return (
                <div key={g.id} className="cg-group-card card">
                  <div className="cg-group-main" onClick={() => navigate(`/groups/${g.id}`)}>
                    <div className="cg-group-avatar"><FiUsers size={20} /></div>
                    <div className="cg-group-info">
                      <div className="cg-group-name">{g.name}</div>
                      {g.description && <div className="cg-group-desc">{g.description}</div>}
                      <div className="cg-group-meta">
                        <span>👥 {g.members?.length ?? 0} member{g.members?.length !== 1 ? 's' : ''}</span>
                        {lastMsg && (
                          <span className="cg-last-msg">
                            {lastMsg.sender?.name}: {lastMsg.content.slice(0, 40)}{lastMsg.content.length > 40 ? '…' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="cg-group-actions">
                    <button className="cg-action-btn chat" onClick={() => navigate(`/groups/${g.id}`)}>
                      <FiMessageCircle size={16} /> Open
                    </button>
                    {isCoach && (
                      <button className="cg-action-btn remove" onClick={() => deleteGroup(g.id, g.name)}>
                        <FiTrash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
