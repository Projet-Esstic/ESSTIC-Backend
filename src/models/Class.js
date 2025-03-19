import mongoose from 'mongoose';

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
        required: true,
        match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
    },
    level: {
        type: String,
        required: true,
        enum: ['level_1', 'level_2', 'level_3', 'masters_1', 'masters_2', 'phd']
    },
    courses: [{
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        semester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Semester',
            required: true
        }
    }],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    classMaster: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

// Validate that courses belong to the class's department
classSchema.pre('save', async function(next) {
    if (this.isModified('courses')) {
        for (const courseAssignment of this.courses) {
            const course = await mongoose.model('Course').findById(courseAssignment.course);
            if (!course) {
                throw new Error(`Course ${courseAssignment.course} not found`);
            }
            
            const belongsToDepartment = course.department.some(
                dep => dep.departmentInfo.toString() === this.department.toString()
            );
            
            if (!belongsToDepartment) {
                throw new Error(`Course ${course.courseName} does not belong to this department`);
            }
        }
    }
    next();
});

const Class = mongoose.model('Class', classSchema);

export default Class;
