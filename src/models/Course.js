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
    coefficient: {
        type: Number,
        required: function () {
            return !this.isEntranceExam;
        },
        min: [1, 'Credit hours must be at least 1']
    },
    // For regular student courses, creditHours is required.
    creditHours: {
        type: Number,
        required: function () {
            return !this.isEntranceExam;
        },
        min: [1, 'Credit hours must be at least 1']
    },

    isActive: {
        type: Boolean,
        default: true // Marks if the department is still active
    },
    // Reference to the Semester model; applicable only for student courses.
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: function () {
            return !this.isEntranceExam;
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
                required: function() {
                    return this.parent().parent().isEntranceExam;
                },
                min: [1, 'Coefficient must be at least 1']
            }
        }],
        validate: {
            validator: function(departments) {
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
    // Specifies which academic level the course belongs to.
    level: {
        type: String,
        enum: ['level_1', 'level_2', 'level_3', 'masters_1', 'masters_2', 'phd'],
        required: function () {
            return !this.isEntranceExam;
        }
    },
   
    isEntranceExam: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Pre-save middleware to validate department structure
courseSchema.pre('save', function(next) {
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