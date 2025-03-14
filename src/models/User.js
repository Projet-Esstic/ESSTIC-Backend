

import mongoose from'mongoose';
import bcrypt  from 'bcrypt';

const userSchema = new mongoose.Schema({
  // Common roles for all users; role-specific details belong in separate models.
  roles: {
    type: [String],
    enum: ['candidate', 'student', 'teacher', 'admin'],
    required: true,
    default: ['candidate']
  },

  // Basic personal information.
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false  // Do not return by default
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?[0-9]{7,15}$/, 'Invalid phone number format']
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },

  // Optional profile information.
  profilePicture: {
    type: String,
    default: 'default-profile.png'
  },
  region: {
    type: String,
    required: true,
  },

  // Contact details.
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true }
  },
  emergencyContact: {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, 'Invalid phone number']
    }
  },

  // User preferences common to all users.
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'fr', 'es', 'de', 'zh']
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: false }
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },

  // Security settings shared by every user.
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false }
  },

  // Account status and activity tracking.
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(doc, ret) {
      // Remove sensitive fields when converting to JSON
      delete ret.password;
      delete ret.security;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual field for convenience.
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash the password if it has been modified.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
  } catch (error) {
      next(error);
  }
});

// Instance method to securely compare passwords.
userSchema.methods.comparePassword = async function (candidatePassword) {
    console.log('Comparing passwords...');
    console.log('Stored Password:', this.password);
    console.log('Provided Password:', candidatePassword);
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password Match:', isMatch);
    return isMatch;
};

// Virtual to check if the account is locked.
userSchema.virtual('isLocked').get(function () {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Method to increment login attempts and set account lock if necessary.
userSchema.methods.incrementLoginAttempts = function () {
  // If previous lock has expired, reset attempts.
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { 'security.loginAttempts': 1 },
      $unset: { 'security.lockUntil': 1 }
    });
  }
  // Otherwise, increment attempts.
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  // Lock account after 5 failed attempts.
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'security.lockUntil': Date.now() + (2 * 60 * 60 * 1000) }; // Lock for 2 hours.
  }
  return this.updateOne(updates);
};  

// Efficient indexing for frequently queried fields.

userSchema.index({ lastName: 1, firstName: 1 });
userSchema.index({ phoneNumber: 1 });

const User = mongoose.model('User', userSchema);
export default User;