const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const User = require('../models/User');

const SETUP_UNAVAILABLE = { success: false, message: 'Admin setup is unavailable.' };
const SETUP_ALREADY_USED = { success: false, message: 'Admin setup has already been completed.' };

function safeSecretMatch(candidate, expected) {
  if (typeof candidate !== 'string' || typeof expected !== 'string') return false;
  const candidateBuffer = Buffer.from(candidate, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return candidateBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(candidateBuffer, expectedBuffer);
}

exports.setupAdmin = async (req, res, next) => {
  res.set('Cache-Control', 'no-store');

  const setupSecret = process.env.ADMIN_SETUP_SECRET;
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const validConfiguredEmail = configuredEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail);
  if (!setupSecret || Buffer.byteLength(setupSecret, 'utf8') < 32
      || setupSecret === process.env.JWT_SECRET || !validConfiguredEmail) {
    return res.status(404).json(SETUP_UNAVAILABLE);
  }

  if (!safeSecretMatch(req.get('x-admin-setup-secret'), setupSecret)) {
    return res.status(403).json(SETUP_UNAVAILABLE);
  }

  const password = req.body?.password;
  if (typeof password !== 'string'
      || Buffer.byteLength(password, 'utf8') < 16
      || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({
      success: false,
      message: 'Password must be between 16 and 72 UTF-8 bytes.',
    });
  }

  try {
    const existing = await User.findOne({ email: configuredEmail }).select('+adminSetupCompleted');
    if (existing?.adminSetupCompleted) return res.status(409).json(SETUP_ALREADY_USED);

    const hashedPassword = await bcrypt.hash(password, 10);
    const updates = {
      email: configuredEmail,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      adminSetupCompleted: true,
    };

    if (existing) {
      const updated = await User.findOneAndUpdate(
        { _id: existing._id, adminSetupCompleted: { $ne: true } },
        { $set: updates },
        { new: true, runValidators: true }
      );
      if (!updated) return res.status(409).json(SETUP_ALREADY_USED);
    } else {
      try {
        // The existing unique users.email index makes concurrent first-time
        // creation atomic: one insert wins and duplicate-key losers get 409.
        await User.create({ name: 'Admin', ...updates });
      } catch (error) {
        // Concurrent registration/setup for this unique email may win first.
        if (error.code === 11000) return res.status(409).json(SETUP_ALREADY_USED);
        throw error;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Admin account setup completed. Remove ADMIN_SETUP_SECRET from the Render environment now.',
    });
  } catch (error) {
    return next(error);
  }
};
