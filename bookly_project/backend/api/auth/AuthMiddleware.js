const jwt = require('jsonwebtoken');

const AuthMiddleware = (req, res, next) => {
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

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
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
            
            // Attach the decoded JWT payload to the request object
            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            message: 'Authentication error occurred' 
        });
    }
};

module.exports = AuthMiddleware;