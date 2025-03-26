import BaseController from './BaseController.js';
import Course from '../models/Course.js';
import createError from 'http-errors';
import mongoose from 'mongoose';

class CourseController extends BaseController {
    constructor() {
        super(Course);
        this.getAllCourses = this.getAllCourses.bind(this);
        this.getCourse = this.getCourse.bind(this);
        this.createCourse = this.createCourse.bind(this);
        this.updateCourse = this.updateCourse.bind(this);
        this.deleteCourse = this.deleteCourse.bind(this);
        this.duplicateCourses = this.duplicateCourses.bind(this);
    }
    async getAllCourses(req, res, next) {
        try {
            const courses = await Course.find()
                .populate('module', 'name')
                .populate('instructors', 'name email')
                .populate('department.departmentInfo', 'name code');
            console.log(courses);
            res.json(courses);
        } catch (error) {
            next(this.handleError(error, 'fetching all courses'));
        }
    }
    async getAllCoursesByYear(req, res, next) {
        try {
            const { level, year } = req.params;
            const courses = await Course.find({ level, year })
                .populate('module', 'name')
                .populate('instructors', 'name email')
                .populate('department.departmentInfo', 'name code');
            // console.log(courses);
            res.json(courses);
        } catch (error) {
            next(this.handleError(error, 'fetching all courses'));
        }
    }

    async getAllNotEntranceCourses(req, res, next) {
        try {
            const { level, year } = req.params;
            const courses = await Course.find({ level, year, isEntranceExam: false })
                .populate('module', 'name')
                .populate('instructors', 'name email')
                .populate('department.departmentInfo', 'name code');
            res.json(courses);
        } catch (error) {
            next(this.handleError(error, 'fetching non-entrance exam courses'));
        }
    }

    async getCourse(req, res, next) {
        try {
            const { id, level, year } = req.params;
            const course = await Course.findOne({ _id: id, level, year })
                .populate('module')
                .populate('instructors', 'name email')
                .populate('department.departmentInfo', 'name');
            if (!course) throw createError(404, 'Course not found');
            res.json(course);
        } catch (error) {
            next(this.handleError(error, 'fetching course'));
        }
    }

    async createCourse(req, res, next) {
        try {
            // const { level, year } = req.params;
            const courseData = { ...req.body };
            console.log(courseData);
            delete courseData._id; // Ensure no overriding of existing course IDs

            if (courseData.isEntranceExam) {
                if (!Array.isArray(courseData.department)) {
                    return res.status(400).json({
                        message: 'For entrance exams, department must be an array with departmentInfo and coefficient'
                    });
                }
                courseData.department = courseData.department.map(dep => ({
                    departmentInfo: dep.departmentInfo._id || dep.departmentInfo,
                    coefficient: dep.coefficient
                }));
            }

            const newCourse = new Course(courseData);
            console.log(newCourse);
            const savedCourse = await newCourse.save();

            const populatedCourse = await Course.findById(savedCourse._id)
                .populate('department.departmentInfo', 'name code')
                .populate('module', 'name')
                .populate('instructors', 'name email');

            res.status(201).json(populatedCourse);
        } catch (error) {
            next(this.handleError(error, 'creating course'));
        }
    }

    async addCourseAssessment(req, res, next) {
        try {
            const id = req.body.course;
            console.log(req.body);
            console.log(id);
            const updatedCourse = await Course.findOne(
                { _id: id },
            )
            if (!updatedCourse) throw createError(404, 'Course not found');
            console.log(updatedCourse.assessmentStatus);
            updatedCourse.assessmentStatus.push(req.body);
            console.log("updatedCourse", updatedCourse.assessmentStatus);
            updatedCourse.save()
            res.json(updatedCourse);
        } catch (error) {
            next(this.handleError(error, 'updating course'));
        }
    }

    async updateCourseAssessment(req, res, next) {
        try {
            const id = req.body.course;
            console.log(req.body);
            console.log(id);
            const updatedCourse = await Course.findOne(
                { _id: id },
            )
            if (!updatedCourse) throw createError(404, 'Course not found');
            console.log(updatedCourse.assessmentStatus);
            updatedCourse.assessmentStatus.filter(opt => opt.type === req.body.type)[0].isActive = !req.body.isActive
            console.log("updatedCourse", updatedCourse.assessmentStatus);
            updatedCourse.save()
            res.json(updatedCourse);
        } catch (error) {
            next(this.handleError(error, 'updating course'));
        }
    }

