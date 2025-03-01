import createError from 'http-errors';

class BaseController {
    constructor(model) {
        this.model = model;
    }

    // Common error handler
    handleError(error, operation) {
        console.error(`Error in ${operation}:`, error);
        if (error.name === 'ValidationError') {
            return createError(400, error.message);
        }
        if (error.name === 'CastError') {
            return createError(400, 'Invalid ID format');
        }
        if (error.code === 11000) {
            return createError(409, 'Duplicate entry found');
        }else{
            console.log(error);
        }
        return createError(500, 'Internal server error');
    }
}

export default BaseController; 