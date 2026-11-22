const express = require('express');
const mediaStore = require('../services/productMediaStorage');

const router = express.Router();

router.get('/:filename', async (req, res, next) => {
  const { filename } = req.params;
  if (!filename || filename !== require('path').basename(filename) || filename.includes('..')) {
    return res.sendStatus(404);
  }

  try {
    const file = await mediaStore.findLatest(filename);
    if (!file) return next(); // Retain compatibility with existing local uploads.

    const size = file.length;
    let start = 0;
    let end = Math.max(0, size - 1);
    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {
        res.set('Content-Range', `bytes */${size}`);
        return res.sendStatus(416);
      }
      if (!match[1]) {
        const suffixLength = Number(match[2]);
        start = Math.max(0, size - suffixLength);
      } else {
        start = Number(match[1]);
        end = match[2] ? Math.min(Number(match[2]), end) : end;
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
        res.set('Content-Range', `bytes */${size}`);
        return res.sendStatus(416);
      }
      res.status(206).set({
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': String(end - start + 1),
      });
    } else {
      res.set({ 'Accept-Ranges': 'bytes', 'Content-Length': String(size) });
    }
    res.type(file.contentType || 'application/octet-stream');
    const options = range ? { start, end: end + 1 } : undefined;
    const stream = mediaStore.downloadStream(file._id, options);
    stream.on('error', next);
    stream.pipe(res);
  } catch (error) {
    // A database outage must not prevent legacy files on disk from being served.
    if (require('mongoose').connection.readyState !== 1) return next();
    next(error);
  }
});

module.exports = router;