    async getAllCoursesAddAssessment(req, res) {
        try {
            // Fetch all courses
            const courses = await Course.find()
                .populate('module', 'name') // Populate module details
                .populate('instructors', 'name email') // Populate instructor details
                .populate('department.departmentInfo', 'name') // Populate department details
                .lean(); // Convert Mongoose documents to plain objects for better performance

            // Array to hold courses that need updates
            const coursesToUpdate = [];

            const updatedCourses = await Promise.all(courses.map(async (course) => {
                // if (!course.assessmentStatus || course.assessmentStatus.length === 0) {
                const defaultAssessment = [
                    { type: "CC", weight: 60, isActive: true },
                    { type: "Exam", weight: 40, isActive: true },
                    // { type: "Resit", weight: 50, isActive: true },
                ];

                // Push to update array
                coursesToUpdate.push({
                    id: course._id,
                    assessmentStatus: defaultAssessment
                });

                // Return updated course data
                return {
                    ...course,
                    assessmentStatus: defaultAssessment
                };
                // }
                // return course;
            }));

            // Update only necessary courses in the database
            for (const update of coursesToUpdate) {
                await Course.findByIdAndUpdate(update.id, { assessmentStatus: update.assessmentStatus }, { new: true });
            }

            res.status(200).json({
                success: true,
                count: updatedCourses.length,
                courses: updatedCourses
            });
        } catch (error) {
            console.error("Error fetching courses:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch courses",
                error: error.message
            });
        }
    }

    async updateCourse(req, res, next) {
        try {
            const { id, } = req.params;
            const updatedCourse = await Course.findOneAndUpdate(
                { _id: id },
                req.body,
                { new: true }
            ).populate('module').populate('instructors', 'name email').populate('department.departmentInfo', 'name code');

            if (!updatedCourse) throw createError(404, 'Course not found');
            res.json(updatedCourse);
        } catch (error) {
            next(this.handleError(error, 'updating course'));
        }
    }

    async deleteCourse(req, res, next) {
        try {
            const { id } = req.params;
            const deletedCourse = await Course.findOneAndDelete({ _id: id });
            if (!deletedCourse) throw createError(404, 'Course not found');
            res.status(204).send();
        } catch (error) {
            next(this.handleError(error, 'deleting course'));
        }
    }

    async duplicateCourses(req, res, next) {
        try {
            const { prevYear, nextYear } = req.params;
            const existingCourses = await Course.find({ year: prevYear });

            if (!existingCourses.length) {
                return res.status(404).json({ message: 'No courses found for the previous year' });
            }

            const duplicatedCourses = existingCourses.map(course => {
                const duplicatedCourse = course.toObject();
                delete duplicatedCourse._id; // Remove the existing ID for duplication
                duplicatedCourse.year = nextYear; // Set the new year
                delete duplicatedCourse.module;
                return duplicatedCourse;
            });

            const savedCourses = await Course.insertMany(duplicatedCourses);
            res.status(201).json({ message: 'Courses duplicated successfully', duplicatedCourses: savedCourses });
        } catch (error) {
            next(this.handleError(error, 'duplicating courses'));
        }
    }

    // Controller to add multiple courses
    async addManyCourses(req, res) {
        try {
            const courses = req.body; // Array of courses from request body

            if (!Array.isArray(courses) || courses.length === 0) {
                return res.status(400).json({ message: "Invalid data format. Expected a non-empty array of courses." });
            }

            const insertedCourses = [];

            for (const courseData of courses) {
                const newCourse = new Course(courseData);
                console.log(newCourse);
                await newCourse.save(); // Save each course individually
                insertedCourses.push(newCourse);
            }

            res.status(201).json({
                message: "Courses added successfully!",
                data: insertedCourses
            });
        } catch (error) {
            res.status(500).json({
                message: "Error adding courses",
                error: error.message
            });
        }

    }
}

export default new CourseController();
