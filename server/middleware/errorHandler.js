function errorHandler(err, req, res, _next) {
  if (res.headersSent) return;
  // Multer file-size errors
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'file too large (max 5MB)' });
  }
  const status = err.status || 500;
  const message = err.expose ? err.message : (status >= 500 ? 'internal error' : err.message);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
