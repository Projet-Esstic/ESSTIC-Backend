import express from 'express';
import entranceExamController from '../controllers/EntranceExamController.js';
import authenticate from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for Entrance Exam operations
router.get('/', authenticate(), entranceExamController.getAllExams);
router.get('/:id', authenticate(), entranceExamController.getExam);
router.post('/', authenticate(['admin']), entranceExamController.createExam);
router.put('/:id', authenticate(['admin']), entranceExamController.updateExam);
router.delete('/:id', authenticate(['admin']), entranceExamController.deleteExam);

export default router; 