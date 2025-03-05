import express from 'express';
import entranceExamController from '../controllers/EntranceExamController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', entranceExamController.getAllEntranceExams);
router.get('/:id', entranceExamController.getEntranceExam);
router.get('/department/:departmentId', entranceExamController.getEntranceExamsByDepartment);

// Protected routes
router.post(
  '/',
  // authenticate,
  // authorizeRoles(['admin']),
  entranceExamController.createEntranceExam
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles(['admin']),
  entranceExamController.updateEntranceExam
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles(['admin']),
  entranceExamController.deleteEntranceExam
);

export default router;
