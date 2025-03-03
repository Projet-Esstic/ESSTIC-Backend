import express from 'express';
import entranceExamController from '../controllers/EntranceExamController.js';
import authenticate from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', entranceExamController.getAllEntranceExams);
router.get('/:id', entranceExamController.getEntranceExam);
router.get('/department/:departmentId', entranceExamController.getEntranceExamsByDepartment);

// Protected routes
router.post('/', entranceExamController.createEntranceExam);
router.put('/:id', authenticate(['admin']), entranceExamController.updateEntranceExam);
router.delete('/:id', authenticate(['admin']), entranceExamController.deleteEntranceExam);

export default router;