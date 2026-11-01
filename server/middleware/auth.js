const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized, token missing' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }

  try {
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'Not authorized, account not found' });
    if (user.isActive === false) return res.status(403).json({ success: false, message: 'Account is disabled' });

    // Role and active status come from MongoDB so demotions and suspensions
    // take effect immediately, even while a previously issued JWT is valid.
    req.user = { id: user._id.toString(), role: user.role };
    req.userFull = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

exports.authorize = (roles = []) => {
  if (typeof roles === 'string') roles = [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
};
