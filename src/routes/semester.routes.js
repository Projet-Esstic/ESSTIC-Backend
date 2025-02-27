import express from 'express';
import semesterController from '../controllers/SemesterController.js';
import authenticate from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for Semester operations, protected for any authenticated user
router.get('/', authenticate(), semesterController.getAllSemesters);
router.get('/:id', authenticate(), semesterController.getSemester);

// Routes for updating and deleting semesters, protected for admin role
router.put('/:id', authenticate(['admin']), semesterController.updateSemester);
router.delete('/:id', authenticate(['admin']), semesterController.deleteSemester);

export default router; 