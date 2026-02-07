function errorHandler(err, req, res, next) { // eslint-disable-line
  console.error(err);
  if (res.headersSent) return next(err);

  // Mongoose validation error -> 400 Bad Request
  if (err.name === 'ValidationError') {
    const errors = Object.keys(err.errors || {}).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
    return res.status(400).json({ message: err.message || 'Validation Error', errors });
  }

  // Mongoose cast error (invalid ObjectId) -> 400 Bad Request
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }

  // Mongo duplicate key -> 409 Conflict
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate key', details: err.keyValue });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
}

module.exports = errorHandler;
