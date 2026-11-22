const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function ensureAdmin() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in server/.env');
  await connectDB();
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { name: 'Admin', email: email.toLowerCase(), password: hashedPassword, role: 'admin', isActive: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Admin account is ready for ${email}`);
  await mongoose.connection.close();
}

ensureAdmin().catch(async (error) => {
  console.error(`Unable to create admin account: ${error.message}`);
  await mongoose.connection.close();
  process.exitCode = 1;
});
