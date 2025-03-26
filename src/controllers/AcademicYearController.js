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

            let assessment = [
                {
                    "type": "CC",
                    "currentMark": 0,
                    "isActive": true,
                    "modified": []
                },
                {
                    "type": "Exam",
                    "currentMark": 0,
                    "isActive": true,
                    "modified": []
                },
                {
                    "type": "Resit",
                    "currentMark": 0,
                    "isActive": true,
                    "modified": []
                }
            ]
            const formattedSemesters = semesters.map(semester => ({
                ...semester.toObject(),
                semesterInfo: semester._id,
                modules: semester.modules.map(module => ({
                    ...module.toObject(),
                    moduleInfo: module._id,  // Renaming
                    courses: module.courses.map(course => ({
                        ...course.toObject(),
                        courseInfo: course._id,  // Renaming
                        assessments: assessment
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
    async updateStudentMark(req, res) {
        try {
            const {
                studentId,
                selectedSemester,
                selectedModule,
                subjectId,
                assessmentType,
                markValue
            } = req.body;

            console.log(studentId);
            // Find the student document
            const student = await AcademicYear.findOne({ _id: studentId });

            if (!student) {
                return res.status(404).json({ success: false, message: "Student not found" });
            }

            // Find the assessment object
            const assessment = student.semesters
                .find(opt => opt.semesterInfo.toString() === selectedSemester)?.modules
                .find(opt => opt.moduleInfo.toString() === selectedModule)?.courses
                .find(opt => opt.courseInfo.toString() === subjectId)?.assessments
                .find(opt => opt.type.toString() === assessmentType);
            
            // console.log(assessment);

            if (!assessment) {
                return res.status(404).json({ success: false, message: "Assessment not found" });
            }

            // // Modify the assessment
            let modified = {
                preMark: assessment.currentMark,
                modMark: markValue,
                modifiedBy: {
                    name: "Anderson",
                    userId: "67d4107146023123ea84d3cb"
                },
            };
            assessment.currentMark = markValue;
            assessment.modified.push(modified);
            // console.log("assessment");
            // console.log(assessment);

            // Save the updated student document
            await student.save();

            return res.status(200).json({
                success: true,
                message: "Student mark updated successfully",
                student
            });

        } catch (error) {
            console.error("Error updating student:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

}

export default new AcademicYearController();
