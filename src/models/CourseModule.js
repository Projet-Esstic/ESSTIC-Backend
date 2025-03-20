import mongoose from 'mongoose';

const courseModuleSchema = new mongoose.Schema({
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
        ref: 'AcademicDetail',
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
                    departments.every(dep => dep.departmentInfo && dep.credit);
            },
            message: 'module must have departments with credit'
        }
    },
    level: {
        type: String,
        required: true,
        enum: ['level_1', 'level_2', 'level_3', 'masters_1', 'masters_2', 'phd']
    },
    year: {
        type: String,
        required: true,
        unique: false,
        match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'],
        trim: true
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});




const CourseModule = mongoose.model('CourseModule', courseModuleSchema);

export default CourseModule; 