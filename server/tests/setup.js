const mongoose = require('mongoose');
const path = require('path');

process.env.MONGOMS_DOWNLOAD_DIR = process.env.MONGOMS_DOWNLOAD_DIR || path.resolve(__dirname, '..', '.cache', 'mongodb-binaries');

const { MongoMemoryReplSet } = require('mongodb-memory-server');
const connectDB = require('../config/db');

let mongoServer;
let connectedForTests = false;
let isolatedTestUri = null;

function isolatedTestMongoUri(uri) {
  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error('TEST_MONGO_URI must be a valid MongoDB URI targeting a dedicated test database.');
  }

  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol)) {
    throw new Error('TEST_MONGO_URI must use mongodb:// or mongodb+srv://.');
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  if (!databaseName || !/(?:^|[_-])test(?:ing)?$/i.test(databaseName)) {
    throw new Error('Refusing to run integration tests: TEST_MONGO_URI database name must end in _test, -test, _testing, or -testing.');
  }

  // Give every invocation a fresh database so teardown cannot touch an existing
  // test database, even if the configured URI is reused between runs.
  parsed.pathname = `/${encodeURIComponent(`${databaseName}_${process.pid}_${Date.now()}_test`)}`;
  return parsed.toString();
}

module.exports = {
  setupDB: async () => {
    const configuredTestUri = process.env.TEST_MONGO_URI;
    if (configuredTestUri) {
      isolatedTestUri = isolatedTestMongoUri(configuredTestUri);
      process.env.MONGO_URI = isolatedTestUri;
    } else {
      mongoServer = await MongoMemoryReplSet.create({ replSet: { storageEngine: 'wiredTiger' } });
      process.env.MONGO_URI = mongoServer.getUri();
    }

    await connectDB();
    connectedForTests = true;
  },
  teardownDB: async () => {
    if (connectedForTests) {
      // Stop Mongoose's automatic index creation before dropping the isolated
      // database, otherwise an index build can recreate an empty collection.
      await mongoose.disconnect();
      connectedForTests = false;
      if (isolatedTestUri) {
        const client = new mongoose.mongo.MongoClient(isolatedTestUri);
        try {
          await client.connect();
          const databaseName = decodeURIComponent(new URL(isolatedTestUri).pathname.replace(/^\/+/, ''));
          await client.db(databaseName).dropDatabase();
        } finally {
          await client.close();
          isolatedTestUri = null;
        }
      }
    }
    if (mongoServer) await mongoServer.stop();
  },
  isolatedTestMongoUri,
};
