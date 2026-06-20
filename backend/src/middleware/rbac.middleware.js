'use strict';

const { PERMISSIONS } = require('../constants/permissions');
const { sendForbidden } = require('../utils/apiResponse');

/**
 * RBAC middleware factory.
 * Usage: authorize('products', 'read')
 * Checks if req.user.role has permission for the given resource and action.
 */
const authorize = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendForbidden(res, 'Authentication required');
    }

    const resourcePermissions = PERMISSIONS[resource];
    if (!resourcePermissions) {
      return sendForbidden(res, `Unknown resource: ${resource}`);
    }

    const allowedRoles = resourcePermissions[action];
    if (!allowedRoles) {
      return sendForbidden(res, `Unknown action: ${action} on resource: ${resource}`);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendForbidden(
        res,
        `Your role (${req.user.role}) does not have permission to ${action} ${resource}`
      );
    }

    next();
  };
};

/**
 * Allows access only if user is modifying their own resource OR is an ADMIN.
 * Usage: authorizeOwnerOrAdmin('userId') — where 'userId' is the param name
 */
const authorizeOwnerOrAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    const { ROLES } = require('../constants/roles');
    if (req.user.role === ROLES.ADMIN) return next();
    if (req.params[paramName] === req.user.userId) return next();
    return sendForbidden(res, 'You can only access your own resources');
  };
};

module.exports = { authorize, authorizeOwnerOrAdmin };
