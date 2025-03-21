import express from 'express';
// import studentController from '../controllers/StudentController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import studentController, { studentBrief, registerStudent,addStudentsArrayJson } from '../controllers/StudentController.js';
import AcademicYearController from '../controllers/AcademicYearController.js';
// import authenticate from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', 
    // authenticate, authorizeRoles(['admin']),
    studentController.getAllStudents);

router.get('/academic/:level/:year', AcademicYearController.getStudentsAcademicYear);    

// Routes for Student operations
router.get('/:id',
  // authenticate,
   studentController.getStudentDetails);

router.put(
  '/academic-info/:studentId',
  // authenticate,
  // authorizeRoles(['admin', 'teacher']),
  studentController.updateAcademicInfo
);

router.post(
  '/marks/:studentId/:courseId',
  // authenticate,
  // authorizeRoles(['admin', 'teacher']),
  studentController.updateMarks
);


router.post(
  '/add',
  // authenticate,
  // authorizeRoles(['admin', 'teacher']),
  registerStudent
);
/**
 * this route will provide information useful for the stats about a student, such as his academic level,
 * behavior and so on
 */
router.post('/brief/:id', 
  //authenticate, 
  studentBrief)
router.post('/add-students', addStudentsArrayJson)
// router.post('/register/', registerStudent)

export default router; 
