// server.js
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const Student = require("./src/models/Student");
const Faculty = require("./src/models/Faculty");
const Attendance = require("./src/models/Attendance");
const Resource = require("./src/models/Resource");

const app = express();
const PORT = 3000;
const MONGODB_URI = "mongodb://127.0.0.1:27017/college_erp";
const ATTENDANCE_THRESHOLD = 75;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, uniqueSuffix + "-" + originalName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "video/mp4", "application/zip"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB at 127.0.0.1:27017");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

function buildStudentAttendanceReport(records) {
  const grouped = new Map();

  records.forEach((record) => {
    const key = record.student._id.toString();
    const current = grouped.get(key) || {
      studentId: record.student._id,
      name: record.student.name,
      enrollmentNo: record.student.enrollmentNo,
      department: record.student.department,
      attended: 0,
      total: 0
    };

    current.total += 1;
    if (record.status === "Present") {
      current.attended += 1;
    }

    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((entry) => ({
    ...entry,
    percentage: entry.total ? Number(((entry.attended / entry.total) * 100).toFixed(2)) : 0,
    shortage: entry.total ? (entry.attended / entry.total) * 100 < ATTENDANCE_THRESHOLD : false
  }));
}

function buildSubjectAttendanceReport(records) {
  const grouped = new Map();

  records.forEach((record) => {
    const key = record.subject;
    const current = grouped.get(key) || {
      subject: record.subject,
      attended: 0,
      total: 0
    };

    current.total += 1;
    if (record.status === "Present") {
      current.attended += 1;
    }

    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((entry) => ({
    ...entry,
    percentage: entry.total ? Number(((entry.attended / entry.total) * 100).toFixed(2)) : 0
  }));
}

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "College ERP server is running." });
});

// Admin login
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    return res.json({
      success: true,
      role: "admin",
      message: "Admin login successful."
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid admin credentials."
  });
});

// Student login
app.post("/api/student/login", async (req, res) => {
  try {
    const { enrollmentNo, password } = req.body;
    const student = await Student.findOne({ enrollmentNo, password }).lean();

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid student credentials."
      });
    }

    return res.json({
      success: true,
      role: "student",
      message: "Student login successful.",
      student
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to login student.",
      error: error.message
    });
  }
});

// Faculty login
app.post("/api/faculty/login", async (req, res) => {
  try {
    const { facultyId, password } = req.body;
    const faculty = await Faculty.findOne({ facultyId, password }).lean();

    if (!faculty) {
      return res.status(401).json({
        success: false,
        message: "Invalid faculty credentials."
      });
    }

    return res.json({
      success: true,
      role: "faculty",
      message: "Faculty login successful.",
      faculty
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to login faculty.",
      error: error.message
    });
  }
});

// Student CRUD operations
app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch students.",
      error: error.message
    });
  }
});

app.get("/api/students/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch student.",
      error: error.message
    });
  }
});

app.get("/api/students/:id/attendance-summary", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    const records = await Attendance.find({ student: req.params.id })
      .populate("faculty", "name")
      .lean();
    const attended = records.filter((record) => record.status === "Present").length;
    const total = records.length;
    const percentage = total ? Number(((attended / total) * 100).toFixed(2)) : 0;

    return res.json({
      success: true,
      summary: {
        attended,
        total,
        percentage,
        shortage: percentage < ATTENDANCE_THRESHOLD
      },
      records
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch attendance summary.",
      error: error.message
    });
  }
});

app.post("/api/students", async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({
      success: true,
      message: "Student added successfully.",
      student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Unable to add student.",
      error: error.message
    });
  }
});

app.put("/api/students/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    res.json({
      success: true,
      message: "Student updated successfully.",
      student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Unable to update student.",
      error: error.message
    });
  }
});

app.put("/api/students/:id/reset-password", async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, {
      password: req.body.password
    }, {
      new: true
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    res.json({
      success: true,
      message: "Password reset successfully."
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Unable to reset password.",
      error: error.message
    });
  }
});

app.put("/api/students/:id/profile", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    // Update basic info
    student.name = req.body.name;
    student.email = req.body.email;
    student.phone = req.body.phone;
    student.address = req.body.address;

    // Update password if provided
    if (req.body.currentPassword && req.body.newPassword) {
      if (student.password !== req.body.currentPassword) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect."
        });
      }
      student.password = req.body.newPassword;
    }

    await student.save();

    res.json({
      success: true,
      message: "Profile updated successfully.",
      student: student.toObject()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Unable to update profile.",
      error: error.message
    });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    await Attendance.deleteMany({ student: req.params.id });

    res.json({
      success: true,
      message: "Student deleted successfully."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete student.",
      error: error.message
    });
  }
});

