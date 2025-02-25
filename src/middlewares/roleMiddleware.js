const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            return res.status(403).json({ message: "Access Denied: No role assigned" });
        }

        // Check if user has at least one of the required roles
        const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
        
        if (!hasRole) {
            return res.status(403).json({ message: "Access Denied: Insufficient Permissions" });
        }

        next();
    };
};

export default roleMiddleware;
