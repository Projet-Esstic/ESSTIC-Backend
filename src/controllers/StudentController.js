import BaseController from './BaseController.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import createError from 'http-errors';

/*export const addStudent = async (req, res) => {
    try {
        const {
            user,
            applicant,
            academicInfo
        } = req.body;

        // Validate required fields
        if (!user || !applicant || !academicInfo) {
            return res.status(400).json({ message: 'Missing required fields: user, applicant, or academicInfo.' });
        }

        // Check if the user exists
        const existingUser = await User.findById(user);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the applicant exists
        const existingApplicant = await Candidate.findById(applicant);
        if (!existingApplicant) {
            return res.status(404).json({ message: 'Applicant not found.' });
        }

        // Check if the student already exists for the given user or applicant
        const existingStudentByUser = await Student.findOne({ user });
        if (existingStudentByUser) {
            return res.status(400).json({ message: 'A student record already exists for this user.' });
        }

        const existingStudentByApplicant = await Student.findOne({ applicant });
        if (existingStudentByApplicant) {
            return res.status(400).json({ message: 'A student record already exists for this applicant.' });
        }

        // Validate academicInfo fields
        if (!academicInfo.level || !academicInfo.department) {
            return res.status(400).json({ message: 'Missing required academicInfo fields: level or department.' });
        }

        // Create the new student
        const newStudent = new Student({
            user,
            applicant,
            academicInfo
        });

        // Save the student to the database
        await newStudent.save();

        // Return the created student
        return res.status(201).json({ message: 'Student created successfully.', student: newStudent });

    } catch (error) {
        console.error('Error in addStudent:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

export const registerStudent = async (req, res) => {
    try {
        const {
            user,
            applicant,
            academicInfo
        } = req.body;

        // Validate required fields
        if (!user || !applicant || !academicInfo) {
            return res.status(400).json({ message: 'Missing required fields: user, applicant, or academicInfo.' });
        }

        // Check if the user exists
        const existingUser = await User.findById(user);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the applicant (candidate) exists
        const existingApplicant = await Candidate.findById(applicant);
        if (!existingApplicant) {
            return res.status(404).json({ message: 'Applicant (candidate) not found.' });
        }

        // Check if the student already exists for the given user or applicant
        const existingStudentByUser = await Student.findOne({ user });
        if (existingStudentByUser) {
            return res.status(400).json({ message: 'A student record already exists for this user.' });
        }

        const existingStudentByApplicant = await Student.findOne({ applicant });
        if (existingStudentByApplicant) {
            return res.status(400).json({ message: 'A student record already exists for this applicant.' });
        }

        // Validate academicInfo fields
        if (!academicInfo.level || !academicInfo.department) {
            return res.status(400).json({ message: 'Missing required academicInfo fields: level or department.' });
        }

        // Create the new student
        const newStudent = new Student({
            user,
            applicant,
            academicInfo
        });

        // Save the student to the database
        await newStudent.save();

        // Return the created student
        return res.status(201).json({ message: 'Student registered successfully.', student: newStudent });

    } catch (error) {
        console.error('Error in registerStudent:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};*/

