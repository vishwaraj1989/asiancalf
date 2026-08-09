const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const connectDB = require('../config/db');

let mongoServer;

module.exports = {
  setupDB: async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { storageEngine: 'wiredTiger' } });
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDB();
  },
  teardownDB: async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  },
};
