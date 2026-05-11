import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSend, FiPaperclip, FiX } from 'react-icons/fi';
import './CoachChat.css'; // reuse styles

const SERVER_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');

export default function UserCoachChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coach, setCoach] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noCoach, setNoCoach] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!user?.coachId) { setNoCoach(true); setLoading(false); return; }
    fetchConversation(user.coachId);
    setupSocket(user.coachId);
    return () => socketRef.current?.disconnect();
  }, [user?.coachId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchConversation(coachId) {
    try {
      const { data } = await api.get(`/messages/${coachId}`);
      setCoach(data.partner);
      setMessages(data.messages);
      await api.put(`/messages/read/${coachId}`);
    } catch (err) {
      if (err.response?.status === 403) {
        setNoCoach(true);
      } else {
        toast.error('Failed to load conversation');
      }
    } finally {
      setLoading(false);
    }
  }

  function setupSocket(coachId) {
    const token = localStorage.getItem('fitbot_token');
    if (!token) return;

    const socket = io(SERVER_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('receive_message', (msg) => {
      if (msg.senderId === coachId || msg.receiverId === coachId) {
        setMessages(prev => [...prev, msg]);
        api.put(`/messages/read/${coachId}`).catch(() => {});
      }
    });

    socket.on('partner_typing', ({ senderId }) => {
      if (senderId === coachId) setIsTyping(true);
    });

    socket.on('partner_stop_typing', ({ senderId }) => {
      if (senderId === coachId) setIsTyping(false);
    });
  }

  function handleTextChange(e) {
    setText(e.target.value);
    if (!socketRef.current || !user?.coachId) return;
    socketRef.current.emit('typing', { receiverId: user.coachId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { receiverId: user.coachId });
    }, 1500);
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Max file size is 10 MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;
    const coachId = user.coachId;
    setSending(true);

    try {
      if (imageFile) {
        const fd = new FormData();
        fd.append('content', text.trim());
        fd.append('image', imageFile);
        const { data } = await api.post(`/messages/${coachId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setMessages(prev => [...prev, data]);
        clearImage();
      } else {
        socketRef.current?.emit('send_message', { receiverId: coachId, content: text.trim() });
        setMessages(prev => [...prev, {
          id: `tmp-${Date.now()}`,
          senderId: user.id,
          receiverId: coachId,
          content: text.trim(),
          imageUrl: null,
          createdAt: new Date().toISOString(),
        }]);
      }

      setText('');
      socketRef.current?.emit('stop_typing', { receiverId: coachId });
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  }

  if (loading) return <div className="cc-loading">Loading conversation…</div>;

  if (noCoach) return (
    <div className="cc-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 32, marginBottom: 12 }}>🏅</p>
        <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>No coach connected</p>
        <p style={{ fontSize: 14 }}>You don't have a coach yet. Ask your coach to add you using your registered email.</p>
        <button className="btn btn-outline" style={{ marginTop: 20 }} onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="cc-page">
      {/* Header */}
      <div className="cc-header">
        <button className="cc-back" onClick={() => navigate(-1)}>
          <FiArrowLeft size={18} />
        </button>
        <div className="cc-avatar">{coach?.name?.charAt(0).toUpperCase()}</div>
        <div className="cc-header-info">
          <div className="cc-header-name">{coach?.name}</div>
          <div className="cc-header-sub">Your Coach 🏅</div>
        </div>
      </div>

      {/* Messages */}
      <div className="cc-messages">
        {messages.length === 0 && (
          <div className="cc-empty">Send your first message to your coach!</div>
        )}

        {messages.map(msg => {
          const isMine = msg.senderId === user.id;
          return (
            <div key={msg.id} className={`cc-msg ${isMine ? 'mine' : 'theirs'}`}>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="progress" className="cc-img" />
              )}
              {msg.content && <div className="cc-bubble">{msg.content}</div>}
              <div className="cc-time">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="cc-msg theirs">
            <div className="cc-bubble cc-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="cc-img-preview">
          <img src={imagePreview} alt="preview" />
          <button className="cc-img-clear" onClick={clearImage}><FiX size={14} /></button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Progress photo ready to send</span>
        </div>
      )}

      {/* Input */}
      <form className="cc-input-row" onSubmit={handleSend}>
        <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleFileChange} />
        <button type="button" className="cc-attach" onClick={() => fileRef.current?.click()} title="Send progress photo">
          <FiPaperclip size={18} />
        </button>
        <textarea
          className="cc-textarea"
          placeholder={`Message your coach…`}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button type="submit" className="cc-send" disabled={sending || (!text.trim() && !imageFile)}>
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );
}
