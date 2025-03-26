import express from 'express';
import courseController from '../controllers/CourseController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for Course operations
router.get('/', courseController.getAllCourses);
router.get('/:level/:year', courseController.getAllCoursesByYear);
router.get('/:level/:year/not-entrance', courseController.getAllNotEntranceCourses);
router.get('/:level/:year/:id', authenticate, courseController.getCourse);
router.post('/',  courseController.createCourse);
router.put('/:id',  courseController.updateCourse);
router.post('/add-assessment',  courseController.addCourseAssessment);
router.post('/all-assessment',  courseController.getAllCoursesAddAssessment);
router.post('/update-assessment',  courseController.updateCourseAssessment);
router.delete('/:id', courseController.deleteCourse);
router.post('/add-multiple-courses', courseController.addManyCourses);

// Route to duplicate courses from one year to another
router.post('/duplicate/:prevYear/:nextYear', authenticate, authorizeRoles(['admin']), courseController.duplicateCourses);

export default router;
