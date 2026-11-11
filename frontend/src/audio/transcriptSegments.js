const normalizeText = (text) => String(text || "").replace(/\s+/g, " ").trim();

const isCompletedSegment = (segment) =>
  segment.completed === true
  || segment.final === true
  || segment.is_final === true
  || ["completed", "final"].includes(segment.status);

const segmentKey = (segment, text) => {
  const identity = segment.id ?? segment.uid ?? segment.segment_id;
  if (identity !== undefined) return `id:${identity}`;
  if (segment.start !== undefined || segment.end !== undefined) {
    return `time:${segment.start ?? ""}:${segment.end ?? ""}:${text}`;
  }
  return `text:${text.toLowerCase()}`;
};

const dedupeSegments = (segments) => {
  const seen = new Set();
  return segments.filter((segment) => {
    const key = segment.key || segmentKey(segment, segment.text);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const words = (text) => normalizeText(text).split(" ").filter(Boolean);

const appendWithoutOverlap = (current, next) => {
  const currentWords = words(current);
  const nextWords = words(next);
  if (!currentWords.length) return nextWords.join(" ");
  if (!nextWords.length) return currentWords.join(" ");

  const maxOverlap = Math.min(currentWords.length, nextWords.length);
  for (let length = maxOverlap; length > 0; length -= 1) {
    const suffix = currentWords.slice(-length).join(" ").toLowerCase();
    const prefix = nextWords.slice(0, length).join(" ").toLowerCase();
    if (suffix === prefix) {
      return [...currentWords, ...nextWords.slice(length)].join(" ");
    }
  }
  return [...currentWords, ...nextWords].join(" ");
};

export const mergeTranscriptSegments = (completedSegments, provisionalSegments, incomingSegments) => {
  const completed = [...completedSegments];
  const provisional = [];
  const incomingKeys = new Set();

  for (const rawSegment of incomingSegments || []) {
    const text = normalizeText(rawSegment.text);
    if (!text) continue;
    const segment = { ...rawSegment, text, key: segmentKey(rawSegment, text) };
    if (isCompletedSegment(segment)) {
      completed.push(segment);
    } else {
      provisional.push(segment);
      incomingKeys.add(segment.key);
    }
  }

  for (const segment of provisionalSegments) {
    if (!incomingKeys.has(segment.key)) provisional.push(segment);
  }

  const uniqueCompleted = dedupeSegments(completed);
  const uniqueProvisional = dedupeSegments(provisional);
  const completedText = uniqueCompleted.reduce(
    (text, segment) => appendWithoutOverlap(text, segment.text),
    ""
  );
  const provisionalText = uniqueProvisional.reduce(
    (text, segment) => appendWithoutOverlap(text, segment.text),
    ""
  );

  return {
    completedSegments: uniqueCompleted,
    provisionalSegments: uniqueProvisional,
    transcript: appendWithoutOverlap(completedText, provisionalText)
  };
};
