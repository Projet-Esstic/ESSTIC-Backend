import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const candidateSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    applicationStatus: {
        type: String,
        enum: ['pending', 'registered', 'examTaken', 'passed', 'failed', 'rejected'],
        default: 'pending'
    },
    applicationDate: {
        type: Date,
        default: Date.now
    },
    selectedEntranceExam: {
        type: Schema.Types.ObjectId,
        ref: 'EntranceExam'
    },
    fieldOfStudy: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    documents: {
        transcript: {
            path: { type: String },
            originalName: { type: String },
            mimeType: { type: String },
            size: { type: Number },
            uploadedAt: { type: Date, default: Date.now }
        },
        diploma: {
            path: { type: String },
            originalName: { type: String },
            mimeType: { type: String },
            size: { type: Number },
            uploadedAt: { type: Date, default: Date.now }
        },
        cv: {
            path: { type: String },
            originalName: { type: String },
            mimeType: { type: String },
            size: { type: Number },
            uploadedAt: { type: Date, default: Date.now }
        },
        other: {
            path: { type: String },
            originalName: { type: String },
            mimeType: { type: String },
            size: { type: Number },
            uploadedAt: { type: Date, default: Date.now }
        }
    },
    examCenter: {
        type: String,
        trim: true
    },
    Marks: [{
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course'
        },
        mark: {
            currentMark: {
                type: Number,
                default: 0
            },
            modified: [{
                preMark: {
                    type: Number,
                    required: true
                },
                modMark: {
                    type: Number,
                    required: true
                },
                modifiedBy: {
                    name: {
                        type: String,
                        required: true
                    },
                    userId: {
                        type: Schema.Types.ObjectId,
                        ref: 'User',
                        required: true
                    }
                },
                dateModified: {
                    type: Date,
                    default: Date.now
                }
            }]
        }
    }],
    payment: [{
        amountPaid: {
            type: Number,
            required: true
        },
        paidDate: {
            type: Date,
            required: true
        },
        paymentMethod: {
            type: String,
            enum: ['bank', 'mobile'],
            required: true
        },
        validatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: function () { return this.paymentMethod === 'bank'}
        }
    }],
    // Additional applicant-specific fields
    highSchool: {
        schoolName: { type: String, trim: true },
        yearCompleted: { type: Number },
        majorSubjects: [String]
    },
    university: {
        universityName: { type: String, trim: true },
        degree: { type: String, trim: true },
        yearCompleted: { type: Number }
    },
    professionalExperience: [{
        company: { type: String, trim: true },
        position: { type: String, trim: true },
        yearsOfExperience: { type: Number }
    }],
    extraActivities: [{
        activity: { type: String, trim: true },
        description: { type: String, trim: true }
    }],
    internationalExposure: [{
        country: { type: String, trim: true },
        purpose: { type: String, trim: true },
        duration: { type: String, trim: true }
    }]
}, {
    timestamps: true
});

const Candidate = mongoose.model('Candidate', candidateSchema);
export default Candidate;
