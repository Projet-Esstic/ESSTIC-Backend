import BaseController from './BaseController.js';
import Course from '../models/Course.js';
import createError from 'http-errors';

class CourseController extends BaseController {
    constructor() {
        super(Course);
    }

    async getAllCourses(req, res, next) {
        try {
            console.log('Fetching all courses...');
            const courses = await Course.find({})
                .populate('semester', 'name academicYear')
                .populate('instructors', 'name email')
                .populate('department', 'name code');

            console.log('Fetched all courses:', courses);
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
            console.log('Received course data:', req.body);
            
            // Remove _id if it's provided
            delete req.body._id;
            
            // Handle department data based on isEntranceExam
            if (req.body.isEntranceExam) {
                // For entrance exams, expect an array of departments with coefficients
                if (!Array.isArray(req.body.department)) {
                    return res.status(400).json({
                        message: 'For entrance exams, department must be an array of objects with departmentInfo and coefficient'
                    });
                }
                
                // Format each department entry
                req.body.department = req.body.department.map(dep => ({
                    departmentInfo: dep.departmentInfo._id || dep.departmentInfo,
                    coefficient: dep.coefficient
                }));
            } else {
                // For regular courses, convert to array format
                if (!Array.isArray(req.body.department)) {
                    req.body.department = [{ departmentInfo: req.body.department }];
                } else {
                    req.body.department = req.body.department.map(depId => ({
                        departmentInfo: depId
                    }));
                }
            }
            
            const newCourse = new Course(req.body);
            const savedCourse = await newCourse.save();
            console.log('Created new course:', savedCourse);
            
            // Populate the department details for the response
            const populatedCourse = await Course.findById(savedCourse._id)
                .populate('department.departmentInfo', 'name code')
                .populate('semester', 'name academicYear')
                .populate('instructors', 'name email');
                
            res.status(201).json(populatedCourse);
        } catch (error) {
            console.error('Error creating course:', error);
            if (error.name === 'ValidationError') {
                res.status(400).json({ 
                    message: 'Validation Error', 
                    errors: Object.values(error.errors).map(err => err.message)
                });
            } else if (error.code === 11000) {
                res.status(400).json({ 
                    message: 'Course code must be unique',
                    field: Object.keys(error.keyPattern)[0]
                });
            } else {
                next(error);
            }
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