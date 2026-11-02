const crypto = require('node:crypto');
const multer = require('multer');
const { IMAGE_MAX_BYTES, VIDEO_MAX_BYTES } = require('./upload');

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

  const uploadLimitMessage = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
    ? err.field === 'video'
      ? `Video exceeds the ${VIDEO_MAX_BYTES / (1024 * 1024)} MB limit.`
      : err.field === 'images'
        ? `Each image must be ${IMAGE_MAX_BYTES / (1024 * 1024)} MB or smaller.`
        : 'Uploaded file exceeds the configured size limit.'
    : null;
  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error.'
    : uploadLimitMessage || err.message || 'Server Error';
  const body = { success: false, message };
  if (status >= 500 && process.env.NODE_ENV === 'production') body.requestId = requestId;
  return res.status(status).json(body);
};
