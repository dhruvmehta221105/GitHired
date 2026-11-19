import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import {
  Bot,
  CheckCircle2,
  FileText,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import axios from "axios";
import API from "../../api";

const RESUME_MATCH_API = import.meta.env.VITE_RESUME_MATCH_API_URL || "/resume-match-api";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const INITIAL_MESSAGE = {
  role: "assistant",
  text: "Hi! I’m Kiko, your assistant. I can help with interview prep and your resume. What would you like to work on?",
};

export default function AssistantWidget() {
  const { pathname } = useLocation();
  const isInterviewRoom = pathname.startsWith("/interview/");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const messageListRef = useRef(null);
  const historyLoadedRef = useRef(false);

  useEffect(() => {
    if (!open || historyLoadedRef.current) return;

    let active = true;
    setHistoryLoading(true);
    setHistoryError("");

    API.get("/chat/history")
      .then(({ data }) => {
        if (!active) return;

        const history = Array.isArray(data)
          ? data.flatMap((chat) => [
            { role: "user", text: chat.message },
            { role: "assistant", text: chat.response },
          ]).filter((message) => message.text)
          : [];

        setMessages(history.length > 0 ? history : [INITIAL_MESSAGE]);
        historyLoadedRef.current = true;
      })
      .catch(() => {
        if (active) {
          setHistoryError("Your previous conversations could not be loaded. You can still start a new one.");
        }
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending, open, activeTab]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    setMessages((current) => [...current, { role: "user", text: message }]);
    setInput("");
    setSending(true);

    try {
      const { data } = await API.post("/chat/send", { message });
      if (!data?.response) {
        throw new Error("Kiko returned an empty response.");
      }
      setMessages((current) => [...current, { role: "assistant", text: data.response }]);
    } catch (error) {
      const detail = error.response?.data?.error
        || (error.request
          ? "Kiko could not reach the assistant service. Please try again."
          : "Kiko could not answer that just now. Please try again.");
      setMessages((current) => [...current, { role: "assistant", text: detail, isError: true }]);
    } finally {
      setSending(false);
    }
  };

  const selectFile = (event) => {
    const selected = event.target.files?.[0] || null;
    event.target.value = "";
    setUploadError("");
    setUploadResult(null);

    if (!selected) {
      setFile(null);
      return;
    }

    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(extension)) {
      setFile(null);
      setUploadError("Choose a PDF or DOCX file.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setUploadError("Your resume must be 10 MB or smaller.");
      return;
    }
    setFile(selected);
  };

  const uploadResume = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setUploadError("");
    setUploadResult(null);

    const formData = new FormData();
    formData.append("files", file);

    try {
      const { data } = await axios.post(`${RESUME_MATCH_API}/resumes/upload`, formData);

      if (data.total_uploaded > 0) {
        setUploadResult(data.uploaded[0]);
        setFile(null);
      } else {
        setUploadError(data.errors?.[0]?.error || "The resume could not be uploaded.");
      }
    } catch (error) {
      setUploadError(
        error.response?.data?.detail
          || (error.request
            ? "The resume service did not respond. Check that it is running and try again."
            : error.message)
      );
    } finally {
      setUploading(false);
    }
  };

  return createPortal(
    <div className={`pointer-events-auto fixed right-5 z-[100] ${isInterviewRoom ? "bottom-24" : "bottom-5"}`}>
      {open && (
        <section
          aria-label="Kiko assistant"
          className="mb-3 flex h-[min(560px,calc(100dvh-7rem))] w-[min(390px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_16px_60px_rgba(0,0,0,0.2)]"
        >
          <header className="flex items-center justify-between bg-accent px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Bot size={23} />
              </span>
              <div>
                <h2 className="text-sm font-bold">KiKo Assistant</h2>
                <p className="flex items-center gap-1.5 text-xs text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Here to help
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Close assistant"
            >
              <X size={19} />
            </button>
          </header>

          <div className="grid grid-cols-2 border-b border-border bg-bg-secondary p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activeTab === "chat" ? "bg-white text-accent shadow-sm" : "text-text-secondary hover:text-text"
              }`}
            >
              <MessageCircle size={16} />
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("resume")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activeTab === "resume" ? "bg-white text-accent shadow-sm" : "text-text-secondary hover:text-text"
              }`}
            >
              <Upload size={16} />
              Upload resume
            </button>
          </div>

          {activeTab === "chat" ? (
            <>
              <div ref={messageListRef} className="flex-1 space-y-3 overflow-y-auto bg-[#fafaf8] p-4" aria-live="polite">
                {historyLoading && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary" role="status">
                    <LoaderCircle size={15} className="animate-spin" />
                    Loading your conversations…
                  </div>
                )}
                {historyError && (
                  <p className="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800" role="status">
                    {historyError}
                  </p>
                )}
                {messages.map((message, index) => (
                  <div
                    key={`${index}-${message.role}`}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <p
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "rounded-br-sm bg-accent text-white"
                          : message.isError
                            ? "rounded-bl-sm border border-red-100 bg-red-50 text-red-700"
                            : "rounded-bl-sm bg-white text-text shadow-sm"
                      }`}
                    >
                      {message.text}
                    </p>
                  </div>
                ))}
                {sending && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary" role="status">
                    <LoaderCircle size={15} className="animate-spin" />
                    Kiko is thinking…
                  </div>
                )}
              </div>
              <form onSubmit={sendMessage} className="flex items-end gap-2 border-t border-border bg-white p-3">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Ask KiKo anything…"
                  aria-label="Message KiKo"
                  rows={1}
                  maxLength={4000}
                  className="max-h-24 min-h-10 flex-1 resize-y rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none transition focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send size={17} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-5 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-light text-accent">
                <FileText size={27} />
              </span>
              <div>
                <h3 className="font-bold text-text">Let’s get your resume ready</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Upload a PDF or DOCX resume to add it to resume matching.
                </p>
              </div>
              <p className="w-full rounded-lg bg-amber-50 px-3 py-2 text-left text-xs leading-relaxed text-amber-800">
                The connected Resume Match service currently stores resumes in a shared workspace, not separately by GitHired user.
              </p>

              <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-6 text-sm text-text-secondary transition hover:border-accent hover:bg-bg">
                <Upload size={20} className="text-accent" />
                <span className="font-semibold text-text">{file ? file.name : "Choose a resume"}</span>
                <span className="text-xs">PDF or DOCX · up to 10 MB</span>
                <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={selectFile} className="sr-only" />
              </label>

              {uploadError && (
                <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-left text-sm text-red-700" role="alert">
                  {uploadError}
                </p>
              )}
              {uploadResult && (
                <div className="flex w-full items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-left text-sm text-emerald-800" role="status">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                  <span>
                    <strong>{uploadResult.candidate_name || "Your resume"}</strong> was uploaded successfully.
                    {uploadResult.email ? ` We found ${uploadResult.email}.` : ""}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={uploadResume}
                disabled={!file || uploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />}
                {uploading ? "Uploading…" : "Upload resume"}
              </button>
            </div>
          )}
        </section>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 rounded-full bg-accent py-2 pl-2 pr-4 text-left text-white shadow-[0_8px_28px_rgba(31,94,59,0.3)] transition hover:-translate-y-0.5 hover:bg-accent-dark"
          aria-label="Open KiKo assistant"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <Bot size={22} />
          </span>
          <span>
            <span className="block text-sm font-bold">Hi! I’m KiKo</span>
            <span className="block text-xs text-white/80">Your assistant</span>
          </span>
        </button>
      )}
    </div>,
    document.body
  );
}
