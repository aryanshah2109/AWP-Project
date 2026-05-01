const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema(
  {
    facultyId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    qualification: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      trim: true
    },
    subjects: {
      type: [String],
      default: []
    },
    workloadHours: {
      type: Number,
      required: true,
      min: 0
    },
    leaveTaken: {
      type: Number,
      default: 0,
      min: 0
    },
    leaveBalance: {
      type: Number,
      default: 12,
      min: 0
    },
    attendanceDaysPresent: {
      type: Number,
      default: 0,
      min: 0
    },
    attendanceDaysTotal: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Faculty", facultySchema);
