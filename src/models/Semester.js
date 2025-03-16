import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema({
    name: {
        type: String,
        enum: ['Semester 1', 'Semester 2'],
        required: true,
        trim: true
    },
    academicYear: {
        type: String,
        required: true,
        match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'],
        trim: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
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
}, { timestamps: true });

// Remove the courses array and replace with a virtual
semesterSchema.virtual('courses', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'semester',
    justOne: false
});

// Compound index for fast lookups
semesterSchema.index({ academicYear: 1, name: 1, department: 1 }, { unique: true });

const Semester = mongoose.model('Semester', semesterSchema);
export default Semester;