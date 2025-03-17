import BaseController from './BaseController.js';
import Semester from '../models/Semester.js';
import createError from 'http-errors';

class SemesterController extends BaseController {
    constructor() {
        super(Semester);
    }

    async getAllSemesters(req, res, next) {
        try {
            const { department, academicYear } = req.query;
            const query = {};

            if (department) {
                query.department = department;
            }
            if (academicYear) {
                query.academicYear = academicYear;
            }

            const semesters = await Semester.find(query)
                .populate({
                    path: 'department',
                    select: 'name code description faculty'
                })
                .populate('courses', 'courseName courseCode')
                .populate('createdBy', 'firstName lastName')
                .lean(); // Convert to plain JavaScript objects

            // Format the response
            const formattedSemesters = semesters.map(semester => ({
                _id: semester._id,
                name: semester.name,
                academicYear: semester.academicYear,
                department: {
                    _id: semester.department._id,
                    name: semester.department.name,
                    code: semester.department.code,
                    description: semester.department.description,
                    faculty: semester.department.faculty
                },
                startDate: semester.startDate,
                endDate: semester.endDate,
                isActive: semester.isActive,
                courses: semester.courses || [],
                createdBy: semester.createdBy,
                createdAt: semester.createdAt,
                updatedAt: semester.updatedAt
            }));
            console.log(formattedSemesters);
            
            res.json(formattedSemesters);
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
        console.log(req.body);
        
        try {
            const newSemester = new Semester(req.body);
            await newSemester.save();
            res.status(201).json(newSemester);
        } catch (error) {
           // console.log(error);
            
            res.status(500).json(error)
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