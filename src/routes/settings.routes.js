import express from "express";
import SettingsController from "../controllers/SettingsController.js";
import { getPermissionsFromRoles } from "../middleware/role.middleware.js";
const router = express.Router();

// Permissions Routes
router.get("/permissions", SettingsController.getAllPermission);
router.get("/permissions/active", SettingsController.getActivePermission);
router.post("/permissions", SettingsController.createPermission);
router.delete("/permissions", SettingsController.deletePermission);
router.put("/permissions/update-status", SettingsController.updatePermissionStatus);

// Roles Routes
router.get("/roles", SettingsController.getAllRoles);
router.get("/roles/active", SettingsController.getActiveRoles);
router.post("/roles", SettingsController.createOrUpdateRole);
router.delete("/roles", SettingsController.deleteRole);

router.get("/roles/permissions", getPermissionsFromRoles,(req, res) => {
    res.status(200).json({ permissions: req.permissions });
  });

export default router;
