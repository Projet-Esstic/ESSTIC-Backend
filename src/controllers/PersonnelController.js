import BaseController from './BaseController.js';
import User from '../models/User.js';
import Personnel from '../models/Personnel.js';
import createError from 'http-errors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import fs from 'fs';
import os from 'os';
import bcrypt from 'bcrypt';

class PersonnelController extends BaseController {
    constructor() {
        super(Personnel);
        this.registerPersonnel = this.registerPersonnel.bind(this);
        this.submitDocuments = this.submitDocuments.bind(this);
        this.getDocument = this.getDocument.bind(this);
        this.updateJobDetails = this.updateJobDetails.bind(this);
        this.getPersonnel = this.getPersonnel.bind(this);
        this.getAllPersonnel = this.getAllPersonnel.bind(this);
        this.updatePersonnel = this.updatePersonnel.bind(this);
    }

    handleError(error, context) {
        console.error(`❌ Error during ${context}:`, error);
        return {
            status: 'error',
            message: `Error during ${context}`,
            details: error.message || error,
        };
    }

    // Register new personnel (similar to registerForExam)
    async registerPersonnel(req, res) {
        let session = null;
        try {
            session = await mongoose.startSession();
            session.startTransaction();

            // const formData = JSON.parse(req.body.formData);
            const formData = req.body
            const { email,
                firstName, lastName,
                dateOfBirth, gender, phoneNumber,
                roles, department, salary, emergencyContact } = formData;

            // Check if the email is already registered
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email is already registered.' });
            }
            let password = "password123"
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create the new user
            const newUser = new User({
                firstName,
                lastName,
                email,
                password: password,
                phoneNumber,
                dateOfBirth,
                gender,
                roles: roles || ['teacher'] // Default role is 'teacher'
            });


            const savedUser = await newUser.save({ session });

            // Handle document uploads
            const documents = {};
            if (req.files) {
                const documentTypes = ['profileImage', 'cv', 'idCard', 'other'];
                for (const type of documentTypes) {
                    if (req.files[type] && req.files[type][0]) {
                        const file = req.files[type][0];
                        documents[type] = {
                            path: file.path,
                            originalName: file.originalname,
                            mimeType: file.mimetype,
                            size: file.size,
                            uploadedAt: new Date(),
                        };
                    }
                }
            }

            // Create new personnel record
            const personnelData = {
                user: savedUser._id,
                documents,
                department,
                salary,
                emergencyContact
            };

            const newPersonnel = new Personnel(personnelData);
            await newPersonnel.save({ session });

            await session.commitTransaction();
            session.endSession();

            res.status(201).json({
                message: 'Personnel registered successfully',
                user: savedUser,
                personnel: newPersonnel,
            });
        } catch (error) {
            console.error('Registration error:', error);

            if (session) {
                await session.abortTransaction();
            }

            res.status(500).json({ message: error.message || 'Internal server error' });
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }

    async registerManyPersonnel(req, res) {
        let session = null;
        try {
            session = await mongoose.startSession();
            session.startTransaction();

            const personnelList = req.body; // Expecting an array of personnel data

            if (!Array.isArray(personnelList) || personnelList.length === 0) {
                return res.status(400).json({ message: 'Invalid input. Expected an array of personnel data.' });
            }

            const newUsers = [];
            const newPersonnelRecords = [];

            for (const formData of personnelList) {
                const { email, firstName, lastName, dateOfBirth, gender, phoneNumber, roles, department, salary, emergencyContact } = formData;

                // Check if email is already registered
                const existingUser = await User.findOne({ email }).session(session);
                if (existingUser) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ message: `Email ${email} is already registered.` });
                }

                // Default password (hashed)
                const password = "password123";
                // const salt = await bcrypt.genSalt(10);
                // const hashedPassword = await bcrypt.hash(password, salt);

                // Create new user
                const newUser = new User({
                    firstName,
                    lastName,
                    email,
                    password: password,
                    phoneNumber,
                    dateOfBirth,
                    gender,
                    roles: roles || ['teacher'] // Default role is 'teacher'
                });

                const savedUser = await newUser.save({ session });
                newUsers.push(savedUser);

                // Handle document uploads
                const documents = {};
                if (req.files) {
                    const documentTypes = ['profileImage', 'cv', 'idCard', 'other'];
                    for (const type of documentTypes) {
                        if (req.files[type] && req.files[type][0]) {
                            const file = req.files[type][0];
                            documents[type] = {
                                path: file.path,
                                originalName: file.originalname,
                                mimeType: file.mimetype,
                                size: file.size,
                                uploadedAt: new Date(),
                            };
                        }
                    }
                }

