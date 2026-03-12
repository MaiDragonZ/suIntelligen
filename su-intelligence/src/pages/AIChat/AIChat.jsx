import { useState, useRef, useEffect } from "react";
import {
  Send, Brain, User, Zap, RefreshCw, ChevronDown,
  Plus, Trash2, MessageSquare, Clock,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import {
  fetchModels, fetchSessions, fetchSession,
  sendMessage, deleteSession,
} from "../../services/aiService";
import { formatTime, timeAgo } from "../../utils/time";
import "./AIChat.css";

function BubbleBot({ msg }) {
  return (
    <div className="bubble-row bot">
      <div className="bubble-avatar bot-avatar"><Brain size={13} /></div>
      <div>
        <div className="bubble bot-bubble">
          <pre style={{ whiteSpace:"pre-wrap", fontFamily:"inherit", fontSize:"inherit" }}>
            {msg.content}
          </pre>
        </div>
        <div className="bubble-meta">
          {msg.model && <span>{msg.model} · </span>}
          {msg.tokens && <span>{msg.tokens} tokens · </span>}
          {msg.latency_ms && <span>{msg.latency_ms}ms · </span>}
          {formatTime(msg.created_at || new Date().toISOString())}
        </div>
      </div>
    </div>
  );
}

function BubbleUser({ msg }) {
  return (
    <div className="bubble-row user">
      <div className="bubble user-bubble">{msg.content}</div>
      <div className="bubble-avatar user-avatar"><User size={13} /></div>
    </div>
  );
}

export default function AIChat() {

  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState("deepseek-chat");

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActive] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const bottomRef = useRef(null);

  useEffect(() => {
    loadModels();
    loadSessions();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadModels = async () => {
    try {
      const res = await fetchModels();
      const data = res?.data || res || [];
      setModels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadModels error", err);
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);

    try {
      const res = await fetchSessions();
      const data = res?.data || res || [];

      if (Array.isArray(data)) {
        setSessions(data);
      } else {
        setSessions([]);
      }

    } catch (err) {
      console.error("loadSessions error", err);
      setSessions([]);
    }

    setLoadingSessions(false);
  };

  const selectSession = async (sess) => {
    try {
      const res = await fetchSession(sess.id);
      const full = res?.data || res;

      setActive(full);
      setMessages(full?.messages || []);
      setModelId(full?.model_id || modelId);

    } catch (err) {
      console.error(err);
    }
  };

  const newChat = () => {
    setActive(null);
    setMessages([]);
  };

  const handleDelete = async (e, sessId) => {
    e.stopPropagation();

    try {
      await deleteSession(sessId);
      setSessions(prev => prev.filter(s => s.id !== sessId));

      if (activeSession?.id === sessId) {
        newChat();
      }

    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {

    const text = input.trim();
    if (!text || loading) return;

    setInput("");

    const userMsg = {
      role: "user",
      content: text,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {

      const resp = await sendMessage(activeSession?.id || "", modelId, text);

      if (!activeSession) {
        setActive({ id: resp.session_id, model_id: modelId });
        loadSessions();
      }

      setMessages(prev => [...prev, { ...resp.message, ...resp }]);

    } catch (err) {

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Error: ${err.message}`,
          created_at: new Date().toISOString(),
        },
      ]);

    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="aichat-shell">

      <Navbar title="AI Chat" subtitle="DeepSeek Inference">

        <div className="model-picker">
          <Brain size={13} color="var(--accent)" />
          <select value={modelId} onChange={e => setModelId(e.target.value)}>
            {Array.isArray(models) && models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <ChevronDown size={12} color="var(--text3)" />
        </div>

        <button className="btn btn-primary" onClick={newChat}>
          <Plus size={12} /> New Chat
        </button>

      </Navbar>

      <div className="aichat-body">

        <aside className="history-sidebar">

          <div className="history-header">
            <span className="history-title">Chat History</span>
            <button className="btn-icon" onClick={loadSessions}>
              <RefreshCw size={13} />
            </button>
          </div>

          <div className="history-list">

            {loadingSessions ? (
              [1,2,3].map(i => (
                <div key={i} className="history-skeleton shimmer-row" />
              ))

            ) : !Array.isArray(sessions) || sessions.length === 0 ? (

              <div className="history-empty">No chats yet</div>

            ) : (

              sessions.map(sess => (
                <div
                  key={sess.id}
                  className={`history-item ${activeSession?.id === sess.id ? "active" : ""}`}
                  onClick={() => selectSession(sess)}
                >
                  <MessageSquare size={13} className="history-icon" />

                  <div className="history-item-body">
                    <span className="history-item-title">{sess.title}</span>
                    <span className="history-item-meta">
                      <Clock size={10} />
                      {timeAgo(sess.updated_at)}
                    </span>
                  </div>

                  <button
                    className="history-delete"
                    onClick={e => handleDelete(e, sess.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))

            )}

          </div>
        </aside>

        <div className="chat-area">

          <div className="chat-messages">

            {messages.length === 0 && (
              <div className="chat-empty fade-in">
                <div className="chat-empty-icon"><Brain size={28} /></div>
                <h3>SU Intelligence Chat</h3>
                <p>
                  Powered by {models.find(m => m.id === modelId)?.name || modelId}
                </p>
              </div>
            )}

            {messages.map((msg, i) =>
              msg.role === "user"
                ? <BubbleUser key={i} msg={msg} />
                : <BubbleBot key={i} msg={msg} />
            )}

            {loading && (
              <div className="bubble-row bot fade-in">
                <div className="bubble-avatar bot-avatar">
                  <Brain size={13} />
                </div>
                <div className="bubble bot-bubble typing-bubble">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={bottomRef} />

          </div>

          <div className="chat-input-bar">

            <div className="chat-input-wrap">

              <textarea
                className="chat-input"
                placeholder="Send a message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
              />

              <button
                className={`send-btn ${loading || !input.trim() ? "disabled" : ""}`}
                onClick={handleSend}
                disabled={loading || !input.trim()}
              >
                {loading
                  ? <Zap size={15} className="spin-anim" />
                  : <Send size={15} />}
              </button>

            </div>

            <div className="chat-hint">
              Model: <strong>{modelId}</strong>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
