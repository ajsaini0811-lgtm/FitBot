import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSend, FiPaperclip, FiX } from 'react-icons/fi';
import './CoachChat.css';

const SERVER_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');

export default function CoachChat() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchConversation();
    setupSocket();
    return () => socketRef.current?.disconnect();
  }, [clientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchConversation() {
    try {
      const { data } = await api.get(`/messages/${clientId}`);
      setClient(data.partner);
      setMessages(data.messages);
      // Mark as read
      await api.put(`/messages/read/${clientId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load conversation');
      navigate('/coach');
    } finally {
      setLoading(false);
    }
  }

  function setupSocket() {
    const token = localStorage.getItem('fitbot_token');
    if (!token) return;

    const socket = io(SERVER_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('receive_message', (msg) => {
      if (msg.senderId === clientId || msg.receiverId === clientId) {
        setMessages(prev => [...prev, msg]);
        api.put(`/messages/read/${clientId}`).catch(() => {});
      }
    });

    socket.on('partner_typing', ({ senderId }) => {
      if (senderId === clientId) setIsTyping(true);
    });

    socket.on('partner_stop_typing', ({ senderId }) => {
      if (senderId === clientId) setIsTyping(false);
    });
  }

  function handleTextChange(e) {
    setText(e.target.value);
    if (!socketRef.current) return;
    socketRef.current.emit('typing', { receiverId: clientId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { receiverId: clientId });
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
    setSending(true);

    try {
      if (imageFile) {
        // REST call for image upload
        const fd = new FormData();
        fd.append('content', text.trim());
        fd.append('image', imageFile);
        const { data } = await api.post(`/messages/${clientId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setMessages(prev => [...prev, data]);
        // Also emit via socket so receiver sees it live
        socketRef.current?.emit('send_message', { receiverId: clientId, content: text.trim(), imageUrl: data.imageUrl });
        clearImage();
      } else {
        // Socket send (also saves to DB in server)
        socketRef.current?.emit('send_message', { receiverId: clientId, content: text.trim() });
        // Optimistic local update
        setMessages(prev => [...prev, {
          id: `tmp-${Date.now()}`,
          senderId: user.id,
          receiverId: clientId,
          content: text.trim(),
          imageUrl: null,
          createdAt: new Date().toISOString(),
        }]);
      }

      setText('');
      socketRef.current?.emit('stop_typing', { receiverId: clientId });
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

  return (
    <div className="cc-page">
      {/* Header */}
      <div className="cc-header">
        <button className="cc-back" onClick={() => navigate('/coach')}>
          <FiArrowLeft size={18} />
        </button>
        <div className="cc-avatar">{client?.name?.charAt(0).toUpperCase()}</div>
        <div className="cc-header-info">
          <div className="cc-header-name">{client?.name}</div>
          <div className="cc-header-sub">Client</div>
        </div>
      </div>

      {/* Messages */}
      <div className="cc-messages">
        {messages.length === 0 && (
          <div className="cc-empty">Send your first message to {client?.name}!</div>
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
        </div>
      )}

      {/* Input */}
      <form className="cc-input-row" onSubmit={handleSend}>
        <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleFileChange} />
        <button type="button" className="cc-attach" onClick={() => fileRef.current?.click()}>
          <FiPaperclip size={18} />
        </button>
        <textarea
          className="cc-textarea"
          placeholder={`Message ${client?.name}…`}
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
