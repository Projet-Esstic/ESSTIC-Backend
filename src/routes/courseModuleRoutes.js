import express from 'express';
import {
    createCourseModule,
    getAllCourseModules, getCourseModuleById, updateCourseModule, 
    deleteCourseModule, duplicateModuleForNextYear, addCourseToModule
} from '../controllers/courseModuleController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Base route: /api/modules

// Public routes
router.get('/:level/:year', getAllCourseModules);  // Get all course modules
router.get('/:id', getCourseModuleById);  // Get a specific course module by ID

// Protected routes (authentication required)
// router.use(authenticate);

// Create a new course module
router.post('/', createCourseModule);

// Update an existing course module by ID
router.put('/:id', updateCourseModule);

// Delete a course module by ID
router.delete('/:id', deleteCourseModule);

// Duplicate a course module for the next academic year
router.post('/:moduleCode/duplicate', duplicateModuleForNextYear);  // Duplicate module for the next year

// Add a course to a module
router.post('/:moduleId/courses', addCourseToModule);  // Add a course to the specified module

export default router;
