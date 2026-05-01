const facultySession = requireRole(["faculty"]);

if (facultySession) {
  const welcomeText = document.getElementById("welcomeText");
  const studentsModuleTab = document.getElementById("studentsModuleTab");
  const attendanceModuleTab = document.getElementById("attendanceModuleTab");
  const studentsModule = document.getElementById("studentsModule");
  const attendanceModule = document.getElementById("attendanceModule");
  const studentTableBody = document.getElementById("studentTableBody");
  const attendanceTableBody = document.getElementById("attendanceTableBody");
  const studentWiseReport = document.getElementById("studentWiseReport");
  const subjectWiseReport = document.getElementById("subjectWiseReport");
  const attendanceAlerts = document.getElementById("attendanceAlerts");
  const studentForm = document.getElementById("studentForm");
  const attendanceForm = document.getElementById("attendanceForm");
  const adminMessage = document.getElementById("adminMessage");
  const attendanceMessage = document.getElementById("attendanceMessage");
  const cancelEdit = document.getElementById("cancelEdit");
  const cancelAttendanceEdit = document.getElementById("cancelAttendanceEdit");
  const logoutButton = document.getElementById("logoutButton");

  const fields = {
    studentId: document.getElementById("studentId"),
    name: document.getElementById("name"),
    enrollmentNo: document.getElementById("enrollmentNo"),
    email: document.getElementById("email"),
    department: document.getElementById("department"),
    semester: document.getElementById("semester"),
    password: document.getElementById("password")
  };

  const attendanceFields = {
    id: document.getElementById("attendanceId"),
    studentId: document.getElementById("attendanceStudent"),
    facultyId: document.getElementById("attendanceFaculty"),
    subject: document.getElementById("attendanceSubject"),
    date: document.getElementById("attendanceDate"),
    status: document.getElementById("attendanceStatus"),
    remarks: document.getElementById("attendanceRemarks")
  };

  welcomeText.textContent = `Welcome, ${facultySession.user.name}`;
  attendanceFields.facultyId.value = facultySession.user._id;

  function setModule(moduleName) {
    const config = [
      { tab: studentsModuleTab, panel: studentsModule, key: "students" },
      { tab: attendanceModuleTab, panel: attendanceModule, key: "attendance" }
    ];

    config.forEach(({ tab, panel, key }) => {
      const active = key === moduleName;
      tab.classList.toggle("active", active);
      panel.classList.toggle("hidden", !active);
    });
  }

  function resetStudentForm() {
    studentForm.reset();
    fields.studentId.value = "";
    document.getElementById("saveButton").textContent = "Add Student";
    cancelEdit.classList.add("hidden");
  }

  function resetAttendanceForm() {
    attendanceForm.reset();
    attendanceFields.id.value = "";
    attendanceFields.facultyId.value = facultySession.user._id;
    document.getElementById("attendanceSaveButton").textContent = "Mark Attendance";
    attendanceFields.status.value = "Present";
    cancelAttendanceEdit.classList.add("hidden");
  }

  function renderStudents(students) {
    studentTableBody.innerHTML = students.length
      ? students
          .map(
            (student) => `
              <tr>
                <td>${student.name}</td>
                <td>${student.enrollmentNo}</td>
                <td>${student.email}</td>
                <td>${student.department}</td>
                <td>${student.semester}</td>
                <td>
                  <div class="action-buttons">
                    <button type="button" onclick="editStudent('${student._id}')">Edit</button>
                    <button type="button" class="danger" onclick="deleteStudent('${student._id}')">Delete</button>
                  </div>
                </td>
              </tr>
            `
          )
          .join("")
      : '<tr><td colspan="6">No students added yet.</td></tr>';

    attendanceFields.studentId.innerHTML = `
      <option value="">Select student</option>
      ${students
        .map(
          (student) =>
            `<option value="${student._id}">${student.name} (${student.enrollmentNo})</option>`
        )
        .join("")}
    `;
  }

  function renderAttendance(records) {
    attendanceTableBody.innerHTML = records.length
      ? records
          .map(
            (record) => `
              <tr>
                <td>${record.date}</td>
                <td>${record.student?.name || "-"}</td>
                <td>${record.subject}</td>
                <td>${record.status}</td>
                <td>${record.faculty?.name || "-"}</td>
                <td>${record.remarks || "-"}</td>
                <td>
                  <div class="action-buttons">
                    <button type="button" onclick="editAttendance('${record._id}')">Edit</button>
                    <button type="button" class="danger" onclick="deleteAttendance('${record._id}')">Delete</button>
                  </div>
                </td>
              </tr>
            `
          )
          .join("")
      : '<tr><td colspan="7">No attendance records found.</td></tr>';
  }

  function renderReportList(container, items, kind) {
    if (!items.length) {
      container.innerHTML = '<div class="report-item">No data available.</div>';
      return;
    }

    if (kind === "student") {
      container.innerHTML = items
        .map(
          (item) => `
            <div class="report-item ${item.shortage ? "alert-item" : ""}">
              <strong>${item.name}</strong><br />
              ${item.enrollmentNo} | ${item.department}<br />
              ${item.attended}/${item.total} classes | ${item.percentage}%
            </div>
          `
        )
        .join("");
      return;
    }

    if (kind === "subject") {
      container.innerHTML = items
        .map(
          (item) => `
            <div class="report-item">
              <strong>${item.subject}</strong><br />
              ${item.attended}/${item.total} present marks | ${item.percentage}%
            </div>
          `
        )
        .join("");
      return;
    }

    container.innerHTML = items
      .map(
        (item) => `
          <div class="report-item alert-item">
            <strong>${item.name}</strong><br />
            ${item.enrollmentNo}<br />
            Attendance shortage: ${item.percentage}%
          </div>
        `
      )
      .join("");
  }

  async function refreshData() {
    const [students, attendance, studentReport, subjectReport, alerts] = await Promise.all([
      apiFetch("/api/students"),
      apiFetch("/api/attendance"),
      apiFetch("/api/reports/attendance/student-wise"),
      apiFetch("/api/reports/attendance/subject-wise"),
      apiFetch("/api/reports/attendance/alerts")
    ]);

    renderStudents(students.students);
    renderAttendance(attendance.records);
    renderReportList(studentWiseReport, studentReport.report, "student");
    renderReportList(subjectWiseReport, subjectReport.report, "subject");
    renderReportList(attendanceAlerts, alerts.alerts, "alerts");
  }

  async function editStudent(id) {
    try {
      const data = await apiFetch(`/api/students/${id}`);
      const student = data.student;
      fields.studentId.value = student._id;
      fields.name.value = student.name;
      fields.enrollmentNo.value = student.enrollmentNo;
      fields.email.value = student.email;
      fields.department.value = student.department;
      fields.semester.value = student.semester;
      fields.password.value = student.password;
      document.getElementById("saveButton").textContent = "Update Student";
      cancelEdit.classList.remove("hidden");
      setModule("students");
      showMessage(adminMessage, `Editing ${student.name}.`);
    } catch (error) {
      showMessage(adminMessage, error.message, true);
    }
  }

  async function deleteStudent(id) {
    if (!window.confirm("Delete this student?")) {
      return;
    }

    try {
      const data = await apiFetch(`/api/students/${id}`, { method: "DELETE" });
      showMessage(adminMessage, data.message);
      resetStudentForm();
      await refreshData();
    } catch (error) {
      showMessage(adminMessage, error.message, true);
    }
  }

  async function editAttendance(id) {
    try {
      const data = await apiFetch(`/api/attendance/${id}`);
      const record = data.record;
      attendanceFields.id.value = record._id;
      attendanceFields.studentId.value = record.student?._id || "";
      attendanceFields.facultyId.value = facultySession.user._id;
      attendanceFields.subject.value = record.subject;
      attendanceFields.date.value = record.date;
      attendanceFields.status.value = record.status;
      attendanceFields.remarks.value = record.remarks || "";
      document.getElementById("attendanceSaveButton").textContent = "Update Attendance";
      cancelAttendanceEdit.classList.remove("hidden");
      setModule("attendance");
      showMessage(attendanceMessage, `Editing ${record.subject} attendance.`);
    } catch (error) {
      showMessage(attendanceMessage, error.message, true);
    }
  }

  async function deleteAttendance(id) {
    if (!window.confirm("Delete this attendance record?")) {
      return;
    }

    try {
      const data = await apiFetch(`/api/attendance/${id}`, { method: "DELETE" });
      showMessage(attendanceMessage, data.message);
      resetAttendanceForm();
      await refreshData();
    } catch (error) {
      showMessage(attendanceMessage, error.message, true);
    }
  }

  studentsModuleTab.addEventListener("click", () => setModule("students"));
  attendanceModuleTab.addEventListener("click", () => setModule("attendance"));

  studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = fields.studentId.value;
    const url = id ? `/api/students/${id}` : "/api/students";
    const method = id ? "PUT" : "POST";

    try {
      const data = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.name.value.trim(),
          enrollmentNo: fields.enrollmentNo.value.trim(),
          email: fields.email.value.trim(),
          department: fields.department.value.trim(),
          semester: Number(fields.semester.value),
          password: fields.password.value.trim()
        })
      });

      showMessage(adminMessage, data.message);
      resetStudentForm();
      await refreshData();
    } catch (error) {
      showMessage(adminMessage, error.message, true);
    }
  });

  attendanceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = attendanceFields.id.value;
    const url = id ? `/api/attendance/${id}` : "/api/attendance";
    const method = id ? "PUT" : "POST";

    try {
      const data = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: attendanceFields.studentId.value,
          facultyId: facultySession.user._id,
          subject: attendanceFields.subject.value.trim(),
          date: attendanceFields.date.value,
          status: attendanceFields.status.value,
          remarks: attendanceFields.remarks.value.trim()
        })
      });

      showMessage(attendanceMessage, data.message);
      resetAttendanceForm();
      await refreshData();
    } catch (error) {
      showMessage(attendanceMessage, error.message, true);
    }
  });

  cancelEdit.addEventListener("click", () => {
    resetStudentForm();
    showMessage(adminMessage, "Edit cancelled.");
  });

  cancelAttendanceEdit.addEventListener("click", () => {
    resetAttendanceForm();
    showMessage(attendanceMessage, "Edit cancelled.");
  });

  logoutButton.addEventListener("click", () => {
    clearAuthSession();
    redirectTo("/login.html");
  });

  window.editStudent = editStudent;
  window.deleteStudent = deleteStudent;
  window.editAttendance = editAttendance;
  window.deleteAttendance = deleteAttendance;

  setModule("students");
  resetAttendanceForm();
  refreshData();
}
