import test from "node:test";
import assert from "node:assert/strict";
import { mixToMono, resampleMonoPcm } from "../src/audio/pcmUtils.js";

test("mixToMono averages channels without changing frame count", () => {
  const mono = mixToMono([
    new Float32Array([1, 0]),
    new Float32Array([0, 1])
  ]);
  assert.deepEqual(Array.from(mono), [0.5, 0.5]);
});

test("resampleMonoPcm converts 48 kHz audio to 16 kHz", () => {
  const input = new Float32Array(480);
  input[0] = 1;
  input[479] = -1;
  const output = resampleMonoPcm(input, 48000, 16000);
  assert.equal(output.length, 160);
  assert.equal(output[0], 1);
  assert.ok(output.every((sample) => sample >= -1 && sample <= 1));
});

test("resampleMonoPcm preserves 16 kHz PCM values", () => {
  const input = new Float32Array([0.25, -0.5, 0.75]);
  assert.deepEqual(
    Array.from(resampleMonoPcm(input, 16000)),
    Array.from(input)
  );
});
