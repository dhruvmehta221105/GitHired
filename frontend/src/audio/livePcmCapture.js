import { TARGET_SAMPLE_RATE } from "./pcmUtils";

const createPermissionError = (error) => {
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
    return new Error("Microphone permission was denied. Allow microphone access and try again.");
  }
  if (error?.name === "NotFoundError") {
    return new Error("No microphone was found. Connect a microphone and try again.");
  }
  if (error?.name === "NotReadableError") {
    return new Error("The microphone is already in use by another application.");
  }
  return error instanceof Error ? error : new Error("Unable to access the microphone.");
};

export const createLivePcmCapture = async ({ onChunk, audioConstraints = {}, stream: providedStream }) => {
  if (!providedStream && !navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support microphone capture.");
  }
  if (!window.AudioContext && !window.webkitAudioContext) {
    throw new Error("This browser does not support AudioContext.");
  }

  let stream;
  let context;
  let source;
  let processor;
  let silentGain;

  try {
    stream = providedStream || await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...audioConstraints
      },
      video: false
    });

    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    context = new AudioContextConstructor();
    await context.audioWorklet.addModule(new URL("../workers/audioProcessor.js", import.meta.url));

    source = context.createMediaStreamSource(stream);
    processor = new AudioWorkletNode(context, "pcm-resampler", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: "max",
      processorOptions: {
        targetSampleRate: TARGET_SAMPLE_RATE,
        chunkSize: 1600
      }
    });
    silentGain = context.createGain();
    silentGain.gain.value = 0;

    processor.port.onmessage = (event) => {
      if (event.data instanceof Float32Array) onChunk(event.data);
      else if (event.data instanceof ArrayBuffer) onChunk(new Float32Array(event.data));
    };
    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(context.destination);
    await context.resume();

    let stopped = false;
    return {
      stream,
      sampleRate: TARGET_SAMPLE_RATE,
      async stop() {
        if (stopped) return;
        stopped = true;
        processor.port.onmessage = null;
        try {
          source.disconnect();
          processor.disconnect();
          silentGain.disconnect();
          if (!providedStream) stream.getTracks().forEach((track) => track.stop());
        } finally {
          if (context.state !== "closed") await context.close();
        }
      }
    };
  } catch (error) {
    if (processor) processor.disconnect();
    if (source) source.disconnect();
    if (silentGain) silentGain.disconnect();
    if (stream && !providedStream) stream.getTracks().forEach((track) => track.stop());
    if (context && context.state !== "closed") await context.close();
    throw createPermissionError(error);
  }
};
