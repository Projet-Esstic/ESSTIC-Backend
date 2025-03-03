import BaseController from './BaseController.js';
import EntranceExam from '../models/EntranceExam.js';
import createError from 'http-errors';

class EntranceExamController extends BaseController {
    constructor() {
        super(EntranceExam);
    }

    async getAllEntranceExams(req, res, next) {
        try {
            console.log('Fetching all entrance exams...');
            const entranceExams = await EntranceExam.find({})
                .populate('department', 'name code')
                .populate('courses.courseId', 'courseName courseCode')
                .populate('createdBy', 'name email');

            console.log('Fetched entrance exams:', entranceExams);
            res.json(entranceExams);
        } catch (error) {
            console.error('Error fetching entrance exams:', error);
            next(this.handleError(error, 'fetching all entrance exams'));
        }
    }

    async getEntranceExam(req, res, next) {
        try {
            const entranceExam = await EntranceExam.findById(req.params.id)
                .populate('department', 'name code')
                .populate('courses.courseId', 'courseName courseCode')
                .populate('createdBy', 'name email');

            if (!entranceExam) {
                throw createError(404, 'Entrance exam not found');
            }
            res.json(entranceExam);
        } catch (error) {
            next(this.handleError(error, 'fetching entrance exam'));
        }
    }

    async createEntranceExam(req, res, next) {
        try {
            console.log('Creating entrance exam with data:', req.body);

            // Validate dates
            const { startDate, endDate, examDate } = req.body;
            const now = new Date();
            const startDateTime = new Date(startDate);
            const endDateTime = new Date(endDate);
            const examDateTime = new Date(examDate);

            if (startDateTime < now) {
                throw createError(400, 'Start date cannot be in the past');
            }
            if (endDateTime <= startDateTime) {
                throw createError(400, 'End date must be after start date');
            }
            if (examDateTime <= endDateTime) {
                throw createError(400, 'Exam date must be after registration end date');
            }

            // Validate academic year format
            const academicYearRegex = /^\d{4}-\d{4}$/;
            if (!academicYearRegex.test(req.body.academicYear)) {
                throw createError(400, 'Academic year must be in format YYYY-YYYY');
            }

            // Validate that all departments exist
            if (!Array.isArray(req.body.department) || req.body.department.length === 0) {
                throw createError(400, 'At least one department must be specified');
            }

            // Create the entrance exam
            const newEntranceExam = new EntranceExam(req.body);
            const savedEntranceExam = await newEntranceExam.save();

            // Fetch the populated entrance exam
            const populatedEntranceExam = await EntranceExam.findById(savedEntranceExam._id)
                .populate('department', 'name code')
                .populate('courses.courseId', 'courseName courseCode')
                .populate('createdBy', 'name email');

            console.log('Created new entrance exam:', populatedEntranceExam);
            res.status(201).json(populatedEntranceExam);
        } catch (error) {
            console.log('Error creating entrance exam:', error);
            //next(this.handleError(error, 'creating entrance exam'));
        }
    }

    async updateEntranceExam(req, res, next) {
        try {
            const { id } = req.params;
            
            // Check if the entrance exam exists
            const existingExam = await EntranceExam.findById(id);
            if (!existingExam) {
                throw createError(404, 'Entrance exam not found');
            }

            // Validate dates if they're being updated
            if (req.body.startDate || req.body.endDate || req.body.examDate) {
                const startDate = new Date(req.body.startDate || existingExam.startDate);
                const endDate = new Date(req.body.endDate || existingExam.endDate);
                const examDate = new Date(req.body.examDate || existingExam.examDate);
                const now = new Date();

                if (startDate < now && startDate.getTime() !== existingExam.startDate.getTime()) {
                    throw createError(400, 'Start date cannot be in the past');
                }
                if (endDate <= startDate) {
                    throw createError(400, 'End date must be after start date');
                }
                if (examDate <= endDate) {
                    throw createError(400, 'Exam date must be after registration end date');
                }
            }

            // Validate academic year format if it's being updated
            if (req.body.academicYear) {
                const academicYearRegex = /^\d{4}-\d{4}$/;
                if (!academicYearRegex.test(req.body.academicYear)) {
                    throw createError(400, 'Academic year must be in format YYYY-YYYY');
                }
            }

            // Validate departments if they're being updated
            if (req.body.department) {
                if (!Array.isArray(req.body.department) || req.body.department.length === 0) {
                    throw createError(400, 'At least one department must be specified');
                }
            }

            const updatedEntranceExam = await EntranceExam.findByIdAndUpdate(
                id,
                req.body,
                { new: true }
            )
            .populate('department', 'name code')
            .populate('courses.courseId', 'courseName courseCode')
            .populate('createdBy', 'name email');

            res.json(updatedEntranceExam);
        } catch (error) {
            next(this.handleError(error, 'updating entrance exam'));
        }
    }

    async deleteEntranceExam(req, res, next) {
        try {
            const deletedEntranceExam = await EntranceExam.findByIdAndDelete(req.params.id);
            if (!deletedEntranceExam) {
                throw createError(404, 'Entrance exam not found');
            }
            res.status(204).send();
        } catch (error) {
            next(this.handleError(error, 'deleting entrance exam'));
        }
    }

    // Additional method to get entrance exams by department
    async getEntranceExamsByDepartment(req, res, next) {
        try {
            const { departmentId } = req.params;
            const entranceExams = await EntranceExam.find({
                department: departmentId
            })
            .populate('department', 'name code')
            .populate('courses.courseId', 'courseName courseCode')
            .populate('createdBy', 'name email');

            res.json(entranceExams);
        } catch (error) {
            next(this.handleError(error, 'fetching entrance exams by department'));
        }
    }
}

export default new EntranceExamController();
