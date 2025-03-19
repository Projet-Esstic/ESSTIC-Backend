import express from 'express';
import {
    createAcademicDetail,
    getAllAcademicDetails,
    getAcademicDetailById,
    deleteAcademicDetail,
    duplicateLastAcademicDetail,
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,

} from '../controllers/AcademicDetailController.js';

const router = express.Router();

// Route to create a new academic detail
router.post('/main/', createAcademicDetail);

// Route to get all academic details, optionally filtered by level and year
router.get('/main/', getAllAcademicDetails);

// Route to get academic details by level and year
router.get('/main/:level/:year', getAcademicDetailById);

// Route to delete an academic detail by level and year
router.delete('/main/:level/:year', deleteAcademicDetail);

// Route to duplicate the last academic detail
router.post('/main/duplicate', duplicateLastAcademicDetail);


// Route to create a new course
router.post('/courses/:level/:year/courses', createCourse);

// Route to get all courses for a given academic detail, with optional filters
router.get('/courses/:level/:year/courses', getAllCourses);

// Route to get a course by its ID or courseCode
router.get('/courses/:level/:year/courses/:courseId', getCourseById);

// Route to update a course
router.put('/courses/:academicDetailId/courses/:courseId', updateCourse);

// Route to delete a course (soft or hard delete)
router.delete('/courses/:level/:year/courses/:courseId', deleteCourse);

export default router;
