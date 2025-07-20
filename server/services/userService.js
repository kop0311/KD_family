const { getDatabase } = require('../database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class UserService {
  async createUser({ username, email, password, fullName, role = 'member' }) {
    try {
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert user
      const result = await db.db.query(
        'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
        [username, email, passwordHash, fullName, role]
      );

      logger.info(`User created: ${username} (ID: ${result.insertId})`);

      return {
        id: result.insertId,
        username,
        email,
        fullName,
        role
      };
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async authenticateUser(username, password) {
    try {
      const users = await db.db.query(
        'SELECT id, username, email, password_hash, full_name, role, avatar_url FROM users WHERE username = ? OR email = ?',
        [username, username]
      );

      if (users.length === 0) {
        logger.warn(`Authentication failed for user: ${username} - user not found`);
        return null;
      }

      const user = users[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        logger.warn(`Authentication failed for user: ${username} - invalid password`);
        return null;
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      logger.info(`User authenticated successfully: ${username}`);

      // Remove password hash from response
      delete user.password_hash;

      return {
        user,
        token
      };
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const users = await db.db.query(
        'SELECT id, username, email, full_name, role, avatar_url, created_at FROM users WHERE id = ?',
        [userId]
      );

      return users.length > 0 ? users[0] : null;
    } catch (error) {
      logger.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  async updateUserAvatar(userId, avatarUrl) {
    try {
      await db.db.query(
        'UPDATE users SET avatar_url = ? WHERE id = ?',
        [avatarUrl, userId]
      );

      logger.info(`Avatar updated for user ID: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error updating user avatar:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const users = await db.db.query(
        'SELECT id, username, email, full_name, role, avatar_url, created_at FROM users ORDER BY created_at DESC'
      );

      return users;
    } catch (error) {
      logger.error('Error fetching all users:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
