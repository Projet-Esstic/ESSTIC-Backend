import express from 'express';
import courseController from '../controllers/CourseController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for Course operations
router.get('/', courseController.getAllCourses);
router.get('/:id', authenticate, courseController.getCourse);
router.post('/',
    //  authenticate, authorizeRoles(['admin', 'teacher']), 
     courseController.createCourse);
router.put('/:id', authenticate, authorizeRoles(['admin', 'teacher']), courseController.updateCourse);
router.delete('/:id', authenticate, authorizeRoles(['admin']), courseController.deleteCourse);

export default router;
