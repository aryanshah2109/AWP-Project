// src/models/Resource.js
const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["PDF", "PPT", "DOC", "VIDEO", "OTHER"],
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      default: 0
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true
    },
    uploaderName: {
      type: String,
      required: true
    },
    department: {
      type: String,
      required: true
    },
    semester: {
      type: Number,
      min: 1,
      max: 8
    },
    downloads: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

resourceSchema.index({ subject: 1, department: 1, semester: 1 });

module.exports = mongoose.model("Resource", resourceSchema);