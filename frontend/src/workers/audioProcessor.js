class PcmResamplerProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const processorOptions = options.processorOptions || {};
    this.targetSampleRate = processorOptions.targetSampleRate || 16000;
    this.chunkSize = processorOptions.chunkSize || 1600;
    this.sourceSampleRate = sampleRate;
    this.sourceBuffer = new Float32Array(0);
    this.sourcePosition = 0;
    this.outputBuffer = new Float32Array(this.chunkSize);
    this.outputLength = 0;
  }

  appendSamples(samples) {
    const merged = new Float32Array(this.sourceBuffer.length + samples.length);
    merged.set(this.sourceBuffer);
    merged.set(samples, this.sourceBuffer.length);
    this.sourceBuffer = merged;
  }

  emitSamples() {
    while (this.outputLength >= this.chunkSize) {
      const chunk = this.outputBuffer.slice(0, this.chunkSize);
      this.port.postMessage(chunk, [chunk.buffer]);
      this.outputBuffer.copyWithin(0, this.chunkSize);
      this.outputLength -= this.chunkSize;
    }
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input.length || !input[0].length) return true;

    const mono = new Float32Array(input[0].length);
    for (let index = 0; index < mono.length; index += 1) {
      let sample = 0;
      for (const channel of input) sample += channel[index] || 0;
      mono[index] = sample / input.length;
    }
    this.appendSamples(mono);

    const ratio = this.sourceSampleRate / this.targetSampleRate;
    while (this.sourcePosition + 1 < this.sourceBuffer.length) {
      const lowerIndex = Math.floor(this.sourcePosition);
      const upperIndex = lowerIndex + 1;
      const fraction = this.sourcePosition - lowerIndex;
      const sample = this.sourceBuffer[lowerIndex]
        + (this.sourceBuffer[upperIndex] - this.sourceBuffer[lowerIndex]) * fraction;

      if (this.outputLength === this.outputBuffer.length) {
        this.emitSamples();
      }
      this.outputBuffer[this.outputLength] = sample;
      this.outputLength += 1;
      this.sourcePosition += ratio;
    }

    const consumed = Math.floor(this.sourcePosition);
    if (consumed > 0) {
      this.sourceBuffer = this.sourceBuffer.slice(consumed);
      this.sourcePosition -= consumed;
    }
    this.emitSamples();
    return true;
  }
}

registerProcessor("pcm-resampler", PcmResamplerProcessor);
