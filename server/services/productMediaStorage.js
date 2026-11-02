const fs = require('node:fs');
const mongoose = require('mongoose');

const BUCKET_NAME = 'productMedia';

function getBucket() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error('MongoDB must be connected before product media can be stored.');
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME });
}

function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const bucket = getBucket();
    const stream = bucket.openUploadStream(file.filename, {
      contentType: file.mimetype,
      metadata: { originalName: file.originalname },
    });
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      stream.abort();
      bucket.delete(stream.id).catch(() => {}).finally(() => reject(error));
    };
    const source = fs.createReadStream(file.path);
    source.once('error', fail);
    stream.once('error', fail);
    stream.once('finish', () => {
      if (settled) return;
      settled = true;
      resolve(stream.id);
    });
    source.pipe(stream);
  });
}

async function findLatest(filename) {
  return getBucket().find({ filename }).sort({ uploadDate: -1, _id: -1 }).limit(1).next();
}

async function deleteFile(id) {
  if (!id) return;
  await getBucket().delete(id);
}

function downloadStream(id, options) {
  return getBucket().openDownloadStream(id, options);
}

module.exports = { BUCKET_NAME, getBucket, uploadFile, findLatest, deleteFile, downloadStream };
