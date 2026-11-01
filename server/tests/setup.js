const mongoose = require('mongoose');
const path = require('path');

process.env.MONGOMS_DOWNLOAD_DIR = process.env.MONGOMS_DOWNLOAD_DIR || path.resolve(__dirname, '..', '.cache', 'mongodb-binaries');

const { MongoMemoryReplSet } = require('mongodb-memory-server');
const connectDB = require('../config/db');

let mongoServer;

module.exports = {
  setupDB: async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { storageEngine: 'wiredTiger' } });
    process.env.MONGO_URI = mongoServer.getUri();
    await connectDB();
  },
  teardownDB: async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  },
};
