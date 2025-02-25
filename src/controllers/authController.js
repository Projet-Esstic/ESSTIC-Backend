import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../services/emailService.js";
import generatePassword from "../services/passwordService.js";

export const register = async (req, res) => {
    try {
        const { name, email, roles } = req.body;  // 👈 Accept an array of roles

        // Generate password
        const { randomPassword, hashedPassword } = await generatePassword();

        const user = new User({ name, email, password: hashedPassword, roles });  // 👈 Store multiple roles
        await user.save();

        // Send email with generated password
        await sendEmail(email, "Your Account Details", `Your password: ${randomPassword}`);

        res.status(201).json({ message: "User registered successfully. Check your email for the password." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Generate JWT with roles
        const token = jwt.sign({ id: user._id, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const logout = (req, res) => {
    res.status(200).json({ message: "User logged out successfully" });
};

export const updateUserRoles = async (req, res) => {
    try {
        const { userId, roles } = req.body; // Get userId and new roles from request
        const adminId = req.user.id; // Logged-in admin's ID

        if (userId === adminId) {
            return res.status(403).json({ message: "You cannot change your own role!" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        user.roles = roles; // Assign new roles
        await user.save();

        return res.status(200).json({ message: "User roles updated successfully!", user });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
