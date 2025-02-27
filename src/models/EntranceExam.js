import Candidate from './Candidate.js';

import mongoose from 'mongoose';

const entranceExamSchema = new mongoose.Schema({
    examCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z0-9]+$/, 'Exam code must be alphanumeric and uppercase']
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
        index: true
    },
    academicYear: {
        type: String,
        required: true,
        match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
    },
    courses: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
    }],
    examDate: {
        type: Date,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Tracks the admin who created it
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'completed'],
        default: 'active' // Default to 'active' statu
    }
}, { timestamps: true });

// Indexing for performance


entranceExamSchema.index({ academicYear: 1 });

// Automatically update the status based on the end date
entranceExamSchema.pre('save', function (next) {
    if (this.examDate < new Date()) {
        this.status = 'completed'; // Mark as 'completed' if the end date has passed
    } else if (this.endDate > new Date()) {
        this.status = 'active'; // Mark as 'inactive' if the exam has not started yet
    }else {
        this.status = 'inactive'; // Mark as 'inactive' if the exam has not started yet
    }

    next();
});

const entranceExam = mongoose.model('EntranceExam', entranceExamSchema);

export default entranceExam;