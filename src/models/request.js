import mongoose from 'mongoose'
const { Schema } = mongoose;

// Unified Request Schema
const requestSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  adminMessage: { type: String, default: '' },
  type: { type: String, enum: ['document', 'leave', 'absence'], required: true },
  documentType: { type: String }, // Specific to document requests
  leaveType: { type: String }, // Specific to leave requests
  startDate: { type: Date }, // Specific to leave requests
  endDate: { type: Date }, // Specific to leave requests
  course: { type: String }, // Specific to absence justifications
  examType: { type: String, enum: ['Exam', 'CA', 'Resit'] }, // Specific to absence justifications
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Associate with a user
}, {
  collection: 'requests', // Collection name
  timestamps: true // Automatically add createdAt and updatedAt fields
});

// Pre-save middleware to ensure required fields based on type
requestSchema.pre('save', function (next) {
  switch (this.type) {
    case 'document':
      if (!this.documentType) {
        return next(new Error('Document type is required for document requests'));
      }
      break;
    case 'leave':
      if (!this.leaveType || !this.startDate || !this.endDate) {
        return next(new Error('Leave type, start date, and end date are required for leave requests'));
      }
      break;
    case 'absence':
      if (!this.course || !this.examType) {
        return next(new Error('Course and exam type are required for absence justifications'));
      }
      break;
    default:
      return next(new Error('Invalid request type'));
  }
  next();
});

const Request = mongoose.model('Request', requestSchema);
export default Request; 