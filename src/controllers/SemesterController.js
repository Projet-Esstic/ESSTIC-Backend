import BaseController from './BaseController.js';
import Semester from '../models/Semester.js';
import createError from 'http-errors';

class SemesterController extends BaseController {
    constructor() {
        super(Semester);
    }

    async getAllSemesters(req, res, next) {
        try {
            const semesters = await Semester.find({})
                .populate('courses', 'courseName courseCode');
            res.json(semesters);
        } catch (error) {
            next(this.handleError(error, 'fetching all semesters'));
        }
    }

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

    async createSemester(req, res, next) {
        try {
            const newSemester = new Semester(req.body);
            await newSemester.save();
            res.status(201).json(newSemester);
        } catch (error) {
            next(this.handleError(error, 'creating semester'));
        }
    }

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
}

export default new SemesterController(); 