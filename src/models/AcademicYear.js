import mongoose from 'mongoose';

const academicYearSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    year: { type: String, required: true, unique: false }, // e.g. "2024-2025"
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
        discipline: { type: String, enum: ['Excellent', 'Good', 'Average', 'Poor'], default: 'Good' },

        // Courses for Each Semester
        courses: [{
            courseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course',
                required: true
            },
            assessments: [{
                type: { type: String, enum: ['CA', 'EXAM', 'RESIT'], required: true },
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

academicYearSchema.index({ student: 1, year: 1 }, { unique: true }); // Ensures a student cannot have duplicate academic years

export const AcademicYear = mongoose.model('AcademicYear', academicYearSchema);
