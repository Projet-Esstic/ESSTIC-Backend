import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    courseName: {
        type: String,
        required: true,
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
    // Every course is linked to a Department.
    department: [
        {
            departmentInfo: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Department',

            },
            coefficient:{
                type: Number,
                required: function () {
                  return this.isEntranceExam;
                },
                min: [1, 'Credit hours must be at least 1']
              },
        }],
    // Specifies which academic level the course belongs to.
    level: {
        type: String,
        enum: ['level_1', 'level_2', 'level_3', 'masters_1', 'masters_2', 'phd'],
        required: function () {
            return !this.isEntranceExam;
        }
    },
    // Specifies which field of study the course belongs to.
    //   fieldOfStudy: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'FieldOfStudy',
    //     required: function () {
    //       return !this.isEntranceExam;
    //     }
    //   },
    //   // Maximum possible marks for the course.
    //   maxMarks: {
    //     type: Number,
    //     required: true,
    //     min: [1, 'Maximum marks must be at least 1']
    //   },
    // Flag to indicate if the course is for the entrance examination.
    isEntranceExam: {
        type: Boolean,
        default: false,
        required: true
    }
}, {
    timestamps: true
});



const Course= mongoose.model('Course', courseSchema);

export default Course;