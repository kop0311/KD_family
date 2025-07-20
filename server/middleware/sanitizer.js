const validator = require('validator');
const logger = require('../utils/logger');

// HTML entities that should be escaped
const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return unsafe;

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// SQL injection patterns to detect
const sqlInjectionPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
  /(UNION\s+SELECT)/i,
  /(\bOR\b.*=.*)/i,
  /(\bAND\b.*=.*)/i,
  /(--|\/\*|\*\/)/,
  /(\bxp_\w+)/i
];

// XSS patterns to detect
const xssPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi
];

// Check for potential SQL injection
const detectSqlInjection = (input) => {
  if (typeof input !== 'string') return false;

  return sqlInjectionPatterns.some(pattern => pattern.test(input));
};

// Check for potential XSS
const detectXss = (input) => {
  if (typeof input !== 'string') return false;

  return xssPatterns.some(pattern => pattern.test(input));
};

// Sanitize a single value
const sanitizeValue = (value, options = {}) => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    let sanitized = value;

    // Trim whitespace
    sanitized = sanitized.trim();

    // Detect potential attacks
    if (detectSqlInjection(sanitized)) {
      logger.warn('Potential SQL injection detected:', sanitized);
      if (options.strict) {
        throw new Error('Suspicious input detected');
      }
    }

    if (detectXss(sanitized)) {
      logger.warn('Potential XSS detected:', sanitized);
      if (options.strict) {
        throw new Error('Suspicious input detected');
      }
    }

    // Apply sanitization based on field type
    if (options.email) {
      sanitized = validator.normalizeEmail(sanitized) || sanitized;
    }

    if (options.escapeHtml) {
      sanitized = escapeHtml(sanitized);
    }

    // Length limits
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    return sanitized;
  }

  if (typeof value === 'number') {
    // Ensure it's a safe number
    if (!Number.isFinite(value)) {
      throw new Error('Invalid number');
    }
    return value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  // For arrays and objects, recursively sanitize
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, options));
  }

  if (typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val, options);
    }
    return sanitized;
  }

  return value;
};

// Middleware to sanitize request data
const sanitizeInput = (options = {}) => {
  return (req, res, next) => {
    try {
      // Sanitize body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body, {
          escapeHtml: true,
          maxLength: 10000,
          ...options
        });
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeValue(req.query, {
          escapeHtml: true,
          maxLength: 1000,
          ...options
        });
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeValue(req.params, {
          maxLength: 100,
          ...options
        });
      }

      next();
    } catch (error) {
      logger.error('Input sanitization error:', error);
      res.status(400).json({
        error: 'Invalid input data',
        details: error.message
      });
    }
  };
};

// Strict sanitizer for sensitive operations
const strictSanitize = sanitizeInput({ strict: true });

module.exports = {
  sanitizeInput,
  strictSanitize,
  sanitizeValue,
  escapeHtml
};
