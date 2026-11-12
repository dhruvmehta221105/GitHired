import { useEffect, useRef } from "react";

const COLORS = {
  accent: "#1f5e3b",
  muted: "#c9d8cd"
};

export default function AudioVisualizer({ stream, active = false, height = 56 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    const width = canvas.clientWidth || 320;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.scale(pixelRatio, pixelRatio);

    let audioContext;
    let analyser;
    let source;
    let frame;
    let data;

    if (stream && active) {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if (AudioContextConstructor) {
        audioContext = new AudioContextConstructor();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        data = new Uint8Array(analyser.frequencyBinCount);
      }
    }

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const barCount = 32;
      const gap = 3;
      const barWidth = Math.max(2, (width - gap * (barCount - 1)) / barCount);
      if (analyser) analyser.getByteFrequencyData(data);

      for (let index = 0; index < barCount; index += 1) {
        const frequency = data ? data[index % data.length] / 255 : 0;
        const idleWave = 0.18 + Math.abs(Math.sin(index * 0.75)) * 0.12;
        const amplitude = active ? Math.max(frequency, idleWave) : idleWave * 0.55;
        const barHeight = Math.max(4, amplitude * (height - 8));
        const x = index * (barWidth + gap);
        const y = (height - barHeight) / 2;
        context.fillStyle = active ? COLORS.accent : COLORS.muted;
        context.globalAlpha = active ? 0.45 + amplitude * 0.55 : 0.7;
        context.beginPath();
        context.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        context.fill();
      }
      context.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(frame);
      source?.disconnect();
      if (audioContext && audioContext.state !== "closed") audioContext.close();
    };
  }, [active, height, stream]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={active ? "Live microphone waveform" : "Microphone waveform idle"}
      style={{ display: "block", width: "100%", height }}
    />
  );
}
