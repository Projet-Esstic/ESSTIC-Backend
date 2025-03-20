import express from 'express';
import courseController from '../controllers/CourseController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for Course operations
router.get('/:level/:year', courseController.getAllCourses);
router.get('/:level/:year/not-entrance', courseController.getAllNotEntranceCourses);
router.get('/:level/:year/:id', authenticate, courseController.getCourse);
router.post('/:level/:year',  courseController.createCourse);
router.put('/:level/:year/:id',  courseController.updateCourse);
router.delete('/:level/:year/:id', authenticate, authorizeRoles(['admin']), courseController.deleteCourse);

// Route to duplicate courses from one year to another
router.post('/duplicate/:prevYear/:nextYear', authenticate, authorizeRoles(['admin']), courseController.duplicateCourses);

export default router;
