import BaseController from './BaseController.js';
import Semester from '../models/Semester.js';
import createError from 'http-errors';
import { AcademicYear } from '../models/AcademicYear.js';

class SemesterController extends BaseController {
    constructor() {
        super(Semester);
        this.getAllSemesters = this.getAllSemesters.bind(this);

    }

    // Fetch all semesters with optional filters for level and academic year
    async getAllSemesters(req, res, next) {
        try {
            const { academicYear, level } = req.params;
            const query = {};

            if (academicYear) {
                query.academicYear = academicYear;
            }
            if (level) {
                query.level = level;
            }

            const semesters = await Semester.find({ level, academicYear })
                // .populate({
                //     path: 'modules',
                //     select: 'moduleCode courses department',
                //     populate: [
                //         {
                //             path: 'courses',
                //             select: 'courseCode department',
                //             populate: [
                //                 { path: 'department.departmentInfo', select: 'name' }
                //             ]
                //         },
                //         { path: 'department.departmentInfo', select: 'name' }
                //     ]
                // })
                .populate('createdBy', 'firstName lastName');

            res.json(semesters);
        } catch (error) {
            next(this.handleError(error, 'fetching all semesters'));
        }
    }

    // Get details of a single semester by its ID
    async getSemester(req, res, next) {
        try {
            const semester = await Semester.findById(req.params.id)
                .populate('courses', 'courseName courseCode');
            if (!semester) {
                throw createError(404, 'Semester not found');
            }
            res.json(semester);
        } catch (error) {
            next(this.handleError(error, 'fetching semester'));
        }
    }

    // Create a new semester with necessary fields
    async createSemester(req, res, next) {
        try {
            delete req.body?._id
            const newSemester = new Semester(req.body);
            console.log(req.body);
            console.log(newSemester);
            await newSemester.save();
            res.status(201).json(newSemester);
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }

    // Update an existing semester
    async updateSemester(req, res, next) {
        try {
            const updatedSemester = await Semester.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedSemester) {
                throw createError(404, 'Semester not found');
            }
            res.json(updatedSemester);
        } catch (error) {
            next(this.handleError(error, 'updating semester'));
        }
    }

    // Delete a semester by its ID
    async deleteSemester(req, res, next) {
        try {
            const deletedSemester = await Semester.findByIdAndDelete(req.params.id);
            if (!deletedSemester) {
                throw createError(404, 'Semester not found');
            }
            res.status(204).send();
        } catch (error) {
            next(this.handleError(error, 'deleting semester'));
        }
    }

    // Method to duplicate a semester to the next academic year
    async duplicateSemesterToNextYear(req, res, next) {
        try {
            const { year } = req.params;

            if (!academicYear || !level) {
                throw createError(400, 'Both academicYear and level are required');
            }

            // Fetch the semester to duplicate based on academicYear and level
            const semesterToDuplicate = await Semester.findOne({ academicYear, level });
            if (!semesterToDuplicate) {
                throw createError(404, 'Semester not found for the given academic year and level');
            }

            // Create a new semester for the next academic year
            const nextYear = parseInt(academicYear.split('-')[1]) + 1;
            const nextAcademicYear = `${parseInt(academicYear.split('-')[0]) + 1}-${nextYear}`;

            const duplicatedSemester = new Semester({
                ...semesterToDuplicate.toObject(),
                academicYear: nextAcademicYear,
                startDate: new Date(semesterToDuplicate.startDate).setFullYear(new Date(semesterToDuplicate.startDate).getFullYear() + 1),
                endDate: new Date(semesterToDuplicate.endDate).setFullYear(new Date(semesterToDuplicate.endDate).getFullYear() + 1),
                isActive: false, // Initially inactive until manually activated
            });

            await duplicatedSemester.save();
            res.status(201).json(duplicatedSemester);
        } catch (error) {
            next(this.handleError(error, 'duplicating semester to next year'));
        }
    }
}

export default new SemesterController();
