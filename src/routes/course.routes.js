import express from 'express';
import courseController from '../controllers/CourseController.js';
import authenticate from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for Course operations
router.get('/', courseController.getAllCourses);
router.get('/:id', authenticate(), courseController.getCourse);
router.post('/',  courseController.createCourse);
router.put('/:id', authenticate(['admin', 'teacher']), courseController.updateCourse);
router.delete('/:id', authenticate(['admin']), courseController.deleteCourse);

export default router; 