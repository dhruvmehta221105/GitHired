import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mic2,
  Play,
  Sparkles,
  Target,
  Trophy
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import API from "../api";

const categoryLabels = {
  technical: "Technical skills",
  communication: "Communication",
  problemSolving: "Problem solving"
};

const categoryGuidance = {
  technical: "Review core concepts and explain your implementation choices aloud.",
  communication: "Practice concise STAR answers and lead with the outcome first.",
  problemSolving: "Use timed problems and narrate your trade-offs step by step."
};

const statusLabels = {
  scheduled: "Scheduled",
  ready: "Ready",
  "in-progress": "In progress",
  paused: "Paused",
  processing: "Processing",
  completed: "Completed"
};

const formatDate = (value) => {
  if (!value) return "Date not set";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const scoreValue = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);

function Interviews() {
  const navigate = useNavigate();
  const location = useLocation();
  const [interviews, setInterviews] = useState([]);
  const [feedbackByInterview, setFeedbackByInterview] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(location.state?.message || "");

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const response = await API.get("/interviews");
        const items = response.data || [];
        const completed = items.filter((interview) => interview.status === "completed");
        const feedbackEntries = await Promise.all(
          completed.map(async (interview) => {
            try {
              const feedback = await API.get(`/feedback/${interview._id}`);
              return [interview._id, feedback.data?.[0] || null];
            } catch {
              return [interview._id, null];
            }
          })
        );

        if (!active) return;
        setInterviews(items);
        setFeedbackByInterview(Object.fromEntries(feedbackEntries));
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || "Unable to load your dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!successMsg) return undefined;
    const timeout = window.setTimeout(() => setSuccessMsg(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [successMsg]);

  const completedInterviews = useMemo(
    () => interviews.filter((interview) => interview.status === "completed"),
    [interviews]
  );

  const activeInterview = useMemo(
    () => interviews.find((interview) => ["ready", "in-progress", "paused", "processing"].includes(interview.status)),
    [interviews]
  );

  const averageScore = useMemo(() => {
    const scores = completedInterviews
      .map((interview) => {
        const storedScore = scoreValue(interview.totalScore);
        if (storedScore !== null) return storedScore;
        const feedbackScore = scoreValue(feedbackByInterview[interview._id]?.rating);
        return feedbackScore === null ? null : feedbackScore * 20;
      })
      .filter((score) => score !== null);
    return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
  }, [completedInterviews, feedbackByInterview]);

  const weakAreas = useMemo(() => {
    const totals = { technical: [], communication: [], problemSolving: [] };
    completedInterviews.forEach((interview) => {
      const feedback = feedbackByInterview[interview._id];
      Object.keys(totals).forEach((key) => {
        const score = scoreValue(feedback?.[key]);
        if (score !== null) totals[key].push(score);
      });
    });

    return Object.entries(totals)
      .map(([key, scores]) => ({
        key,
        score: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null
      }))
      .filter((area) => area.score !== null && area.score < 3.5)
      .sort((a, b) => a.score - b.score);
  }, [completedInterviews, feedbackByInterview]);

  const recentInterviews = useMemo(
    () => [...interviews].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [interviews]
  );

  const handleInterviewAction = async (interview) => {
    if (interview.status === "completed") {
      navigate(`/interview-result/${interview._id}`);
      return;
    }
    if (interview.status === "processing") return;

    try {
      setActionId(interview._id);
      if (interview.status === "scheduled") await API.post(`/interviews/${interview._id}/ready`);
      await API.post(`/interviews/${interview._id}/start`);
      navigate(`/interview/${interview._id}`, { state: { interviewId: interview._id, role: interview.role } });
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to open this interview.");
    } finally {
      setActionId(null);
    }
  };

  const actionLabel = (interview) => {
    if (actionId === interview._id) return "Opening...";
    if (interview.status === "completed") return "View results";
    if (interview.status === "processing") return "Evaluating...";
    if (["in-progress", "paused"].includes(interview.status)) return "Resume interview";
    return "Start interview";
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Practice workspace</p>
            <h1 style={styles.title}>Your interview dashboard</h1>
            <p style={styles.subtitle}>See your momentum, focus your next practice session, and keep improving.</p>
          </div>
          <button style={styles.primaryButton} onClick={() => navigate("/schedule-interview")}>
            <CalendarDays size={17} /> Schedule interview
          </button>
        </header>

        {successMsg && <div style={styles.success}>{successMsg}</div>}
        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.loading}>Loading your practice data...</div>
        ) : (
          <>
            <section style={styles.metricGrid} aria-label="Interview summary">
              <Metric icon={<Trophy size={19} />} label="Average score" value={averageScore === null ? "--" : `${averageScore}/100`} tone="green" />
              <Metric icon={<CheckCircle2 size={19} />} label="Completed interviews" value={completedInterviews.length} tone="green" />
              <Metric icon={<Activity size={19} />} label="Total practice sessions" value={interviews.length} tone="blue" />
              <Metric icon={<Target size={19} />} label="Focus areas" value={weakAreas.length || "None"} tone="orange" />
            </section>

            <section style={styles.contentGrid}>
              <div style={styles.primaryColumn}>
                <div style={styles.sectionHeader}>
                  <div>
                    <p style={styles.sectionKicker}>Your activity</p>
                    <h2 style={styles.sectionTitle}>Recent interviews</h2>
                  </div>
                  <span style={styles.sectionCount}>{interviews.length} total</span>
                </div>

                {recentInterviews.length === 0 ? (
                  <EmptyState onCreate={() => navigate("/schedule-interview")} />
                ) : (
                  <div style={styles.interviewList}>
                    {recentInterviews.map((interview) => (
                      <article key={interview._id} style={styles.interviewRow}>
                        <div style={styles.roleIcon}><Brain size={18} /></div>
                        <div style={styles.interviewInfo}>
                          <div style={styles.rowTitle}>{interview.role}</div>
                          <div style={styles.rowMeta}>{formatDate(interview.date)} · {interview.questions?.length || 0} answers</div>
                        </div>
                        <div style={styles.rowScore}>
                          {interview.status === "completed" && scoreValue(interview.totalScore) !== null ? `${interview.totalScore}/100` : statusLabels[interview.status] || interview.status}
                        </div>
                        <button style={styles.iconAction} onClick={() => handleInterviewAction(interview)} disabled={actionId === interview._id || interview.status === "processing"}>
                          {interview.status === "completed" ? <ArrowRight size={18} /> : <Play size={17} />}
                          <span>{actionLabel(interview)}</span>
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <aside style={styles.sidebarColumn}>
                <section style={styles.activePanel}>
                  <div style={styles.panelIcon}><Clock3 size={18} /></div>
                  <p style={styles.panelKicker}>Active interview</p>
                  {activeInterview ? (
                    <>
                      <h2 style={styles.panelTitle}>{activeInterview.role}</h2>
                      <p style={styles.panelText}>{statusLabels[activeInterview.status]} · {activeInterview.questions?.length || 0} answers saved</p>
                      <button style={styles.panelButton} onClick={() => handleInterviewAction(activeInterview)} disabled={activeInterview.status === "processing" || actionId === activeInterview._id}>
                        {activeInterview.status === "processing" ? "Evaluation in progress" : "Continue interview"} <ArrowRight size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 style={styles.panelTitle}>No active session</h2>
                      <p style={styles.panelText}>Start a focused practice session when you are ready.</p>
                      <button style={styles.panelButton} onClick={() => navigate("/schedule-interview")}>Schedule practice <ArrowRight size={16} /></button>
                    </>
                  )}
                </section>

                <section style={styles.sideSection}>
                  <div style={styles.sectionHeaderSmall}><AlertTriangle size={17} color="#c76b1d" /><h2 style={styles.sideTitle}>Weak areas</h2></div>
                  {weakAreas.length ? weakAreas.map((area) => (
                    <div key={area.key} style={styles.areaRow}>
                      <div><strong style={styles.areaLabel}>{categoryLabels[area.key]}</strong><span style={styles.areaMeta}>{area.score.toFixed(1)}/5 average</span></div>
                      <div style={styles.areaTrack}><div style={{ ...styles.areaFill, width: `${(area.score / 5) * 100}%` }} /></div>
                    </div>
                  )) : <p style={styles.muted}>Complete an interview with feedback to see your focus areas.</p>}
                </section>

                <section style={styles.sideSection}>
                  <div style={styles.sectionHeaderSmall}><Sparkles size={17} color="#1f5e3b" /><h2 style={styles.sideTitle}>Recommended practice</h2></div>
                  {(weakAreas.length ? weakAreas : [{ key: "technical" }]).slice(0, 3).map((area) => (
                    <div key={area.key} style={styles.recommendation}>
                      <span style={styles.recommendationDot} />
                      <div><strong style={styles.recommendationTitle}>{categoryLabels[area.key]}</strong><p style={styles.recommendationText}>{categoryGuidance[area.key]}</p></div>
                    </div>
                  ))}
                </section>
              </aside>
            </section>

            <section style={styles.roadmap}>
              <div style={styles.roadmapHeader}>
                <div>
                  <p style={styles.sectionKicker}>Your next move</p>
                  <h2 style={styles.sectionTitle}>Build a stronger interview habit</h2>
                  <p style={styles.roadmapSubtitle}>Use this simple loop to turn each practice session into measurable progress.</p>
                </div>
                <div style={styles.roadmapBadge}><Sparkles size={16} /> Personal preparation loop</div>
              </div>
              <div style={styles.roadmapGrid}>
                <RoadmapCard
                  number="01"
                  icon={<CalendarDays size={18} />}
                  title="Set a focused session"
                  text="Choose a role, difficulty, and question count that match your next opportunity."
                  action="Schedule interview"
                  onClick={() => navigate("/schedule-interview")}
                />
                <RoadmapCard
                  number="02"
                  icon={<Mic2 size={18} />}
                  title="Practice out loud"
                  text="Answer naturally and explain your thinking. Clear communication matters as much as the final answer."
                  action="View active sessions"
                  onClick={activeInterview ? () => handleInterviewAction(activeInterview) : undefined}
                />
                <RoadmapCard
                  number="03"
                  icon={<CheckCheck size={18} />}
                  title="Review and improve"
                  text="Use your score and feedback to choose one improvement target for the next round."
                  action="Review recent results"
                  onClick={completedInterviews[0] ? () => navigate(`/interview-result/${completedInterviews[0]._id}`) : undefined}
                />
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Metric({ icon, label, value, tone }) {
  return <div style={styles.metric}><div style={{ ...styles.metricIcon, ...styles[`tone${tone}`] }}>{icon}</div><div><span style={styles.metricLabel}>{label}</span><strong style={styles.metricValue}>{value}</strong></div></div>;
}

function EmptyState({ onCreate }) {
  return <div style={styles.empty}><div style={styles.emptyIcon}><CalendarDays size={22} /></div><h3 style={styles.emptyTitle}>No interviews yet</h3><p style={styles.emptyText}>Create your first practice session to start building a performance baseline.</p><button style={styles.primaryButton} onClick={onCreate}>Create interview <ArrowRight size={16} /></button></div>;
}

function RoadmapCard({ number, icon, title, text, action, onClick }) {
  return (
    <article style={styles.roadmapCard}>
      <div style={styles.roadmapCardTop}>
        <div style={styles.roadmapIcon}>{icon}</div>
        <span style={styles.roadmapNumber}>{number}</span>
      </div>
      <h3 style={styles.roadmapTitle}>{title}</h3>
      <p style={styles.roadmapText}>{text}</p>
      <button style={styles.roadmapAction} onClick={onClick} disabled={!onClick}>
        {action} <ArrowRight size={14} />
      </button>
    </article>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f5f6fa", color: "#0f1117", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  main: { maxWidth: 1240, margin: "0 auto", padding: "116px 28px 64px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, marginBottom: 30 },
  eyebrow: { margin: "0 0 9px", color: "#1f5e3b", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.2px" },
  title: { margin: 0, fontSize: "clamp(30px, 4vw, 44px)", letterSpacing: "-1.5px", lineHeight: 1.06, fontWeight: 800 },
  subtitle: { margin: "12px 0 0", color: "#697386", fontSize: 15, lineHeight: 1.6 },
  primaryButton: { display: "inline-flex", alignItems: "center", gap: 8, border: 0, borderRadius: 10, padding: "12px 16px", background: "#1f5e3b", color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  success: { padding: "12px 16px", marginBottom: 18, borderRadius: 10, background: "#e7f8f1", color: "#177955", fontSize: 14 },
  error: { padding: "12px 16px", marginBottom: 18, borderRadius: 10, background: "#fff0f0", color: "#b42318", fontSize: 14 },
  loading: { padding: "80px 0", color: "#697386", textAlign: "center" },
  metricGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 34 },
  metric: { display: "flex", alignItems: "center", gap: 13, padding: "18px", background: "#fff", border: "1px solid #e8eaf0", borderRadius: 14 },
  metricIcon: { width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 10 },
  tonegreen: { color: "#1f5e3b", background: "#e8f0eb" }, toneblue: { color: "#3f6b50", background: "#edf5ef" }, toneorange: { color: "#557a60", background: "#f0f6f1" },
  metricLabel: { display: "block", color: "#697386", fontSize: 12, marginBottom: 5 },
  metricValue: { display: "block", fontSize: 23, letterSpacing: "-0.6px" },
  contentGrid: { display: "grid", gridTemplateColumns: "minmax(0, 1.65fr) minmax(300px, .9fr)", gap: 24 },
  primaryColumn: { minWidth: 0 }, sidebarColumn: { display: "flex", flexDirection: "column", gap: 16 },
  sectionHeader: { display: "flex", alignItems: "end", justifyContent: "space-between", marginBottom: 13 },
  sectionKicker: { margin: 0, color: "#8a93a3", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" },
  sectionTitle: { margin: "5px 0 0", fontSize: 22, letterSpacing: "-0.6px" },
  sectionCount: { color: "#8a93a3", fontSize: 12 },
  interviewList: { display: "flex", flexDirection: "column", gap: 8 },
  interviewRow: { display: "flex", alignItems: "center", gap: 13, minHeight: 74, padding: "12px 14px", background: "#fff", border: "1px solid #e8eaf0", borderRadius: 12 },
  roleIcon: { display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 10, background: "#e8f0eb", color: "#1f5e3b", flexShrink: 0 },
  interviewInfo: { minWidth: 0, flex: 1 }, rowTitle: { fontWeight: 750, fontSize: 14 }, rowMeta: { marginTop: 5, color: "#8a93a3", fontSize: 12 },
  rowScore: { color: "#4b5565", fontSize: 13, fontWeight: 750, minWidth: 86, textAlign: "right" },
  iconAction: { display: "inline-flex", alignItems: "center", gap: 7, border: 0, background: "transparent", color: "#1f5e3b", fontWeight: 750, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" },
  activePanel: { padding: 22, color: "#174a2e", background: "#e8f0eb", border: "1px solid #b9d1c0", borderRadius: 16 }, panelIcon: { display: "grid", placeItems: "center", width: 36, height: 36, color: "#1f5e3b", background: "#fff", borderRadius: 10 }, panelKicker: { margin: "18px 0 6px", color: "#557a60", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }, panelTitle: { margin: 0, fontSize: 20 }, panelText: { margin: "8px 0 18px", color: "#3f6b50", fontSize: 13, lineHeight: 1.55 }, panelButton: { display: "inline-flex", alignItems: "center", gap: 8, border: 0, borderRadius: 9, padding: "10px 12px", background: "#1f5e3b", color: "#fff", fontWeight: 700, cursor: "pointer" },
  sideSection: { padding: 19, background: "#fff", border: "1px solid #e8eaf0", borderRadius: 14 }, sectionHeaderSmall: { display: "flex", alignItems: "center", gap: 8, marginBottom: 15 }, sideTitle: { margin: 0, fontSize: 15 }, muted: { margin: 0, color: "#8a93a3", fontSize: 13, lineHeight: 1.55 },
  areaRow: { marginBottom: 14 }, areaLabel: { display: "block", fontSize: 13 }, areaMeta: { display: "block", marginTop: 3, color: "#8a93a3", fontSize: 11 },
  areaTrack: { height: 6, marginTop: 8, background: "#edf0f4", borderRadius: 20, overflow: "hidden" }, areaFill: { height: "100%", background: "#e58a3a", borderRadius: 20 },
  recommendation: { display: "flex", gap: 9, marginBottom: 14 }, recommendationDot: { width: 7, height: 7, marginTop: 5, borderRadius: "50%", background: "#1f5e3b", flexShrink: 0 }, recommendationTitle: { display: "block", fontSize: 13 }, recommendationText: { margin: "4px 0 0", color: "#697386", fontSize: 12, lineHeight: 1.45 },
  empty: { padding: "56px 24px", textAlign: "center", background: "#fff", border: "1px solid #e8eaf0", borderRadius: 14 }, emptyIcon: { display: "grid", placeItems: "center", width: 46, height: 46, margin: "0 auto 14px", color: "#1f5e3b", background: "#e8f0eb", borderRadius: 12 }, emptyTitle: { margin: 0, fontSize: 18 }, emptyText: { maxWidth: 360, margin: "8px auto 18px", color: "#697386", fontSize: 14, lineHeight: 1.5 },
  roadmap: { marginTop: 28, padding: 24, background: "#fff", border: "1px solid #e8eaf0", borderRadius: 16 },
  roadmapHeader: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 20 },
  roadmapSubtitle: { margin: "8px 0 0", color: "#697386", fontSize: 13, lineHeight: 1.5 },
  roadmapBadge: { display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 11px", borderRadius: 999, color: "#1f5e3b", background: "#e8f0eb", fontSize: 11, fontWeight: 750, whiteSpace: "nowrap" },
  roadmapGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 },
  roadmapCard: { padding: 17, background: "#f8faf8", border: "1px solid #e2ebe4", borderRadius: 13 },
  roadmapCardTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  roadmapIcon: { display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10, color: "#1f5e3b", background: "#dcebe1" },
  roadmapNumber: { color: "#91a699", fontSize: 12, fontWeight: 800, letterSpacing: "1px" },
  roadmapTitle: { margin: 0, fontSize: 15, letterSpacing: "-.2px" },
  roadmapText: { minHeight: 58, margin: "8px 0 15px", color: "#697386", fontSize: 12, lineHeight: 1.55 },
  roadmapAction: { display: "inline-flex", alignItems: "center", gap: 6, padding: 0, border: 0, background: "transparent", color: "#1f5e3b", fontSize: 12, fontWeight: 800, cursor: "pointer" }
};

export default Interviews;
