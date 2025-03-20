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
            default: function () {
                return this.CM + this.TP + this.TPE;
            }
        }
    }
}, {
    timestamps: true
});

// Pre-save middleware to validate department structure and to check if the course exists in the referenced module's courses array
courseSchema.pre('save', async function (next) {
    if (this.isEntranceExam) {
        // Validate that each department has both departmentInfo and coefficient
        const isValid = this.department.every(dep =>
            dep.departmentInfo && dep.coefficient && dep.coefficient >= 1
        );
        if (!isValid) {
            next(new Error('Entrance exam courses must have departments with valid coefficients'));
        }
    }
    if (this.module) {
        try {
            const CourseModule = mongoose.model('CourseModule');
            const module = await CourseModule.findById(this.module);
            if (module) {
                if (!module.courses) 
                    module.courses = []
                console.log(module.courses)
                if (!module.courses.includes(this._id)) {
                    module.courses.push(this._id);
                    await module.save();
                }
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});


// Pre-update middleware to handle module changes
courseSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    if (!update) return next();

    const CourseModule = mongoose.model('CourseModule');
    const existingCourse = await this.model.findOne(this.getQuery());

    if (existingCourse && update.module && existingCourse.module?.toString() !== update.module.toString()) {
        try {
            // Remove from old module
            if (existingCourse.module) {
                const oldModule = await CourseModule.findById(existingCourse.module);
                if (oldModule) {
                    oldModule.courses = oldModule.courses.filter(courseId => courseId.toString() !== existingCourse._id.toString());
                    await oldModule.save();
                }
            }

            // Add to new module
            if (update.module) {
                const newModule = await CourseModule.findById(update.module);
                if (newModule) {
                    if (!newModule.courses.includes(existingCourse._id)) {
                        newModule.courses.push(existingCourse._id);
                        await newModule.save();
                    }
                }
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Pre-remove middleware to handle deletion
courseSchema.pre('findOneAndDelete', async function (next) {
    const course = await this.model.findOne(this.getQuery());

    if (course && course.module) {
        try {
            const CourseModule = mongoose.model('CourseModule');
            const module = await CourseModule.findById(course.module);
            if (module) {
                module.courses = module.courses.filter(courseId => courseId.toString() !== course._id.toString());
                await module.save();
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

const Course = mongoose.model('Course', courseSchema);

export default Course;