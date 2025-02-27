import BaseController from './BaseController.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import createError from 'http-errors';

class StudentController extends BaseController {
    constructor() {
        super(Student);
    }

    async getStudentDetails(req, res, next) {
        try {
            const student = await Student.findById(req.params.id)
                .populate('user', 'name email')
                .populate({
                    path: 'courses',
                    populate: { path: 'courseId', select: 'courseName courseCode' }
                });

            if (!student) {
                throw createError(404, 'Student not found');
            }

            res.json(student);
        } catch (error) {
            next(this.handleError(error, 'fetching student details'));
        }
    }

    async updateAcademicInfo(req, res, next) {
        try {
            const { studentId } = req.params;
            const updates = req.body;

            // Verify if user has permission (admin or teacher)
            if (!req.user.roles.includes('admin') && !req.user.roles.includes('teacher')) {
                throw createError(403, 'Unauthorized to update academic info');
            }

            const student = await Student.findByIdAndUpdate(
                studentId,
                { $set: { 'academicInfo': updates } },
                { new: true, runValidators: true }
            );

            if (!student) {
                throw createError(404, 'Student not found');
            }

            res.json(student);
        } catch (error) {
            next(this.handleError(error, 'update academic info'));
        }
    }

    async updateMarks(req, res, next) {
        try {
            const { studentId, courseId } = req.params;
            const { examType, mark } = req.body;

            // Verify if user has permission (admin or teacher)
            if (!req.user.roles.includes('admin') && !req.user.roles.includes('teacher')) {
                throw createError(403, 'Unauthorized to update marks');
            }

            const student = await Student.findById(studentId);
            if (!student) {
                throw createError(404, 'Student not found');
            }

            // Find the course in student's courses array
            const courseIndex = student.academicInfo.courses.findIndex(
                c => c.courseId.toString() === courseId
            );

            if (courseIndex === -1) {
                throw createError(404, 'Course not found for this student');
            }

            // Create modification record
            const modification = {
                preMark: student.academicInfo.courses[courseIndex].marks[examType].currentMark,
                modMark: mark,
                modifiedBy: {
                    name: req.user.fullName,
                    userId: req.user.userId
                }
            };

            // Update the mark and add modification record
            student.academicInfo.courses[courseIndex].marks[examType].currentMark = mark;
            student.academicInfo.courses[courseIndex].marks[examType].modified.push(modification);

            await student.save();

            res.json(student);
        } catch (error) {
            next(this.handleError(error, 'update marks'));
        }
    }
}

export default new StudentController(); 