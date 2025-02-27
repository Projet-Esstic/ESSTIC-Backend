import BaseController from './BaseController.js';
import EntranceExam from '../models/EntranceExam.js';
import createError from 'http-errors';

class EntranceExamController extends BaseController {
    constructor() {
        super(EntranceExam);
    }

    async getAllExams(req, res, next) {
        try {
            const exams = await EntranceExam.find({})
                .populate({
                    path: 'courses',
                    populate: { path: 'courseId', select: 'courseName courseCode' }
                })
                .populate('department', 'name code');
            res.json(exams);
        } catch (error) {
            next(this.handleError(error, 'fetching all entrance exams'));
        }
    }

    async getExam(req, res, next) {
        try {
            const exam = await EntranceExam.findById(req.params.id)
                .populate({
                    path: 'courses',
                    populate: { path: 'courseId', select: 'courseName courseCode' }
                })
                .populate('department', 'name code');
            if (!exam) {
                throw createError(404, 'Entrance exam not found');
            }
            res.json(exam);
        } catch (error) {
            next(this.handleError(error, 'fetching entrance exam'));
        }
    }

    async createExam(req, res, next) {
        try {
            const newExam = new EntranceExam(req.body);
            await newExam.save();
            res.status(201).json(newExam);
        } catch (error) {
            next(this.handleError(error, 'creating entrance exam'));
        }
    }

    async updateExam(req, res, next) {
        try {
            const updatedExam = await EntranceExam.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedExam) {
                throw createError(404, 'Entrance exam not found');
            }
            res.json(updatedExam);
        } catch (error) {
            next(this.handleError(error, 'updating entrance exam'));
        }
    }

    async deleteExam(req, res, next) {
        try {
            const deletedExam = await EntranceExam.findByIdAndDelete(req.params.id);
            if (!deletedExam) {
                throw createError(404, 'Entrance exam not found');
            }
            res.status(204).send();
        } catch (error) {
            next(this.handleError(error, 'deleting entrance exam'));
        }
    }
}

export default new EntranceExamController(); 

