const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'That email is already registered' });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Something went wrong on our side' : err.message,
  });
};

module.exports = { notFound, errorHandler };
