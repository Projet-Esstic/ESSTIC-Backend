import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        unique: true,
        trim: true
    },
    courseName: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseModule',
    },
    isActive: {
        type: Boolean,
        default: true // Marks if the department is still active
    },
    // Multiple instructors allowed but not required initially.
    instructors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'

    }],
    // Department structure changes based on isEntranceExam
    department: {
        type: [{
            _id: false, // Disable automatic _id for subdocuments
            departmentInfo: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Department',
                required: true
            },
            coefficient: {
                type: Number,
                required: true,
                min: [1, 'Coefficient must be at least 1']
            }
        }, { _id: false }],
        validate: {
            validator: function (departments) {
                return departments.length > 0 &&
                    departments.every(dep => dep.departmentInfo && dep.coefficient);
            },
            message: 'Courses must have departments with coefficients'
        }
    },
    // Specifies which academic level the course belongs to.
    level: {
        type: String,
        enum: ['level_1', 'level_2', 'level_3', 'masters_1', 'masters_2', 'phd'],
        required: function () {
            return !this.isEntranceExam;
        }
    },
    year: {
        type: String,
        required: true,
        unique: false,
        match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'],
        trim: true
    },
    isEntranceExam: {
        type: Boolean,
        default: false
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
}, {
    timestamps: true
});

// Pre-save middleware to validate department structure
courseSchema.pre('save', function (next) {
    if (this.isEntranceExam) {
        // Validate that each department has both departmentInfo and coefficient
        const isValid = this.department.every(dep =>
            dep.departmentInfo && dep.coefficient && dep.coefficient >= 1
        );
        if (!isValid) {
            next(new Error('Entrance exam courses must have departments with valid coefficients'));
        }
    }
    next();
});

const Course = mongoose.model('Course', courseSchema);

export default Course;