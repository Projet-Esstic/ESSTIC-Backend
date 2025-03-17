import express from 'express';
import { courseModuleController } from '../controllers/courseModuleController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Base route: /api/modules

// Public routes
router.get('/', courseModuleController.getAll);
router.get('/:id', courseModuleController.getById);

// Protected routes
router.use(authenticate);
router.post('/', courseModuleController.create);
router.put('/:id', courseModuleController.update);
router.delete('/:id', courseModuleController.delete);

// Course management within modules
router.post('/:moduleId/courses', courseModuleController.addCourse);
router.delete('/:moduleId/courses/:courseId', courseModuleController.removeCourse);

export default router; 