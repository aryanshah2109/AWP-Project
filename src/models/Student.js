// src/models/Student.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    enrollmentNo: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    password: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    address: {
      type: String,
      trim: true,
      default: ""
    },
    profilePicture: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Student", studentSchema);