import { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './NotificationBell.css';

export default function NotificationBell() {
  const [notifs, setNotifs]   = useState([]);
  const [open, setOpen]       = useState(false);
  const dropRef               = useRef(null);
  const navigate              = useNavigate();

  async function load() {
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data);
    } catch {}
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  async function markRead(id) {
    try { await api.put(`/notifications/${id}/read`); } catch {}
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAll() {
    try { await api.put('/notifications/read-all'); } catch {}
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  function handleClick(n) {
    markRead(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  }

  const typeIcon = {
    message:      '💬',
    plan_assigned:'📋',
    diet_assigned:'🥗',
    coach_note:   '📝',
    reminder:     '⏰',
  };

  return (
    <div className="nb-wrap" ref={dropRef}>
      <button className="nb-bell" onClick={() => setOpen(o => !o)} title="Notifications">
        <FiBell size={18} />
        {unread > 0 && <span className="nb-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <span className="nb-title">Notifications</span>
            {unread > 0 && (
              <button className="nb-mark-all" onClick={markAll}>
                <FiCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="nb-list">
            {notifs.length === 0 ? (
              <div className="nb-empty">🔔 You're all caught up!</div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  className={`nb-item ${n.read ? 'read' : 'unread'}`}
                  onClick={() => handleClick(n)}
                >
                  <div className="nb-item-icon">{typeIcon[n.type] || '🔔'}</div>
                  <div className="nb-item-body">
                    <div className="nb-item-title">{n.title}</div>
                    <div className="nb-item-text">{n.body}</div>
                    <div className="nb-item-time">
                      {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  {!n.read && <div className="nb-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
