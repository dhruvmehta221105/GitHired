import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  CircleHelp,
  Mic,
  MicOff,
  Pause,
  Send,
  ShieldCheck,
  Square,
  Video,
  VideoOff
} from "lucide-react";
import API from "../api";
import { stopAllMediaTracks } from "../utils/interviewUtils";
import { useLiveTranscription } from "../hooks/useLiveTranscription";
import LiveTranscript from "../components/interview/LiveTranscript";

/* ─── CSS injected once ─────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes recPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.85); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .ix-spin   { animation: spin 1s linear infinite; }
  .ix-pulse  { animation: recPulse 1.6s ease-in-out infinite; }
  .ix-fade   { animation: fadeIn 0.3s ease both; }

  .ix-ctrl-btn:hover  { border-color: #1f5e3b !important; transform: translateY(-1px); }
  .ix-submit-btn:hover:not(:disabled) { filter: brightness(1.05); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(31,94,59,0.24) !important; }
  .ix-end-btn:hover:not(:disabled)    { background: #f0f7f2 !important; }
  .ix-shortcut-row:hover kbd { background: #e8f0eb !important; color: #174a2e !important; }
  @media (max-width: 900px) {
    .interview-room-main { overflow-y: auto !important; flex-direction: column !important; }
    .interview-room-left { min-height: 620px !important; }
    .interview-room-side { width: 100% !important; overflow: visible !important; display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .interview-room-transcript { grid-column: 1 / -1; }
  }
  @media (max-width: 620px) {
    .interview-room-main { padding: 14px !important; }
    .interview-room-side { display: flex !important; }
    .interview-room-topbar { padding: 0 14px !important; }
    .interview-room-topbar .ix-status-chip { display: none; }
    .interview-room-bottom { height: auto !important; padding: 12px 14px !important; flex-wrap: wrap; }
    .interview-room-bottom-center { order: -1; flex-basis: 100%; }
  }
`;

function InterviewRoom() {
  /* ── State (unchanged) ── */
  const { id: interviewId } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [interview,        setInterview]        = useState(null);
  const [role]                                  = useState(location.state?.role || "");
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState("");
  const [videoStream,      setVideoStream]      = useState(null);
  const [isCameraOn,       setIsCameraOn]       = useState(true);
  const [hasVideo,         setHasVideo]         = useState(false);
  const [isMicOn,          setIsMicOn]          = useState(true);
  const videoRef           = useRef(null);
  const [currentQuestion,  setCurrentQuestion]  = useState(null);
  const [isRecording,      setIsRecording]      = useState(false);
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [timeElapsed,      setTimeElapsed]      = useState(0);
  const [answerText,       setAnswerText]       = useState("");
  const timerIntervalRef   = useRef(null);
  const initializeRef      = useRef(false);
  const liveQuestionRef    = useRef(null);
  const liveTranscription = useLiveTranscription({
    interviewId,
    mediaStream: videoStream
  });
  const { start: startLiveTranscription } = liveTranscription;

  useEffect(() => {
    setIsRecording(liveTranscription.status === "recording");
  }, [liveTranscription.status]);

  /* ── Cleanup on unmount (master cleanup) ── */
  useEffect(() => {
    return () => {
      console.log("[Cleanup] Component unmounting, cleaning up all resources...");
      
      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        console.log("[Cleanup] ✅ Timer stopped");
      }
      
      // Stop all media tracks
      if (videoStream) {
        console.log("[Cleanup] Stopping media tracks...");
        stopAllMediaTracks(videoStream);
        console.log("[Cleanup] ✅ Media tracks stopped");
      }
      
      // Clear video display
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.srcObject = null;
          console.log("[Cleanup] ✅ Video element cleared");
        } catch (e) {
          console.warn("[Cleanup] Error clearing video:", e);
        }
      }
      
      console.log("[Cleanup] ✅ All cleanup complete");
    };
  }, []);

  /* ── Init ── */
  useEffect(() => {
    // Only initialize once per component mount
    if (initializeRef.current) return;
    initializeRef.current = true;

    const init = async () => {
      let acquiredStream = null;
      try {
        setLoading(true);
        setError("");
        
        // Fetch interview data
        const interviewRes = await API.get(`/interviews/${interviewId}`);
        let activeInterview = interviewRes.data;

        if (activeInterview.status === "completed") {
          navigate(`/interview-result/${interviewId}`, {
            replace: true,
            state: { interview: activeInterview }
          });
          return;
        }

        if (activeInterview.status === "paused") {
          const resumeResponse = await API.post(`/interviews/${interviewId}/resume`);
          activeInterview = resumeResponse.data;
        } else if (activeInterview.status === "scheduled") {
          await API.post(`/interviews/${interviewId}/ready`);
          const startResponse = await API.post(`/interviews/${interviewId}/start`);
          activeInterview = startResponse.data;
        } else if (activeInterview.status === "ready") {
          const startResponse = await API.post(`/interviews/${interviewId}/start`);
          activeInterview = startResponse.data;
        }

        if (activeInterview.status !== "in-progress") {
          throw new Error(
            `This interview is currently ${activeInterview.status}. Return to the interview dashboard and try again.`
          );
        }

        setInterview(activeInterview);

        // ✅ REQUEST USER MEDIA (Audio + Video)
        console.log("[Init] Requesting camera and microphone access...");
        
        // Check browser support first
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Your browser doesn't support camera access. Please use Chrome, Firefox, Safari, or Edge.");
        }
        
        // Check HTTPS/localhost requirement
        const protocol = window.location.protocol;
        if (protocol !== "https:" && !window.location.hostname.includes("localhost")) {
          throw new Error("Camera access requires HTTPS or localhost. This is a browser security requirement.");
        }
        
        try {
          acquiredStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user"
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
          });
        } catch (err) {
          console.error(`[Init] getUserMedia error - ${err.name}:`, err.message);

          if (err.name === "NotAllowedError") {
            throw new Error("❌ Camera/Microphone permission denied. Please click the lock icon in your address bar and allow camera & microphone access.");
          } else if (err.name === "NotFoundError") {
            throw new Error("❌ No camera or microphone detected. Please check if your devices are connected and not in use by another application.");
          } else if (err.name === "NotReadableError") {
            throw new Error("❌ Camera/Microphone is in use by another app. Please close other apps using the camera (Zoom, Teams, etc.).");
          } else if (err.name === "SecurityError") {
            throw new Error("❌ Security error: Camera access only works on HTTPS or localhost.");
          } else {
            throw new Error(`Camera error: ${err.name} - ${err.message}`);
          }
        }

        console.log("[Init] Stream obtained. Checking tracks...");
        console.log(`  - Video tracks: ${acquiredStream.getVideoTracks().length}`);
        console.log(`  - Audio tracks: ${acquiredStream.getAudioTracks().length}`);

        // Validate streams - audio is required, video is optional
        if (acquiredStream.getAudioTracks().length === 0) {
          throw new Error("No microphone detected. Please connect a microphone and refresh.");
        }

        // If video track is missing, continue with audio-only (camera optional)
        const videoAvailable = acquiredStream.getVideoTracks().length > 0;
        setHasVideo(videoAvailable);
        if (!videoAvailable) {
          console.warn("[Init] No video track available - continuing audio-only");
        }

        console.log("[Init] Setting video stream to ref...");
        setVideoStream(acquiredStream);

        // ✅ FETCH FIRST QUESTION
        const questionRes = await API.get(`/interviews/${interviewId}/question`);
        console.log("[Init] Question fetched:", questionRes.data);
        setCurrentQuestion(questionRes.data);

        // ✅ START TIMER
        let seconds = Math.max(
          0,
          Math.floor((Date.now() - new Date(activeInterview.startTime).getTime()) / 1000)
        );
        setTimeElapsed(seconds);
        timerIntervalRef.current = setInterval(() => {
          seconds += 1;
          setTimeElapsed(seconds);
          console.log(`[Timer] Elapsed: ${seconds}s`);
        }, 1000);

        setError(""); // Clear any initial errors
        setLoading(false);
        console.log("[Init] ✅ Interview room initialized successfully");

      } catch (err) {
        console.error("[Init] ❌ Initialization error:", err);
        if (acquiredStream) stopAllMediaTracks(acquiredStream);
        initializeRef.current = false; // Allow retry
        
        if (err.name === "NotAllowedError") {
          setError("Camera/Microphone permission denied. Please allow access and refresh.");
        } else if (err.name === "NotFoundError") {
          setError("No camera or microphone found. Please connect devices and refresh.");
        } else {
          setError(err.message || "Failed to initialize interview room");
        }
        
        setLoading(false);
      }
    };

    init();
    
    return () => {
      console.log("[Cleanup] Cleaning up resources...");
      
      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      // Stop media tracks
      if (videoStream) {
        console.log("[Cleanup] Stopping media tracks...");
        stopAllMediaTracks(videoStream);
      }
      
      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      console.log("[Cleanup] ✅ Cleanup complete");
    };
  }, [interviewId, navigate]);

  /* ── Attach stream to video element when both are ready ── */
  useEffect(() => {
    if (videoStream && videoRef.current) {
      try {
        console.log("[StreamAttach] Video element found, attaching stream...");
        videoRef.current.srcObject = videoStream;
        
        // Wait a tick to ensure stream is attached, then play
        setTimeout(async () => {
          try {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              await playPromise;
              console.log("[StreamAttach] ✅ Video playing successfully");
            } else {
              console.log("[StreamAttach] ✅ Play called (old browser)");
            }
          } catch (err) {
            console.warn("[StreamAttach] Auto-play blocked or failed:", err.message);
            // Try a user gesture approach - this is normal on some browsers
            videoRef.current.muted = true;
            try {
              await videoRef.current.play();
              console.log("[StreamAttach] ✅ Video playing with muted fallback");
            } catch (err2) {
              console.error("[StreamAttach] ❌ Failed to play video even with muted:", err2);
            }
          }
        }, 0);
        
        console.log("[StreamAttach] Stream attached to video element, play initiated");
      } catch (err) {
        console.error("[StreamAttach] ❌ Error attaching stream to video:", err);
        setError(`Failed to attach camera stream: ${err.message}`);
      }
    }
  }, [videoStream]);

  /* ── Start one live transcription session per question ── */
  useEffect(() => {
    if (loading || !videoStream || !currentQuestion || isSubmitting) return;
    if (liveQuestionRef.current === currentQuestion.questionId) return;

    liveQuestionRef.current = currentQuestion.questionId;
    startLiveTranscription()
      .then(() => setIsRecording(true))
      .catch((err) => {
        liveQuestionRef.current = null;
        setError(err.message || "Unable to start live transcription.");
      });
  }, [
    currentQuestion,
    isSubmitting,
    startLiveTranscription,
    loading,
    videoStream
  ]);

  /* ── Handle page unload/leave ── */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (videoStream) {
        // Stop camera immediately on page leave
        console.log("[BeforeUnload] Stopping camera as user is leaving page...");
        try {
          stopAllMediaTracks(videoStream);
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
          }
        } catch (err) {
          console.error("[BeforeUnload] Error stopping camera:", err);
        }
      }
      
      // Show warning if interview is active
      if (isRecording || (videoStream && !loading)) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [videoStream, isRecording, loading]);
  useEffect(() => {
    const handler = (e) => {
      if (e.code === "KeyM")  toggleMicrophone();
      if (e.code === "KeyV")  toggleCamera();
      if (e.code === "Enter") submitAnswer();
      if (e.code === "Escape") endInterview();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isRecording]);

  /* ── Media controls ── */
  const toggleCamera = () => {
    if (videoStream) {
      const videoTracks = videoStream.getVideoTracks();
      console.log(`[ToggleCamera] Found ${videoTracks.length} video track(s)`);
      
      videoTracks.forEach((track) => {
        const wasEnabled = track.enabled;
        track.enabled = !track.enabled;
        console.log(`[ToggleCamera] Track state changed: ${wasEnabled} → ${track.enabled}`);
      });
      
      setIsCameraOn((v) => !v);
      
      // Ensure video element is visible/hidden properly
      if (videoRef.current) {
        videoRef.current.style.opacity = videoStream.getVideoTracks()[0]?.enabled ? "1" : "0.3";
      }
    }
  };
  const toggleMicrophone = () => {
    if (videoStream) {
      videoStream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
      setIsMicOn((v) => !v);
    }
  };

  /* ── Submit the finalized live transcript ── */
  const submitAnswer = async () => {
    if (isSubmitting) return;

    try {
      if (!currentQuestion) {
        setError("Recording not initialized"); 
        return; 
      }
      
      setIsSubmitting(true);
      setError("");
      console.log("[Submit] Finalizing live transcription...");

      await liveTranscription.stop();

      const transcript = liveTranscription.transcript.trim() || answerText.trim();
      if (!transcript) {
        console.warn("[Submit] No transcript or typed answer was provided.");
        setError("Add an answer by speaking or typing before continuing.");
        setIsSubmitting(false);
        liveQuestionRef.current = null;
        if (liveTranscription.status === "idle" || liveTranscription.status === "error") {
          try {
            await liveTranscription.start();
          } catch (e) {
            console.error("[Submit] Failed to restart live transcription:", e);
          }
        }
        return; 
      }

      // Submit answer
      console.log("[Submit] Submitting answer to API...");
      await API.post(`/interviews/${interviewId}/answer`, {
        questionId: currentQuestion.questionId,
        transcript
      });

      // Fetch next question
      console.log("[Submit] Fetching next question from API...");
      let next;
      try {
        next = await API.get(`/interviews/${interviewId}/question`);
        console.log("[Submit] Next question response:", next.data);
      } catch (err) {
        console.error("[Submit] Failed to fetch next question:", err);
        throw new Error(`Failed to fetch next question: ${err.message}`);
      }

      if (!next.data) {
        throw new Error("No question data received from server");
      }

      if (next.data.isLastQuestion) {
        console.log("[Submit] Last question reached, ending interview");
        await endInterview();
      } else {
        console.log("[Submit] Setting next question and restarting transcription");
        setCurrentQuestion(next.data);
        liveQuestionRef.current = null;
        setIsRecording(false);
      }
      setAnswerText("");
      
      console.log("[Submit] ✅ Answer submitted successfully");
      
    } catch (err) {
      console.error("[Submit] Error:", err);
      setError(err.response?.data?.error || err.message || "Failed to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── End ── */
  const pauseInterview = async () => {
    if (isSubmitting) return;

    try {
      await liveTranscription.stop();
      liveQuestionRef.current = null;
      await API.post(`/interviews/${interviewId}/pause`);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (videoStream) stopAllMediaTracks(videoStream);
      setVideoStream(null);
      setIsRecording(false);
      navigate("/interviews");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to pause interview");
    }
  };

  const endInterview = async () => {
    try {
      console.log("[EndInterview] Starting interview end sequence...");
      await liveTranscription.stop();
      liveQuestionRef.current = null;
      
      // 1️⃣ Stop timer first
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        console.log("[EndInterview] ✅ Timer stopped");
      }
      
      // 2️⃣ Stop all media tracks (camera + microphone)
      if (videoStream) {
        console.log("[EndInterview] Stopping all media tracks (camera/mic)...");
        try {
          const videoTracks = videoStream.getVideoTracks();
          const audioTracks = videoStream.getAudioTracks();
          
          videoTracks.forEach(track => {
            console.log("[EndInterview] Stopping video track:", track.label);
            track.stop();
            track.enabled = false;
          });
          
          audioTracks.forEach(track => {
            console.log("[EndInterview] Stopping audio track:", track.label);
            track.stop();
            track.enabled = false;
          });
          
          console.log(`[EndInterview] ✅ Stopped ${videoTracks.length} video track(s) and ${audioTracks.length} audio track(s)`);
        } catch (e) {
          console.error("[EndInterview] Error stopping tracks:", e);
        }
      }
      
      // 3️⃣ Clear video element and disconnect stream
      if (videoRef.current) {
        console.log("[EndInterview] Clearing video element...");
        try {
          videoRef.current.pause();
          videoRef.current.srcObject = null;
          console.log("[EndInterview] ✅ Video element cleared");
        } catch (e) {
          console.warn("[EndInterview] Error clearing video element:", e);
        }
      }
      
      // 4️⃣ Clean up state
      setVideoStream(null);
      setIsRecording(false);
      console.log("[EndInterview] ✅ State cleaned up");
      
      // 5️⃣ Submit end request and navigate
      console.log("[EndInterview] Sending end request to API...");
      const response = await API.post(`/interviews/${interviewId}/end`);
      console.log("[EndInterview] ✅ Interview ended successfully");
      
      navigate(`/interview-result/${interviewId}`, { state: { interview: response.data } });
    } catch (err) {
      console.error("[EndInterview] ❌ Error ending interview:", err);
      setError("Failed to end interview: " + (err.message || "Unknown error"));
    }
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div style={c.root}>
        <style>{GLOBAL_CSS}</style>
        <div style={c.loadWrap}>
          <div style={c.loadInner}>
            <div style={c.spinRing} className="ix-spin" />
            <div style={c.loadLogo}>IX</div>
            <p style={c.loadTitle}>Setting up your interview room</p>
            <p style={c.loadSub}>Initializing camera, microphone and questions…</p>
            <div style={c.loadDots}>
              {["Connecting media","Loading questions","Preparing live transcription"].map((s, i) => (
                <div key={i} style={{ ...c.loadStep, animationDelay: `${i * 0.15}s` }} className="ix-fade">
                  <span style={c.loadStepDot} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const timerWarning = timeElapsed > 1140; // > 19 min

  return (
    <div style={c.root}>
      <style>{GLOBAL_CSS}</style>

      {/* ══ TOP BAR ══ */}
      <header style={c.topBar} className="interview-room-topbar">
        {/* Brand + info */}
        <div style={c.topLeft}>
          <div style={c.brand}>
            <span style={c.brandText}>GH</span>
          </div>
          <div style={c.topInfo}>
            <span style={c.topName}>{interview?.candidateName || "Candidate"}</span>
            <span style={c.topRole}>{interview?.role || role || "Interview Session"}</span>
          </div>
        </div>

        {/* Timer */}
        <div style={{ ...c.timerPill, ...(timerWarning ? c.timerWarn : {}) }}>
          <span style={c.timerDot} className={isRecording ? "ix-pulse" : ""} />
          <span style={c.timerText}>{formatTime(timeElapsed)}</span>
        </div>

        {/* Status chip */}
        <div style={c.statusChip} className="ix-status-chip">
          <span style={c.statusDot} />
          Live interview
        </div>
      </header>

      {/* ══ MAIN LAYOUT ══ */}
      <main style={c.main} className="interview-room-main">

        {/* ── LEFT PANEL ── */}
        <section style={c.leftPanel} className="interview-room-left">

          {/* Video (only when camera track exists) */}
          {hasVideo && (
            <div style={c.videoWrap}>
              <video
                ref={videoRef}
                autoPlay={true}
                playsInline={true}
                muted={true}
                style={c.video}
                onLoadedMetadata={() => console.log("[Video] ✅ Metadata loaded - camera stream active")}
                onCanPlay={() => console.log("[Video] ✅ Ready to play - camera is ON")}
                onPlay={() => console.log("[Video] ✅ Video playing - camera feed visible")}
                onError={(e) => {
                  console.error("[Video] ❌ Error:", e);
                  const errorCode = e.target.error?.code;
                  const errorMsg = {
                    1: "MEDIA_ERR_ABORTED",
                    2: "MEDIA_ERR_NETWORK",
                    3: "MEDIA_ERR_DECODE",
                    4: "MEDIA_ERR_SRC_NOT_SUPPORTED"
                  }[errorCode] || "Unknown error";
                  console.error(`[Video] Error code: ${errorCode} (${errorMsg})`);
                }}
                onStalled={() => console.warn("[Video] ⚠️ Video stalled - buffering...")}
                onSuspend={() => console.warn("[Video] ⚠️ Media loading suspended")}
              />

              {/* overlay badges */}
              <div style={c.videoTopLeft}>
                {isRecording && (
                  <div style={c.recBadge}>
                    <span style={c.recDot} className="ix-pulse" />
                    Recording
                  </div>
                )}
              </div>
              <div style={c.videoTopRight}>
                {!isCameraOn && <div style={c.camOffBadge}>Camera Off</div>}
              </div>

              {/* camera-off overlay */}
              {!isCameraOn && (
                <div style={c.camOffOverlay}>
                  <VideoOff size={34} strokeWidth={1.7} style={c.camOffIcon} />
                  <p style={c.camOffText}>Your camera is off</p>
                </div>
              )}

              {/* mic-off indicator */}
              {!isMicOn && (
                <div style={c.micOffStrip}>
                  <MicOff size={14} /> Microphone muted — your answer is not being recorded
                </div>
              )}
            </div>
          )}

          {/* Question card */}
          {currentQuestion && (
            <div style={c.questionCard} className="ix-fade">
              <div style={c.questionMeta}>
                <span style={c.questionTag}>
                  Question {currentQuestion.questionId + 1}
                </span>
                <span style={c.questionType}>
                  {currentQuestion.type || "General"}
                </span>
              </div>
              <p style={c.questionText}>{currentQuestion.questionText}</p>
              <div style={c.questionFooter}>
                <div style={isRecording ? c.recStatus : c.recStatusPaused}>
                  <span style={{ ...c.recStatusDot, background: isRecording ? "#c84b42" : "#a0a0a0" }}
                    className={isRecording ? "ix-pulse" : ""} />
                  {isRecording ? "Recording your response" : "Recording paused"}
                </div>
                <span style={c.questionHint}>Speak clearly · Answer within 2–3 min</span>
              </div>
            </div>
          )}

          <div style={c.answerCard}>
            <label htmlFor="typed-answer" style={c.answerLabel}>
              Answer workspace
              <span style={c.answerOptional}>Use this if live transcription is unavailable</span>
            </label>
            <textarea
              id="typed-answer"
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              placeholder="Type your answer here, or speak while transcription is connected..."
              style={c.answerInput}
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={c.errorCard}>
              <AlertTriangle size={17} style={c.errorIcon} />
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* ── RIGHT PANEL ── */}
        <aside style={c.rightPanel} className="interview-room-side">

          <div className="interview-room-transcript">
            <LiveTranscript transcription={liveTranscription} />
          </div>

          {/* Candidate card */}
          <div style={c.sideCard}>
            <div style={c.sideCardHeader}>
              <div style={c.candidateAvatar}>
                {(interview?.candidateName || "C").charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={c.candidateName}>{interview?.candidateName || "—"}</div>
                <div style={c.candidateRole}>{interview?.role || "—"}</div>
              </div>
            </div>
            <div style={c.divider} />
            <div style={c.statGrid}>
              {[
                { label: "Session", value: `#${interviewId?.slice(-6) || "—"}` },
                { label: "Status",  value: "Live",   accent: "#1f5e3b" },
                { label: "Elapsed", value: formatTime(timeElapsed) },
                { label: "Q No.",   value: currentQuestion ? `${currentQuestion.questionId + 1}` : "—" },
              ].map(({ label, value, accent }) => (
                <div key={label} style={c.statItem}>
                  <span style={c.statLabel}>{label}</span>
                  <span style={{ ...c.statValue, ...(accent ? { color: accent } : {}) }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div style={c.sideCard}>
            <h3 style={c.sideTitle}><CircleHelp size={15} /> Interview guide</h3>
            <div style={c.instrList}>
              {[
                ["🎯", "Listen carefully to each question"],
                ["🎙️", "Speak clearly and at a steady pace"],
                ["⏱️", "Keep answers within 2–3 minutes"],
                ["✅", "Click Submit & Next when ready"],
                ["📋", "Total session is ~20 minutes"],
              ].map(([icon, text]) => (
                <div key={text} style={c.instrRow}>
                  <span style={c.instrIcon}>{icon}</span>
                  <span style={c.instrText}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shortcuts */}
          <div style={c.sideCard}>
            <h3 style={c.sideTitle}><ShieldCheck size={15} /> Session controls</h3>
            <div style={c.shortcutList}>
              {[
                ["M", "Mute / Unmute"],
                ["V", "Camera On / Off"],
                ["↵", "Submit Answer"],
                ["Esc", "End Interview"],
              ].map(([key, label]) => (
                <div key={key} style={c.shortcutRow} className="ix-shortcut-row">
                  <kbd style={c.kbd}>{key}</kbd>
                  <span style={c.shortcutLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </main>

      {/* ══ BOTTOM CONTROL BAR ══ */}
      <footer style={c.bottomBar} className="interview-room-bottom">

        {/* Left: Media toggles */}
        <div style={c.ctrlGroup}>
          <CtrlBtn
            active={isMicOn}
            onClick={toggleMicrophone}
            activeIcon={<Mic size={18} />}
            inactiveIcon={<MicOff size={18} />}
            activeLabel="Mic On"
            inactiveLabel="Muted"
            title={isMicOn ? "Mute (M)" : "Unmute (M)"}
          />
          {hasVideo && (
            <CtrlBtn
              active={isCameraOn}
              onClick={toggleCamera}
              activeIcon={<Video size={18} />}
              inactiveIcon={<VideoOff size={18} />}
              activeLabel="Cam On"
              inactiveLabel="Cam Off"
              title={isCameraOn ? "Turn off camera (V)" : "Turn on camera (V)"}
            />
          )}
        </div>

        {/* Center: Submit */}
        <div style={c.ctrlCenter} className="interview-room-bottom-center">
          <button
            className="ix-submit-btn"
            style={{
              ...c.submitBtn,
              opacity: isSubmitting || (!isRecording && !answerText.trim()) ? 0.55 : 1,
            }}
            onClick={submitAnswer}
            disabled={isSubmitting || (!isRecording && !answerText.trim())}
            title="Submit your response (Enter)"
          >
            {isSubmitting ? (
              <>
                <span style={c.submitSpinner} className="ix-spin" />
                Submitting…
              </>
            ) : (
              <><Send size={16} /> {isRecording ? "Finish answer" : "Submit answer"}</>
            )}
          </button>
        </div>

        {/* Right: End */}
        <div style={c.ctrlRight}>
          <button
            className="ix-end-btn"
            style={{ ...c.endBtn, opacity: isSubmitting ? 0.5 : 1, marginRight: 8 }}
            onClick={pauseInterview}
            disabled={isSubmitting}
            title="Pause interview"
          >
            <Pause size={15} /> Pause
          </button>
          <button
            className="ix-end-btn"
            style={{ ...c.endBtn, opacity: isSubmitting ? 0.5 : 1 }}
            onClick={endInterview}
            disabled={isSubmitting}
            title="End interview (Esc)"
          >
            <Square size={14} /> End interview
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ─── Small reusable control button ──────────────────────── */
function CtrlBtn({ active, onClick, activeIcon, inactiveIcon, activeLabel, inactiveLabel, title }) {
  return (
    <button
      className="ix-ctrl-btn"
      onClick={onClick}
      title={title}
      style={{
        ...c.ctrlBtn,
        background: active ? "#e8f0eb" : "#fff5f4",
        border:     `1.5px solid ${active ? "#b9d1c0" : "#efb4ae"}`,
        color:      active ? "#1f5e3b" : "#a12f26",
      }}
    >
      <span style={{ display: "flex" }}>{active ? activeIcon : inactiveIcon}</span>
      <span style={c.ctrlLabel}>{active ? activeLabel : inactiveLabel}</span>
    </button>
  );
}

/* ─── STYLES ──────────────────────────────────────────────── */
const c = {
  root: {
    height: "100vh",
    background: "#f8f8f6",
    color: "#111111",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'DM Sans', sans-serif",
    overflow: "hidden",
    position: "relative",
  },

  /* loading */
  loadWrap: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    background: "#f8f8f6",
  },
  loadInner: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
    textAlign: "center",
  },
  spinRing: {
    width: 56, height: 56,
    border: "3px solid #dfe9e2",
    borderTop: "3px solid #1f5e3b",
    borderRadius: "50%",
    marginBottom: 8,
  },
  loadLogo: {
    position: "absolute",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800, fontSize: 14, color: "#1f5e3b",
    marginTop: -2,
  },
  loadTitle: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: "#111111" },
  loadSub:   { fontSize: 13, color: "#5e5e5e", marginTop: -4 },
  loadDots:  { display: "flex", flexDirection: "column", gap: 8, marginTop: 12, alignItems: "flex-start" },
  loadStep:  { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#5e5e5e" },
  loadStepDot: { width: 6, height: 6, borderRadius: "50%", background: "#1f5e3b", display: "inline-block" },

  /* top bar */
  topBar: {
    height: 64,
    padding: "0 24px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    borderBottom: "1px solid #e5e5e5",
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(12px)",
    flexShrink: 0,
    gap: 16,
  },
  topLeft:   { display: "flex", alignItems: "center", gap: 14 },
  brand: {
    width: 36, height: 36, borderRadius: 10,
    background: "#1f5e3b",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  brandText: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13, color: "#fff" },
  topInfo:   { display: "flex", flexDirection: "column", gap: 1 },
  topName:   { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#111111", lineHeight: 1.2 },
  topRole:   { fontSize: 11, color: "#5e5e5e", letterSpacing: "0.3px" },
  timerPill: {
    background: "#f2f1ec",
    border: "1px solid #e5e5e5",
    borderRadius: 100,
    padding: "6px 16px",
    display: "flex", alignItems: "center", gap: 8,
    transition: "border-color 0.3s, background 0.3s",
  },
  timerWarn: { borderColor: "#dc2626", background: "rgba(220,38,38,0.08)" },
  timerDot:  { width: 8, height: 8, borderRadius: "50%", background: "#1f5e3b", display: "inline-block" },
  timerText: { fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 500, color: "#111111", letterSpacing: "1px" },
  statusChip: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#e8f0eb",
    border: "1px solid #b9d1c0",
    borderRadius: 100,
    padding: "5px 14px",
    fontSize: 12, fontWeight: 600, color: "#1f5e3b",
    letterSpacing: "0.2px",
  },
  statusDot: { width: 7, height: 7, borderRadius: "50%", background: "#3f9b62", display: "inline-block" },

  /* main */
  main: {
    flex: 1,
    display: "flex",
    gap: 20,
    padding: "22px 28px",
    overflow: "hidden",
    minHeight: 0,
  },

  /* left panel */
  leftPanel: {
    flex: "1 1 0",
    display: "flex", flexDirection: "column", gap: 12,
    minWidth: 0,
  },
  videoWrap: {
    flex: 1,
    background: "#17211a",
    borderRadius: 18,
    border: "1px solid #d9e3dc",
    overflow: "hidden",
    position: "relative",
    minHeight: 0,
  },
  video: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  videoTopLeft: { position: "absolute", top: 14, left: 14 },
  videoTopRight: { position: "absolute", top: 14, right: 14 },
  recBadge: {
    background: "rgba(10,14,22,0.82)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(248,113,113,0.3)",
    borderRadius: 100, padding: "5px 12px",
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 11, fontWeight: 700, color: "#f5c1bd", letterSpacing: "1.5px",
  },
  recDot: { width: 7, height: 7, borderRadius: "50%", background: "#e56b61", display: "inline-block" },
  camOffBadge: {
    background: "rgba(10,14,22,0.82)", backdropFilter: "blur(6px)",
    border: "1px solid rgba(248,113,113,0.25)",
    borderRadius: 100, padding: "5px 12px",
    fontSize: 11, fontWeight: 600, color: "#f5c1bd",
  },
  camOffOverlay: {
    position: "absolute", inset: 0,
    background: "rgba(8,12,20,0.88)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
  },
  camOffIcon: { fontSize: 40, opacity: 0.5 },
  camOffText: { fontSize: 13, color: "#d1ddd4" },
  micOffStrip: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    background: "rgba(185,28,28,0.9)", backdropFilter: "blur(4px)",
    padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#fff",
    textAlign: "center",
  },

  /* question card */
  questionCard: {
    background: "#ffffff",
    border: "1px solid #dfe9e2",
    borderLeft: "4px solid #1f5e3b",
    borderRadius: 14,
    padding: "20px 22px",
    flexShrink: 0,
  },
  questionMeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  questionTag: {
    background: "#e8f0eb",
    border: "1px solid #b9d1c0",
    color: "#1f5e3b",
    borderRadius: 100, padding: "3px 10px",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.5px",
  },
  questionType: { fontSize: 11, color: "#5e5e5e", fontWeight: 500 },
  questionText: {
    fontSize: 18, fontWeight: 700, color: "#111111",
    lineHeight: 1.5, marginBottom: 16,
  },
  questionFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  recStatus: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#1f5e3b" },
  recStatusPaused: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#8a8a8a" },
  recStatusDot: { width: 7, height: 7, borderRadius: "50%", display: "inline-block" },
  questionHint: { fontSize: 11, color: "#777777" },
  answerCard: {
    background: "#ffffff",
    border: "1px solid #e5e5e5",
    borderRadius: 14,
    padding: "16px 20px",
    flexShrink: 0,
  },
  answerLabel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
    color: "#111111",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 9,
  },
  answerOptional: {
    color: "#777777",
    fontSize: 11,
    fontWeight: 400,
    textAlign: "right",
  },
  answerInput: {
    width: "100%",
    resize: "vertical",
    minHeight: 92,
    background: "#fbfbfa",
    border: "1px solid #d8d8d4",
    borderRadius: 10,
    color: "#111111",
    fontFamily: "inherit",
    fontSize: 13,
    lineHeight: 1.6,
    outline: "none",
    padding: "11px 12px",
  },

  /* error */
  errorCard: {
    background: "#fff5f4",
    border: "1px solid #efb4ae",
    borderRadius: 12, padding: "12px 16px",
    display: "flex", alignItems: "center", gap: 10,
    fontSize: 13, color: "#a12f26",
    flexShrink: 0,
  },
  errorIcon: { fontSize: 16 },

  /* right panel */
  rightPanel: {
    width: 330,
    flexShrink: 0,
    display: "flex", flexDirection: "column", gap: 12,
    overflowY: "auto",
  },
  sideCard: {
    background: "#ffffff",
    border: "1px solid #e5e5e5",
    borderRadius: 14,
    padding: "16px 18px",
    flexShrink: 0,
  },
  sideCardHeader: { display: "flex", alignItems: "center", gap: 12 },
  candidateAvatar: {
    width: 40, height: 40, borderRadius: 12,
    background: "#1f5e3b",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#fff",
    flexShrink: 0,
  },
  candidateName: { fontWeight: 700, fontSize: 13, color: "#111111" },
  candidateRole: { fontSize: 11, color: "#5e5e5e", marginTop: 2 },
  divider: { height: 1, background: "#e5e5e5", margin: "14px 0" },
  statGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  statItem: { display: "flex", flexDirection: "column", gap: 3 },
  statLabel: { fontSize: 10, color: "#777777", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px" },
  statValue: { fontSize: 13, fontWeight: 700, color: "#1f5e3b", fontFamily: "'DM Mono', monospace" },

  sideTitle: {
    fontFamily: "'Syne', sans-serif",
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 11, fontWeight: 700, color: "#1f5e3b",
    textTransform: "uppercase", letterSpacing: "0.8px",
    marginBottom: 12,
  },
  instrList: { display: "flex", flexDirection: "column", gap: 9 },
  instrRow:  { display: "flex", alignItems: "flex-start", gap: 10 },
  instrIcon: { fontSize: 14, flexShrink: 0, lineHeight: 1.5 },
  instrText: { fontSize: 12, color: "#5e5e5e", lineHeight: 1.5 },

  shortcutList: { display: "flex", flexDirection: "column", gap: 8 },
  shortcutRow:  { display: "flex", alignItems: "center", gap: 10 },
  kbd: {
    background: "#f2f1ec",
    border: "1px solid #d8d8d4",
    borderBottom: "2px solid #c9c9c4",
    borderRadius: 6,
    padding: "3px 8px",
    fontFamily: "'DM Mono', monospace",
    fontSize: 11, fontWeight: 500, color: "#5e5e5e",
    minWidth: 28, textAlign: "center",
    transition: "background 0.2s",
  },
  shortcutLabel: { fontSize: 12, color: "#5e5e5e" },

  /* bottom bar */
  bottomBar: {
    height: 76,
    padding: "0 24px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    borderTop: "1px solid #e5e5e5",
    background: "rgba(255,255,255,0.98)",
    backdropFilter: "blur(12px)",
    flexShrink: 0,
    gap: 16,
  },
  ctrlGroup: { display: "flex", gap: 10 },
  ctrlBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    padding: "8px 14px",
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.18s",
    flexShrink: 0,
  },
  ctrlLabel: { fontSize: 10, fontWeight: 600, letterSpacing: "0.3px" },
  ctrlCenter: { flex: 1, display: "flex", justifyContent: "center" },
  submitBtn: {
    background: "#1f5e3b",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 32px",
    fontSize: 14, fontWeight: 700,
    cursor: "pointer",
    display: "flex", alignItems: "center", gap: 8,
    boxShadow: "0 4px 20px rgba(31,94,59,0.2)",
    transition: "all 0.2s",
    fontFamily: "inherit",
    letterSpacing: "0.2px",
  },
  submitSpinner: {
    width: 14, height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    display: "inline-block",
  },
  ctrlRight: { display: "flex", justifyContent: "flex-end" },
  endBtn: {
    background: "transparent",
    border: "1.5px solid #b9d1c0",
    color: "#1f5e3b",
    borderRadius: 12,
    padding: "11px 22px",
    fontSize: 13, fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
    letterSpacing: "0.2px",
  },
};

export default InterviewRoom;