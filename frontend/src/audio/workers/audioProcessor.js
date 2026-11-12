/**
 * AudioWorklet processor: resamples multichannel audio to mono 16kHz PCM
 * and emits Float32Array chunks via the worker port.
 */

const TARGET_SAMPLE_RATE = 16000;
const CHUNK_SIZE = 1600;

class PCMResamplerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sourceSampleRate = sampleRate;
    this.resamplerBuffer = new Float32Array(0);
    this.port.onmessage = (event) => {
      if (event.data && event.data.processorOptions) {
        this.sourceSampleRate = event.data.processorOptions.targetSampleRate || sampleRate;
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input.length) return true;

    const channelData = input[0];
    if (!channelData) return true;

    // Mix to mono if multichannel
    const mono = new Float32Array(channelData.length);
    for (let channel = 0; channel < input.length; channel += 1) {
      const ch = input[channel];
      for (let i = 0; i < ch.length; i += 1) {
        mono[i] += (ch[i] || 0) / input.length;
      }
    }

    // Resample to target sample rate
    let resampled;
    if (this.sourceSampleRate === TARGET_SAMPLE_RATE) {
      resampled = mono;
    } else {
      const ratio = this.sourceSampleRate / TARGET_SAMPLE_RATE;
      const outputLength = Math.max(1, Math.round(mono.length / ratio));
      resampled = new Float32Array(outputLength);
      for (let i = 0; i < outputLength; i += 1) {
        const sourcePos = i * ratio;
        const idx = Math.floor(sourcePos);
        const frac = sourcePos - idx;
        const a = mono[idx] || 0;
        const b = mono[Math.min(idx + 1, mono.length - 1)] || 0;
        resampled[i] = a + (b - a) * frac;
    }

    // Append to buffer and emit chunks
    const combined = new Float32Array(this.resamplerBuffer.length + resampled.length);
    combined.set(this.resamplerBuffer);
    combined.set(resampled, this.resamplerBuffer.length);
    this.resamplerBuffer = combined;

    while (this.resamplerBuffer.length >= CHUNK_SIZE) {
      const chunk = this.resamplerBuffer.slice(0, CHUNK_SIZE);
      this.resamplerBuffer = this.resamplerBuffer.slice(CHUNK_SIZE);
      this.port.postMessage(chunk);
    }
    }

    return true;
  }
}

registerProcessor("pcm-resampler", PCMResamplerProcessor);
