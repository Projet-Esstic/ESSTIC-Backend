const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    level: {
        type: Number,
        required: true,
        min: 1,
        max: 5 // Assuming 5 years of study
    },
    courses: [{
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        lecturer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        schedule: [{
            day: {
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                required: true
            },
            startTime: {
                type: String,
                required: true
            },
            endTime: {
                type: String,
                required: true
            },
            room: {
                type: String,
                required: true
            }
        }]
    }],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    classTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add indexes for common queries
classSchema.index({ department: 1, academicYear: 1 });
classSchema.index({ name: 1, academicYear: 1 }, { unique: true });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
