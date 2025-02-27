import BaseController from './BaseController.js';
import Course from '../models/Course.js';
import createError from 'http-errors';

class CourseController extends BaseController {
    constructor() {
        super(Course);
    }

    async getAllCourses(req, res, next) {
        try {
            const courses = await Course.find({})
                .populate('semester', 'name academicYear')
                .populate('instructors', 'name email')
                .populate('department', 'name code');
            res.json(courses);
        } catch (error) {
            next(this.handleError(error, 'fetching all courses'));
        }
    }

    async getCourse(req, res, next) {
        try {
            const course = await Course.findById(req.params.id)
                .populate('semester')
                .populate('instructors', 'name email')
                .populate('department', 'name');
            if (!course) {
                throw createError(404, 'Course not found');
            }
            res.json(course);
        } catch (error) {
            next(this.handleError(error, 'fetching course'));
        }
    }

    async createCourse(req, res, next) {
        try {
            const newCourse = new Course(req.body);
            await newCourse.save();
            res.status(201).json(newCourse);
        } catch (error) {
            next(this.handleError(error, 'creating course'));
        }
    }

    async updateCourse(req, res, next) {
        try {
            const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedCourse) {
                throw createError(404, 'Course not found');
            }
            res.json(updatedCourse);
        } catch (error) {
            next(this.handleError(error, 'updating course'));
        }
    }

    async deleteCourse(req, res, next) {
        try {
            const deletedCourse = await Course.findByIdAndDelete(req.params.id);
            if (!deletedCourse) {
                throw createError(404, 'Course not found');
            }
            res.status(204).send();
        } catch (error) {
            next(this.handleError(error, 'deleting course'));
        }
    }
}

export default new CourseController(); 