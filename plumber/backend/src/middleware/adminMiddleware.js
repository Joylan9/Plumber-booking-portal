const { authorizeRoles } = require('./authMiddleware');

// The authorizeRoles middleware already checks if the user has the required role
// This acts as a semantic alias specifically for admin protection.
const adminOnly = authorizeRoles('admin');

module.exports = {
  adminOnly,
};
