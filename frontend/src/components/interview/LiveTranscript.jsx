import AudioVisualizer from "./AudioVisualizer";

const STATUS_LABELS = {
  idle: "Not recording",
  connecting: "Connecting",
  recording: "Listening",
  paused: "Paused",
  error: "Connection issue"
};

const statusColor = {
  idle: "#94a3b8",
  connecting: "#f59e0b",
  recording: "#22c55e",
  paused: "#f59e0b",
  error: "#ef4444"
};

const buttonStyle = (variant = "secondary") => ({
  border: "1px solid",
  borderColor: variant === "primary" ? "#1f5e3b" : "#d8d8d4",
  background: variant === "primary" ? "#1f5e3b" : "#fff",
  color: variant === "primary" ? "#fff" : "#334155",
  borderRadius: 10,
  padding: "9px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 160ms ease"
});

export default function LiveTranscript({ transcription, title = "Live transcript" }) {
  const {
    status = "idle",
    transcript = "",
    completedSegments = [],
    provisionalSegments = [],
    audioStream = null,
    error,
    start,
    pause,
    resume,
    stop
  } = transcription || {};
  const isRecording = status === "recording";
  const isConnecting = status === "connecting";
  const hasSession = ["recording", "paused"].includes(status);
  const completedText = completedSegments.map((segment) => segment.text).join(" ").trim();
  const provisionalText = provisionalSegments.map((segment) => segment.text).join(" ").trim();
  const displayedText = transcript || completedText || provisionalText;

  return (
    <section
      aria-label={title}
      style={{
        background: "#fff",
        border: "1px solid #e5e5e5",
        borderRadius: 16,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        overflow: "hidden",
        color: "#0f172a"
      }}
    >
      <header style={{ padding: "18px 20px 12px", display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
            Transcription updates as you speak
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: statusColor[status] || statusColor.idle, fontSize: 12, fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor", boxShadow: isRecording ? "0 0 0 4px rgba(34,197,94,.12)" : "none" }} />
          {STATUS_LABELS[status] || status}
        </div>
      </header>

      <div style={{ margin: "0 20px", padding: "8px 12px", borderRadius: 10, background: "#f2f1ec" }}>
        <AudioVisualizer stream={audioStream} active={isRecording} />
      </div>

      <div aria-live="polite" style={{ minHeight: 128, padding: "18px 20px", fontSize: 15, lineHeight: 1.7 }}>
        {displayedText ? (
          <>
            <span>{completedText || displayedText}</span>
            {provisionalText && (
              <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                {completedText ? ` ${provisionalText}` : provisionalText}
              </span>
            )}
          </>
        ) : (
          <span style={{ color: "#94a3b8" }}>
            {isConnecting ? "Connecting to live transcription…" : "Your transcript will appear here."}
          </span>
        )}
      </div>

      {error && (
        <div role="alert" style={{ margin: "0 20px 14px", padding: "10px 12px", borderRadius: 10, background: "#fef2f2", color: "#b91c1c", fontSize: 13 }}>
          {error}
        </div>
      )}

      <footer style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "14px 20px 18px", borderTop: "1px solid #f1f5f9" }}>
        {status === "idle" || status === "error" ? (
          <button type="button" onClick={start} disabled={isConnecting} style={buttonStyle("primary")}>
            Start
          </button>
        ) : null}
        {isConnecting ? (
          <button type="button" disabled style={{ ...buttonStyle("primary"), opacity: 0.65 }}>
            Connecting…
          </button>
        ) : null}
        {isRecording ? (
          <button type="button" onClick={pause} style={buttonStyle()}>
            Pause
          </button>
        ) : null}
        {status === "paused" ? (
          <button type="button" onClick={resume} style={buttonStyle("primary")}>
            Resume
          </button>
        ) : null}
        {hasSession ? (
          <button type="button" onClick={stop} style={buttonStyle()}>
            Stop
          </button>
        ) : null}
      </footer>
    </section>
  );
}
