/**
 * Middleware factory that creates a role checker.
 * Use after AuthMiddleware to restrict routes to specific user roles.
 * 
 * @param {string[]} allowedRoles - Array of roles that can access the route (e.g., ['provider'], ['customer'], ['provider', 'admin'])
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Only providers can access this route
 * router.get('/provider/services', AuthMiddleware, requireRole(['provider']), handler);
 * 
 * @example
 * // Both providers and admins can access this route
 * router.get('/admin/stats', AuthMiddleware, requireRole(['provider', 'admin']), handler);
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        // req.user is set by AuthMiddleware (the decoded JWT payload)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'No user data found in request. Ensure AuthMiddleware runs before RoleMiddleware.'
            });
        }

        const userRole = req.user.role;

        // Check if user's role is in the allowed roles array
        if (!allowedRoles.includes(userRole)) {
            console.warn(`Access denied: User with role '${userRole}' attempted to access route requiring ${allowedRoles.join(' or ')}`);
            
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.',
                error: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`
            });
        }

        // User has the correct role, proceed to route handler
        next();
    };
};

module.exports = { requireRole };
