const jwt = require('jsonwebtoken');
const { pool } = require('../../sql/database');

const AuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                message: 'No token provided',
                error: 'Missing authorization token'
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET not configured');
            return res.status(500).json({ 
                message: 'Server configuration error' 
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            const statusCode = err.name === 'TokenExpiredError' ? 401 : 403;
            const message = err.name === 'TokenExpiredError' 
                ? 'Token expired'
                : 'Invalid token';
            
            return res.status(statusCode).json({ 
                message,
                error: err.message,
                tokenExpired: err.name === 'TokenExpiredError'
            });
        }

        req.user = decoded;

        // Check admin exists in DB (no bypass)
        if (decoded.role === 'admin') {
            const [admins] = await pool.query(
                'SELECT id FROM admins WHERE id = ?',
                [decoded.userId]
            );
            if (admins.length === 0) {
                return res.status(403).json({
                    message: 'Admin fiók nem található',
                    banned: true
                });
            }
            return next();
        }

        // Check account status in DB for providers
        if (decoded.role === 'provider') {
            const [providers] = await pool.query(
                'SELECT status FROM providers WHERE id = ?',
                [decoded.userId]
            );
            if (providers.length === 0 || providers[0].status === 'banned' || providers[0].status === 'deleted' || providers[0].status === 'inactive') {
                return res.status(403).json({
                    message: 'A fiók le van tiltva vagy törölve',
                    banned: true
                });
            }
        } else {
            // Check account status in DB for customers/users
            const [users] = await pool.query(
                'SELECT status FROM users WHERE id = ?',
                [decoded.userId]
            );
            if (users.length === 0 || users[0].status === 'banned' || users[0].status === 'deleted') {
                return res.status(403).json({
                    message: 'A fiók le van tiltva vagy törölve',
                    banned: true
                });
            }
        }

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            message: 'Authentication error occurred' 
        });
    }
};

module.exports = AuthMiddleware;