import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSend, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useFit } from '../context/FitContext';
import api from '../utils/api';
import { getInitialState, transition, buildSummaryMessage } from '../utils/chatbot';
import ChatBubble from '../components/chatbot/ChatBubble';
import QuickReplies from '../components/chatbot/QuickReplies';
import toast from 'react-hot-toast';
import './Chat.css';

export default function Chat() {
  const { user } = useAuth();
  const { refreshTodayStats } = useFit();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [botState, setBotState] = useState(getInitialState());
  const [currentReplies, setCurrentReplies] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState('free'); // 'free' | 'chips_only'
  const [isTyping, setIsTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load chat history then trigger welcome
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get('/chat?limit=60');
      const history = res.data;
      if (history.length > 0) {
        setMessages(history.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          quickReplies: m.metadata?.quickReplies || null,
        })));
        // Restore to MAIN_MENU state since history exists
        const menuReplies = ['🍽️ Log a Meal', '🏋️ Log Workout', '📊 Today\'s Summary', '⚖️ Update Weight', '🔄 Back to Menu'];
        setCurrentReplies(menuReplies);
        setBotState({ ...getInitialState(), name: 'MAIN_MENU' });
      } else {
        // Fresh session — trigger welcome
        triggerWelcome();
      }
    } catch {
      triggerWelcome();
    } finally {
      setHistoryLoaded(true);
    }
  };

  const triggerWelcome = (persist = false) => {
    const result = transition(getInitialState(), '__start', user);
    applyBotMessages(result.botMessages, result.newState, {}, persist);
  };

  const applyBotMessages = useCallback(async (botMessages, newState, extra = {}, persist = true) => {
    setBotState(newState);
    for (const msg of botMessages) {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 500 + msg.content.length * 1.5));
      setIsTyping(false);
      const newMsg = { id: Date.now() + Math.random(), role: 'bot', content: msg.content, quickReplies: msg.quickReplies };
      setMessages(prev => [...prev, newMsg]);
      // Persist to server only when needed (not for welcome/reset messages)
      if (persist) {
        api.post('/chat', { role: 'bot', content: msg.content, metadata: msg.quickReplies ? { quickReplies: msg.quickReplies } : null }).catch(() => {});
      }
      // Set last quick replies
      if (msg.quickReplies) {
        setCurrentReplies(msg.quickReplies);
        setInputMode('free');
      }
      if (msg.inputMode) setInputMode(msg.inputMode);
    }
    if (extra.navigate) navigate(extra.navigate);
  }, [navigate]);

  const handleUserSend = async (text) => {
    if (!text.trim() || busy) return;
    setBusy(true);

    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setCurrentReplies(null);

    // Persist user message
    api.post('/chat', { role: 'user', content: text }).catch(() => {});

    try {
      const result = transition(botState, text, user);

      // Handle pending API call
      if (result.pendingApiCall) {
        // Show bot typing messages first
        for (const msg of result.botMessages) {
          setIsTyping(true);
          await new Promise(r => setTimeout(r, 400));
          setIsTyping(false);
          setMessages(prev => [...prev, { id: Date.now() + Math.random(), role: 'bot', content: msg.content, quickReplies: null }]);
          api.post('/chat', { role: 'bot', content: msg.content }).catch(() => {});
        }
        setBotState(result.newState);

        // ── SHOW_ESTIMATE: food estimation API call ──────────
        if (result.apiSuccessState === 'SHOW_ESTIMATE') {
          try {
            const estimateData = await result.pendingApiCall(api);
            const { foodName, grams, displayMethod, mealType } = result.estimateContext;
            const { calories, proteinG, carbsG, fatG } = estimateData;

            const confirmText =
              `📋 Here's my estimate for **${grams}g of ${foodName}** (${displayMethod}):\n\n` +
              `🔥 ${calories} kcal\n` +
              `🥩 Protein: ${proteinG}g\n` +
              `🍚 Carbs: ${carbsG}g\n` +
              `🫒 Fat: ${fatG}g\n\n` +
              `Shall I log this for your ${mealType}?\n` +
              `_(These are approximate — actual values may vary by recipe)_`;

            const confirmReplies = ['✅ Yes, log it!', '✏️ Change amount', '🔍 Search different food'];
            const confirmState = {
              ...result.newState,
              name: 'CONFIRM_ESTIMATED_FOOD',
              pendingFood: { foodName, grams, calories, proteinG, carbsG, fatG },
              mealType,
            };

            setIsTyping(true);
            await new Promise(r => setTimeout(r, 700));
            setIsTyping(false);
            const confirmMsg = { id: Date.now(), role: 'bot', content: confirmText, quickReplies: confirmReplies };
            setMessages(prev => [...prev, confirmMsg]);
            api.post('/chat', { role: 'bot', content: confirmText, metadata: { quickReplies: confirmReplies } }).catch(() => {});
            setCurrentReplies(confirmReplies);
            setBotState(confirmState);
          } catch {
            await applyBotMessages(
              [{ role: 'bot', content: 'Sorry, I couldn\'t estimate that food. Try typing a different name?', quickReplies: ['🔄 Back to Menu'] }],
              { ...result.newState, name: 'MAIN_MENU' }
            );
          }

        // ── SUMMARY_DONE ──────────────────────────────────────
        } else if (result.apiSuccessState === 'SUMMARY_DONE') {
          try {
            const statsData = await result.pendingApiCall(api);
            const summaryText = buildSummaryMessage(statsData, user?.name);
            const replies = ['🍽️ Log a Meal', '🏋️ Log Workout', '⚖️ Update Weight', '🔄 Back to Menu'];
            setIsTyping(true);
            await new Promise(r => setTimeout(r, 600));
            setIsTyping(false);
            const summaryMsg = { id: Date.now(), role: 'bot', content: summaryText, quickReplies: replies };
            setMessages(prev => [...prev, summaryMsg]);
            api.post('/chat', { role: 'bot', content: summaryText, metadata: { quickReplies: replies } }).catch(() => {});
            setCurrentReplies(replies);
            setBotState({ ...result.newState, name: 'MAIN_MENU' });
          } catch {
            toast.error('Could not fetch your stats');
            await applyBotMessages(
              [{ role: 'bot', content: 'Sorry, I couldn\'t fetch your stats right now. Try again?', quickReplies: ['🔄 Back to Menu'] }],
              { ...result.newState, name: 'MAIN_MENU' }
            );
          }

        // ── Regular API call (log food, log workout, log weight) ─
        } else {
          try {
            await result.pendingApiCall(api);
            refreshTodayStats();
            const successMsg = result.apiSuccessMessage || '✅ Done!';
            const afterReplies = result.afterSuccessReplies || ['🔄 Back to Menu'];
            const afterState = result.afterSuccessState || { ...result.newState, name: 'MAIN_MENU' };
            setIsTyping(true);
            await new Promise(r => setTimeout(r, 500));
            setIsTyping(false);
            const msg = { id: Date.now(), role: 'bot', content: successMsg, quickReplies: afterReplies };
            setMessages(prev => [...prev, msg]);
            api.post('/chat', { role: 'bot', content: successMsg, metadata: { quickReplies: afterReplies } }).catch(() => {});
            setCurrentReplies(afterReplies);
            setBotState({ ...getInitialState(), ...afterState });
          } catch (err) {
            const errMsg = result.apiErrorMessage || 'Something went wrong. Try again?';
            toast.error(errMsg);
            await applyBotMessages(
              [{ role: 'bot', content: errMsg, quickReplies: ['🔄 Back to Menu'] }],
              { ...result.newState, name: 'MAIN_MENU' }
            );
          }
        }
      } else {
        await applyBotMessages(result.botMessages, result.newState, { navigate: result.navigate });
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickReply = (opt) => handleUserSend(opt);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) handleUserSend(inputValue.trim());
  };

  const clearChat = async () => {
    if (!confirm('Clear all chat history?')) return;
    await api.delete('/chat').catch(() => {});
    setMessages([]);
    setBotState(getInitialState());
    setCurrentReplies(null);
    triggerWelcome();
    toast.success('Chat cleared');
  };

  return (
    <div className="chat-page page-wrapper">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-bot-avatar">💪</div>
          <div>
            <div className="chat-bot-name">FitBot</div>
            <div className="chat-bot-status">
              {user?.coachName ? `Coach: ${user.coachName}` : 'Your fitness companion'}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn" onClick={clearChat} title="Clear chat"><FiTrash2 size={17} /></button>
          <button className="icon-btn" onClick={() => { setMessages([]); setCurrentReplies(null); setBotState(getInitialState()); triggerWelcome(false); }} title="Reset"><FiRefreshCw size={17} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {!historyLoaded && (
          <div className="loading-center"><div className="spinner" /></div>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {isTyping && (
          <div className="chat-bubble-wrap bot">
            <div className="bot-avatar">💪</div>
            <div className="bubble bubble-bot typing-indicator">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick Replies */}
      <QuickReplies options={currentReplies} onSelect={handleQuickReply} disabled={busy} />

      {/* Input */}
      <form className="chat-input-bar" onSubmit={handleTextSubmit}>
        <input
          ref={inputRef}
          className="chat-input"
          placeholder={inputMode === 'chips_only' ? 'Pick an option above…' : 'Type a message…'}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          disabled={busy || inputMode === 'chips_only'}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={busy || !inputValue.trim()}
        >
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );
}