                // Create new personnel record
                const newPersonnel = new Personnel({
                    user: savedUser._id,
                    documents,
                    department,
                    salary,
                    emergencyContact
                });

                const savedPersonnel = await newPersonnel.save({ session });
                newPersonnelRecords.push(savedPersonnel);
            }

            await session.commitTransaction();
            session.endSession();

            res.status(201).json({
                message: 'Personnel registered successfully',
                users: newUsers,
                personnel: newPersonnelRecords,
            });
        } catch (error) {
            console.error('Batch registration error:', error);

            if (session) {
                await session.abortTransaction();
                session.endSession();
            }

            res.status(500).json({ message: error.message || 'Internal server error' });
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }

    // Submit documents (similar to submitDocuments in CandidateController)
    async submitDocuments(req, res, next) {
        try {
            const personnel = await Personnel.findOne({ user: req.user.userId });
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            if (req.files) {
                const documentTypes = ['profileImage', 'cv', 'idCard', 'other'];
                for (const type of documentTypes) {
                    if (req.files[type] && req.files[type][0]) {
                        const file = req.files[type][0];

                        // Remove old file if it exists
                        if (personnel.documents[type] && personnel.documents[type].path) {
                            fs.unlinkSync(personnel.documents[type].path);
                        }

                        // Update with new file
                        personnel.documents[type] = {
                            path: file.path,
                            originalName: file.originalname,
                            mimeType: file.mimetype,
                            size: file.size,
                            uploadedAt: new Date(),
                        };
                    }
                }
            }

            await personnel.save();
            res.json({
                message: 'Documents submitted successfully',
                documents: Object.fromEntries(
                    Object.entries(personnel.documents).map(([type, doc]) => [
                        type,
                        { originalName: doc.originalName, size: doc.size, uploadedAt: doc.uploadedAt },
                    ])
                ),
            });
        } catch (error) {
            next(this.handleError(error, 'submitting documents'));
        }
    }

    // Get a specific document (similar to getDocument in CandidateController)
    async getDocument(req, res, next) {
        try {
            const { type } = req.params;
            const personnel = await Personnel.findOne({ user: req.user.userId });
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            const document = personnel.documents[type];
            if (!document || !document.path) {
                throw createError(404, 'Document not found');
            }

            if (!fs.existsSync(document.path)) {
                throw createError(404, 'Document file not found');
            }

            res.sendFile(document.path, { root: '.' });
        } catch (error) {
            next(this.handleError(error, 'getting document'));
        }
    }

    // Update job details (similar to updateMarks for candidates)
    async updateJobDetails(req, res, next) {
        try {
            const { personnelId } = req.params;
            const { department, position } = req.body;

            // Verify if user has permission (admin only)
            if (!req.user.roles.includes('admin')) {
                throw createError(403, 'Unauthorized to update job details');
            }

            const personnel = await Personnel.findById(personnelId);
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            // Update department and position
            personnel.department = department || personnel.department;
            personnel.position = position || personnel.position;

            await personnel.save();

            res.json(personnel);
        } catch (error) {
            next(this.handleError(error, 'updating job details'));
        }
    }

    // Get a specific personnel by ID
    async getPersonnel(req, res, next) {
        try {
            const personnel = await Personnel.findById(req.params.id).populate('user');
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }
            res.json(personnel);
        } catch (error) {
            next(this.handleError(error, 'fetching personnel'));
        }
    }

    // Get all personnel
    async getAllPersonnel(req, res, next) {
        try {
            const personnel = await Personnel.find().populate('user');
            // console.log(personnel);

            res.json(personnel);
        } catch (error) {
            next(this.handleError(error, 'fetching all personnel'));
        }
    }

    // Update personnel details (similar to updateCandidate)
    async updatePersonnel(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            let session = null;
            session = await mongoose.startSession();
            session.startTransaction();

            const personnel = await Personnel.findById(id);
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            const personnelUpdateData = {};

            if (updateData.department) {
                personnelUpdateData.department = updateData.department;
            }

            if (updateData.employmentStatus) {
                personnelUpdateData.employmentStatus = updateData.employmentStatus;
            }

            // Additional fields as necessary

            if (Object.keys(personnelUpdateData).length > 0) {
                const updatedPersonnel = await Personnel.findByIdAndUpdate(
                    id,
                    personnelUpdateData,
                    { session, new: true, runValidators: true }
                );

                await session.commitTransaction();
                res.json(updatedPersonnel);
            } else {
                throw createError(400, 'No valid update data provided');
            }
        } catch (error) {
            if (session) {
                await session.abortTransaction();
            }
            next(this.handleError(error, 'updating personnel'));
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }

    async createSchedule(req, res, next) {
        try {
            const { id } = req.params;
            const { schedule } = req.body; // { class: 'Math', date: '2023-10-10', time: '10:00 AM', resource: 'Room 101' }

            const personnel = await Personnel.findById(id);
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            personnel.schedule.push(schedule);
            await personnel.save();

            res.status(201).json({ message: 'Schedule created successfully', schedule });
        } catch (error) {
            next(this.handleError(error, 'creating schedule'));
        }
    }

    async updateSchedule(req, res, next) {
        try {
            const { id } = req.params;
            const { scheduleId, updates } = req.body; // updates: { class: 'Physics', date: '2023-10-11', time: '11:00 AM' }

            const personnel = await Personnel.findById(id);
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            const schedule = personnel.schedule.id(scheduleId);
            if (!schedule) {
                throw createError(404, 'Schedule not found');
            }

            Object.assign(schedule, updates);
            await personnel.save();

            res.json({ message: 'Schedule updated successfully', schedule });
        } catch (error) {
            next(this.handleError(error, 'updating schedule'));
        }
    }

    async getSchedule(req, res, next) {
        try {
            const { id } = req.params;

            const personnel = await Personnel.findById(id);
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            res.json({ schedule: personnel.schedule });
        } catch (error) {
            next(this.handleError(error, 'fetching schedule'));
        }
    }

    async markAttendance(req, res, next) {
        try {
            const { id } = req.params;
            const { date, status } = req.body; // status: 'present', 'absent', 'late'

            const personnel = await Personnel.findById(id);
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            personnel.attendance.push({ date, status });
            await personnel.save();

            res.status(201).json({ message: 'Attendance marked successfully', attendance: { date, status } });
        } catch (error) {
            next(this.handleError(error, 'marking attendance'));
        }
    }

    async getAttendance(req, res, next) {
        try {
            const { id } = req.params;

            const personnel = await Personnel.findById(id);
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            res.json({ attendance: personnel.attendance });
        } catch (error) {
            next(this.handleError(error, 'fetching attendance'));
        }
    }

    async requestLeave(req, res, next) {
        try {
            const { id } = req.params;
            const { leaveType, startDate, endDate, reason } = req.body;

            const personnel = await Personnel.findById(id);
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            personnel.leaveHistory.push({
                leaveType,
                leaveStartDate: startDate,
                leaveEndDate: endDate,
                reason,
                approvalStatus: 'pending',
            });

            await personnel.save();

            res.status(201).json({ message: 'Leave request submitted successfully', leaveRequest: personnel.leaveHistory.slice(-1)[0] });
        } catch (error) {
            next(this.handleError(error, 'requesting leave'));
        }
    }

    async approveLeave(req, res, next) {
        try {
            const { id, leaveId } = req.params;
            const { status } = req.body; // status: 'approved', 'rejected'

            const personnel = await Personnel.findById(id);
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            const leaveRequest = personnel.leaveHistory.id(leaveId);
            if (!leaveRequest) {
                throw createError(404, 'Leave request not found');
            }

            leaveRequest.approvalStatus = status;
            await personnel.save();

            res.json({ message: 'Leave request updated successfully', leaveRequest });
        } catch (error) {
            next(this.handleError(error, 'approving leave'));
        }
    }

    async assignSubjects(req, res, next) {
        try {
            const { id } = req.params;
            const { subjects } = req.body; // subjects: ['Math', 'Physics']

            const personnel = await Personnel.findById(id);
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            personnel.assignedSubjects = subjects;
            await personnel.save();

            res.json({ message: 'Subjects assigned successfully', assignedSubjects: personnel.assignedSubjects });
        } catch (error) {
            next(this.handleError(error, 'assigning subjects'));
        }
    }

    async suspendTeacher(req, res, next) {
        try {
            const { id } = req.params;

            const personnel = await Personnel.findById(id);
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            personnel.employmentStatus = 'suspended';
            await personnel.save();

            res.json({ message: 'Teacher suspended successfully', personnel });
        } catch (error) {
            next(this.handleError(error, 'suspending teacher'));
        }
    }

    async updateTeacherRole(req, res, next) {
        try {
            const { id } = req.params;
            const { newRole } = req.body; // newRole: 'seniorTeacher', 'coordinator'

            const personnel = await Personnel.findById(id);
            if (!personnel) {
                throw createError(404, 'Personnel not found');
            }

            personnel.role = newRole;
            await personnel.save();

            res.json({ message: 'Teacher role updated successfully', personnel });
        } catch (error) {
            next(this.handleError(error, 'updating teacher role'));
        }
    }
}

export default new PersonnelController();
