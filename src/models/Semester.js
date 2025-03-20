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
    level: {
        type: String,
        required: true,
        enum: ['level_1', 'level_2', 'level_3', 'masters_1', 'masters_2', 'phd']
    },
    startDate: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                return value < this.endDate;
            },
            message: 'Start date must be before end date.'
        }
    },
    modules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseModule',
    }],
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'End date must be after start date.'
        }
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

// Add compound index for fast lookups and potential additional indexes
semesterSchema.index({ academicYear: 1, name: 1, level: 1 }, { unique: true });
semesterSchema.index({ academicYear: 1 }); // Index for faster queries by academicYear
semesterSchema.index({ level: 1 }); // Index for faster queries by level

// Optional: Middleware to automatically update `isActive` based on dates
semesterSchema.pre('save', function(next) {
    const currentDate = new Date();
    // Automatically set isActive based on current date and start/end dates
    if (this.startDate <= currentDate && this.endDate >= currentDate) {
        this.isActive = true;
    } else {
        this.isActive = false;
    }
    next();
});

const Semester = mongoose.model('Semester', semesterSchema);
export default Semester;
