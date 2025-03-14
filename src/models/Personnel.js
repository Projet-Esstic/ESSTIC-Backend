import mongoose from 'mongoose';
import bcrypt  from 'bcrypt';

const Schema = mongoose.Schema;

const personnelSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    employmentStatus: {
        type: String,
        enum: ['active', 'onLeave', 'retired', 'terminated'],
        default: 'active'
    },
    hireDate: {
        type: Date,
        default: Date.now
    },
    department: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    documents: {
        contract: {
            path: { type: String },
            originalName: { type: String },
            mimeType: { type: String },
            size: { type: Number },
            uploadedAt: { type: Date, default: Date.now }
        },
        idCard: {
            path: { type: String },
            originalName: { type: String },
            mimeType: { type: String },
            size: { type: Number },
            uploadedAt: { type: Date, default: Date.now }
        },
        degreeCertificate: {
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
    salary: {
        amount: {
            type: Number,
            required: true
        },
        paymentMethod: {
            type: String,
            enum: ['bank', 'cash', 'mobile'],
            required: true
        },
        paidDate: {
            type: Date,
            required: true
        }
    },
    performanceReviews: [{
        reviewDate: {
            type: Date,
            required: true
        },
        reviewer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comments: { type: String, trim: true }
    }],
    trainingPrograms: [{
        programName: { type: String, required: true, trim: true },
        dateCompleted: { type: Date },
        certification: {
            path: { type: String },
            originalName: { type: String },
            mimeType: { type: String },
            size: { type: Number },
            uploadedAt: { type: Date, default: Date.now }
        }
    }],
    leaveHistory: [{
        leaveType: {
            type: String,
            enum: ['sick', 'vacation', 'maternity', 'personal'],
            required: true
        },
        leaveStartDate: { type: Date, required: true },
        leaveEndDate: { type: Date, required: true },
        approvalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        reason: { type: String, trim: true }
    }],
    emergencyContact: {
        name: { type: String, trim: true },
        relationship: { type: String, trim: true },
        phone: {
            type: String,
            trim: true,
            match: [/^\+?[0-9]{7,15}$/, 'Invalid phone number']
        }
    },
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
    certifications: [{
        certificationName: { type: String, trim: true },
        institution: { type: String, trim: true },
        dateIssued: { type: Date },
        expirationDate: { type: Date }
    }],
    skills: [{
        skillName: { type: String, trim: true },
        proficiencyLevel: { type: String, enum: ['beginner', 'intermediate', 'expert'] }
    }],
    projects: [{
        projectName: { type: String, trim: true },
        projectDescription: { type: String, trim: true },
        role: { type: String, trim: true },
        projectDuration: { type: String, trim: true }
    }]
}, {
    timestamps: true
});

const Personnel = mongoose.model('Personnel', personnelSchema);
export default Personnel;
