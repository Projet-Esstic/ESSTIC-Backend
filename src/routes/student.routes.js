import express from 'express';
import studentController from '../controllers/StudentController.js';
import authenticate from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for Student operations
router.get('/:id', authenticate(), studentController.getStudentDetails);
router.put('/academic-info/:studentId', authenticate(['admin', 'teacher']), studentController.updateAcademicInfo);
router.post('/marks/:studentId/:courseId', authenticate(['admin', 'teacher']), studentController.updateMarks);

export default router; 