import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Target,
  Trophy
} from "lucide-react";
import API from "../api";
import Navbar from "../components/common/Navbar";

const categories = [
  { key: "technical", label: "Technical skills", color: "#1f5e3b" },
  { key: "communication", label: "Communication", color: "#3f9b62" },
  { key: "problemSolving", label: "Problem solving", color: "#6b8f71" }
];

const categoryTopics = {
  technical: "Review core concepts and explain implementation choices out loud.",
  communication: "Practice STAR responses with a clear result in the first sentence.",
  problemSolving: "Use timed problems and narrate your assumptions and trade-offs."
};

const asNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);

const formatDate = (value) => {
  if (!value) return "Date not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const formatDuration = (seconds) => {
  if (!seconds) return "Not recorded";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

function InterviewResult() {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [interview, setInterview] = useState(location.state?.interview || null);
  const [feedback, setFeedback] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(0);
  const [loading, setLoading] = useState(!interview);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadResults = async () => {
      try {
        setLoading(true);
        const interviewRequest = API.get(`/interviews/${interviewId}`);
        const [interviewResponse, feedbackResponse] = await Promise.all([
          interviewRequest,
          API.get(`/feedback/${interviewId}`).catch(() => ({ data: [] }))
        ]);
        if (!active) return;
        setInterview(interviewResponse.data);
        setFeedback(feedbackResponse.data?.[0] || null);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || "Unable to load interview results.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadResults();
    return () => {
      active = false;
    };
  }, [interviewId]);

  const overallScore = useMemo(() => {
    const storedScore = asNumber(interview?.totalScore);
    if (storedScore !== null) return storedScore;
    const feedbackScore = asNumber(feedback?.rating);
    return feedbackScore === null ? null : Math.round(feedbackScore * 20);
  }, [feedback, interview]);

  const weakCategories = useMemo(
    () => categories.filter((category) => {
      const score = asNumber(feedback?.[category.key]);
      return score !== null && score < 3.5;
    }),
    [feedback]
  );

  const recommendedTopics = weakCategories.length
    ? weakCategories.map((category) => ({ label: category.label, text: categoryTopics[category.key] }))
    : [{ label: `${interview?.role || "Interview"} fundamentals`, text: "Keep practicing timed sessions to build consistency under pressure." }];

  const handleRetry = async () => {
    if (!interview) return;
    try {
      setRetrying(true);
      const now = new Date();
      await API.post("/interviews", {
        candidateName: interview.candidateName,
        email: interview.email,
        role: interview.role,
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5)
      });
      navigate("/interviews", { state: { message: "A new practice interview is ready when you are." } });
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to create a retry interview.");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) return <PageState text="Loading your interview review..." />;
  if (error && !interview) return <PageState text={error} action={() => navigate("/interviews")} />;
  if (!interview) return <PageState text="Interview results are unavailable." action={() => navigate("/interviews")} />;

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>
        <button style={styles.backButton} onClick={() => navigate("/interviews")}><ArrowLeft size={17} /> Back to dashboard</button>

        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Interview review</p>
            <h1 style={styles.title}>{interview.role}</h1>
            <p style={styles.subtitle}>{formatDate(interview.date)} · {formatDuration(interview.duration)} · {interview.questions?.length || 0} questions answered</p>
          </div>
          <button style={styles.retryButton} onClick={handleRetry} disabled={retrying}><RefreshCw size={17} /> {retrying ? "Creating retry..." : "Retry interview"}</button>
        </header>

        {error && <div style={styles.error}>{error}</div>}

        <section style={styles.heroGrid}>
          <div style={styles.scorePanel}>
            <div style={styles.scoreIcon}><Trophy size={20} /></div>
            <p style={styles.panelKicker}>Overall score</p>
            <div style={styles.scoreLine}>{overallScore === null ? "--" : overallScore}<span style={styles.scoreUnit}>/100</span></div>
            <p style={styles.panelText}>{overallScore === null ? "Your score will appear after evaluation." : "A complete view of this interview session."}</p>
            <div style={styles.scoreTrack}><div style={{ ...styles.scoreFill, width: `${Math.min(Math.max(overallScore || 0, 0), 100)}%` }} /></div>
          </div>
          <div style={styles.summaryPanel}>
            <div style={styles.summaryHeader}><div><p style={styles.panelKicker}>Session summary</p><h2 style={styles.summaryTitle}>{interview.candidateName}</h2></div><span style={styles.completedBadge}><CheckCircle2 size={15} /> {interview.status}</span></div>
            <div style={styles.summaryGrid}>
              <SummaryItem label="Interview date" value={formatDate(interview.date)} />
              <SummaryItem label="Duration" value={formatDuration(interview.duration)} />
              <SummaryItem label="Questions" value={interview.questions?.length || 0} />
              <SummaryItem label="Role" value={interview.role} />
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <SectionHeading icon={<Target size={18} />} title="Category scores" detail="Feedback is shown on the five-point scale used by your evaluator." />
          <div style={styles.categoryGrid}>
            {categories.map((category) => {
              const score = asNumber(feedback?.[category.key]);
              return <div key={category.key} style={styles.categoryCard}><div style={styles.categoryTop}><span>{category.label}</span><strong>{score === null ? "--" : `${score.toFixed(1)}/5`}</strong></div><div style={styles.categoryTrack}><div style={{ ...styles.categoryFill, width: `${score === null ? 0 : (score / 5) * 100}%`, background: category.color }} /></div></div>;
            })}
          </div>
        </section>

        <section style={styles.twoColumn}>
          <div style={styles.sectionBlock}><SectionHeading icon={<Sparkles size={18} />} title="Strengths" />{feedback?.strengths || interview.feedback ? <p style={styles.longText}>{feedback?.strengths || interview.feedback}</p> : <Pending text="Overall strengths will appear when evaluator feedback is available." />}</div>
          <div style={styles.sectionBlock}><SectionHeading icon={<AlertIcon />} title="Weaknesses" />{feedback?.improvements ? <p style={styles.longText}>{feedback.improvements}</p> : weakCategories.length ? <div>{weakCategories.map((category) => <p key={category.key} style={styles.topicLine}>{category.label} needs more practice.</p>)}</div> : <Pending text="Complete an evaluated session to identify your weakest areas." />}</div>
        </section>

        <section style={styles.section}>
          <SectionHeading icon={<MessageCircle size={18} />} title="Question-by-question review" detail="Review each prompt, transcript, and available evaluation." />
          <div style={styles.questionList}>
            {(interview.questions || []).map((question, index) => {
              const expanded = expandedQuestion === index;
              return <article key={`${question.questionId}-${index}`} style={styles.questionCard}>
                <button style={styles.questionHeader} onClick={() => setExpandedQuestion(expanded ? null : index)}>
                  <span style={styles.questionNumber}>Q{index + 1}</span><span style={styles.questionPrompt}>{question.questionText}</span>{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expanded && <div style={styles.questionBody}><div><span style={styles.fieldLabel}>Transcript</span><p style={styles.transcript}>{question.transcript || "Transcript unavailable for this answer."}</p></div><div style={styles.questionFeedback}><span style={styles.fieldLabel}>Feedback</span><p style={styles.transcript}>{question.feedback || "Question-level feedback is not available for this interview yet."}</p></div></div>}
              </article>;
            })}
          </div>
          {!interview.questions?.length && <Pending text="No recorded answers are available for this session." />}
        </section>

        <section style={styles.section}>
          <SectionHeading icon={<Brain size={18} />} title="Recommended topics" detail="Use these as the agenda for your next practice session." />
          <div style={styles.topicGrid}>{recommendedTopics.map((topic) => <div key={topic.label} style={styles.topicCard}><div style={styles.topicIcon}><Brain size={16} /></div><div><strong style={styles.topicTitle}>{topic.label}</strong><p style={styles.topicText}>{topic.text}</p></div></div>)}</div>
        </section>

        <div style={styles.footerActions}><button style={styles.secondaryButton} onClick={() => navigate("/interviews")}><ArrowLeft size={16} /> Dashboard</button><button style={styles.retryButton} onClick={handleRetry} disabled={retrying}><RefreshCw size={16} /> {retrying ? "Creating retry..." : "Practice this role again"}</button></div>
      </main>
    </div>
  );
}

function SummaryItem({ label, value }) { return <div><span style={styles.fieldLabel}>{label}</span><strong style={styles.summaryValue}>{value}</strong></div>; }
function SectionHeading({ icon, title, detail }) { return <div style={styles.sectionHeading}><div style={styles.headingIcon}>{icon}</div><div><h2 style={styles.sectionTitle}>{title}</h2>{detail && <p style={styles.sectionDetail}>{detail}</p>}</div></div>; }
function Pending({ text }) { return <p style={styles.pending}>{text}</p>; }
function AlertIcon() { return <span style={styles.alertIcon}>!</span>; }
function PageState({ text, action }) { return <div style={styles.statePage}><p>{text}</p>{action && <button style={styles.retryButton} onClick={action}><ArrowLeft size={16} /> Back to dashboard</button>}</div>; }

const styles = {
  page: { minHeight: "100vh", background: "#f5f6fa", color: "#0f1117", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  main: { maxWidth: 1080, margin: "0 auto", padding: "108px 28px 64px" },
  backButton: { display: "inline-flex", alignItems: "center", gap: 7, padding: 0, marginBottom: 24, border: 0, background: "transparent", color: "#1f5e3b", fontWeight: 750, cursor: "pointer" },
  header: { display: "flex", alignItems: "end", justifyContent: "space-between", gap: 20, marginBottom: 28 },
  eyebrow: { margin: "0 0 8px", color: "#1f5e3b", fontSize: 11, fontWeight: 800, letterSpacing: "1.2px", textTransform: "uppercase" },
  title: { margin: 0, fontSize: "clamp(30px, 4vw, 42px)", letterSpacing: "-1.4px" },
  subtitle: { margin: "10px 0 0", color: "#697386", fontSize: 14 },
  retryButton: { display: "inline-flex", alignItems: "center", gap: 8, border: 0, borderRadius: 10, padding: "11px 15px", background: "#1f5e3b", color: "#fff", fontWeight: 750, cursor: "pointer", whiteSpace: "nowrap" },
  secondaryButton: { display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #dfe2ea", borderRadius: 10, padding: "11px 15px", background: "#fff", color: "#4b5565", fontWeight: 750, cursor: "pointer" },
  error: { padding: "12px 16px", marginBottom: 18, borderRadius: 10, background: "#fff0f0", color: "#b42318", fontSize: 14 },
  heroGrid: { display: "grid", gridTemplateColumns: "minmax(230px, .8fr) minmax(0, 1.4fr)", gap: 16, marginBottom: 28 },
  scorePanel: { padding: 24, color: "#fff", background: "#1f5e3b", borderRadius: 16 },
  scoreIcon: { display: "grid", placeItems: "center", width: 38, height: 38, color: "#1f5e3b", background: "#e8f0eb", borderRadius: 10 },
  panelKicker: { margin: "16px 0 7px", color: "#8893a7", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" },
  scoreLine: { fontSize: 48, lineHeight: 1, fontWeight: 800, letterSpacing: "-2px" }, scoreUnit: { marginLeft: 6, color: "#8d97a9", fontSize: 16, letterSpacing: 0 },
  panelText: { margin: "12px 0 18px", color: "#d7e6db", fontSize: 13, lineHeight: 1.5 }, scoreTrack: { height: 7, background: "#174a2e", borderRadius: 20, overflow: "hidden" }, scoreFill: { height: "100%", background: "#b9d1c0", borderRadius: 20 },
  summaryPanel: { padding: 24, background: "#fff", border: "1px solid #e8eaf0", borderRadius: 16 }, summaryHeader: { display: "flex", justifyContent: "space-between", alignItems: "start", gap: 15 }, summaryTitle: { margin: 0, fontSize: 21 }, completedBadge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 9px", borderRadius: 20, color: "#16866a", background: "#e3f8f1", fontSize: 11, fontWeight: 800, textTransform: "capitalize" }, summaryGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 20, marginTop: 28 }, fieldLabel: { display: "block", marginBottom: 6, color: "#8a93a3", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".6px" }, summaryValue: { display: "block", fontSize: 14 },
  section: { padding: 22, marginBottom: 16, background: "#fff", border: "1px solid #e8eaf0", borderRadius: 16 }, sectionHeading: { display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 19 }, headingIcon: { display: "grid", placeItems: "center", width: 32, height: 32, color: "#1f5e3b", background: "#e8f0eb", borderRadius: 9, flexShrink: 0 }, sectionTitle: { margin: 0, fontSize: 18 }, sectionDetail: { margin: "5px 0 0", color: "#8a93a3", fontSize: 12 },
  categoryGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }, categoryCard: { padding: 15, background: "#fafbfc", border: "1px solid #edf0f4", borderRadius: 11 }, categoryTop: { display: "flex", justifyContent: "space-between", gap: 12, color: "#4b5565", fontSize: 13 }, categoryTopStrong: { fontWeight: 800 }, categoryTrack: { height: 7, marginTop: 13, background: "#e9edf2", borderRadius: 20, overflow: "hidden" }, categoryFill: { height: "100%", borderRadius: 20 },
  twoColumn: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, marginBottom: 16 }, sectionBlock: { minHeight: 170, padding: 22, background: "#fff", border: "1px solid #e8eaf0", borderRadius: 16 }, longText: { margin: 0, color: "#4b5565", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }, pending: { margin: 0, color: "#8a93a3", fontSize: 13, lineHeight: 1.6 }, topicLine: { margin: "0 0 8px", color: "#4b5565", fontSize: 14 }, alertIcon: { display: "grid", placeItems: "center", width: 18, height: 18, color: "#c76b1d", background: "#fff1df", borderRadius: "50%", fontSize: 12, fontWeight: 800 },
  questionList: { display: "flex", flexDirection: "column", gap: 8 }, questionCard: { border: "1px solid #e8eaf0", borderRadius: 11, overflow: "hidden" }, questionHeader: { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px", border: 0, background: "#fff", color: "#0f1117", textAlign: "left", cursor: "pointer" }, questionNumber: { color: "#1f5e3b", fontWeight: 800, fontSize: 12 }, questionPrompt: { flex: 1, fontSize: 13, fontWeight: 700, lineHeight: 1.45 }, questionBody: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18, padding: "0 16px 17px", background: "#fafbfc" }, transcript: { margin: 0, color: "#4b5565", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap" }, questionFeedback: { paddingLeft: 18, borderLeft: "1px solid #e3e7ed" },
  topicGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }, topicCard: { display: "flex", gap: 11, padding: 14, background: "#fafbfc", border: "1px solid #edf0f4", borderRadius: 11 }, topicIcon: { display: "grid", placeItems: "center", width: 30, height: 30, color: "#1f5e3b", background: "#e8f0eb", borderRadius: 8, flexShrink: 0 }, topicTitle: { fontSize: 13 }, topicText: { margin: "4px 0 0", color: "#697386", fontSize: 12, lineHeight: 1.5 },
  footerActions: { display: "flex", justifyContent: "space-between", gap: 12, paddingTop: 6 }, statePage: { minHeight: "100vh", display: "grid", placeItems: "center", gap: 14, color: "#697386", fontFamily: "'Plus Jakarta Sans', sans-serif" }
};

export default InterviewResult;
