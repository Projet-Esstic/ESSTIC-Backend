import express from 'express';
import semesterController from '../controllers/SemesterController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for Semester operations, accessible by any authenticated user
router.get('/:level/:academicYear', 
    // authenticate, // Uncomment to enable authentication
    semesterController.getAllSemesters);

router.get('/:id', 
    // authenticate, // Uncomment to enable authentication
    semesterController.getSemester);

router.post(
    '/',
    // authenticate, // Uncomment to enable authentication
    // authorizeRoles(['admin', 'professor']), // Example: Only 'admin' or 'professor' can create semesters
    semesterController.createSemester
);

// Routes for updating and deleting semesters, protected for admin role
router.put('/:id', 
    // authenticate, // Uncomment to enable authentication
    // authorizeRoles(['admin']), // Only 'admin' can update semesters
    semesterController.updateSemester);

router.delete('/:id', 
    // authenticate, // Uncomment to enable authentication
    // authorizeRoles(['admin']), // Only 'admin' can delete semesters
    semesterController.deleteSemester);

// Route to duplicate a semester to the next academic year
router.post('/duplicate', 
    // authenticate, // Uncomment to enable authentication
    // authorizeRoles(['admin']), // Only 'admin' can duplicate semesters
    semesterController.duplicateSemesterToNextYear);

export default router;
