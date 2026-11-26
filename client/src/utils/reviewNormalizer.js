/**
 * Derive unified 6-section study notes data from either v3 Gemini reviews or legacy v2 reviews.
 * Kept dependency-free so pages viewing reviews do not eagerly bundle jsPDF/html2canvas.
 */
export const normalizeReviewSections = (review) => {
  const rawErrors =
    Array.isArray(review?.errors) && review.errors.length > 0
      ? review.errors
      : Array.isArray(review?.codeErrors) && review.codeErrors.length > 0
        ? review.codeErrors
        : (review?.bugs || []).map((b) => ({
            line: b.lineNumber ?? 0,
            severity: /warning|loose equality|var declaration/i.test(String(b.title || '')) ? 'WARNING' : 'ERROR',
            title: b.title || 'Code Issue',
            explanation: b.whyItHappens || b.description || b.hint || '',
            fix: b.solution || b.hint || '',
          }));

  const howItWorks =
    Array.isArray(review?.howItWorks) && review.howItWorks.length > 0
      ? review.howItWorks
      : review?.summary
        ? [review.summary]
        : ['Code execution flow analyzed cleanly from top to bottom.'];

  const complexity = {
    time: review?.complexity?.time || 'O(1)',
    timeReason:
      review?.complexity?.timeReason ||
      review?.complexity?.explanation ||
      'Estimated from loops, recursion depth, and data operations.',
    space: review?.complexity?.space || 'O(1)',
    spaceReason:
      review?.complexity?.spaceReason ||
      review?.complexity?.explanation ||
      'Estimated from memory allocations and call stack usage.',
  };

  const callGraph = Array.isArray(review?.callGraph) ? review.callGraph : [];
  const functionBreakdown = Array.isArray(review?.functionBreakdown) ? review.functionBreakdown : [];

  const isGemini =
    review?.analysisEngine === 'GEMINI_AI' ||
    (!review?.isFallback && review?.analysisEngine !== 'STATIC_FALLBACK');

  return {
    errors: rawErrors,
    howItWorks,
    complexity,
    callGraph,
    functionBreakdown,
    isGemini,
  };
};
