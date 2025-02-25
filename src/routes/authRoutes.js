import express from "express";
import { register, login, logout, updateUserRoles } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/register", authMiddleware, roleMiddleware(["admin"]), register);  // Only Admin can create users
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.put("/update-roles", authMiddleware, roleMiddleware(["admin"]), updateUserRoles);

// Role-based routes
router.get("/admin-route", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    res.status(200).json({ message: "Admin Access Granted" });
});

router.get("/manager-route", authMiddleware, roleMiddleware(["admin", "manager"]), (req, res) => {
    res.status(200).json({ message: "Manager or Admin Access Granted" });
});

router.get("/user-route", authMiddleware, roleMiddleware(["user", "manager", "admin"]), (req, res) => {
    res.status(200).json({ message: "User Access Granted" });
});

export default router;
