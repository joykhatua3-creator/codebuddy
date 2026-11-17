// Usage: router.post('/x', validate(schema), handler)
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = {};
    result.error.issues.forEach((i) => {
      const key = i.path.join('.') || 'form';
      if (!errors[key]) errors[key] = i.message;
    });
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  req.body = result.data; // cleaned + normalised values
  next();
};

module.exports = validate;
