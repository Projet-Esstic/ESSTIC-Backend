import express from 'express';
import {
    createAcademicDetail,
    getAllAcademicDetails,
    getAcademicDetailById,
    deleteAcademicDetail,
    duplicateLastAcademicDetail,
    createCourse,
    getAllCourses,
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
    getCourseByCode,
    

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

// Routes for semesters within a given level and year
router.post('/:level/:year/semesters', createSemester);
router.get('/:level/:year/semesters', getSemesters);
router.get('/:level/:year/semesters/:semesterId', getSemesterById);
router.put('/:level/:year/semesters/:semesterId', updateSemester);
router.delete('/:level/:year/semesters/:semesterId', deleteSemester);

// Module routes
router.get('/:level/:year/modules', getModules);
router.get('/:level/:year/modules/:moduleId', getModuleById);
router.post('/:level/:year/modules', createModule);
router.put('/:level/:year/modules/:moduleId', updateModule);
router.delete('/:level/:year/modules/:moduleId', deleteModule);

// Define routes for CRUD  operations of course
router.post('/:level/:year/courses', createCourse);
router.get('/:level/:year/courses', getAllCourses);
router.get('/:level/:year/courses/:courseCode', getCourseByCode);
router.put('/:level/:year/courses/:courseCode', updateCourse);
router.delete('/:level/:year/courses/:courseCode', deleteCourse);

export default router;
