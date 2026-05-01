const adminSession = requireRole(["admin"]);

if (adminSession) {
  const welcomeText = document.getElementById("welcomeText");
  const studentsModuleTab = document.getElementById("studentsModuleTab");
  const facultyModuleTab = document.getElementById("facultyModuleTab");
  const attendanceModuleTab = document.getElementById("attendanceModuleTab");
  const studentsModule = document.getElementById("studentsModule");
  const facultyModule = document.getElementById("facultyModule");
  const attendanceModule = document.getElementById("attendanceModule");
  const studentTableBody = document.getElementById("studentTableBody");
  const facultyTableBody = document.getElementById("facultyTableBody");
  const attendanceTableBody = document.getElementById("attendanceTableBody");
  const studentWiseReport = document.getElementById("studentWiseReport");
  const subjectWiseReport = document.getElementById("subjectWiseReport");
  const attendanceAlerts = document.getElementById("attendanceAlerts");
  const studentForm = document.getElementById("studentForm");
  const facultyForm = document.getElementById("facultyForm");
  const attendanceForm = document.getElementById("attendanceForm");
  const adminMessage = document.getElementById("adminMessage");
  const facultyMessage = document.getElementById("facultyMessage");
  const attendanceMessage = document.getElementById("attendanceMessage");
  const cancelEdit = document.getElementById("cancelEdit");
  const cancelFacultyEdit = document.getElementById("cancelFacultyEdit");
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

  const facultyFields = {
    id: document.getElementById("facultyDocumentId"),
    facultyId: document.getElementById("facultyId"),
    name: document.getElementById("facultyName"),
    email: document.getElementById("facultyEmail"),
    phone: document.getElementById("facultyPhone"),
    department: document.getElementById("facultyDepartment"),
    qualification: document.getElementById("facultyQualification"),
    password: document.getElementById("facultyPassword"),
    subjects: document.getElementById("facultySubjects"),
    workloadHours: document.getElementById("facultyWorkload"),
    leaveTaken: document.getElementById("facultyLeaveTaken"),
    leaveBalance: document.getElementById("facultyLeaveBalance"),
    attendanceDaysPresent: document.getElementById("facultyDaysPresent"),
    attendanceDaysTotal: document.getElementById("facultyDaysTotal")
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

  welcomeText.textContent = "Welcome, Admin";

  function setModule(moduleName) {
    const config = [
      { tab: studentsModuleTab, panel: studentsModule, key: "students" },
      { tab: facultyModuleTab, panel: facultyModule, key: "faculty" },
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

  function resetFacultyForm() {
    facultyForm.reset();
    facultyFields.id.value = "";
    document.getElementById("facultySaveButton").textContent = "Add Faculty";
    cancelFacultyEdit.classList.add("hidden");
  }

  function resetAttendanceForm() {
    attendanceForm.reset();
    attendanceFields.id.value = "";
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

  function renderFaculty(facultyList) {
    facultyTableBody.innerHTML = facultyList.length
      ? facultyList
          .map((faculty) => {
            const percentage = faculty.attendanceDaysTotal
              ? ((faculty.attendanceDaysPresent / faculty.attendanceDaysTotal) * 100).toFixed(1)
              : "0.0";

            return `
              <tr>
                <td>${faculty.name}</td>
                <td>${faculty.facultyId}</td>
                <td>${faculty.qualification}</td>
                <td>${faculty.subjects.join(", ") || "-"}</td>
                <td>${faculty.workloadHours} hrs</td>
                <td>${faculty.leaveTaken} used / ${faculty.leaveBalance} left</td>
                <td>${faculty.attendanceDaysPresent}/${faculty.attendanceDaysTotal} (${percentage}%)</td>
                <td>
                  <div class="action-buttons">
                    <button type="button" onclick="editFaculty('${faculty._id}')">Edit</button>
                    <button type="button" class="danger" onclick="deleteFaculty('${faculty._id}')">Delete</button>
                  </div>
                </td>
              </tr>
            `;
          })
          .join("")
      : '<tr><td colspan="8">No faculty records added yet.</td></tr>';

    attendanceFields.facultyId.innerHTML = `
      <option value="">Select faculty (optional)</option>
      ${facultyList
        .map(
          (faculty) =>
            `<option value="${faculty._id}">${faculty.name} (${faculty.facultyId})</option>`
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
    const [students, faculty, attendance, studentReport, subjectReport, alerts] =
      await Promise.all([
        apiFetch("/api/students"),
        apiFetch("/api/faculty"),
        apiFetch("/api/attendance"),
        apiFetch("/api/reports/attendance/student-wise"),
        apiFetch("/api/reports/attendance/subject-wise"),
        apiFetch("/api/reports/attendance/alerts")
      ]);

    renderStudents(students.students);
    renderFaculty(faculty.faculty);
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

  async function editFaculty(id) {
    try {
      const data = await apiFetch(`/api/faculty/${id}`);
      const faculty = data.faculty;
      facultyFields.id.value = faculty._id;
      facultyFields.facultyId.value = faculty.facultyId;
      facultyFields.name.value = faculty.name;
      facultyFields.email.value = faculty.email;
      facultyFields.phone.value = faculty.phone;
      facultyFields.department.value = faculty.department;
      facultyFields.qualification.value = faculty.qualification;
      facultyFields.password.value = faculty.password;
      facultyFields.subjects.value = faculty.subjects.join(", ");
      facultyFields.workloadHours.value = faculty.workloadHours;
      facultyFields.leaveTaken.value = faculty.leaveTaken;
      facultyFields.leaveBalance.value = faculty.leaveBalance;
      facultyFields.attendanceDaysPresent.value = faculty.attendanceDaysPresent;
      facultyFields.attendanceDaysTotal.value = faculty.attendanceDaysTotal;
      document.getElementById("facultySaveButton").textContent = "Update Faculty";
      cancelFacultyEdit.classList.remove("hidden");
      setModule("faculty");
      showMessage(facultyMessage, `Editing ${faculty.name}.`);
    } catch (error) {
      showMessage(facultyMessage, error.message, true);
    }
  }

  async function deleteFaculty(id) {
    if (!window.confirm("Delete this faculty member?")) {
      return;
    }

    try {
      const data = await apiFetch(`/api/faculty/${id}`, { method: "DELETE" });
      showMessage(facultyMessage, data.message);
      resetFacultyForm();
      await refreshData();
    } catch (error) {
      showMessage(facultyMessage, error.message, true);
    }
  }

  async function editAttendance(id) {
    try {
      const data = await apiFetch(`/api/attendance/${id}`);
      const record = data.record;
      attendanceFields.id.value = record._id;
      attendanceFields.studentId.value = record.student?._id || "";
      attendanceFields.facultyId.value = record.faculty?._id || "";
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
  facultyModuleTab.addEventListener("click", () => setModule("faculty"));
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

  facultyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = facultyFields.id.value;
    const url = id ? `/api/faculty/${id}` : "/api/faculty";
    const method = id ? "PUT" : "POST";

    try {
      const data = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId: facultyFields.facultyId.value.trim(),
          name: facultyFields.name.value.trim(),
          email: facultyFields.email.value.trim(),
          phone: facultyFields.phone.value.trim(),
          department: facultyFields.department.value.trim(),
          qualification: facultyFields.qualification.value.trim(),
          password: facultyFields.password.value.trim(),
          subjects: facultyFields.subjects.value
            .split(",")
            .map((subject) => subject.trim())
            .filter(Boolean),
          workloadHours: Number(facultyFields.workloadHours.value),
          leaveTaken: Number(facultyFields.leaveTaken.value || 0),
          leaveBalance: Number(facultyFields.leaveBalance.value || 0),
          attendanceDaysPresent: Number(facultyFields.attendanceDaysPresent.value || 0),
          attendanceDaysTotal: Number(facultyFields.attendanceDaysTotal.value || 0)
        })
      });

      showMessage(facultyMessage, data.message);
      resetFacultyForm();
      await refreshData();
    } catch (error) {
      showMessage(facultyMessage, error.message, true);
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
          facultyId: attendanceFields.facultyId.value,
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

  cancelFacultyEdit.addEventListener("click", () => {
    resetFacultyForm();
    showMessage(facultyMessage, "Edit cancelled.");
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
  window.editFaculty = editFaculty;
  window.deleteFaculty = deleteFaculty;
  window.editAttendance = editAttendance;
  window.deleteAttendance = deleteAttendance;

  setModule("students");
  resetAttendanceForm();
  refreshData();
}
