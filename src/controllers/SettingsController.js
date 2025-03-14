import Settings from "../models/Settings.js"; // Assuming this path

class SettingsController {

    // Get all permissions
    async getAllPermission(req, res) {
        try {
            const settings = await Settings.findOne();
            if (!settings) return res.status(404).json({ message: "Settings not found" });

            return res.status(200).json({
                permissions: settings.permissions,
                message: "List all permissions",
            });
        } catch (error) {
            res.status(500).json({ message: "Server error." });
        }
    }

    // Get all active permissions
    async getActivePermission(req, res) {
        try {
            const settings = await Settings.findOne();
            if (!settings) return res.status(404).json({ message: "Settings not found" });

            const activePermissions = settings.permissions.filter(permission => permission.status);
            return res.status(200).json({
                permissions: activePermissions,
                message: "List all active permissions",
            });
        } catch (error) {
            res.status(500).json({ message: "Server error." });
        }
    }

    // Create a new permission
    async createPermission(req, res) {
        const { name, status } = req.body;
        try {
            const settings = await Settings.findOne();
            if (!settings) {
                let setting = new Settings()
                setting.save()
                return res.status(404).json({ message: "Settings not found" });
            }

            if (settings.permissions.some(permission => permission.name === name)) {
                return res.status(400).json({ message: "Permission already exists" });
            }

            settings.permissions.push({ name, status });
            await settings.save();
            return res.status(200).json({ message: "Permission Created", permissions: settings.permissions });
        } catch (error) {
            res.status(500).json({ message: "Server error." });
        }
    }

    async updatePermissionStatus(req, res) {
        const { name, status } = req.body;

        try {
            const settings = await Settings.findOne();
            if (!settings) {
                return res.status(404).json({ message: "Settings not found" });
            }

            // Find the permission by name
            const permission = settings.permissions.find(permission => permission.name === name);

            if (!permission) {
                return res.status(400).json({ message: `Permission ${name} not found` });
            }

            // Update status
            permission.status = status;

            // Save the updated settings
            await settings.save();

            return res.status(200).json({ message: `Permission ${name} status updated successfully` });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // Delete a permission
    async deletePermission(req, res) {
        const { name } = req.body;
        try {
            const settings = await Settings.findOne();
            if (!settings) return res.status(404).json({ message: "Settings not found" });

            const initialLength = settings.permissions.length;
            settings.permissions = settings.permissions.filter(permission => permission.name !== name);

            if (initialLength === settings.permissions.length) {
                return res.status(400).json({ message: `Permission ${name} does not exist` });
            }

            await settings.save();
            return res.status(200).json({ message: "Permission successfully deleted" });
        } catch (error) {
            res.status(500).json({ message: "Server error." });
        }
    }

    // Get all roles
    async getAllRoles(req, res) {
        try {
            const settings = await Settings.findOne();
            if (!settings) return res.status(404).json({ message: "Settings not found" });

            return res.status(200).json({
                roles: settings.roles,
                message: "List all roles",
            });
        } catch (error) {
            res.status(500).json({ message: "Server error." });
        }
    }

    // Get all active roles
    async getActiveRoles(req, res) {
        try {
            const settings = await Settings.findOne();
            if (!settings) return res.status(404).json({ message: "Settings not found" });

            const activeRoles = settings.roles.filter(role => role.status);
            return res.status(200).json({
                roles: activeRoles,
                message: "List all active roles",
            });
        } catch (error) {
            res.status(500).json({ message: "Server error." });
        }
    }

    // Create or update a role
    async createOrUpdateRole(req, res) {
        const { name, permissions, status } = req.body;

        if (!name || !permissions || !Array.isArray(permissions)) {
            return res.status(400).json({ message: "Invalid role data" });
        }

        try {
            const settings = await Settings.findOne();
            if (!settings) return res.status(404).json({ message: "Settings not found" });

            const existingRoleIndex = settings.roles.findIndex(role => role.name.toLowerCase() === name.toLowerCase());

            if (existingRoleIndex !== -1) {
                // Update existing role
                settings.roles[existingRoleIndex] = { name, permissions, status };
            } else {
                // Add new role
                settings.roles.push({ name, permissions, status });
            }

            await settings.save();
            return res.status(200).json({ message: "Role created/updated successfully" });
        } catch (error) {
            res.status(500).json({ message: "Server error." });
        }
    }
    async updateRoleStatus(req, res) {
        const { name, status } = req.body;
        console.log(req.body);

        try {
            const settings = await Settings.findOne();
            if (!settings) {
                return res.status(404).json({ message: "Settings not found" });
            }

            // Find the permission by name
            const role = settings.roles.find(role => role.name === name);

            if (!role) {
                return res.status(400).json({ message: `Role ${name} not found` });
            }

            // Update status
            role.status = status;

            // Save the updated settings
            await settings.save();

            return res.status(200).json({ message: `Role ${name} status updated successfully` });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    }
    // Delete a role
    async deleteRole(req, res) {
        const { name } = req.body;
        console.log(req.body);
        try {
            const settings = await Settings.findOne();
            if (!settings) return res.status(404).json({ message: "Settings not found" });

            const initialLength = settings.roles.length;
            settings.roles = settings.roles.filter(role => role.name !== name);

            if (initialLength === settings.roles.length) {
                return res.status(400).json({ message: `Role ${name} does not exist` });
            }

            await settings.save();
            return res.status(200).json({ message: "Role successfully deleted" });
        } catch (error) {
            res.status(500).json({ message: "Server error." });
        }
    }
}

export default new SettingsController();
