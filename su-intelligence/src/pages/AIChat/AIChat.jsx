import { useState, useRef, useEffect } from "react";
import { Send, Brain, User, Zap, RefreshCw, ChevronDown } from "lucide-react";
import Navbar  from "../../components/Navbar";
import { fetchModels, sendMessage } from "../../services/aiService";
import { formatTime } from "../../utils/time";
import "./AIChat.css";

function BubbleBot({ msg }) {
  return (
    <div className="bubble-row bot">
      <div className="bubble-avatar bot-avatar"><Brain size={13} /></div>
      <div>
        <div className="bubble bot-bubble">
          <pre style={{ whiteSpace:"pre-wrap", fontFamily:"inherit", fontSize:"inherit" }}>{msg.content}</pre>
        </div>
        <div className="bubble-meta">
          {msg.model} · {msg.tokens} tokens · {msg.latency}ms · {formatTime(msg.time)}
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
  const [models, setModels]     = useState([]);
  const [modelId, setModelId]   = useState("su-text-ultra");
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchModels().then(m => setModels(m));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg = { id: Date.now(), role:"user", content:text, time: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const resp = await sendMessage(modelId, text);
      setMessages(prev => [...prev, { ...resp, time: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="aichat-shell">
      <Navbar title="AI Chat" subtitle="Inference playground">
        {/* Model picker */}
        <div className="model-picker">
          <Brain size={13} color="var(--accent)" />
          <select
            value={modelId}
            onChange={e => setModelId(e.target.value)}
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <ChevronDown size={12} color="var(--text3)" />
        </div>
        <button className="btn btn-ghost" onClick={clearChat}>
          <RefreshCw size={12} /> Clear
        </button>
      </Navbar>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty fade-in">
            <div className="chat-empty-icon"><Brain size={28} /></div>
            <h3>SU Intelligence Chat</h3>
            <p>Send a message to start a conversation with the selected model.</p>
            <div className="chat-suggestions">
              {["What can you do?", "Explain transformer architecture", "Write a Python sorting algorithm"].map(s => (
                <button key={s} className="suggestion-pill" onClick={() => setInput(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg =>
          msg.role === "user"
            ? <BubbleUser key={msg.id} msg={msg} />
            : <BubbleBot  key={msg.id} msg={msg} />
        )}

        {loading && (
          <div className="bubble-row bot fade-in">
            <div className="bubble-avatar bot-avatar"><Brain size={13} /></div>
            <div className="bubble bot-bubble typing-bubble">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <div className="chat-input-wrap">
          <textarea
            className="chat-input"
            placeholder="Send a message… (Enter to send, Shift+Enter for newline)"
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
            {loading ? <Zap size={15} className="spin-anim" /> : <Send size={15} />}
          </button>
        </div>
        <div className="chat-hint">
          Model: <strong>{modelId}</strong> · Press <kbd>Enter</kbd> to send
        </div>
      </div>
    </div>
  );
}
