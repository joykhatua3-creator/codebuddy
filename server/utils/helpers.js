const crypto = require('crypto');

/**
 * Generate a SHA-256 hash of code + language for cache lookup.
 * @param {string} code
 * @param {string} language
 * @returns {string} hex digest
 */
const generateCodeHash = (code, language) => {
  return crypto
    .createHash('sha256')
    .update(`${language}:${code}`)
    .digest('hex');
};

/**
 * Generate a JWT token for a user.
 * @param {string} id  - MongoDB ObjectId
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * Strip markdown code fences from AI responses.
 * e.g. ```json ... ``` → ...
 * @param {string} text
 * @returns {string}
 */
const stripMarkdownFences = (text) => {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim();
  const fencedJsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (/^```/i.test(trimmed) && /```$/i.test(trimmed)) {
    return trimmed
      .replace(/^```[\w-]*\s*\r?\n?/, '')
      .replace(/\r?\n?```\s*$/, '')
      .trim();
  }
  if (fencedJsonMatch && fencedJsonMatch[1]?.trim().startsWith('{')) {
    return fencedJsonMatch[1].trim();
  }
  return trimmed;
};

/**
 * Strip markdown fences and extract the first valid top-level `{ ... }` JSON object.
 * Handles preamble/postamble text and ignores braces inside JSON string literals.
 * @param {string} text
 * @returns {string}
 */
const extractJsonObject = (text) => {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim();
  // If preamble precedes a markdown code block, start at `{` inside the fence; if text already starts with `{`, preserve from `{`.
  const fenceOpenMatch = trimmed.startsWith('{') ? null : trimmed.match(/```(?:json)?\s*(\{[\s\S]*)/i);
  const candidate = fenceOpenMatch ? fenceOpenMatch[1] : stripMarkdownFences(trimmed);
  const start = candidate.indexOf('{');
  if (start === -1) return stripMarkdownFences(trimmed);

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return candidate.slice(start, i + 1);
      }
    }
  }

  const last = candidate.lastIndexOf('}');
  if (last > start) return candidate.slice(start, last + 1);
  return candidate.slice(start);
};

/**
 * Async wrapper to avoid try/catch boilerplate in route handlers.
 * @param {Function} fn - Async controller function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  generateCodeHash,
  generateToken,
  stripMarkdownFences,
  extractJsonObject,
  asyncHandler,
};
