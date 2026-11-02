const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 25 * 1024 * 1024;
const MAX_IMAGES_PER_REQUEST = 5;
const imageTypes = new Map([
  ['.jpg', new Set(['image/jpeg'])],
  ['.jpeg', new Set(['image/jpeg'])],
  ['.png', new Set(['image/png'])],
  ['.webp', new Set(['image/webp'])],
]);
const videoTypes = new Map([
  ['.mp4', new Set(['video/mp4'])],
  ['.webm', new Set(['video/webm'])],
  ['.ogg', new Set(['video/ogg'])],
]);

const diskStorage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, uploadDir);
  },
  filename(req, file, callback) {
    const ext = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

function makeFileFilter(types, label) {
  return (req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimeTypes = types.get(ext);
    if (allowedMimeTypes?.has(file.mimetype.toLowerCase())) return callback(null, true);

    const error = new Error(`Unsupported ${label} file type.`);
    error.status = 400;
    error.code = 'UNSUPPORTED_FILE_TYPE';
    return callback(error);
  };
}

function createUploaders(storage = diskStorage) {
  const upload = multer({
    storage,
    fileFilter: makeFileFilter(imageTypes, 'image'),
    limits: {
      fileSize: IMAGE_MAX_BYTES,
      files: MAX_IMAGES_PER_REQUEST,
      fields: 1,
      fieldSize: 32,
      // Multipart field names are scalar (for example, "images"), not
      // bracket-indexed arrays, so numeric array indexes are unnecessary.
      fieldArrayIndexLimit: 0,
    },
  });
  const uploadVideo = multer({
    storage,
    fileFilter: makeFileFilter(videoTypes, 'video'),
    limits: {
      fileSize: VIDEO_MAX_BYTES,
      files: 1,
      fields: 0,
      fieldArrayIndexLimit: 0,
    },
  });

  return { upload, uploadVideo };
}

module.exports = {
  ...createUploaders(),
  createUploaders,
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
};
