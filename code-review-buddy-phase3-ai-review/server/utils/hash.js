const crypto = require('crypto');

// Same code + same language => same hash. Line endings and outer whitespace are
// normalised so a Windows paste and a Mac paste of the same code still match.
const hashCode = (language, code) => {
  const normalised = code.replace(/\r\n/g, '\n').trim();
  return crypto.createHash('sha256').update(`${language}\n${normalised}`).digest('hex');
};

module.exports = { hashCode };
