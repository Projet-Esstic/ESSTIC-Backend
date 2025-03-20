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
        ref: 'Semester',
        required: true
    },
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
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
            message: 'Module must have departments with credit'
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
        match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'],
        trim: true
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

courseModuleSchema.virtual('fullDescription').get(function() {
   return `${this.moduleCode}: ${this.description}`;
});

// Middleware to handle adding module to Semester
courseModuleSchema.post('save', async function (doc) {
    await mongoose.model('Semester').findByIdAndUpdate(doc.semester, {
        $addToSet: { modules: doc._id }
    });
});

// Middleware to handle updating semester reference
courseModuleSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    if (update.semester) {
        const doc = await this.model.findOne(this.getQuery());
        if (doc && doc.semester.toString() !== update.semester.toString()) {
            await mongoose.model('Semester').findByIdAndUpdate(doc.semester, {
                $pull: { modules: doc._id }
            });
            await mongoose.model('Semester').findByIdAndUpdate(update.semester, {
                $addToSet: { modules: doc._id }
            });
        }
    }
    next();
});

// Middleware to remove module reference from Semester on delete
courseModuleSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await mongoose.model('Semester').findByIdAndUpdate(doc.semester, {
            $pull: { modules: doc._id }
        });
    }
});

const CourseModule = mongoose.model('CourseModule', courseModuleSchema);

export default CourseModule;
