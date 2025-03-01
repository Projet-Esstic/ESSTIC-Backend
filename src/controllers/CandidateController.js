import BaseController from './BaseController.js';
import User from '../models/User.js';
import Candidate from '../models/Candidate.js';
import createError from 'http-errors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import fs from 'fs';

class CandidateController extends BaseController {
    constructor() {
        super(Candidate);
    }

    async registerForExam(req, res, ) {
        let session = null;
        try {
            session = await mongoose.startSession();
            session.startTransaction();

            // Get form data based on content type
            let formData;
            if (req.is('multipart/form-data')) {
                formData = req.body.formData ? JSON.parse(req.body.formData) : req.body;
            } else {
                formData = req.body;
            }

            console.log('Received registration data:', formData);
            
            const {
                email, password, firstName, lastName, dateOfBirth, gender,
                phoneNumber, address, emergencyContact, examId,
                highSchool,
                university,
                professionalExperience,
                extraActivities,
                internationalExposure,
                fieldOfStudy
            } = formData;

            // Validate required fields
            if (!email || !firstName || !lastName || !examId || !fieldOfStudy) {
                throw createError(400, 'Missing required fields');
            }

            // Create User
            const newUser = new User({
                email,
                password,
                firstName,
                lastName,
                roles: ['candidate'],
                dateOfBirth,
                gender,
                phoneNumber,
                address,
                emergencyContact
            });

            console.log('Creating new user:', newUser);
            const savedUser = await newUser.save({ session });

            // Process uploaded documents if any
            const documents = {};
            if (req.files) {
                const documentTypes = ['profileImage', 'transcript', 'diploma', 'cv', 'other'];
                
                for (const type of documentTypes) {
                    if (req.files[type] && req.files[type][0]) {
                        const file = req.files[type][0];
                        documents[type] = {
                            path: file.path,
                            originalName: file.originalname,
                            mimeType: file.mimetype,
                            size: file.size,
                            uploadedAt: new Date()
                        };
                    }
                }
            }

            // Create Candidate
            const newCandidate = new Candidate({
                user: savedUser._id,
                selectedEntranceExam: examId,
                documents,
                fieldOfStudy,
                highSchool: highSchool || {},
                university: university || {},
                professionalExperience: professionalExperience || [],
                extraActivities: extraActivities || [],
                internationalExposure: internationalExposure || []
            });

            console.log('Creating new candidate:', newCandidate);
            const savedCandidate = await newCandidate.save({ session });

            // Generate JWT token
            const token = jwt.sign(
                { userId: savedUser._id, roles: savedUser.roles },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Commit transaction
            await session.commitTransaction();

            res.status(201).json({
                message: "Registration successful",
                token,
                user: savedUser,
                candidate: savedCandidate
            });
        } catch (error) {
            console.error('Registration error:', error);
            
            if (session) {
                try {
                    await session.abortTransaction();
                } catch (abortError) {
                    console.error('Error aborting transaction:', abortError);
                }
            }

            // Send appropriate error response
            if (error.name === 'ValidationError') {
                res.status(400).json({ 
                    message: 'Validation Error',
                    errors: Object.values(error.errors).map(err => err.message)
                });
            } else if (error.code === 11000) {
                res.status(400).json({ 
                    message: 'Email already exists',
                    field: Object.keys(error.keyPattern)[0]
                });
            } else {
                res.status(500).json({ 
                    message: error.message || 'Internal server error'
                });
            }
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }

    async submitDocuments(req, res, next) {
        try {
            const candidate = await Candidate.findOne({ user: req.user.userId });
            if (!candidate) {
                throw createError(404, 'Candidate not found');
            }

            // Process uploaded documents
            if (req.files) {
                const documentTypes = ['profileImage', 'transcript', 'diploma', 'cv', 'other'];
                
                for (const type of documentTypes) {
                    if (req.files[type] && req.files[type][0]) {
                        const file = req.files[type][0];
                        
                        // Remove old file if it exists
                        if (candidate.documents[type] && candidate.documents[type].path) {
                            try {
                                fs.unlinkSync(candidate.documents[type].path);
                            } catch (err) {
                                console.error(`Error deleting old file: ${err}`);
                            }
                        }

                        // Update with new file
                        candidate.documents[type] = {
                            path: file.path,
                            originalName: file.originalname,
                            mimeType: file.mimetype,
                            size: file.size,
                            uploadedAt: new Date()
                        };
                    }
                }
            }

            await candidate.save();
            res.json({ 
                message: 'Documents submitted successfully', 
                documents: Object.fromEntries(
                    Object.entries(candidate.documents).map(([type, doc]) => [
                        type,
                        {
                            originalName: doc.originalName,
                            size: doc.size,
                            uploadedAt: doc.uploadedAt
                        }
                    ])
                )
            });
        } catch (error) {
            next(this.handleError(error, 'submitting documents'));
        }
    }

    async getDocument(req, res, next) {
        try {
            const { type } = req.params;
            const candidate = await Candidate.findOne({ user: req.user.userId });
            
            if (!candidate) {
                throw createError(404, 'Candidate not found');
            }

            const document = candidate.documents[type];
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

    async updateMarks(req, res, next) {
        try {
            const { candidateId } = req.params;
            const { courseId, mark } = req.body;

            // Verify if user has permission (admin only)
            if (!req.user.roles.includes('admin')) {
                throw createError(403, 'Unauthorized to update entrance exam marks');
            }

            const candidate = await Candidate.findById(candidateId);
            if (!candidate) {
                throw createError(404, 'Candidate not found');
            }

            // Create modification record
            const modification = {
                preMark: candidate.Marks.find(m => m.courseId.toString() === courseId)?.mark?.currentMark || 0,
                modMark: mark,
                modifiedBy: {
                    name: req.user.fullName,
                    userId: req.user.userId
                }
            };

            // Update or add new mark
            const markIndex = candidate.Marks.findIndex(m => m.courseId.toString() === courseId);
            if (markIndex === -1) {
                candidate.Marks.push({
                    courseId,
                    mark: {
                        currentMark: mark,
                        modified: [modification]
                    }
                });
            } else {
                candidate.Marks[markIndex].mark.currentMark = mark;
                candidate.Marks[markIndex].mark.modified.push(modification);
            }

            await candidate.save();

            res.json(candidate);
        } catch (error) {
            next(this.handleError(error, 'update entrance exam marks'));
        }
    }

    // Method to get a single candidate by ID
    async getCandidate(req, res, next) {
        try {
            const candidate = await Candidate.findById(req.params.id).populate('user');
            if (!candidate) {
                throw createError(404, 'Candidate not found');
            }
            res.json(candidate);
        } catch (error) {
            next(this.handleError(error, 'fetching candidate'));
        }
    }

    // Method to get all candidates
    async getAllCandidates(req, res, next) {
        try {
            const candidates = await Candidate.find().populate('user');
            res.json(candidates);
        } catch (error) {
            next(this.handleError(error, 'fetching all candidates'));
        }
    }

    async updateCandidate(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            let session = null;
            console.log('Update data received:', updateData);

            try {
                session = await mongoose.startSession();
                session.startTransaction();

                // Find candidate
                const candidate = await Candidate.findById(id);
                if (!candidate) {
                    throw createError(404, 'Candidate not found');
                }

                // Create update object with only valid fields
                const candidateUpdateData = {};

                // Handle applicationStatus if provided and valid
                if (updateData.applicationStatus && 
                    ['pending', 'registered', 'rejected', 'passed', 'failed'].includes(updateData.applicationStatus)) {
                    candidateUpdateData.applicationStatus = updateData.applicationStatus;
                }

                // Helper function to check if an object has any non-empty values
                const hasNonEmptyValues = (obj) => {
                    if (!obj || typeof obj !== 'object') return false;
                    return Object.values(obj).some(value => {
                        if (Array.isArray(value)) return value.length > 0;
                        if (typeof value === 'object' && value !== null) return hasNonEmptyValues(value);
                        return value !== null && value !== '' && value !== undefined;
                    });
                };

                // Handle nested objects only if they contain valid data
                const nestedFields = ['highSchool', 'university', 'professionalExperience', 'extraActivities', 'internationalExposure'];
                nestedFields.forEach(field => {
                    if (updateData[field] !== undefined) {
                        if (Array.isArray(updateData[field])) {
                            // For arrays, only include if there are non-empty elements
                            if (updateData[field].some(item => hasNonEmptyValues(item))) {
                                candidateUpdateData[field] = updateData[field];
                            }
                        } else if (hasNonEmptyValues(updateData[field])) {
                            // For objects, only include if they have non-empty values
                            candidateUpdateData[field] = updateData[field];
                        }
                    }
                });

                console.log('Filtered update data:', candidateUpdateData);

                if (Object.keys(candidateUpdateData).length > 0) {
                    const updatedCandidate = await Candidate.findByIdAndUpdate(
                        id,
                        candidateUpdateData,
                        { session, new: true, runValidators: true }
                    );

                    await session.commitTransaction();
                    res.json(updatedCandidate);
                } else {
                    throw createError(400, 'No valid update data provided');
                }
            } catch (error) {
                if (session) {
                    await session.abortTransaction();
                }
                throw error;
            } finally {
                if (session) {
                    session.endSession();
                }
            }
        } catch (error) {
            console.error('Update error:', error);
            next(error);
        }
    }
}

export default new CandidateController(); 