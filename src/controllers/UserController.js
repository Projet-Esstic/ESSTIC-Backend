import BaseController from './BaseController.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import createError from 'http-errors';

class UserController extends BaseController {
    constructor() {
        super(User);
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.getProfile = this.getProfile.bind(this);
    }

    /*async register(req, res, next) {
        try {
            const userData = req.body;
            const user = await User.create(userData);
            
            // Remove sensitive data
            const userResponse = user.toJSON();
            delete userResponse.password;
            delete userResponse.security;

            res.status(201).json(userResponse);
        } catch (error) {
            console.log(this)
            next(this.handleError(error, 'user registration'));
        }
    }*/
    async register (req, res) {
        try {
            const {
                firstName,
                lastName,
                email,
                password,
                phoneNumber,
                dateOfBirth,
                gender,
                roles
            } = req.body;
    
            // Validate required fields
            if (!firstName || !lastName || !email || !password || !dateOfBirth) {
                return res.status(400).json({ message: 'Missing required fields: firstName, lastName, email, password, or dateOfBirth.' });
            }
    
            // Check if the email is already registered
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email is already registered.' });
            }
    
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
    
            // Create the new user
            const newUser = new User({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                phoneNumber,
                dateOfBirth,
                gender,
                roles: roles || ['candidate'] // Default role is 'candidate'
            });
    
            // Save the user to the database
            await newUser.save();
    
            // Return the created user (excluding sensitive fields)
            const userResponse = {
                _id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                dateOfBirth: newUser.dateOfBirth,
                gender: newUser.gender,
                roles: newUser.roles,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt
            };
    
            return res.status(201).json({ message: 'User registered successfully.', user: userResponse });
    
        } catch (error) {
            console.error('Error in registerUser:', error);
            return res.status(500).json({ message: 'Internal server error.' });
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
            console.log("error test:",error.message)
            // console.log("error test:",error.code)
            res.json(error);
            // next(this.handleError(error, 'user login'));
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