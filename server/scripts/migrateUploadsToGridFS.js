const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const mediaStore = require('../services/productMediaStorage');

const uploadDir = path.resolve(__dirname, '..', 'uploads', 'products');
const apply = process.argv.includes('--apply');

function contentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'video/ogg' })[ext] || 'application/octet-stream';
}

async function hashStream(stream) {
  const hash = crypto.createHash('sha256');
  stream.on('data', (chunk) => hash.update(chunk));
  await new Promise((resolve, reject) => stream.once('error', reject).once('end', resolve));
  return hash.digest('hex');
}

async function hashFile(filePath) {
  return hashStream(fs.createReadStream(filePath));
}

async function main() {
  await connectDB();
  const names = (await fsp.readdir(uploadDir)).filter((name) => /\.(jpe?g|png|webp|mp4|webm|ogg)$/i.test(name));
  let migrated = 0;
  let skipped = 0;
  for (const filename of names) {
    const filePath = path.join(uploadDir, filename);
    const existing = await mediaStore.findLatest(filename);
    let verified = false;
    if (existing) {
      const [sourceHash, storedHash] = await Promise.all([
        hashFile(filePath),
        hashStream(mediaStore.downloadStream(existing._id)),
      ]);
      verified = sourceHash === storedHash && existing.length === (await fsp.stat(filePath)).size;
    } else {
      if (!apply) {
        console.log(`Would upload and verify (dry run): ${filename}`);
        migrated += 1;
        continue;
      }
      const file = { filename, path: filePath, mimetype: contentType(filename), originalname: filename };
      const id = await mediaStore.uploadFile(file);
      const stored = await hashStream(mediaStore.downloadStream(id));
      const source = await hashFile(filePath);
      verified = stored === source && (await mediaStore.findLatest(filename))?.length === (await fsp.stat(filePath)).size;
      if (!verified) {
        console.error(`Verification failed; source retained: ${filename}`);
        skipped += 1;
        continue;
      }
    }

    if (!verified) {
      console.error(`Existing GridFS file differs; source retained: ${filename}`);
      skipped += 1;
      continue;
    }
    migrated += 1;
    console.log(`${apply ? 'Verified and eligible for source removal' : 'Verified (dry run)'}: ${filename}`);
    if (apply) await fsp.unlink(filePath);
  }
  console.log(`Complete. verified=${migrated}, skipped=${skipped}, mode=${apply ? 'apply' : 'dry-run'}`);
}

main()
  .catch((error) => {
    console.error(`Media migration failed: ${error.name || 'Error'}: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
