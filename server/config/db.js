const mongoose = require('mongoose');
const dns = require('node:dns');

let connectionLoggingRegistered = false;

function registerConnectionLogging() {
  if (connectionLoggingRegistered) return;
  connectionLoggingRegistered = true;

  mongoose.connection.on('connected', () => console.log('MongoDB connection established'));
  mongoose.connection.on('reconnected', () => console.log('MongoDB connection restored'));
  mongoose.connection.on('disconnected', () => console.warn('MongoDB connection lost; waiting for driver reconnection'));
  mongoose.connection.on('error', (error) => {
    const code = error.code ? ` code=${error.code}` : '';
    console.error(`MongoDB connection error: ${error.name || 'Error'}${code}`);
  });
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing. Set it in the server environment.');
  }

  const configuredDnsServers = process.env.MONGO_DNS_SERVERS;
  if (configuredDnsServers) {
    const dnsServers = configuredDnsServers.split(',').map((server) => server.trim()).filter(Boolean);
    if (!dnsServers.length) {
      throw new Error('MONGO_DNS_SERVERS is set but contains no DNS server addresses.');
    }
    dns.setServers(dnsServers);
  }

  registerConnectionLogging();

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      // Keep production startup from creating or changing indexes implicitly.
      // Development and the isolated in-memory tests retain schema index setup.
      autoIndex: process.env.NODE_ENV !== 'production',
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' && /querySrv/i.test(error.message || '')) {
      throw new Error('MongoDB DNS SRV lookup was refused. Check the configured DNS resolver and cloud database network access.');
    }
    if (error.code === 18) {
      throw new Error('MongoDB authentication failed (code 18). Verify the database user, password encoding, and authentication database.');
    }
    const errorCode = error.code || error.name || 'unknown error';
    throw new Error(`MongoDB connection failed (${errorCode}). Verify the existing cloud URI, database availability, credentials, and network access rules.`);
  }
};

module.exports = connectDB;
