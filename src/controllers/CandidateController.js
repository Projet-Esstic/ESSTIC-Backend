import BaseController from './BaseController.js';
import User from '../models/User.js';
import Candidate from '../models/Candidate.js';
import createError from 'http-errors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import fs from 'fs';
import os from 'os';
import { log } from 'console';

class CandidateController extends BaseController {
    constructor() {
        super(Candidate);
        // Bind methods to ensure 'this' context is preserved
        this.registerForExam = this.registerForExam.bind(this);
        this.submitDocuments = this.submitDocuments.bind(this);
        this.getDocument = this.getDocument.bind(this);
        this.updateMarks = this.updateMarks.bind(this);
        this.getCandidate = this.getCandidate.bind(this);
        this.getAllCandidates = this.getAllCandidates.bind(this);
    }
    
    handleError(error, context) {
        console.error(`❌ Error during ${context}:`, error);
        return {
            status: 'error',
            message: `Error during ${context}`,
            details: error.message || error,
        };
    }
    
    async registerForExam(req, res) {
        let session = null;
        let parsedFormData = null;

        try {
            console.log('Request body:', req.body);
            console.log('Processed files:', req.processedFiles);
            
            session = await mongoose.startSession();
            session.startTransaction();

            parsedFormData = JSON.parse(req.body.formData);
            console.log('Parsed payment data:', parsedFormData.payment);

            const {
                email, password, firstName, lastName, dateOfBirth, gender,
                phoneNumber, address, emergencyContact, examId,
                highSchool, university, professionalExperience,
                extraActivities, internationalExposure, fieldOfStudy,
                payment,state
            } = parsedFormData;

            // Create new user
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
                region: address.state,
                emergencyContact
            });

            console.log('Creating new user:', newUser);
            const savedUser = await newUser.save({ session });

            // Handle processed files
            const documents = {};
            if (req.processedFiles && req.processedFiles.length > 0) {
                for (const file of req.processedFiles) {
                    documents[file.documentType] = {
                        path: file.path,
                        originalName: file.originalName,
                        mimeType: file.mimeType,
                        size: file.size,
                        uploadedAt: file.uploadedAt,
                        thumbnailPath: file.thumbnailPath
                    };
                }
            }

            // Parse and validate the payment date
            const paymentDate = payment.paymentDate ? new Date(payment.paymentDate) : null;
            console.log('Parsed payment date:', paymentDate);

            if (!paymentDate || isNaN(paymentDate.getTime())) {
                throw new Error(`Invalid payment date: ${payment.paymentDate}`);
            }

            // Create candidate data with payment information
            const candidateData = {
                user: savedUser._id,
                documents,
                highSchool: highSchool || {},
                university: university || {},
                professionalExperience: professionalExperience || [],
                extraActivities: extraActivities || [],
                internationalExposure: internationalExposure || [],
                payment: [{
                    amountPaid: payment.amount,
                    paidDate: paymentDate.toISOString(), // Convert to ISO string
                    paymentMethod: payment.paymentMethod,
                    phoneNumber: payment.phoneNumber,
                    provider: payment.provider,
                    ...(payment.paymentMethod === 'bank' && documents.receipt && {
                        receiptPath: documents.receipt.path,
                        receiptThumbnail: documents.receipt.thumbnailPath
                    })
                }]
            };

            // Validate and add examId
            if (examId && mongoose.Types.ObjectId.isValid(examId)) {
                candidateData.selectedEntranceExam = new mongoose.Types.ObjectId(examId);
            } else {
                throw new Error('Invalid examId format');
            }

            // Validate and add fieldOfStudy
            if (fieldOfStudy && mongoose.Types.ObjectId.isValid(fieldOfStudy)) {
                candidateData.fieldOfStudy = new mongoose.Types.ObjectId(fieldOfStudy);
            } else {
                throw new Error('A valid fieldOfStudy ID is required');
            }

            console.log("Creating candidate with data:", {
                examId: candidateData.selectedEntranceExam,
                fieldOfStudy: candidateData.fieldOfStudy,
                payment: candidateData.payment,
                paymentDate: candidateData.payment[0].paidDate // Log the date
            });

            const newCandidate = new Candidate(candidateData);
            const savedCandidate = await newCandidate.save({ session });

            await session.commitTransaction();
            session.endSession();

            const token = jwt.sign(
                { userId: savedUser._id, roles: savedUser.roles },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

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

            // Send more specific error messages
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
            const candidatesToUpdate = req.body; // Expecting an array of { candidateId, courseId, mark }

            console.log('Candidates to update:', candidatesToUpdate); // Log the entire request body

            const updatedCandidates = [];

            for (const { candidateId, courseId, mark } of candidatesToUpdate) {
                // Log the mark object for each candidate
                console.log(`Updating candidate ID: ${candidateId}, mark:`, mark);

                const candidate = await Candidate.findById(candidateId);
                if (!candidate) {
                    throw createError(404, `Candidate not found for ID: ${candidateId}`);
                }

                // Extract the current mark and modification details
                const currentMark = mark.currentMark;
                const modificationDetails = mark.modified[0]; // Assuming there's at least one modification record

                // Create modification record
                const modification = {
                    preMark: modificationDetails.preMark || 0,
                    modMark: currentMark,
                    modifiedBy: {
                        name: modificationDetails.modifiedBy.name,
                        userId: modificationDetails.modifiedBy.userId
                    }
                };

                // Update or add new mark
                const markIndex = candidate.Marks.findIndex(m => m.courseId.toString() === courseId);
                if (markIndex === -1) {
                    candidate.Marks.push({
                        courseId,
                        mark: {
                            currentMark,
                            modified: [modification]
                        }
                    });
                } else {
                    candidate.Marks[markIndex].mark.currentMark = currentMark;
                    candidate.Marks[markIndex].mark.modified.push(modification);
                }

                await candidate.save();
                updatedCandidates.push(candidate);
            }

            res.json(updatedCandidates);
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