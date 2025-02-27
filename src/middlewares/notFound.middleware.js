/**
 * Middleware to handle not found routes.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const notFound = (req, res, next) => {
    res.status(404).json({
        message: "Route not found"
    });
};

export default notFound; 