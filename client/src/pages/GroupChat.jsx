import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSend, FiUserPlus, FiTrash2, FiUsers } from 'react-icons/fi';
import { io } from 'socket.io-client';
import './GroupChat.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

export default function GroupChat() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCoach = user?.role === 'COACH';

  const [group, setGroup]     = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [clients, setClients] = useState([]); // for adding members (coach only)

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchGroup();
    fetchMessages();

    // Socket connection
    const token = localStorage.getItem('fitbot_token');
    const socket = io(API_BASE, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.emit('join_group', { groupId });
    socket.on('group_message', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => socket.disconnect();
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isCoach && showMembers) fetchClients();
  }, [showMembers]);

  async function fetchGroup() {
    try {
      const { data } = await api.get(`/groups/${groupId}`);
      setGroup(data);
    } catch {
      toast.error('Group not found');
      navigate(isCoach ? '/coach/groups' : '/groups');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages() {
    try {
      const { data } = await api.get(`/groups/${groupId}/messages`);
      setMessages(data);
    } catch {}
  }

  async function fetchClients() {
    try {
      const { data } = await api.get('/coach/clients');
      setClients(data);
    } catch {}
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/groups/${groupId}/messages`, { content: text.trim() });
      setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
      setText('');
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  }

  async function addMember(clientId) {
    try {
      const { data } = await api.post(`/groups/${groupId}/members`, { userId: clientId });
      setGroup(data);
      toast.success('Member added!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add member'); }
  }

  async function removeMember(userId, name) {
    if (!confirm(`Remove ${name} from the group?`)) return;
    try {
      await api.delete(`/groups/${groupId}/members/${userId}`);
      setGroup(g => ({ ...g, members: g.members.filter(m => m.userId !== userId) }));
      toast.success('Removed');
    } catch { toast.error('Failed to remove member'); }
  }

  async function deleteGroup() {
    if (!confirm('Delete this group and all its messages?')) return;
    try {
      await api.delete(`/groups/${groupId}`);
      toast.success('Group deleted');
      navigate('/coach/groups');
    } catch { toast.error('Failed to delete group'); }
  }

  const memberIds = new Set(group?.members?.map(m => m.userId) || []);
  const nonMembers = clients.filter(c => !memberIds.has(c.id));

  if (loading) return <div className="gc-page"><div className="loading-center"><div className="spinner" /></div></div>;
  if (!group) return null;

  return (
    <div className="gc-page">
      {/* Header */}
      <div className="gc-header">
        <button className="gc-back" onClick={() => navigate(isCoach ? '/coach/groups' : '/groups')}>
          <FiArrowLeft size={20} />
        </button>
        <div className="gc-group-info">
          <div className="gc-group-avatar"><FiUsers size={18} /></div>
          <div>
            <div className="gc-group-name">{group.name}</div>
            <div className="gc-group-sub">{group.members?.length ?? 0} member{group.members?.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="gc-icon-btn" onClick={() => setShowMembers(s => !s)} title="Members">
            <FiUserPlus size={18} />
          </button>
          {isCoach && (
            <button className="gc-icon-btn danger" onClick={deleteGroup} title="Delete group">
              <FiTrash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Members panel */}
      {showMembers && (
        <div className="gc-members-panel">
          <div className="gc-members-title">Group Members ({group.members?.length})</div>
          {group.members?.map(m => (
            <div key={m.userId} className="gc-member-row">
              <div className="gc-member-avatar">{m.user.name.charAt(0).toUpperCase()}</div>
              <span className="gc-member-name">{m.user.name}</span>
              {isCoach && m.userId !== group.coachId && (
                <button className="gc-remove-btn" onClick={() => removeMember(m.userId, m.user.name)}>
                  <FiTrash2 size={12} />
                </button>
              )}
            </div>
          ))}

          {isCoach && nonMembers.length > 0 && (
            <>
              <div className="gc-members-title" style={{ marginTop: 12 }}>Add Members</div>
              {nonMembers.map(c => (
                <div key={c.id} className="gc-member-row">
                  <div className="gc-member-avatar" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="gc-member-name">{c.name}</span>
                  <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => addMember(c.id)}>+ Add</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="gc-messages">
        {messages.length === 0 && (
          <div className="gc-empty">No messages yet. Say hello! 👋</div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === user.id;
          return (
            <div key={msg.id} className={`gc-msg-row ${isMe ? 'me' : ''}`}>
              {!isMe && (
                <div className="gc-msg-avatar" title={msg.sender?.name}>
                  {msg.sender?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`gc-bubble ${isMe ? 'me' : ''} ${msg.sender?.role === 'COACH' ? 'coach' : ''}`}>
                {!isMe && (
                  <div className="gc-bubble-sender">
                    {msg.sender?.name}
                    {msg.sender?.role === 'COACH' && <span className="gc-coach-tag">Coach</span>}
                  </div>
                )}
                <div className="gc-bubble-text">{msg.content}</div>
                <div className="gc-bubble-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="gc-input-row" onSubmit={sendMessage}>
        <input
          className="gc-input"
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          autoComplete="off"
        />
        <button className="gc-send-btn" type="submit" disabled={sending || !text.trim()}>
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );
}
