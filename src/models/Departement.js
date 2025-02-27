import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z0-9]+$/, 'Department code must be alphanumeric and uppercase']
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    headOfDepartment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Tracks the department head (optional)
        required: false
    },
   createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Tracks the admin who created it
    },
  
}, { timestamps: true });

const Department = mongoose.model('Department', departmentSchema);
export default Department;