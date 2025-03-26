import BaseController from './BaseController.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Candidate from '../models/Candidate.js';
import Department from '../models/Departement.js';
import { AcademicYear } from '../models/AcademicYear.js';
import createError from 'http-errors';
import mongoose from 'mongoose';
import { sendStudentRegistrationEmail } from '../services/email.service.js';
import Semester from '../models/Semester.js';

export const registerStudent = async (req, res) => {
    try {
        const studentRegistrations = Array.isArray(req.body) ? req.body : [req.body];
        const results = [];
        const errors = [];
        const emailPromises = []; // Array to hold email promises
        // console.log('Processing registrations:', studentRegistrations);

        for (const registration of studentRegistrations) {
            try {
                const { user, candidate, academicInfo } = registration;
                // console.log('Processing registration:', { user, candidate });
                // console.log('Academic Info:', academicInfo);

                // Validate required fields
                if (!user || !candidate || !academicInfo) {
                    // console.log('Missing required fields for:', { user, candidate });
                    errors.push({
                        user,
                        error: 'Missing required fields: user, candidate, or academicInfo.'
                    });
                    continue;
                }

                // Check if the user exists
                const existingUser = await User.findById(user);
                // console.log('Existing user:', existingUser);
                if (!existingUser) {
                    // console.log('User not found:', user);
                    errors.push({ user, error: 'User not found.' });
                    continue;
                }

                // Check if the candidate exists
                const existingCandidate = await Candidate.findById(candidate);
                console.log('candidate:', candidate);
                console.log('Existing candidate:', existingCandidate.user);
                if (!existingCandidate) {
                    console.log('Candidate not found:', candidate);
                    errors.push({ user, error: 'Candidate not found.' });
                    continue;
                }

                // Check for existing student records
                const existingStudentByUser = await Student.findOne({ user });
                if (existingStudentByUser) {
                    errors.push({ user, error: 'A student record already exists for this user.' });
                    continue;
                }

                const existingStudentByCandidate = await Student.findOne({ candidate });
                if (existingStudentByCandidate) {
                    errors.push({ user, error: 'A student record already exists for this candidate.' });
                    continue;
                }

                // Validate academicInfo structure
                const requiredAcademicFields = {
                    level: ['level_1', 'level_2', 'level_3', 'masters_1', 'masters_2', 'phd'],
                    department: mongoose.Types.ObjectId.isValid,
                    academicYears: Array.isArray
                };

                let academicInfoValid = true;
                for (const [field, validator] of Object.entries(requiredAcademicFields)) {
                    if (!academicInfo[0][field]) {
                        errors.push({
                            user,
                            error: `Missing required academicInfo field: ${field}`
                        });
                        academicInfoValid = false;
                        break;
                    }

                    if (Array.isArray(validator)) {
                        if (!validator.includes(academicInfo[0][field])) {
                            errors.push({
                                user,
                                error: `Invalid ${field}. Must be one of: ${validator.join(', ')}`
                            });
                            academicInfoValid = false;
                            break;
                        }
                    } else if (!validator(academicInfo[0][field])) {
                        errors.push({
                            user,
                            error: `Invalid ${field} format`
                        });
                        academicInfoValid = false;
                        break;
                    }
                }

                if (!academicInfoValid) continue;

                // Set default values for academic info
                const defaultedAcademicInfo = {
                    ...academicInfo[0],
                    annualTotalPoints: 0,
                    annualAverage: 0,
                    annualRank: null,
                    conduct: 0,
                    annualCredits: 0,
                    annualHourOfAbsences: 0,
                    annualDiscipline: 'Good',
                    finalDecision: 'Pending',
                    courses: academicInfo[0].courses || []
                };

                // Validate academic years structure
                if (academicInfo[0].academicYears) {
                    for (const year of academicInfo[0].academicYears) {
                        if (!year.year || !Array.isArray(year.semesters)) {
                            errors.push({
                                user,
                                error: 'Invalid academic year structure. Each year must have a year and semesters array.'
                            });
                            academicInfoValid = false;
                            break;
                        }
                    }
                }

                if (!academicInfoValid) continue;

                // Start a session for the transaction
                const session = await mongoose.startSession();
                session.startTransaction();

                try {
                    // Create and save the new student within the transaction
                    const newStudent = new Student({
                        user,
                        candidate,
                        academicInfo: defaultedAcademicInfo
                    });

                    const savedStudent = await newStudent.save({ session });
                    console.log("savedStudent:", savedStudent.candidate)
                    // Update candidate status to passed within the same transaction
                    await Candidate.findByIdAndUpdate(
                        candidate,
                        { applicationStatus: 'passed' },
                        { session }
                    );
                    console.log("update candidate:")
                    // Commit the transaction
                    await session.commitTransaction();
                    // console.log('Saved student:', savedStudent);

                    // Queue email sending after successful transaction
                    const emailPromise = sendStudentRegistrationEmail(
                        existingUser.email,
                        `${existingUser.firstName} ${existingUser.lastName}`,
                        defaultedAcademicInfo.level,
                        defaultedAcademicInfo.department
                    ).catch(error => {
                        console.error('Email sending failed for user:', existingUser.email, error);
                        return null;
                    });

                    emailPromises.push(emailPromise);

                    results.push({
                        user,
                        message: 'Student registered successfully.',
                        student: savedStudent
                    });

                } catch (transactionError) {
                    // If anything fails, abort the transaction
                    await session.abortTransaction();
                    throw transactionError;
                } finally {
                    // End the session
                    session.endSession();
                }

            } catch (registrationError) {
                console.error('Error in registration:', registrationError);
                errors.push({
                    user: registration.user,
                    error: registrationError.message
                });
            }
        }

        // Wait for all emails to be sent
        await Promise.allSettled(emailPromises);

        // console.log('Final results:', results);
        // console.log('Errors:', errors);

        return res.status(200).json({
            message: 'Student registration process completed',
            successful: results,
            failed: errors
        });

    } catch (error) {
        console.error('Error in registerStudent:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

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

// Function to add students from a JSON file
export const addStudentsArrayJson = async (req, res) => {
    const session = await mongoose.startSession(); // Start a new session
    session.startTransaction(); // Start the transaction

    try {
        let jsonData = req.body;

        // Validate that jsonData is an array
        if (!Array.isArray(jsonData)) {
            return res.status(400).json({ message: 'Invalid JSON format. Expecting an array of students.' });
        }

        const studentsAdded = [];
        let level = "level_1", academicYear = "2024-2025";
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
        // Fetching the semesters with population and formatting
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
            .populate('createdBy', 'firstName lastName')
            .session(session); // Use session in the query

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

        // Loop through each student in the request body
        for (const studentData of jsonData) {
            const { firstName, lastName, email, phoneNumber, dateOfBirth, gender, region,
                candidateId, level, departmentId, classId } = studentData;

            // Check if user already exists
            let user = await User.findOne({ email }).session(session); // Use session

            if (!user) {
                // Create new user
                const password = "password123";
                user = new User({
                    firstName,
                    lastName,
                    email,
                    password: password,
                    phoneNumber,
                    dateOfBirth,
                    gender,
                    region,
                    roles: ['student']  // Assign student role
                });
                await user.save({ session }); // Save with session
            }

            // Check if candidate exists
            const candidate = await Candidate.findById(candidateId).session(session); // Use session

            // Check if department exists
            const department = await Department.findById(departmentId).session(session); // Use session
            if (!department) {
                console.log({ message: `Department with ID ${departmentId} not found.` });
                continue;
            }

            // Create academic year module
            const academicYearModule = new AcademicYear({
                classes: classId,
                department: department?._id,
                level,
                year: academicYear,
                semesters: formattedSemesters,
            });
            let student = await Student.findOne({ user: user._id }).session(session); // Use session
            let existStudent = true
            if (!student) {
                existStudent = false
                // Create student record
                student = new Student({
                    user: user._id,
                    candidate: candidate?._id,
                    level,
                    department: department?._id,
                    academicYears: academicYearModule._id,
                    classes: classId || null  // Optional class field
                });
            }
            console.log("existStudent",existStudent)
            academicYearModule.student = student._id;

            // Save academic year module and student with session
            await academicYearModule.save({ session });
            if (!existStudent)
                await student.save({ session });

            studentsAdded.push({
                "student": student,
                "academicYear": academicYearModule,
                "user": user,
            });
        }

        // If everything was successful, commit the transaction
        await session.commitTransaction();
        session.endSession(); // End the session

        res.status(201).json({
            message: 'Students added successfully',
            students: studentsAdded,
        });

    } catch (error) {
        // If any error happens, abort the transaction
        await session.abortTransaction();
        session.endSession(); // End the session
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


class StudentController extends BaseController {
    constructor() {
        super(Student);
        this.getAllStudents = this.getAllStudents.bind(this);

    }

    handleError(error, context) {
        console.error(`❌ Error during ${context}:`, error);
        return {
            status: 'error',
            message: `Error during ${context}`,
            details: error.message || error,
        };
    }

    async getAllStudents(req, res, next) {
        try {
            const students = await Student.find()
                .populate('user')
                .populate('academicYears')
                .populate({
                    path: 'candidate',
                    select: 'fieldOfStudy',
                    populate: {
                        path: 'fieldOfStudy'
                    }
                });
            res.json(students);
        } catch (error) {
            next(this.handleError(error, 'fetching all candidates'));
        }
    }

    async getStudentDetails(req, res, next) {
        try {
            const student = await Student.findById(req.params.id)
                .populate('user')
            // .populate({
            //     path: 'courses',
            //     populate: { path: 'courseId', select: 'courseName courseCode' }
            // });

            if (!student) {
                throw createError(404, 'Student not found');
            }
            console.log(student);
            res.json(student);
        } catch (error) {
            console.log(error);
            //next(this.handleError(error, 'fetching student details'));
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