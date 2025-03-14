import express from 'express';
import UserController from '../controllers/UserController.js';
import { getPermissionsFromRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login, getPermissionsFromRoles, (req, res) => {
    res.status(200).json({ token: res.token, user: res.user, permissions: req.permissions });
});

export default router;
