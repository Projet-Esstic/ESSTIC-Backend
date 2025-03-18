import express from 'express';
import departmentController from '../controllers/DepartmentController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for Department operations
router.get('/', departmentController.getAllDepartments);
router.get('/:id', authenticate, departmentController.getDepartment);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

export default router;
