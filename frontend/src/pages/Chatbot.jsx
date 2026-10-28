import { useState, useRef, useEffect } from "react";
import Navbar from "../components/common/Navbar";
import API from "../api";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: " Hi! I'm your AI Interview Bot from GitHired.\n\nI can help you:\n• Practice technical & HR interview questions\n• Give feedback on your answers\n• Improve your communication & confidence\n\nWhat role are you preparing for today just let me know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const sendMessage = async (overrideText) => {
    const userMessage = (overrideText ?? input).trim();
    if (!userMessage || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const response = await API.post("/chat/send", { message: userMessage });
      const reply = response.data.response;

      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ " + err.message, isError: true },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "bot",
        text: "Chat cleared! 🗑️ Ready to help. What role are you preparing for?",
      },
    ]);
  };

  const SUGGESTIONS = [
    "Help me prepare for a Frontend Developer interview",
    "Ask me a technical React question",
    "Give me an HR behavioural question",
    "How do I answer 'Tell me about yourself'?",
  ];

  return (
    <div style={s.page}>
      <style>{CSS}</style>
      <Navbar />

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.botAvatar}>🤖</div>
          <div>
            <div style={s.headerTitle}>AI Interview Coach</div>
            <div style={s.headerSub}>
              <span style={s.dot} /> Online · Powered by GitHired
            </div>
          </div>
        </div>
        <button className="ix-clear-btn" onClick={clearChat} style={s.clearBtn}>
          🗑 Clear
        </button>
      </div>

      {/* ── Messages ── */}
      <div style={s.messages}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className="msg-fade"
            style={{
              ...s.row,
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {/* Bot avatar */}
            {msg.role === "bot" && <div style={s.avatarBot}>🤖</div>}

            <div style={{ maxWidth: "72%" }}>
              <div
                style={{
                  ...s.bubble,
                  ...(msg.role === "user" ? s.bubbleUser : s.bubbleBot),
                  ...(msg.isError ? s.bubbleErr : {}),
                }}
              >
                {/* Render newlines and bullet points */}
                {msg.text.split("\n").map((line, i) => (
                  <span key={i} style={{ display: "block", marginBottom: 2 }}>
                    {line}
                  </span>
                ))}
              </div>
            </div>

            {/* User avatar */}
            {msg.role === "user" && <div style={s.avatarUser}>👤</div>}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="msg-fade" style={{ ...s.row, justifyContent: "flex-start" }}>
            <div style={s.avatarBot}>🤖</div>
            <div style={{ ...s.bubble, ...s.bubbleBot, padding: "14px 18px" }}>
              <span className="ix-dot" />
              <span className="ix-dot" />
              <span className="ix-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Suggestion chips (only at start) ── */}
      {messages.length <= 2 && !loading && (
        <div style={s.chips}>
          {SUGGESTIONS.map((txt) => (
            <button
              key={txt}
              className="ix-chip"
              style={s.chip}
              onClick={() => sendMessage(txt)}
            >
              {txt}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ── */}
      <div style={s.inputArea}>
        <div style={s.inputBox}>
          <textarea
            ref={textareaRef}
            style={s.textarea}
            placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="ix-send-btn"
            style={{
              ...s.sendBtn,
              opacity: loading || !input.trim() ? 0.45 : 1,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            }}
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            {loading ? "···" : "↑"}
          </button>
        </div>
        <p style={s.hint}>GitHired AI Coach</p>
      </div>
    </div>
  );
}

/* ─── Inline CSS ─────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .ix-clear-btn:hover { background: #fee2e2 !important; color: #ef4444 !important; }
  .ix-chip:hover      { background: #ede9ff !important; border-color: #7c5af6 !important; color: #7c5af6 !important; }
  .ix-send-btn:hover:not(:disabled) { background: #1558c0 !important; }
  textarea:focus      { outline: none; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes blink {
    0%,80%,100% { transform: scale(0.5); opacity: 0.3; }
    40%         { transform: scale(1);   opacity: 1;   }
  }
  .msg-fade { animation: fadeUp 0.22s ease; }
  .ix-dot {
    display: inline-block;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #7c5af6;
    margin: 0 2.5px;
    animation: blink 1.3s infinite;
  }
  .ix-dot:nth-child(2) { animation-delay: .2s; }
  .ix-dot:nth-child(3) { animation-delay: .4s; }
`;

/* ─── Styles ─────────────────────────────────────────── */
const s = {
  page: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    background: "#f5f6fa",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },

  /* header */
  header: {
    background: "#fff",
    borderBottom: "1px solid #ebebf0",
    padding: "13px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
  },
  headerLeft:  { display: "flex", alignItems: "center", gap: 12 },
  botAvatar: {
    width: 44, height: 44, borderRadius: "50%",
    background: "linear-gradient(135deg,#7c5af6,#4f8ef7)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
  },
  headerTitle: { fontFamily: "'Manrope',sans-serif", fontSize: 16, fontWeight: 800, color: "#0f1117" },
  headerSub:   { fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 5, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "#22d3a4", display: "inline-block" },
  clearBtn: {
    background: "#fff", border: "1.5px solid #e0e1ea", borderRadius: 100,
    padding: "7px 16px", fontSize: 13, fontWeight: 600, color: "#888",
    cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
  },

  /* messages */
  messages: {
    flex: 1, overflowY: "auto", padding: "28px 24px 12px",
    display: "flex", flexDirection: "column", gap: 14,
    maxWidth: 860, width: "100%", margin: "0 auto",
  },
  row: { display: "flex", alignItems: "flex-end", gap: 10 },
  avatarBot: {
    width: 32, height: 32, borderRadius: "50%",
    background: "linear-gradient(135deg,#7c5af6,#4f8ef7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 15, flexShrink: 0,
  },
  avatarUser: {
    width: 32, height: 32, borderRadius: "50%", background: "#e8eeff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 15, flexShrink: 0,
  },
  bubble: { padding: "13px 17px", borderRadius: 16, fontSize: 14, lineHeight: 1.7 },
  bubbleBot: {
    background: "#fff", color: "#0f1117",
    borderRadius: "4px 16px 16px 16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
  },
  bubbleUser: {
    background: "linear-gradient(135deg,#7c5af6,#4f8ef7)", color: "#fff",
    borderRadius: "16px 4px 16px 16px",
    boxShadow: "0 4px 14px rgba(124,90,246,0.28)",
  },
  bubbleErr: { background: "#fff5f5", border: "1px solid #fecaca", color: "#dc2626" },

  /* suggestions */
  chips: {
    display: "flex", flexWrap: "wrap", gap: 8,
    padding: "4px 24px 12px", maxWidth: 860, width: "100%", margin: "0 auto",
  },
  chip: {
    background: "#fff", border: "1.5px solid #e0e1ea", borderRadius: 100,
    padding: "8px 16px", fontSize: 13, color: "#444", cursor: "pointer",
    fontFamily: "inherit", fontWeight: 500, transition: "all 0.18s",
  },

  /* input */
  inputArea: {
    background: "#fff", borderTop: "1px solid #ebebf0",
    padding: "14px 24px 18px", position: "sticky", bottom: 0,
  },
  inputBox: {
    display: "flex", gap: 10, maxWidth: 860, margin: "0 auto",
    background: "#f5f6fa", border: "1.5px solid #e0e1ea",
    borderRadius: 14, padding: "10px 10px 10px 16px", alignItems: "flex-end",
  },
  textarea: {
    flex: 1, border: "none", background: "transparent",
    fontSize: 14, color: "#0f1117", resize: "none",
    fontFamily: "inherit", lineHeight: 1.6,
    maxHeight: 120, overflowY: "auto",
  },
  sendBtn: {
    background: "#1a73e8", color: "#fff", border: "none",
    borderRadius: 10, width: 40, height: 40,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, fontWeight: 900, flexShrink: 0,
    transition: "background 0.2s", fontFamily: "inherit",
  },
  hint: { textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 10 },
};