// Faculty CRUD operations
app.get("/api/faculty", async (req, res) => {
  try {
    const faculty = await Faculty.find().sort({ createdAt: -1 });
    res.json({ success: true, faculty });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch faculty records.",
      error: error.message
    });
  }
});

app.get("/api/faculty/:id", async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty record not found."
      });
    }

    res.json({ success: true, faculty });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch faculty record.",
      error: error.message
    });
  }
});

app.post("/api/faculty", async (req, res) => {
  try {
    const payload = {
      ...req.body,
      subjects: Array.isArray(req.body.subjects)
        ? req.body.subjects
        : String(req.body.subjects || "")
            .split(",")
            .map((subject) => subject.trim())
            .filter(Boolean)
    };

    const faculty = await Faculty.create(payload);
    res.status(201).json({
      success: true,
      message: "Faculty member added successfully.",
      faculty
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Unable to add faculty member.",
      error: error.message
    });
  }
});

app.put("/api/faculty/:id", async (req, res) => {
  try {
    const payload = {
      ...req.body,
      subjects: Array.isArray(req.body.subjects)
        ? req.body.subjects
        : String(req.body.subjects || "")
            .split(",")
            .map((subject) => subject.trim())
            .filter(Boolean)
    };

    const faculty = await Faculty.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty record not found."
      });
    }

    res.json({
      success: true,
      message: "Faculty member updated successfully.",
      faculty
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Unable to update faculty member.",
      error: error.message
    });
  }
});

app.put("/api/faculty/:id/reset-password", async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, {
      password: req.body.password
    }, {
      new: true
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found."
      });
    }

    res.json({
      success: true,
      message: "Password reset successfully."
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Unable to reset password.",
      error: error.message
    });
  }
});

app.put("/api/faculty/:id/profile", async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found."
      });
    }

    // Update basic info
    faculty.name = req.body.name;
    faculty.email = req.body.email;
    faculty.phone = req.body.phone;
    faculty.address = req.body.address;

    // Update password if provided
    if (req.body.currentPassword && req.body.newPassword) {
      if (faculty.password !== req.body.currentPassword) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect."
        });
      }
      faculty.password = req.body.newPassword;
    }

    await faculty.save();

    res.json({
      success: true,
      message: "Profile updated successfully.",
      faculty: faculty.toObject()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Unable to update profile.",
      error: error.message
    });
  }
});

app.delete("/api/faculty/:id", async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty record not found."
      });
    }

    await Attendance.updateMany(
      { faculty: req.params.id },
      { $set: { faculty: null } }
    );

    res.json({
      success: true,
      message: "Faculty member deleted successfully."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete faculty member.",
      error: error.message
    });
  }
});

// Attendance operations
app.get("/api/attendance", async (req, res) => {
  try {
    const query = {};

    if (req.query.date) {
      query.date = req.query.date;
    }
    if (req.query.subject) {
      query.subject = req.query.subject;
    }
    if (req.query.studentId) {
      query.student = req.query.studentId;
    }

    const records = await Attendance.find(query)
      .populate("student", "name enrollmentNo department phone address")
      .populate("faculty", "name facultyId")
      .sort({ date: -1, createdAt: -1 });

    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch attendance records.",
      error: error.message
    });
  }
});

app.get("/api/attendance/:id", async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id)
      .populate("student", "name enrollmentNo department")
      .populate("faculty", "name facultyId");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found."
      });
    }

    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch attendance record.",
      error: error.message
    });
  }
});

app.post("/api/attendance", async (req, res) => {
  try {
    const student = await Student.findById(req.body.studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found for attendance."
      });
    }

    if (req.body.facultyId) {
      const faculty = await Faculty.findById(req.body.facultyId);
      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: "Faculty not found for attendance."
        });
      }
    }

    const record = await Attendance.create({
      student: req.body.studentId,
      faculty: req.body.facultyId || null,
      subject: req.body.subject,
      date: req.body.date,
      status: req.body.status,
      remarks: req.body.remarks || ""
    });

    const populated = await Attendance.findById(record._id)
      .populate("student", "name enrollmentNo department")
      .populate("faculty", "name facultyId");

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully.",
      record: populated
    });
  } catch (error) {
    const isDuplicate = error && error.code === 11000;
    res.status(isDuplicate ? 409 : 400).json({
      success: false,
      message: isDuplicate
        ? "Attendance for this student, subject, and date already exists."
        : "Unable to mark attendance.",
      error: error.message
    });
  }
});

