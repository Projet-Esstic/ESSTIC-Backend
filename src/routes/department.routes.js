import express from 'express';
import departmentController from '../controllers/DepartmentController.js';
import authenticate from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for Department operations
router.get('/', authenticate(), departmentController.getAllDepartments);
router.get('/:id', authenticate(), departmentController.getDepartment);
router.post('/', authenticate(['admin']), departmentController.createDepartment);
router.put('/:id', authenticate(['admin']), departmentController.updateDepartment);
router.delete('/:id', authenticate(['admin']), departmentController.deleteDepartment);

export default router; 