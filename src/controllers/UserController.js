import BaseController from './BaseController.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import createError from 'http-errors';

class UserController extends BaseController {
    constructor() {
        super(User);
    }

    async register(req, res, next) {
        try {
            const userData = req.body;
            const user = await User.create(userData);
            
            // Remove sensitive data
            const userResponse = user.toJSON();
            delete userResponse.password;
            delete userResponse.security;

            res.status(201).json(userResponse);
        } catch (error) {
            next(this.handleError(error, 'user registration'));
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            
            // Include security fields in query
            const user = await User.findOne({ email })
                .select('+password +security.loginAttempts +security.lockUntil');

            if (!user) {
                throw createError(401, 'Invalid credentials');
            }

            // Check if account is locked
            if (user.isLocked) {
                throw createError(423, 'Account is temporarily locked');
            }

            // Verify password
            const isValid = await user.comparePassword(password);
            if (!isValid) {
                await user.incrementLoginAttempts();
                throw createError(401, 'Invalid credentials');
            }

            // Reset login attempts on successful login
            await User.findByIdAndUpdate(user._id, {
                $set: { 'security.loginAttempts': 0 },
                $unset: { 'security.lockUntil': 1 },
                lastLogin: new Date()
            });

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, roles: user.roles },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({ token, user: user.toJSON() });
        } catch (error) {
            next(this.handleError(error, 'user login'));
        }
    }

    async getProfile(req, res, next) {
        try {
            const user = await User.findById(req.user.userId)
                .select('-security');
            
            if (!user) {
                throw createError(404, 'User not found');
            }

            res.json(user);
        } catch (error) {
            next(this.handleError(error, 'get profile'));
        }
    }
}

export default new UserController(); 