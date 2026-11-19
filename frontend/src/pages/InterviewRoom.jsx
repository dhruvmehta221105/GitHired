import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mic,
  MicOff,
  Pause,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Wifi,
  XCircle
} from "lucide-react";
import API from "../api";
import { stopAllMediaTracks } from "../utils/interviewUtils";
import { useLiveTranscription } from "../hooks/useLiveTranscription";
import LiveTranscript from "../components/interview/LiveTranscript";

const ROOM_CSS = `
  @keyframes interview-spin { to { transform: rotate(360deg); } }
  @keyframes interview-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, .32); }
    50% { box-shadow: 0 0 0 7px rgba(220, 38, 38, 0); }
  }
  @keyframes interview-rise {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .interview-spin { animation: interview-spin 1s linear infinite; }
  .interview-pulse { animation: interview-pulse 1.6s ease-out infinite; }
  .interview-rise { animation: interview-rise .35s ease both; }
  .interview-scrollbar::-webkit-scrollbar { width: 7px; }
  .interview-scrollbar::-webkit-scrollbar-thumb { background: #d7ddd9; border-radius: 999px; }
  @media (max-width: 980px) {
    .interview-workspace { grid-template-columns: 1fr !important; }
    .interview-sidebar { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .interview-transcript-card { grid-column: 1 / -1; }
  }
  @media (max-width: 760px) {
    .interview-media-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 640px) {
    .interview-header { padding: 14px 16px !important; }
    .interview-header-meta { display: none !important; }
    .interview-header-actions { gap: 6px !important; }
    .interview-workspace { padding: 14px !important; }
    .interview-sidebar { display: flex !important; }
    .interview-controls { flex-direction: column !important; align-items: stretch !important; }
    .interview-control-group, .interview-control-end { justify-content: center !important; }
  }
`;

const getMediaError = (error) => {
  const messages = {
    NotAllowedError: "Camera or microphone permission was denied. Allow access in your browser settings, then try again.",
    NotFoundError: "No camera or microphone was found. Connect a device and try again.",
    NotReadableError: "Your camera or microphone is already being used by another app. Close it and try again.",
    SecurityError: "Camera and microphone access requires HTTPS or localhost.",
    OverconstrainedError: "The selected camera or microphone settings are not available."
  };
  return messages[error?.name] || error?.message || "Unable to access your camera and microphone.";
};

const formatTime = (seconds) => (
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
);

function MediaStatus({ icon: Icon, label, active, detail }) {
  const StatusIcon = Icon;
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${active ? "border-emerald-100 bg-emerald-50/70" : "border-red-100 bg-red-50/70"}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
        <StatusIcon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-800">{label}</p>
        <p className={`truncate text-[11px] ${active ? "text-emerald-700" : "text-red-600"}`}>{detail}</p>
      </div>
      {active ? <CheckCircle2 className="ml-auto shrink-0 text-emerald-600" size={16} /> : <XCircle className="ml-auto shrink-0 text-red-500" size={16} />}
    </div>
  );
}

