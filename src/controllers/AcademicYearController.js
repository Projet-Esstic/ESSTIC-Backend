import BaseController from './BaseController.js';
import Semester from '../models/Semester.js';
import createError from 'http-errors';
import { AcademicYear } from '../models/AcademicYear.js';

class AcademicYearController extends BaseController {
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
                .populate({
                    path: 'modules',
                    select: 'moduleCode courses department',
                    populate: [
                        {
                            path: 'courses',
                            select: 'courseCode department',
                            populate: [
                                { path: 'department.departmentInfo', select: 'name' }
                            ]
                        },
                        { path: 'department.departmentInfo', select: 'name' }
                    ]
                })
                .populate('createdBy', 'firstName lastName');

            const formattedSemesters = semesters.map(semester => ({
                ...semester.toObject(),
                semesterInfo: semester._id,
                modules: semester.modules.map(module => ({
                    ...module.toObject(),
                    moduleInfo: module._id,  // Renaming
                    courses: module.courses.map(course => ({
                        ...course.toObject(),
                        courseInfo: course._id  // Renaming
                    }))
                }))
            }));

            const academicYearModule = new AcademicYear({
                classes: "",
                student: "",
                department: "",
                level,
                year: academicYear,
                semesters: formattedSemesters,
            })


            res.json(academicYearModule);
            // res.json(semesters);
        } catch (error) {
            next(this.handleError(error, 'fetching all semesters'));
        }
    }
    async getStudentsAcademicYear(req, res) {
        const { academicYear, level } = req.params;

        const students = await AcademicYear.find({ level, academicYear })
            .populate({
                path: 'student',
                select: 'user',
                populate: [
                    {
                        path: 'user',
                    }
                ]
            });
        res.json(students);

    }
}

export default new AcademicYearController();
