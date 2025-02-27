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

    async registerForExam(req, res, next) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Parse form data from request body
            const formData = JSON.parse(req.body.formData);
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
            const savedUser = await newUser.save({ session });

            // Process uploaded documents
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

            // Create Candidate with additional fields
            const newCandidate = new Candidate({
                user: savedUser._id,
                selectedEntranceExam: examId,
                documents,
                fieldOfStudy,
                // Add educational and professional background
                highSchool: highSchool || {},
                university: university || {},
                professionalExperience: professionalExperience || [],
                extraActivities: extraActivities || [],
                internationalExposure: internationalExposure || []
            });
            await newCandidate.save({ session });

            // Commit transaction
            await session.commitTransaction();
            session.endSession();

            // Generate JWT token
            const token = jwt.sign(
                { userId: savedUser._id, roles: savedUser.roles },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: "Registration successful",
                token,
                user: savedUser,
                candidate: newCandidate
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            next(this.handleError(error, 'registering for exam and creating user'));
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
}

export default new CandidateController(); 