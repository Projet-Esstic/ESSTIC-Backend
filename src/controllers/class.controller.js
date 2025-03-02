const Class = require('../models/Class');
const Course = require('../models/Course');
const { validateObjectId } = require('../utils/validation');
const ApiError = require('../utils/ApiError');

const classController = {
    // Create a new class
    createClass: async (req, res) => {
        try {
            const { name, department, academicYear, level, classTeacher } = req.body;
            
            // Check if class already exists
            const existingClass = await Class.findOne({ name, academicYear });
            if (existingClass) {
                throw new ApiError(400, 'Class already exists for this academic year');
            }

            const newClass = new Class({
                name,
                department,
                academicYear,
                level,
                classTeacher
            });

            await newClass.save();

            res.status(201).json({
                success: true,
                message: 'Class created successfully',
                data: newClass
            });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    // Get all classes
    getAllClasses: async (req, res) => {
        try {
            const { department, academicYear } = req.query;
            const filter = {};

            if (department) filter.department = department;
            if (academicYear) filter.academicYear = academicYear;

            const classes = await Class.find(filter)
                .populate('department', 'name')
                .populate('classTeacher', 'name email')
                .populate('courses.course', 'name code credits')
                .populate('courses.lecturer', 'name email');

            res.status(200).json({
                success: true,
                data: classes
            });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    // Get class by ID
    getClassById: async (req, res) => {
        try {
            const { id } = req.params;
            validateObjectId(id);

            const classData = await Class.findById(id)
                .populate('department', 'name')
                .populate('classTeacher', 'name email')
                .populate('courses.course', 'name code credits')
                .populate('courses.lecturer', 'name email')
                .populate('students', 'name registrationNumber');

            if (!classData) {
                throw new ApiError(404, 'Class not found');
            }

            res.status(200).json({
                success: true,
                data: classData
            });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    // Update class
    updateClass: async (req, res) => {
        try {
            const { id } = req.params;
            validateObjectId(id);

            const updates = req.body;
            const classData = await Class.findById(id);

            if (!classData) {
                throw new ApiError(404, 'Class not found');
            }

            // Check name uniqueness if name is being updated
            if (updates.name && updates.name !== classData.name) {
                const existingClass = await Class.findOne({
                    name: updates.name,
                    academicYear: updates.academicYear || classData.academicYear,
                    _id: { $ne: id }
                });

                if (existingClass) {
                    throw new ApiError(400, 'Class name already exists for this academic year');
                }
            }

            Object.assign(classData, updates);
            await classData.save();

            res.status(200).json({
                success: true,
                message: 'Class updated successfully',
                data: classData
            });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    // Delete class
    deleteClass: async (req, res) => {
        try {
            const { id } = req.params;
            validateObjectId(id);

            const classData = await Class.findById(id);
            if (!classData) {
                throw new ApiError(404, 'Class not found');
            }

            await classData.remove();

            res.status(200).json({
                success: true,
                message: 'Class deleted successfully'
            });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    // Add course to class
    addCourseToClass: async (req, res) => {
        try {
            const { id } = req.params;
            const { courseId, lecturerId, schedule } = req.body;
            
            validateObjectId(id);
            validateObjectId(courseId);
            validateObjectId(lecturerId);

            const classData = await Class.findById(id);
            if (!classData) {
                throw new ApiError(404, 'Class not found');
            }

            // Check if course exists
            const course = await Course.findById(courseId);
            if (!course) {
                throw new ApiError(404, 'Course not found');
            }

            // Check if course is already added
            const courseExists = classData.courses.some(c => c.course.toString() === courseId);
            if (courseExists) {
                throw new ApiError(400, 'Course already added to this class');
            }

            // Validate schedule
            if (schedule) {
                // Check for schedule conflicts
                const hasConflict = classData.courses.some(c => 
                    c.schedule.some(s1 => 
                        schedule.some(s2 => 
                            s1.day === s2.day && 
                            ((s1.startTime <= s2.startTime && s2.startTime < s1.endTime) ||
                             (s2.startTime <= s1.startTime && s1.startTime < s2.endTime))
                        )
                    )
                );

                if (hasConflict) {
                    throw new ApiError(400, 'Schedule conflict detected');
                }
            }

            classData.courses.push({
                course: courseId,
                lecturer: lecturerId,
                schedule: schedule || []
            });

            await classData.save();

            res.status(200).json({
                success: true,
                message: 'Course added to class successfully',
                data: classData
            });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    // Remove course from class
    removeCourseFromClass: async (req, res) => {
        try {
            const { id, courseId } = req.params;
            
            validateObjectId(id);
            validateObjectId(courseId);

            const classData = await Class.findById(id);
            if (!classData) {
                throw new ApiError(404, 'Class not found');
            }

            classData.courses = classData.courses.filter(c => c.course.toString() !== courseId);
            await classData.save();

            res.status(200).json({
                success: true,
                message: 'Course removed from class successfully',
                data: classData
            });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    // Add students to class
    addStudentsToClass: async (req, res) => {
        try {
            const { id } = req.params;
            const { studentIds } = req.body;
            
            validateObjectId(id);
            studentIds.forEach(studentId => validateObjectId(studentId));

            const classData = await Class.findById(id);
            if (!classData) {
                throw new ApiError(404, 'Class not found');
            }

            // Filter out students that are already in the class
            const newStudents = studentIds.filter(
                studentId => !classData.students.includes(studentId)
            );

            if (newStudents.length === 0) {
                throw new ApiError(400, 'All students are already in this class');
            }

            classData.students.push(...newStudents);
            await classData.save();

            res.status(200).json({
                success: true,
                message: 'Students added to class successfully',
                data: classData
            });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    // Remove student from class
    removeStudentFromClass: async (req, res) => {
        try {
            const { id, studentId } = req.params;
            
            validateObjectId(id);
            validateObjectId(studentId);

            const classData = await Class.findById(id);
            if (!classData) {
                throw new ApiError(404, 'Class not found');
            }

            classData.students = classData.students.filter(s => s.toString() !== studentId);
            await classData.save();

            res.status(200).json({
                success: true,
                message: 'Student removed from class successfully',
                data: classData
            });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    // Get class schedule
    getClassSchedule: async (req, res) => {
        try {
            const { id } = req.params;
            validateObjectId(id);

            const classData = await Class.findById(id)
                .populate('courses.course', 'name code')
                .populate('courses.lecturer', 'name');

            if (!classData) {
                throw new ApiError(404, 'Class not found');
            }

            const schedule = classData.courses
                .filter(course => course.schedule && course.schedule.length > 0)
                .map(course => ({
                    course: course.course,
                    lecturer: course.lecturer,
                    schedule: course.schedule
                }));

            res.status(200).json({
                success: true,
                data: schedule
            });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    }
};

module.exports = classController;
