import test from "node:test";
import assert from "node:assert/strict";
import { mergeTranscriptSegments } from "../src/audio/transcriptSegments.js";

test("keeps completed and provisional segments separate", () => {
  const result = mergeTranscriptSegments([], [], [
    { id: "final-1", text: "Hello there", completed: true },
    { id: "partial-1", text: "how are" }
  ]);
  assert.equal(result.completedSegments.length, 1);
  assert.equal(result.provisionalSegments.length, 1);
  assert.equal(result.transcript, "Hello there how are");
});

test("deduplicates cumulative segment updates and overlapping words", () => {
  let result = mergeTranscriptSegments([], [], [
    { id: "final-1", text: "I am ready", final: true }
  ]);
  result = mergeTranscriptSegments(
    result.completedSegments,
    result.provisionalSegments,
    [
      { id: "final-1", text: "I am ready", final: true },
      { id: "partial-1", text: "ready to begin" }
    ]
  );
  assert.equal(result.completedSegments.length, 1);
  assert.equal(result.transcript, "I am ready to begin");
});

test("preserves completed text when provisional updates change", () => {
  const result = mergeTranscriptSegments(
    [{ id: "final-1", text: "Good answer", completed: true }],
    [{ id: "partial-1", text: "with a" }],
    [{ id: "partial-1", text: "with a strong example" }]
  );
  assert.equal(result.transcript, "Good answer with a strong example");
});

test("replaces a repeated time-coded segment instead of appending it", () => {
  const first = mergeTranscriptSegments([], [], [
    { start: 0, end: 1.6, text: "Walk me through your tech stack", completed: true }
  ]);
  const second = mergeTranscriptSegments(first.completedSegments, first.provisionalSegments, [
    { start: 0, end: 1.6, text: "Walk me through your typical tech stack", completed: true }
  ]);

  assert.equal(second.transcript, "Walk me through your typical tech stack");
});

test("does not duplicate cumulative provisional text", () => {
  const first = mergeTranscriptSegments([], [], [
    { start: 0, end: 2, text: "I chose React" }
  ]);
  const second = mergeTranscriptSegments(first.completedSegments, first.provisionalSegments, [
    { start: 0, end: 3, text: "I chose React because it is familiar" }
  ]);

  assert.equal(second.transcript, "I chose React because it is familiar");
});
