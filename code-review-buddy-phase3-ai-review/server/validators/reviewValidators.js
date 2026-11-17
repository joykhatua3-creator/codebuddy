const { z } = require('zod');
const { LANGUAGES } = require('../utils/topics');

const createReviewSchema = z.object({
  language: z.enum(LANGUAGES, { errorMap: () => ({ message: 'Choose a supported language' }) }),
  code: z
    .string()
    .refine((s) => s.trim().length >= 10, 'Paste at least a few lines of code')
    .refine((s) => s.length <= 10000, 'Code must be 10,000 characters or fewer'),
});

module.exports = { createReviewSchema };