export const studentBrief = async (req, res) => {
    try {
        /**
         * I prefer to do like this because I assumes that other people thant the student will have access to this route
         * like the teachers, the student's parent and the admin for example.
         */
        const { id } = req.params;
        const { year } = req.body;

        // Validate the ID and year
        if (!id) {
            return res.status(400).json({ message: 'You need to provide the ID of the user to proceed.' });
        }
        if (!year || !/^\d{4}-\d{4}$/.test(year)) {
            return res.status(400).json({ message: 'Invalid academic year format. Use YYYY-YYYY.' });
        }

        // Define the global briefing object
        const brief = {};

        // Get the student by ID and populate the user field
        const student = await Student.findById(id).populate('user');
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        // Add personal information about the student
        brief.personalInfo = {
            fullName: student.user.fullName,
            dateOfBirth: student.user.dateOfBirth,
            gender: student.user.gender,
            email: student.user.email
        };

        // Find the academic year in the student's record
        const academicYearData = student.academicInfo.academicYears.find(ay => ay.year === year);
        if (!academicYearData) {
            return res.status(404).json({ message: 'No academic year found for the specified year.' });
        }

        // Add the academic information
        brief.academicInfo = {
            annualTotalPoints: student.academicInfo.annualTotalPoints,
            annualAverage: student.academicInfo.annualAverage,
            annualRank: student.academicInfo.annualRank,
            annualCredits: student.academicInfo.annualCredits,
            annualHourOfAbsences: student.academicInfo.annualHourOfAbsences,
            annualDiscipline: student.academicInfo.annualDiscipline,
            finalDecision: student.academicInfo.finalDecision,
            level: student.academicInfo.level,
            department: student.academicInfo.department
        };

        // Add the level information
        brief.level_details = {
            academicYear: academicYearData.year,
            semesters: academicYearData.semesters.map(semester => ({
                semesterInfo: semester.semesterInfo,
                totalPoints: semester.totalPoints,
                average: semester.average,
                rank: semester.rank,
                credits: semester.credits,
                absences: semester.absences,
                discipline: semester.discipline
            }))
        };

        // Add the courses information
        await student.populate('academicInfo.courses.courseId');
        brief.coursesInfo = student.academicInfo.courses.map(course => ({
            courseId: course.courseId,
            marks: {
                CA: course.marks.CA,
                EXAM: course.marks.EXAM,
                RESIT: course.marks.RESIT
            }
        }));

        // Return the brief
        return res.status(200).json({ studentBrief: brief });

    } catch (error) {
        console.error('Error in studentBrief:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

class StudentController extends BaseController {
    constructor() {
        super(Student);
    }

    async getStudentDetails(req, res, next) {
        try {
            const student = await Student.findById(req.params.id)
                .populate('user', 'name email')
                .populate({
                    path: 'courses',
                    populate: { path: 'courseId', select: 'courseName courseCode' }
                });

            if (!student) {
                throw createError(404, 'Student not found');
            }

            res.json(student);
        } catch (error) {
            next(this.handleError(error, 'fetching student details'));
        }
    }

    async updateAcademicInfo(req, res, next) {
        try {
            const { studentId } = req.params;
            const updates = req.body;

            // Verify if user has permission (admin or teacher)
            if (!req.user.roles.includes('admin') && !req.user.roles.includes('teacher')) {
                throw createError(403, 'Unauthorized to update academic info');
            }

            const student = await Student.findByIdAndUpdate(
                studentId,
                { $set: { 'academicInfo': updates } },
                { new: true, runValidators: true }
            );

            if (!student) {
                throw createError(404, 'Student not found');
            }

            res.json(student);
        } catch (error) {
            next(this.handleError(error, 'update academic info'));
        }
    }

    async updateMarks(req, res, next) {
        try {
            const { studentId, courseId } = req.params;
            const { examType, mark } = req.body;

            // Verify if user has permission (admin or teacher)
            if (!req.user.roles.includes('admin') && !req.user.roles.includes('teacher')) {
                throw createError(403, 'Unauthorized to update marks');
            }

            const student = await Student.findById(studentId);
            if (!student) {
                throw createError(404, 'Student not found');
            }

            // Find the course in student's courses array
            const courseIndex = student.academicInfo.courses.findIndex(
                c => c.courseId.toString() === courseId
            );

            if (courseIndex === -1) {
                throw createError(404, 'Course not found for this student');
            }

            // Create modification record
            const modification = {
                preMark: student.academicInfo.courses[courseIndex].marks[examType].currentMark,
                modMark: mark,
                modifiedBy: {
                    name: req.user.fullName,
                    userId: req.user.userId
                }
            };

            // Update the mark and add modification record
            student.academicInfo.courses[courseIndex].marks[examType].currentMark = mark;
            student.academicInfo.courses[courseIndex].marks[examType].modified.push(modification);

            await student.save();

            res.json(student);
        } catch (error) {
            next(this.handleError(error, 'update marks'));
        }
    }
}

export default new StudentController(); 