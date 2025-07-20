const request = require('supertest');
const { validateEnvironment } = require('../server/utils/envValidator');
const { sanitizeValue } = require('../server/middleware/sanitizer');

describe('Security Improvements', () => {
  
  describe('Environment Validation', () => {
    it('should validate required environment variables', () => {
      // Save original env
      const originalEnv = { ...process.env };
      
      // Test missing required vars
      delete process.env.DB_HOST;
      expect(validateEnvironment()).toBe(false);
      
      // Restore env
      process.env = originalEnv;
      expect(validateEnvironment()).toBe(true);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML content', () => {
      const input = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeValue(input, { escapeHtml: true });
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    it('should detect SQL injection patterns', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1 OR 1=1",
        "UNION SELECT password FROM users"
      ];

      maliciousInputs.forEach(input => {
        expect(() => {
          sanitizeValue(input, { strict: true });
        }).toThrow('Suspicious input detected');
      });
    });

    it('should sanitize email addresses', () => {
      const email = '  TEST@EXAMPLE.COM  ';
      const sanitized = sanitizeValue(email, { email: true });
      expect(sanitized).toBe('test@example.com');
    });

    it('should enforce length limits', () => {
      const longString = 'a'.repeat(1000);
      const sanitized = sanitizeValue(longString, { maxLength: 100 });
      expect(sanitized.length).toBe(100);
    });
  });

  describe('Logging System', () => {
    it('should have logger utility available', () => {
      const logger = require('../server/utils/logger');
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
    });
  });

});

describe('Performance Improvements', () => {
  
  describe('Database Indexes', () => {
    it('should have index file for performance optimization', () => {
      const fs = require('fs');
      const path = require('path');
      
      const indexFile = path.join(__dirname, '../schema/indexes.sql');
      expect(fs.existsSync(indexFile)).toBe(true);
      
      const content = fs.readFileSync(indexFile, 'utf8');
      expect(content).toContain('CREATE INDEX');
      expect(content).toContain('idx_tasks_status');
      expect(content).toContain('idx_users_email');
    });
  });

});