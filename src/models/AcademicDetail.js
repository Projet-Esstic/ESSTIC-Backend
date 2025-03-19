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
    isActive: {
        type: Boolean,
        default: true // Marks if the department is still active
    },
    // Reference to the Semester model; applicable only for student courses.
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicDetail.module',
        required: function () {
            return this.isEntranceExam;
        }
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
                if (this.isEntranceExam) {
                    // For entrance exams: must have departments with coefficients
                    return departments.length > 0 &&
                        departments.every(dep => dep.departmentInfo && dep.coefficient);
                } else {
                    // For regular courses: must have at least one department without coefficient
                    return departments.length > 0;
                }
            },
            message: props => {
                if (props.doc.isEntranceExam) {
                    return 'Entrance exam courses must have departments with coefficients';
                }
                return 'Course must be associated with at least one department';
            }
        }
    },
    isEntranceExam: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: false
});

// Pre-save middleware to validate department structure
courseSchema.pre('save', function (next) {
    if (this.isEntranceExam && !this.department.every(dep => dep.coefficient >= 1)) {
        next(new Error('Entrance exam courses must have departments with valid coefficients'));
    }
    next();
});


const moduleSchema = new mongoose.Schema({
    moduleCode: {
        type: String,
        unique: true,
        required: true,  // Ensure moduleCode is always provided
        trim: true
    },    
    moduleUnit: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Reference to the Semester model; applicable only for student courses.
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    // Department structure changes based on isEntranceExam
    department: {
        type: [{
            _id: false, // Disable automatic _id for subdocuments
            departmentInfo: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Department',
                required: true
            },
            credit: {
                type: Number,
                required: true,
                min: [1, 'Credit must be at least 1']
            },
        }, { _id: false }],
        validate: {
            validator: function (departments) {
                return departments.length > 0 &&
                    departments.every(dep => dep.departmentInfo && dep.coefficient);
            },
            message: 'module must have departments with credit'
        }
    }
}, {
    timestamps: false
});

const semesterSchema = new mongoose.Schema({
    name: {
        type: String,
        enum: ['Semester 1', 'Semester 2'],
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value < this.endDate;
            },
            message: 'Start date must be before end date.'
        }
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false // Marks if the semester is currently ongoing
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Tracks admin or professor who created it
    }
}, { timestamps: false });

// Compound index for fast lookups
semesterSchema.index({  name: 1, department: 1 }, { unique: true });

const AcademicDetailSchema = new mongoose.Schema({
    level: { type: String, required: true, unique: false }, // e.g. "level"
    year: {
        type: String,
        required: true,
        unique: false,
        match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'],
        trim: true
    }, // e.g. "2024-2025"
    courses: { type: [courseSchema], require: true },
    modules: { type: [moduleSchema], require: true },
    semesters: { type: [semesterSchema], require: true },
}, { timestamps: false })
AcademicDetailSchema.index({ level: 1, year: 1 }, { unique: true }); // Ensures a level cannot have duplicate academic years

const AcademicDetail = mongoose.model('AcademicDetail', AcademicDetailSchema);
export default AcademicDetail;