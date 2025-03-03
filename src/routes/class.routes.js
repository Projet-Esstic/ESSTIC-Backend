import express from 'express';
import classController from '../controllers/class.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Base route: /api/classes

// Create a new class (Admin only)
router.post(
    '/',
    authenticate,
    authorizeRoles(['admin']),
    classController.createClass
);

// Get all classes
router.get(
    '/',
    authenticate,
    authorizeRoles(['admin', 'teacher']),
    classController.getAllClasses
);

// Get class by ID
router.get(
    '/:id',
    authenticate,
    authorizeRoles(['admin', 'teacher']),
    classController.getClassById
);

// Update class
router.put(
    '/:id',
    authenticate,
    authorizeRoles(['admin']),
    classController.updateClass
);

// Delete class
router.delete(
    '/:id',
    authenticate,
    authorizeRoles(['admin']),
    classController.deleteClass
);

// Add course to class
router.post(
    '/:id/courses',
    authenticate,
    authorizeRoles(['admin']),
    classController.addCourseToClass
);

// Remove course from class
router.delete(
    '/:id/courses/:courseId',
    authenticate,
    authorizeRoles(['admin']),
    classController.removeCourseFromClass
);

// Add students to class
router.post(
    '/:id/students',
    authenticate,
    authorizeRoles(['admin']),
    classController.addStudentsToClass
);

// Remove student from class
router.delete(
    '/:id/students/:studentId',
    authenticate,
    authorizeRoles(['admin']),
    classController.removeStudentFromClass
);

// Get class schedule
router.get(
    '/:id/schedule',
    authenticate,
    authorizeRoles(['admin', 'teacher', 'student']),
    classController.getClassSchedule
);

export default router;
