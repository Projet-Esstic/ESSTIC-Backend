import mongoose from 'mongoose';


const courseSchema = new mongoose.Schema({
    courseInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    isActive: { type: Boolean, default: true },
    assessments: [{
        type: {
            type: String,
            required: true
        },
        currentMark: { type: Number, default: 0, min: 0, max: 20 },
        weight: { type: Number, default: 0, min: 0, max: 100 },
        hasWritten: { type: Boolean, default: false },
        hasJustified: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        modified: [{
            preMark: { type: Number, required: true, min: 0, max: 20 },
            modMark: { type: Number, required: true, min: 0, max: 20 },
            modifiedBy: {
                name: { type: String, required: true },
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
            },
            dateModified: { type: Date, default: Date.now }
        }]
    }],
    courseAverage: { type: Number, default: 0, min: 0, max: 20 },
});

// Pre-save middleware to calculate courseAverage
courseSchema.pre('save', function (next) {
    if (!this.assessments || this.assessments.length === 0) {
        this.courseAverage = 0;
    } else {
        const activeAssessments = this.assessments.filter(a => a.isActive && a.weight > 0);

        if (activeAssessments.length > 0) {
            let totalWeightedScore = 0;
            let totalWeight = 0;

            activeAssessments.forEach(assessment => {
                totalWeightedScore += assessment.currentMark * (assessment.weight / 100);
                totalWeight += assessment.weight;
            });

            this.courseAverage = totalWeight > 0 ? ((totalWeightedScore / totalWeight) * 20).toFixed(2) : 0;
        } else {
            this.courseAverage = 0;
        }
    }

    next();
});

const moduleSchema = new mongoose.Schema({
    moduleInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseModule',
        required: true
    },
    moduleAverage: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    courses: { type: [courseSchema], required: true },
});

// Pre-save middleware for moduleSchema to calculate moduleAverage
moduleSchema.pre('save', async function (next) {
    if (!this.courses || this.courses.length === 0) {
        this.moduleAverage = 0; // No courses, set moduleAverage to 0
        return next();
    }

    try {
        let totalWeightedScore = 0;
        let totalCoefficient = 0;

        // Fetch actual coefficients from the Course model
        const courseIds = this.courses.filter(c => c.isActive).map(c => c.courseInfo);
        const coursesWithCoefficients = await mongoose.model('Course').find(
            { _id: { $in: courseIds } },
            { _id: 1, coefficient: 1 } // Assuming Course model has a `coefficient` field
        );

        const coefficientMap = new Map();
        coursesWithCoefficients.forEach(course => {
            coefficientMap.set(course._id.toString(), course.coefficient || 1); // Default coefficient to 1 if not defined
        });

        this.courses.forEach(course => {
            if (course.isActive && coefficientMap.has(course.courseInfo.toString())) {
                const coefficient = coefficientMap.get(course.courseInfo.toString());
                totalWeightedScore += course.courseAverage * coefficient;
                totalCoefficient += coefficient;
            }
        });

        this.moduleAverage = totalCoefficient > 0 ? (totalWeightedScore / totalCoefficient).toFixed(2) : 0;
        next();
    } catch (error) {
        next(error);
    }
});

const semesterSchema = new mongoose.Schema({
    semesterInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    totalPoints: { type: Number, default: 0, min: 0 },
    average: { type: Number, default: 0, min: 0, max: 20 },
    rank: { type: Number, default: null },
    credits: { type: Number, default: 0, min: 0 },
    modules: { type: [moduleSchema], required: true },
    discipline: { type: String, enum: ['Excellent', 'Good', 'Average', 'Poor'], default: 'Good' }
});

// Pre-save middleware to calculate semester stats
semesterSchema.pre('save', async function (next) {
    if (!this.modules || this.modules.length === 0) {
        this.totalPoints = 0;
        this.credits = 0;
        this.average = 0;
        this.rank = null;
        return next();
    }

    try {
        let totalPoints = 0;
        let totalCredits = 0;
        let moduleIds = this.modules.filter(m => m.isActive).map(m => m.moduleInfo);

        // Fetch actual module credits
        const modulesWithCredits = await mongoose.model('CourseModule').find(
            { _id: { $in: moduleIds } },
            { _id: 1, credit: 1 } // Assuming Module model has a `credit` field
        );

        const creditMap = new Map();
        modulesWithCredits.forEach(module => {
            creditMap.set(module._id.toString(), module.credit || 1); // Default credit to 1 if not defined
        });

        this.modules.forEach(module => {
            if (module.isActive) {
                totalPoints += module.moduleAverage;
                
                // Add credits if moduleAverage > 10
                if (module.moduleAverage > 10 && creditMap.has(module.moduleInfo.toString())) {
                    totalCredits += creditMap.get(module.moduleInfo.toString());
                }
            }
        });

        this.totalPoints = totalPoints;
        this.credits = totalCredits;
        this.average = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

        next();
    } catch (error) {
        next(error);
    }
});


const academicYearSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    year: { type: String, required: true, unique: false },
    level: { type: String, required: true, unique: false },
    department: { type: String, required: true, unique: false },
    semesters: { type: [semesterSchema], required: true },
}, { timestamps: true });

academicYearSchema.index({ student: 1, year: 1 }, { unique: true }); // Ensures a student cannot have duplicate academic years

export const AcademicYear = mongoose.model('AcademicYear', academicYearSchema);
