import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authenticate = (roles = []) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1]; // Bearer Token
            if (!token) {
                return res.status(401).json({ message: 'No token provided.' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('+roles');

            if (!user) {
                return res.status(401).json({ message: 'User not found.' });
            }

            // If roles are specified, check if the user has any of the required roles
            if (roles.length && !roles.some(role => user.roles.includes(role))) {
                return res.status(403).json({ message: 'Insufficient permissions.' });
            }

            // Attach user to the request object
            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token.' });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired.' });
            } else {
                return res.status(500).json({ message: 'Failed to authenticate.' });
            }
        }
    };
};

export default authenticate; 