const { getDatabase } = require('../database/connection');
const logger = require('../utils/logger');

// Permission levels
const PERMISSIONS = {
  ADVISOR: {
    level: 3,
    permissions: [
      'manage_users',
      'manage_tasks',
      'manage_points',
      'manage_groups',
      'manage_task_types',
      'view_all_data',
      'approve_tasks',
      'assign_roles'
    ]
  },
  PARENT: {
    level: 2,
    permissions: [
      'view_family_data',
      'approve_tasks',
      'award_bonus_points',
      'view_reports'
    ]
  },
  MEMBER: {
    level: 1,
    permissions: [
      'view_own_data',
      'complete_tasks',
      'upload_achievements'
    ]
  }
};

// Get user roles from database
async function getUserRoles(userId) {
  try {
    const db = await getDatabase();
    
    // Get primary role
    const user = await db.query('SELECT primary_role FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return [];
    }
    
    // Get additional roles
    const additionalRoles = await db.query('SELECT role FROM user_roles WHERE user_id = ?', [userId]);
    
    const roles = [user[0].primary_role];
    additionalRoles.forEach(roleRow => {
      if (!roles.includes(roleRow.role)) {
        roles.push(roleRow.role);
      }
    });
    
    return roles;
  } catch (error) {
    logger.error('Error getting user roles:', error);
    return [];
  }
}

// Get all permissions for a user
async function getUserPermissions(userId) {
  const roles = await getUserRoles(userId);
  const permissions = new Set();
  
  roles.forEach(role => {
    const roleUpper = role.toUpperCase();
    if (PERMISSIONS[roleUpper]) {
      PERMISSIONS[roleUpper].permissions.forEach(permission => {
        permissions.add(permission);
      });
    }
  });
  
  return Array.from(permissions);
}

// Check if user has specific permission
async function hasPermission(userId, permission) {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

// Get highest role level for a user
async function getUserLevel(userId) {
  const roles = await getUserRoles(userId);
  let maxLevel = 0;
  
  roles.forEach(role => {
    const roleUpper = role.toUpperCase();
    if (PERMISSIONS[roleUpper] && PERMISSIONS[roleUpper].level > maxLevel) {
      maxLevel = PERMISSIONS[roleUpper].level;
    }
  });
  
  return maxLevel;
}

// Middleware to check permissions
function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const hasAccess = await hasPermission(req.user.id, permission);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    } catch (error) {
      logger.error('Permission check failed:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

// Middleware to check role level
function requireLevel(minLevel) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userLevel = await getUserLevel(req.user.id);
      if (userLevel < minLevel) {
        return res.status(403).json({ error: 'Insufficient role level' });
      }
      
      next();
    } catch (error) {
      logger.error('Level check failed:', error);
      res.status(500).json({ error: 'Level check failed' });
    }
  };
}

// Middleware to check if user can manage another user
function canManageUser() {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const targetUserId = req.params.userId || req.body.userId;
      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID required' });
      }
      
      // Users can always manage themselves
      if (parseInt(targetUserId) === req.user.id) {
        return next();
      }
      
      // Check if user has manage_users permission
      const canManage = await hasPermission(req.user.id, 'manage_users');
      if (!canManage) {
        return res.status(403).json({ error: 'Cannot manage other users' });
      }
      
      // Advisors can manage anyone, but check level hierarchy
      const userLevel = await getUserLevel(req.user.id);
      const targetLevel = await getUserLevel(parseInt(targetUserId));
      
      if (userLevel <= targetLevel && parseInt(targetUserId) !== req.user.id) {
        return res.status(403).json({ error: 'Cannot manage users of equal or higher level' });
      }
      
      next();
    } catch (error) {
      logger.error('User management check failed:', error);
      res.status(500).json({ error: 'User management check failed' });
    }
  };
}

module.exports = {
  PERMISSIONS,
  getUserRoles,
  getUserPermissions,
  hasPermission,
  getUserLevel,
  requirePermission,
  requireLevel,
  canManageUser
};
