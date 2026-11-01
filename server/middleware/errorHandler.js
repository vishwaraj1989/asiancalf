const crypto = require('node:crypto');
const multer = require('multer');

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const requestId = crypto.randomUUID();
  let status = Number(err.statusCode || err.status) || 500;
  if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
  }
  if (status < 400 || status > 599) status = 500;

  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify({
      requestId,
      status,
      name: err.name || 'Error',
      code: err.code || undefined,
    }));
  } else {
    console.error(err.stack || err);
  }

  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error.'
    : err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
      ? 'Uploaded file exceeds the configured size limit.'
    : err.message || 'Server Error';
  const body = { success: false, message };
  if (status >= 500 && process.env.NODE_ENV === 'production') body.requestId = requestId;
  return res.status(status).json(body);
};
