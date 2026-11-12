import { useCallback, useEffect, useRef, useState } from "react";
import { createLivePcmCapture } from "../audio/livePcmCapture";
import { mergeTranscriptSegments } from "../audio/transcriptSegments";

const getTranscriptionSocketUrl = (interviewId) => {
  const configuredUrl = import.meta.env.VITE_TRANSCRIPTION_WS_URL;
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const baseUrl = new URL(configuredUrl || apiUrl);
  const protocol = baseUrl.protocol === "https:" || baseUrl.protocol === "wss:" ? "wss:" : "ws:";
  const host = baseUrl.host;
  const path = configuredUrl
    ? baseUrl.pathname.replace(/\/$/, "")
    : baseUrl.pathname.replace(/\/api\/?$/, "");
  const socketUrl = new URL(`${protocol}//${host}${path || ""}/ws/transcription`);
  socketUrl.searchParams.set("interviewId", interviewId);
  socketUrl.searchParams.set("token", localStorage.getItem("token") || "");
  return socketUrl.toString();
};

export const useLiveTranscription = ({ interviewId, mediaStream = null }) => {
  const socketRef = useRef(null);
  const captureRef = useRef(null);
  const startRequestRef = useRef(null);
  const sessionIdRef = useRef(0);
  const [state, setState] = useState({
    status: "idle",
    transcript: "",
    segments: [],
    completedSegments: [],
    provisionalSegments: [],
    audioStream: null,
    error: null
  });

  const stop = useCallback(async () => {
    sessionIdRef.current += 1;
    startRequestRef.current = null;
    const capture = captureRef.current;
    captureRef.current = null;
    const socket = socketRef.current;
    socketRef.current = null;
    try {
      if (capture) await capture.stop();
    } finally {
      if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, "Session complete");
      setState((current) => ({ ...current, status: "idle" }));
    }
  }, []);

  const start = useCallback(async () => {
    if (!interviewId) throw new Error("Interview ID is required for live transcription.");
    if (startRequestRef.current) return startRequestRef.current;

    const request = new Promise((resolve, reject) => {
      let settled = false;
      const sessionId = ++sessionIdRef.current;
      const socket = new WebSocket(getTranscriptionSocketUrl(interviewId));
      socketRef.current = socket;
      setState((current) => ({
        ...current,
        status: "connecting",
        transcript: "",
        segments: [],
        completedSegments: [],
        provisionalSegments: [],
        audioStream: null,
        error: null
      }));

      const fail = (error) => {
        if (settled) return;
        settled = true;
        socket.close();
        setState((current) => ({ ...current, status: "error", error: error.message }));
        reject(error);
      };

      const handleRuntimeError = async (error) => {
        setState((current) => ({ ...current, status: "error", error: error.message }));
        const capture = captureRef.current;
        captureRef.current = null;
        if (socketRef.current === socket) socketRef.current = null;
        try {
          if (capture) await capture.stop();
        } finally {
          if (socket.readyState < WebSocket.CLOSING) socket.close(1011, "Transcription failed");
        }
      };

      socket.onmessage = async (event) => {
        if (sessionId !== sessionIdRef.current) return;
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          fail(new Error("Received an invalid transcription message."));
          return;
        }

        if (message.type === "ready") {
          try {
            captureRef.current = await createLivePcmCapture({
              stream: mediaStream,
              onChunk: (chunk) => {
                if (socket.readyState === WebSocket.OPEN) socket.send(chunk.buffer);
              }
            });
            settled = true;
            setState((current) => ({
              ...current,
              status: "recording",
              audioStream: captureRef.current.stream
            }));
            resolve();
          } catch (error) {
            fail(error);
          }
          return;
        }

        if (message.type === "transcript") {
          const segments = Array.isArray(message.segments) ? message.segments : [];
          setState((current) => {
            const merged = mergeTranscriptSegments(
              current.completedSegments,
              current.provisionalSegments,
              segments
            );
            return { ...current, ...merged, segments };
          });
        }
        if (message.type === "error") {
          const error = new Error(message.message || "Transcription failed.");
          if (settled) await handleRuntimeError(error);
          else fail(error);
        }
      };

      socket.onerror = () => fail(new Error("Unable to connect to the transcription proxy."));
      socket.onclose = () => {
        if (!settled) fail(new Error("The transcription connection closed before it was ready."));
        else if (socketRef.current === socket) {
          setState((current) => ({
            ...current,
            status: "error",
            error: "The transcription connection closed unexpectedly."
          }));
        }
      };
    });

    startRequestRef.current = request;
    try {
      await request;
    } finally {
      startRequestRef.current = null;
    }
  }, [interviewId, mediaStream]);

  const pause = useCallback(async () => {
    if (state.status !== "recording") return;
    const capture = captureRef.current;
    captureRef.current = null;
    if (capture) await capture.stop();
    setState((current) => ({ ...current, status: "paused", audioStream: null }));
  }, [state.status]);

  const resume = useCallback(async () => {
    if (state.status !== "paused") return;
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      const error = new Error("The transcription connection is no longer available.");
      setState((current) => ({ ...current, status: "error", error: error.message }));
      throw error;
    }
    try {
      const capture = await createLivePcmCapture({
        stream: mediaStream,
        onChunk: (chunk) => {
          if (socket.readyState === WebSocket.OPEN) socket.send(chunk.buffer);
        }
      });
      captureRef.current = capture;
      setState((current) => ({ ...current, status: "recording", error: null, audioStream: capture.stream }));
    } catch (error) {
      setState((current) => ({ ...current, status: "error", error: error.message }));
      throw error;
    }
  }, [mediaStream, state.status]);

  useEffect(() => () => {
    stop();
  }, [stop]);

  return {
    ...state,
    start,
    pause,
    resume,
    stop,
    isReady: ["recording", "paused"].includes(state.status),
    isRecording: state.status === "recording"
  };
};
