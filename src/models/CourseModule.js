import mongoose from 'mongoose';

const courseModuleSchema = new mongoose.Schema({
    moduleCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    moduleName: {
        type: String,
        required: true,
        trim: true
    },
    courses: [{
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        hours: {
            CM: {
                type: Number,
                default: 0,
                min: 0
            },
            TP: {
                type: Number,
                default: 0,
                min: 0
            },
            TPE: {
                type: Number,
                default: 0,
                min: 0
            },
            total: {
                type: Number,
                default: function() {
                    return this.CM + this.TP + this.TPE;
                }
            }
        }
    }],
    credits: {
        type: Number,
        required: true,
        min: 0
    },
    semester: {
        type: Number,
        required: true,
        enum: [1, 2],
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value'
        }
    },
    level: {
        type: String,
        required: true,
        enum: ['level_1', 'level_2', 'level_3', 'masters_1', 'masters_2', 'phd']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total hours in the module
courseModuleSchema.virtual('totalHours').get(function() {
    if (!this.populated('courses')) {
        return 0;
    }
    return this.courses.reduce((total, course) => total + course.hours.total, 0);
});

// Pre-save middleware to validate total credits
courseModuleSchema.pre('save', function(next) {
    if (this.credits < 0) {
        next(new Error('Credits cannot be negative'));
    }
    next();
});

const CourseModule = mongoose.model('CourseModule', courseModuleSchema);

export default CourseModule; 