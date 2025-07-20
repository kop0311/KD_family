const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/connection');
const logger = require('../utils/logger');

const authenticateToken = async(req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const db = await getDatabase();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const users = await db.query(
      'SELECT id, username, email, full_name, primary_role as role, avatar_url, group_id FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const requireAdmin = requireRole(['advisor', 'parent']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin
};
