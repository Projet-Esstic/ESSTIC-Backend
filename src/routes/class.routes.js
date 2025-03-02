const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Base route: /api/classes

// Create a new class (Admin only)
router.post('/', 
    authenticateToken, 
    authorizeRoles(['admin']), 
    classController.createClass
);

// Get all classes
router.get('/', 
    authenticateToken, 
    authorizeRoles(['admin', 'teacher']), 
    classController.getAllClasses
);

// Get class by ID
router.get('/:id', 
    authenticateToken, 
    authorizeRoles(['admin', 'teacher']), 
    classController.getClassById
);

// Update class
router.put('/:id', 
    authenticateToken, 
    authorizeRoles(['admin']), 
    classController.updateClass
);

// Delete class
router.delete('/:id', 
    authenticateToken, 
    authorizeRoles(['admin']), 
    classController.deleteClass
);

// Add course to class
router.post('/:id/courses', 
    authenticateToken, 
    authorizeRoles(['admin']), 
    classController.addCourseToClass
);

// Remove course from class
router.delete('/:id/courses/:courseId', 
    authenticateToken, 
    authorizeRoles(['admin']), 
    classController.removeCourseFromClass
);

// Add students to class
router.post('/:id/students', 
    authenticateToken, 
    authorizeRoles(['admin']), 
    classController.addStudentsToClass
);

// Remove student from class
router.delete('/:id/students/:studentId', 
    authenticateToken, 
    authorizeRoles(['admin']), 
    classController.removeStudentFromClass
);

// Get class schedule
router.get('/:id/schedule', 
    authenticateToken, 
    authorizeRoles(['admin', 'teacher', 'student']), 
    classController.getClassSchedule
);

module.exports = router;
