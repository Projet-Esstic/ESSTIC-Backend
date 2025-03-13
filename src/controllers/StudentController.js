import BaseController from './BaseController.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Candidate from '../models/Candidate.js';
import createError from 'http-errors';
import mongoose from 'mongoose';
import { sendStudentRegistrationEmail } from '../services/email.service.js';

export const registerStudent = async (req, res) => {
    try {
        const studentRegistrations = Array.isArray(req.body) ? req.body : [req.body];
        const results = [];
        const errors = [];
        const emailPromises = []; // Array to hold email promises
        console.log('Processing registrations:', studentRegistrations);

        for (const registration of studentRegistrations) {
            try {
                const { user, candidate, academicInfo } = registration;
                console.log('Processing registration:', { user, candidate });
                console.log('Academic Info:', academicInfo);

                // Validate required fields
                if (!user || !candidate || !academicInfo) {
                    console.log('Missing required fields for:', { user, candidate });
                    errors.push({ 
                        user, 
                        error: 'Missing required fields: user, candidate, or academicInfo.' 
                    });
                    continue;
                }

                // Check if the user exists
                const existingUser = await User.findById(user);
                console.log('Existing user:', existingUser);
                if (!existingUser) {
                    console.log('User not found:', user);
                    errors.push({ user, error: 'User not found.' });
                    continue;
                }

                // Check if the candidate exists
                const existingCandidate = await Candidate.findById(candidate);
                console.log('Existing candidate:', existingCandidate);
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
                    
                    // Update candidate status to passed within the same transaction
                    await Candidate.findByIdAndUpdate(
                        candidate, 
                        { applicationStatus: 'passed' },
                        { session }
                    );

                    // Commit the transaction
                    await session.commitTransaction();
                    console.log('Saved student:', savedStudent);

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

        console.log('Final results:', results);
        console.log('Errors:', errors);

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