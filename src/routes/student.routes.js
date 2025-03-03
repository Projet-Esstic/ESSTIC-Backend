import express from 'express';
import studentController from '../controllers/StudentController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for Student operations
router.get('/:id', authenticate, studentController.getStudentDetails);

router.put(
  '/academic-info/:studentId',
  authenticate,
  authorizeRoles(['admin', 'teacher']),
  studentController.updateAcademicInfo
);

router.post(
  '/marks/:studentId/:courseId',
  authenticate,
  authorizeRoles(['admin', 'teacher']),
  studentController.updateMarks
);

export default router;
