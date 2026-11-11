export const TARGET_SAMPLE_RATE = 16000;

export const mixToMono = (channels) => {
  if (!channels.length) return new Float32Array();
  if (channels.length === 1) return new Float32Array(channels[0]);

  const mono = new Float32Array(channels[0].length);
  for (let index = 0; index < mono.length; index += 1) {
    let sample = 0;
    for (const channel of channels) sample += channel[index] || 0;
    mono[index] = sample / channels.length;
  }
  return mono;
};

export const resampleMonoPcm = (input, sourceSampleRate, targetSampleRate = TARGET_SAMPLE_RATE) => {
  if (!(input instanceof Float32Array)) {
    throw new TypeError("PCM input must be a Float32Array");
  }
  if (!Number.isFinite(sourceSampleRate) || sourceSampleRate <= 0) {
    throw new RangeError("Source sample rate must be positive");
  }
  if (!Number.isFinite(targetSampleRate) || targetSampleRate <= 0) {
    throw new RangeError("Target sample rate must be positive");
  }
  if (sourceSampleRate === targetSampleRate) return new Float32Array(input);
  if (!input.length) return new Float32Array();

  const outputLength = Math.max(1, Math.round(input.length * targetSampleRate / sourceSampleRate));
  const output = new Float32Array(outputLength);
  const ratio = sourceSampleRate / targetSampleRate;

  for (let index = 0; index < output.length; index += 1) {
    const sourcePosition = index * ratio;
    const lowerIndex = Math.floor(sourcePosition);
    const upperIndex = Math.min(lowerIndex + 1, input.length - 1);
    const fraction = sourcePosition - lowerIndex;
    output[index] = input[lowerIndex] + (input[upperIndex] - input[lowerIndex]) * fraction;
  }

  return output;
};