app.put("/api/attendance/:id", async (req, res) => {
  try {
    const payload = {
      student: req.body.studentId,
      faculty: req.body.facultyId || null,
      subject: req.body.subject,
      date: req.body.date,
      status: req.body.status,
      remarks: req.body.remarks || ""
    };

    const record = await Attendance.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    })
      .populate("student", "name enrollmentNo department")
      .populate("faculty", "name facultyId");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found."
      });
    }

    res.json({
      success: true,
      message: "Attendance updated successfully.",
      record
    });
  } catch (error) {
    const isDuplicate = error && error.code === 11000;
    res.status(isDuplicate ? 409 : 400).json({
      success: false,
      message: isDuplicate
        ? "Attendance for this student, subject, and date already exists."
        : "Unable to update attendance.",
      error: error.message
    });
  }
});

app.delete("/api/attendance/:id", async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found."
      });
    }

    res.json({
      success: true,
      message: "Attendance record deleted successfully."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete attendance record.",
      error: error.message
    });
  }
});

// Resource operations
app.post("/api/resources/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded."
      });
    }

    const facultyId = req.headers["x-faculty-id"];
    const facultyName = req.headers["x-faculty-name"];
    const facultyDepartment = req.headers["x-faculty-department"];

    if (!facultyId) {
      fs.unlinkSync(req.file.path);
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Faculty ID required."
      });
    }

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Faculty not found."
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileExtension = req.file.originalname.split(".").pop().toUpperCase();
    let fileType = "OTHER";
    if (fileExtension === "PDF") fileType = "PDF";
    else if (["PPT", "PPTX"].includes(fileExtension)) fileType = "PPT";
    else if (["DOC", "DOCX"].includes(fileExtension)) fileType = "DOC";
    else if (["MP4", "MOV", "AVI"].includes(fileExtension)) fileType = "VIDEO";

    const resource = await Resource.create({
      title: req.body.title,
      description: req.body.description || "",
      subject: req.body.subject,
      type: req.body.type || fileType,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadedBy: facultyId,
      uploaderName: facultyName || faculty.name,
      department: facultyDepartment || faculty.department,
      semester: req.body.semester ? parseInt(req.body.semester) : null
    });

    res.status(201).json({
      success: true,
      message: "Resource uploaded successfully.",
      resource
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({
      success: false,
      message: "Unable to upload resource.",
      error: error.message
    });
  }
});

app.get("/api/resources", async (req, res) => {
  try {
    const query = {};
    
    if (req.query.subject) {
      query.subject = req.query.subject;
    }
    if (req.query.semester) {
      query.semester = parseInt(req.query.semester);
    }
    if (req.query.department) {
      query.department = req.query.department;
    }

    const resources = await Resource.find(query)
      .sort({ createdAt: -1 });
    
    res.json({ success: true, resources });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch resources.",
      error: error.message
    });
  }
});

app.get("/api/resources/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found."
      });
    }
    
    res.json({ success: true, resource });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch resource.",
      error: error.message
    });
  }
});

app.post("/api/resources/:id/download", async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found."
      });
    }
    
    res.json({ success: true, downloads: resource.downloads });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to track download.",
      error: error.message
    });
  }
});

app.delete("/api/resources/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found."
      });
    }
    
    // Delete file from filesystem
    const filePath = path.join(__dirname, resource.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await Resource.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: "Resource deleted successfully."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete resource.",
      error: error.message
    });
  }
});

// Reports
app.get("/api/reports/attendance/student-wise", async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("student", "name enrollmentNo department")
      .lean();

    res.json({
      success: true,
      report: buildStudentAttendanceReport(records)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to generate student-wise report.",
      error: error.message
    });
  }
});

app.get("/api/reports/attendance/subject-wise", async (req, res) => {
  try {
    const records = await Attendance.find().lean();

    res.json({
      success: true,
      report: buildSubjectAttendanceReport(records)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to generate subject-wise report.",
      error: error.message
    });
  }
});

app.get("/api/reports/attendance/alerts", async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("student", "name enrollmentNo department")
      .lean();

    const alerts = buildStudentAttendanceReport(records).filter(
      (entry) => entry.shortage
    );

    res.json({
      success: true,
      threshold: ATTENDANCE_THRESHOLD,
      alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to generate attendance alerts.",
      error: error.message
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`College ERP server running on http://localhost:${PORT}`);
});