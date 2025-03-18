import Class from '../models/Class.js';
import Course from '../models/Course.js';
import { validateObjectId } from '../utils/validation.js';
import ApiError from '../utils/ApiError.js';

const classController = {
    async createClass(req, res) {
        try {
            const { name, department, academicYear, level, classTeacher } = req.body;
            const existingClass = await Class.findOne({ name, academicYear });
            if (existingClass) throw new ApiError(400, 'Class already exists for this academic year');

            const newClass = new Class({ name, department, academicYear, level, classTeacher });
            await newClass.save();

            res.status(201).json({ success: true, message: 'Class created successfully', data: newClass });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    async getAllClasses(req, res) {
        try {
            const { department, academicYear } = req.query;
            const filter = {};
            console.log(department, academicYear)
            if (department) filter.department = department;
            if (academicYear) filter.academicYear = academicYear;
            const classes = await Class.find(filter)
                .populate('department', 'name')
                .populate('classTeacher', 'name')
                .populate('courses.course', 'name code credits')
                .populate('courses.lecturer', 'name email');
            console.log(classes)
            res.status(200).json(classes);
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    async getClassById(req, res) {
        try {
            const { id } = req.params;
            validateObjectId(id);

            const classData = await Class.findById(id)
                .populate('department', 'name')
                .populate('classTeacher', 'name email')
                .populate('courses.course', 'name code credits')
                .populate('courses.lecturer', 'name email')
                .populate('students', 'name registrationNumber');

            if (!classData) throw new ApiError(404, 'Class not found');

            res.status(200).json({ success: true, data: classData });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    async updateClass(req, res) {
        try {
            const { id } = req.params;
            validateObjectId(id);

            const updates = req.body;
            const classData = await Class.findById(id);
            if (!classData) throw new ApiError(404, 'Class not found');

            if (updates.name && updates.name !== classData.name) {
                const existingClass = await Class.findOne({
                    name: updates.name,
                    academicYear: updates.academicYear || classData.academicYear,
                    _id: { $ne: id }
                });
                if (existingClass) throw new ApiError(400, 'Class name already exists for this academic year');
            }

            Object.assign(classData, updates);
            await classData.save();

            res.status(200).json({ success: true, message: 'Class updated successfully', data: classData });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    async deleteClass(req, res) {
        try {
            const { id } = req.params;
            validateObjectId(id);

            const classData = await Class.findById(id);
            if (!classData) throw new ApiError(404, 'Class not found');

            await classData.remove();

            res.status(200).json({ success: true, message: 'Class deleted successfully' });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    async addCourseToClass(req, res) {
        try {
            const { id } = req.params;
            const { courseId, lecturerId, schedule } = req.body;

            [id, courseId, lecturerId].forEach(validateObjectId);

            const classData = await Class.findById(id);
            if (!classData) throw new ApiError(404, 'Class not found');

            const course = await Course.findById(courseId);
            if (!course) throw new ApiError(404, 'Course not found');

            if (classData.courses.some(c => c.course.toString() === courseId)) {
                throw new ApiError(400, 'Course already added to this class');
            }

            if (schedule) {
                const hasConflict = classData.courses.some(c =>
                    c.schedule.some(s1 =>
                        schedule.some(s2 =>
                            s1.day === s2.day &&
                            ((s1.startTime <= s2.startTime && s2.startTime < s1.endTime) ||
                                (s2.startTime <= s1.startTime && s1.startTime < s2.endTime))
                        )
                    )
                );
                if (hasConflict) throw new ApiError(400, 'Schedule conflict detected');
            }

            classData.courses.push({ course: courseId, lecturer: lecturerId, schedule: schedule || [] });
            await classData.save();

            res.status(200).json({ success: true, message: 'Course added to class successfully', data: classData });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    async removeCourseFromClass(req, res) {
        try {
            const { id, courseId } = req.params;

            [id, courseId].forEach(validateObjectId);

            const classData = await Class.findById(id);
            if (!classData) throw new ApiError(404, 'Class not found');

            classData.courses = classData.courses.filter(c => c.course.toString() !== courseId);
            await classData.save();

            res.status(200).json({ success: true, message: 'Course removed from class successfully', data: classData });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    async addStudentsToClass(req, res) {
        try {
            const { id } = req.params;
            const { studentIds } = req.body;

            // ensuring that the student ids is an array
            if (!Array.isArray(studentIds)) {
                throw new ApiError(400, "studentId must be an array")
            }
            if (studentIds.length === 0) {
                throw new ApiError(400, "studentIds can not be empty");
            }

            validateObjectId(id);
            studentIds.forEach(validateObjectId);

            const updatedClass = await Class.findByIdAndUpdate(
                id,
                { $addToSet: { students: { $each: studentIds } } }, // Add students if they don't already exist
                { new: true } // Return the updated document
            );

            if (!updatedClass) {
                throw new ApiError(404, 'Class not found');
            }

            const newStudents = studentIds.filter(
                studentId => !classData.students.includes(studentId)
            );

            if (newStudents.length === 0) throw new ApiError(400, 'All students are already in this class');

            res.status(200).json({
                success: true,
                message: 'Students added to class successfully',
                data: updatedClass,
                newStudents: newStudents,
            });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    async removeStudentFromClass(req, res) {
        try {
            const { id, studentId } = req.params;

            [id, studentId].forEach(validateObjectId);

            const classData = await Class.findById(id);
            if (!classData) throw new ApiError(404, 'Class not found');

            classData.students = classData.students.filter(s => s.toString() !== studentId);
            await classData.save();

            res.status(200).json({ success: true, message: 'Student removed from class successfully', data: classData });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    },

    async getClassSchedule(req, res) {
        try {
            const { id } = req.params;
            validateObjectId(id);

            const classData = await Class.findById(id)
                .populate('courses.course', 'name code')
                .populate('courses.lecturer', 'name');

            if (!classData) throw new ApiError(404, 'Class not found');

            const schedule = classData.courses.filter(c => c.schedule.length).map(({ course, lecturer, schedule }) => ({ course, lecturer, schedule }));

            res.status(200).json({ success: true, data: schedule });
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message);
        }
    }
};

export default classController;
