function errorHandler(err, req, res, next) { // eslint-disable-line
  console.error(err);
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
}

module.exports = errorHandler;
