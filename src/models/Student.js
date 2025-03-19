import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    // Reference to general user information
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Reference to the applicant record (previous entrance exam data)
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true,
        unique: true
    },
    // Academic Information
    academicInfo: [{
        annualTotalPoints: { type: Number, default: 0, min: 0 },
        annualAverage: { type: Number, default: 0, min: 0, max: 20 },
        annualRank: { type: Number, default: null },
        conduct: { type: Number, default: 0, min: 0, max: 10 },
        annualCredits: { type: Number, default: 0, min: 0 },
        annualHourOfAbsences: { type: Number, default: 0, min: 0 },
        annualDiscipline: { type: String, enum: ['Excellent', 'Good', 'Average', 'Poor'], default: 'Good' },
        finalDecision: { type: String, enum: ['Pass', 'Fail', 'Repeat', 'Pending'], default: 'Pending' },

        // Level & Department
        level: {
            type: String,
            enum: ['level_1', 'level_2', 'level_3', 'masters_1', 'masters_2', 'phd'],
            required: true
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            required: true
        },

        // Academic Years & Semesters
        academicYears: [{
            year: { type: String, required: true },  // e.g. "2024-2025"
            semesters: [{
                semesterInfo: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Semester',
                    required: true
                },
                totalPoints: { type: Number, default: 0, min: 0 },
                average: { type: Number, default: 0, min: 0, max: 20 },
                rank: { type: Number, default: null },
                credits: { type: Number, default: 0, min: 0 },
                absences: { type: Number, default: 0, min: 0 },
                discipline: { type: String, enum: ['Excellent', 'Good', 'Average', 'Poor'], default: 'Good' }
            }]
        }],

        // Courses & Marks
        courses: [{
            courseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course',
                required: true
            },
            assessments: [{
                type: { type: String, enum: ['CA', 'EXAM', 'RESIT'], required: true },
                isActive: { type: Boolean, default: true },
                currentMark: { type: Number, default: 0, min: 0, max: 20 },
                hasWritten: { type: Boolean, default: false },
                hasJustified: { type: Boolean, default: false },
                modified: [{
                    preMark: { type: Number, required: true, min: 0, max: 20 },
                    modMark: { type: Number, required: true, min: 0, max: 20 },
                    modifiedBy: {
                        name: { type: String, required: true },
                        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
                    },
                    dateModified: { type: Date, default: Date.now }
                }]
            }]
        }]
    }]
}, { timestamps: true });

// Pre-save middleware to set default marks to 0 if a student has not written and has not justified
studentSchema.pre('save', function (next) {
    if (this.academicInfo && this.academicInfo.courses) {
        this.academicInfo.courses.forEach(course => {
            if (course && course.assessments) {
                course.assessments.forEach(assessment => {
                    if (!assessment.hasWritten && !assessment.hasJustified) {
                        assessment.currentMark = 0;
                    }
                });
            }
        });
    }
    next();
});

studentSchema.pre('save', function (next) {
    // Check if courses exist before trying to iterate
    if (this.academicInfo && this.academicInfo.courses) {
        this.academicInfo.courses.forEach(course => {
            if (course && course.marks) {
                ['CA', 'EXAM', 'RESIT'].forEach(examType => {
                    if (course.marks[examType] &&
                        !course.marks[examType].hasWritten &&
                        !course.marks[examType].hasJustified) {
                        course.marks[examType].currentMark = 0;
                    }
                });
            }
        });
    }
    next();
});

const Student = mongoose.model('Student', studentSchema);
export default Student;