function InterviewRoom() {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [interview, setInterview] = useState(null);
  const [role] = useState(location.state?.role || "");
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [error, setError] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [videoStream, setVideoStream] = useState(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const initializedRef = useRef(false);
  const liveQuestionRef = useRef(null);
  const liveTranscription = useLiveTranscription({ interviewId, mediaStream: videoStream });
  const { start: startTranscription, stop: stopTranscription } = liveTranscription;

  const isRecording = liveTranscription.status === "recording";
  const releaseMedia = useCallback(() => {
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) stopAllMediaTracks(stream);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setVideoStream(null);
    setHasVideo(false);
    setHasMicrophone(false);
    setIsCameraOn(false);
    setIsMicOn(false);
  }, []);

  const requestMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError("This browser does not support camera and microphone access.");
      return null;
    }

    setMediaLoading(true);
    setMediaError("");
    releaseMedia();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 360 },
          facingMode: "user"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      if (!videoTracks.length || !audioTracks.length) {
        stopAllMediaTracks(stream);
        throw new Error("A camera and microphone are both required to start the interview.");
      }

      streamRef.current = stream;
      setVideoStream(stream);
      setHasVideo(true);
      setHasMicrophone(true);
      setIsCameraOn(videoTracks.some((track) => track.enabled));
      setIsMicOn(audioTracks.some((track) => track.enabled));
      return stream;
    } catch (requestError) {
      setMediaError(getMediaError(requestError));
      return null;
    } finally {
      setMediaLoading(false);
    }
  }, [releaseMedia]);

  useEffect(() => {
    if (!videoStream || !videoRef.current) return undefined;
    const video = videoRef.current;
    video.srcObject = videoStream;
    video.muted = true;
    const playVideo = async () => {
      try {
        await video.play();
      } catch {
        setMediaError("Your camera is ready, but the preview could not start. Click the preview to try again.");
      }
    };
    playVideo();
    return () => {
      video.pause();
      video.srcObject = null;
    };
  }, [videoStream]);

  useEffect(() => {
    if (!videoStream || !currentQuestion || isSubmitting || liveQuestionRef.current === currentQuestion.questionId) return;
    liveQuestionRef.current = currentQuestion.questionId;
    startTranscription().catch((transcriptionError) => {
      liveQuestionRef.current = null;
      setError(transcriptionError.message || "Live transcription could not start. You can still type your answer.");
    });
  }, [currentQuestion, isSubmitting, startTranscription, videoStream]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    let active = true;

    const initialize = async () => {
      try {
        setLoading(true);
        setError("");
        const interviewResponse = await API.get(`/interviews/${interviewId}`);
        let activeInterview = interviewResponse.data;

        if (activeInterview.status === "completed") {
          navigate(`/interview-result/${interviewId}`, { replace: true, state: { interview: activeInterview } });
          return;
        }
        if (activeInterview.status === "paused") {
          activeInterview = (await API.post(`/interviews/${interviewId}/resume`)).data;
        } else if (activeInterview.status === "scheduled") {
          await API.post(`/interviews/${interviewId}/ready`);
          activeInterview = (await API.post(`/interviews/${interviewId}/start`)).data;
        } else if (activeInterview.status === "ready") {
          activeInterview = (await API.post(`/interviews/${interviewId}/start`)).data;
        }
        if (activeInterview.status !== "in-progress") {
          throw new Error(`This interview is currently ${activeInterview.status}. Return to the interview dashboard and try again.`);
        }

        const questionResponse = await API.get(`/interviews/${interviewId}/question`);
        const stream = await requestMedia();
        if (!stream) {
          setLoading(false);
          setInterview(activeInterview);
          setCurrentQuestion(questionResponse.data);
          return;
        }
        if (!active) {
          stopAllMediaTracks(stream);
          return;
        }
        setInterview(activeInterview);
        setCurrentQuestion(questionResponse.data);
        const startTime = new Date(activeInterview.startTime).getTime();
        setTimeElapsed(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
        timerRef.current = window.setInterval(() => {
          setTimeElapsed((value) => value + 1);
        }, 1000);
        setLoading(false);
      } catch (initializationError) {
        if (active) {
          setError(initializationError.response?.data?.error || initializationError.message || "Failed to initialize the interview.");
          setLoading(false);
        }
      }
    };
    initialize();

    return () => {
      active = false;
      if (timerRef.current) window.clearInterval(timerRef.current);
      initializedRef.current = false;
      releaseMedia();
    };
  }, [interviewId, navigate, releaseMedia, requestMedia]);

  const toggleCamera = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsCameraOn(track.enabled);
  };

  const toggleMicrophone = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMicOn(track.enabled);
  };

  const submitAnswer = async () => {
    if (isSubmitting || !currentQuestion) return;
    setIsSubmitting(true);
    setError("");
    try {
      await stopTranscription();
      const transcript = liveTranscription.transcript.trim() || answerText.trim();
      if (!transcript) {
        throw new Error("Speak an answer or type one in the answer box before continuing.");
      }
      await API.post(`/interviews/${interviewId}/answer`, {
        questionId: currentQuestion.questionId,
        transcript
      });
      const next = (await API.get(`/interviews/${interviewId}/question`)).data;
      if (next?.isLastQuestion) {
        await endInterview();
        return;
      }
      setCurrentQuestion(next);
      setAnswerText("");
      liveQuestionRef.current = null;
    } catch (submitError) {
      setError(submitError.response?.data?.error || submitError.message || "Failed to submit your answer.");
      liveQuestionRef.current = null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const pauseInterview = async () => {
    if (isSubmitting) return;
    try {
      await stopTranscription();
      await API.post(`/interviews/${interviewId}/pause`);
      if (timerRef.current) window.clearInterval(timerRef.current);
      releaseMedia();
      navigate("/interviews");
    } catch (pauseError) {
      setError(pauseError.response?.data?.error || "Failed to pause the interview.");
    }
  };

  const endInterview = async () => {
    try {
      await stopTranscription();
      if (timerRef.current) window.clearInterval(timerRef.current);
      releaseMedia();
      const response = await API.post(`/interviews/${interviewId}/end`);
      navigate(`/interview-result/${interviewId}`, { state: { interview: response.data } });
    } catch (endError) {
      setError(endError.response?.data?.error || "Failed to end the interview.");
    }
  };

  const retryMedia = async () => {
    const stream = await requestMedia();
    if (stream) setMediaError("");
  };

  useEffect(() => () => {
    stopTranscription();
  }, [stopTranscription]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-6">
        <style>{ROOM_CSS}</style>
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f0eb] text-[#1f5e3b]">
            <LoaderCircle className="interview-spin" size={28} />
          </div>
          <h1 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">Preparing your interview room</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Connecting your session and checking your camera, microphone, and live transcription.</p>
          <div className="mt-6 space-y-2 text-left text-xs text-slate-500">
            {["Loading interview session", "Requesting device access", "Preparing your first question"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1f5e3b]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-slate-900">
      <style>{ROOM_CSS}</style>
      <header className="interview-header sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-7 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => navigate("/interviews")} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Back to interviews">
              <ArrowLeft size={19} />
            </button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1f5e3b] text-sm font-black text-white shadow-lg shadow-[#1f5e3b]/20">GH</div>
            <div className="interview-header-meta min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-900">{interview?.role || role || "Practice interview"}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{interview?.candidateName || "Interview candidate"} · Private practice session</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold sm:flex ${isRecording ? "border-red-100 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              <span className={`h-2 w-2 rounded-full ${isRecording ? "interview-pulse bg-red-500" : "bg-slate-400"}`} />
              {isRecording ? "Recording" : "Ready"}
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-bold text-white">
              <Clock3 size={15} className="text-emerald-300" />
              {formatTime(timeElapsed)}
            </div>
          </div>
        </div>
      </header>

      <main className="interview-workspace mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1.55fr)_minmax(330px,.8fr)] gap-5 p-7">
        <section className="min-w-0 space-y-5">
          <div className="interview-media-grid grid grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)] items-start gap-5">
            <div className="interview-rise rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#1f5e3b]">
                  <Sparkles size={14} /> Question {Number(currentQuestion?.questionId || 0) + 1}
                </div>
                <h1 className="mt-3 max-w-3xl text-xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl">{currentQuestion?.questionText || "Your next question is loading..."}</h1>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{currentQuestion?.type || "General"}</span>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs">
              <span className={`flex items-center gap-2 font-bold ${isRecording ? "text-red-600" : "text-slate-500"}`}>
                <span className={`h-2 w-2 rounded-full ${isRecording ? "interview-pulse bg-red-500" : "bg-slate-300"}`} />
                {isRecording ? "Listening to your answer" : liveTranscription.status === "connecting" ? "Connecting transcription..." : "Transcription paused"}
              </span>
              <span className="text-slate-400">Speak naturally · Aim for 2–3 minutes</span>
            </div>
          </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-xl shadow-slate-300/30">
            <div className="relative aspect-video min-h-[280px] w-full">
              {hasVideo ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  onClick={() => videoRef.current?.play()}
                  className={`h-full w-full object-cover transition ${isCameraOn ? "opacity-100" : "opacity-25"}`}
                />
              ) : (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-[#143b29] px-6 text-center text-white">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                    <CameraOff size={28} className="text-white/70" />
                  </div>
                  <p className="mt-4 font-bold">Camera preview unavailable</p>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-white/60">Allow camera access to see your preview. You can still use the typed answer while reconnecting.</p>
                </div>
              )}
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span className="rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">Your preview</span>
                {isRecording && <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-[11px] font-bold text-white"><span className="h-1.5 w-1.5 rounded-full bg-white" /> Live</span>}
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div className="rounded-xl bg-black/55 px-3 py-2 text-xs text-white backdrop-blur">
                  <span className="font-bold">{interview?.candidateName || "You"}</span>
                  <span className="mx-2 text-white/40">·</span>
                  <span className="text-white/70">{isCameraOn ? "Camera on" : "Camera off"}</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={toggleMicrophone} disabled={!hasMicrophone} className={`flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur transition ${isMicOn ? "bg-white/90 text-slate-800 hover:bg-white" : "bg-red-500 text-white"}`} aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}>
                    {isMicOn ? <Mic size={17} /> : <MicOff size={17} />}
                  </button>
                  <button type="button" onClick={toggleCamera} disabled={!hasVideo} className={`flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur transition ${isCameraOn ? "bg-white/90 text-slate-800 hover:bg-white" : "bg-red-500 text-white"}`} aria-label={isCameraOn ? "Turn camera off" : "Turn camera on"}>
                    {isCameraOn ? <Camera size={17} /> : <CameraOff size={17} />}
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <label htmlFor="typed-answer" className="flex flex-wrap items-center justify-between gap-2 text-sm font-extrabold text-slate-900">
              Answer workspace
              <span className="text-xs font-medium text-slate-400">Optional fallback if transcription is unavailable</span>
            </label>
            <textarea id="typed-answer" value={answerText} onChange={(event) => setAnswerText(event.target.value)} disabled={isSubmitting} rows={5} placeholder="Type your answer here, or speak while the live transcript listens..." className="mt-4 min-h-32 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1f5e3b] focus:bg-white focus:ring-4 focus:ring-[#1f5e3b]/10" />
            {error && <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700"><AlertTriangle size={17} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
            {mediaError && <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"><AlertTriangle size={17} className="mt-0.5 shrink-0" /><span>{mediaError}</span></div>}
          </div>
        </section>

        <aside className="interview-sidebar interview-scrollbar flex min-w-0 flex-col gap-5 overflow-y-auto lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-10rem)]">
          <section className="interview-transcript-card min-h-[300px]">
            <LiveTranscript transcription={liveTranscription} />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-slate-900">Device check</p>
                <p className="mt-1 text-xs text-slate-500">Your devices stay private to this session.</p>
              </div>
              <ShieldCheck className="text-[#1f5e3b]" size={21} />
            </div>
            <div className="mt-4 space-y-2">
              <MediaStatus icon={Camera} label="Camera" active={hasVideo && isCameraOn} detail={hasVideo ? (isCameraOn ? "Preview is live" : "Turned off") : "Not connected"} />
              <MediaStatus icon={Mic} label="Microphone" active={hasMicrophone && isMicOn} detail={hasMicrophone ? (isMicOn ? "Ready to record" : "Muted") : "Not connected"} />
            </div>
            <button type="button" onClick={retryMedia} disabled={mediaLoading} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-[#1f5e3b] hover:text-[#1f5e3b] disabled:cursor-not-allowed disabled:opacity-60">
              {mediaLoading ? <LoaderCircle size={14} className="interview-spin" /> : <RefreshCw size={14} />}
              {mediaLoading ? "Connecting devices..." : "Reconnect devices"}
            </button>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><Wifi size={16} className="text-[#1f5e3b]" /> Session tips</div>
            <ul className="mt-4 space-y-3 text-xs leading-5 text-slate-500">
              <li className="flex gap-2"><span className="font-bold text-[#1f5e3b]">01</span> Keep your face centered and look toward the camera.</li>
              <li className="flex gap-2"><span className="font-bold text-[#1f5e3b]">02</span> Speak clearly and pause briefly between thoughts.</li>
              <li className="flex gap-2"><span className="font-bold text-[#1f5e3b]">03</span> Use the answer box if live transcription needs a moment.</li>
            </ul>
          </section>
        </aside>
      </main>

      <footer className="interview-controls sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-7 py-4 shadow-[0_-8px_30px_rgba(15,23,42,.06)] backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div className="interview-control-group flex items-center gap-2">
            <button type="button" onClick={toggleMicrophone} disabled={!hasMicrophone} className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${isMicOn ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-red-50 text-red-700 hover:bg-red-100"} disabled:cursor-not-allowed disabled:opacity-50`}>
              {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}<span className="hidden sm:inline">{isMicOn ? "Mute" : "Unmute"}</span>
            </button>
            <button type="button" onClick={toggleCamera} disabled={!hasVideo} className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${isCameraOn ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-red-50 text-red-700 hover:bg-red-100"} disabled:cursor-not-allowed disabled:opacity-50`}>
              {isCameraOn ? <Camera size={16} /> : <CameraOff size={16} />}<span className="hidden sm:inline">{isCameraOn ? "Camera" : "Camera off"}</span>
            </button>
          </div>
          <button type="button" onClick={submitAnswer} disabled={isSubmitting || (!isRecording && !answerText.trim())} className="flex items-center justify-center gap-2 rounded-xl bg-[#1f5e3b] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#1f5e3b]/20 transition hover:-translate-y-0.5 hover:bg-[#174a2e] disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? <LoaderCircle size={17} className="interview-spin" /> : <Send size={16} />}
            {isSubmitting ? "Submitting..." : "Finish & next"}
          </button>
          <div className="interview-control-end flex items-center gap-2">
            <button type="button" onClick={pauseInterview} disabled={isSubmitting} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"><Pause size={15} /><span className="hidden sm:inline">Pause</span></button>
            <button type="button" onClick={endInterview} disabled={isSubmitting} className="flex items-center gap-2 rounded-xl border border-red-100 px-3.5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"><Square size={13} /><span className="hidden sm:inline">End</span></button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default InterviewRoom;
