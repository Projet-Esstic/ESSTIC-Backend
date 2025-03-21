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
        // required: true,
        // unique: true
    },
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
    // Academic Information
    academicYears: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
    }],
    classes: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
    },

}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
export default Student;