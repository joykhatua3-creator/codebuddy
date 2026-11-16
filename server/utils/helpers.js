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
  return text
    .replace(/^```[\w]*\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim();
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
  asyncHandler,
};
