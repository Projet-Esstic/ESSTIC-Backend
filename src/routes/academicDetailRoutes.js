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
    createSemester,
    getSemesters,
    getSemesterById,
    updateSemester,
    deleteSemester,
    getModules,
    getModuleById,
    createModule,
    updateModule,
    deleteModule,

} from '../controllers/AcademicDetailController.js';

const router = express.Router();

// Route to create a new academic detail
router.post('/', createAcademicDetail);

// Route to get all academic details, optionally filtered by level and year
router.get('/', getAllAcademicDetails);

// Route to get academic details by level and year
router.get('/:level/:year', getAcademicDetailById);

// Route to delete an academic detail by level and year
router.delete('/:level/:year', deleteAcademicDetail);

// Route to duplicate the last academic detail
router.post('/:level/:year/duplicate', duplicateLastAcademicDetail);


// Route to create a new course
router.post('/:level/:year/courses', createCourse);

// Route to get all courses for a given academic detail, with optional filters
router.get('/:level/:year/courses', getAllCourses);

// Route to get a course by its ID or courseCode
router.get('/:level/:year/courses/:courseId', getCourseById);

// Route to update a course
router.put('/courses/:academicDetailId/courses/:courseId', updateCourse);

// Route to delete a course (soft or hard delete)
router.delete('/courses/:level/:year/courses/:courseId', deleteCourse);

// Routes for semesters within a given level and year
router.post('/:level/:year/semesters', createSemester);
router.get('/:level/:year/semesters', getSemesters);
router.get('/:level/:year/semesters/:semesterId', getSemesterById);
router.put('/:level/:year/semesters/:semesterId', updateSemester);
router.delete('/:level/:year/semesters/:semesterId', deleteSemester);

// Module routes
router.get('/:year/:level/modules', getModules);
router.get('/:year/:level/modules/:moduleId', getModuleById);
router.post('/:year/:level/modules', createModule);
router.put('/:year/:level/modules/:moduleId', updateModule);
router.delete('/:year/:level/modules/:moduleId', deleteModule);

export default router;
