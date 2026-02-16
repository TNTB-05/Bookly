import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getUserFromToken } from './auth';

/**
 * ProtectedRoute - Wraps routes that require authentication and specific roles
 * @param {string[]} allowedRoles - Which roles can access this route ['provider', 'costumer']
 * @param {JSX.Element} children - The component to render if authorized
 */
export default function ProtectedRoute({ allowedRoles, children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const user = getUserFromToken();

    // Not logged in at all → redirect to appropriate login page
    if (!isAuthenticated || !user) {
        let loginPath = '/login';
        if (location.pathname.startsWith('/admin')) {
            loginPath = '/admin/login';
        } else if (location.pathname.startsWith('/provider') || location.pathname.startsWith('/ProvDash')) {
            loginPath = '/provider/login';
        }
        
        // Save where they were trying to go (for redirect after login)
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    // Logged in but wrong role → redirect to their correct dashboard
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        let redirectPath = '/dashboard';
        if (user.role === 'provider') {
            redirectPath = '/ProvDash';
        } else if (user.role === 'admin') {
            redirectPath = '/admin/dashboard';
        }
        
        return <Navigate to={redirectPath} replace />;
    }

    // Authorized! Render the protected component
    return children;
}
