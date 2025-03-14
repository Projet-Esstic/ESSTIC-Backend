import Settings from "../models/Settings.js"; // Import Settings model

export const getPermissionsFromRoles = async (req, res, next) => {
    try {
        const roles = req.user?.roles || req.body.roles;
        // const roles 

        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({ message: "Invalid roles input" });
        }

        const settings = await Settings.findOne();
        // Fetch roles from settings
        if (!settings) {
            return res.status(404).json({ message: "Settings not found" });
        }

        // Fetch all available permission types dynamically
        const permissionData = settings.permissions;
        // console.log(permissionData)
        if (!permissionData || !Array.isArray(permissionData) || permissionData.length === 0) {
            return res.status(404).json({ message: "Permission types not found" });
        }

        const availablePermissions = permissionData.filter(m => m.status)?.map(m => m.name); // e.g., ["read", "write", "create", "delete", "update"]

        // Initialize an empty permissions object dynamically
        let mergedPermissions = {};
        availablePermissions.forEach(type => {
            mergedPermissions[type] = [];
        });


        roles.forEach(roleName => {
            const role = settings.roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
            if (role) {
                role.permissions.forEach(permissionType => {
                    if (availablePermissions.includes(permissionType.name)) {
                        mergedPermissions[permissionType.name] = [
                            ...new Set([...mergedPermissions[permissionType.name], ...permissionType.pages])
                        ];
                    }
                });
            }
        });
        req.permissions = mergedPermissions
        next()

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
