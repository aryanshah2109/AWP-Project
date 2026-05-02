// public/faculty-dashboard.js
const facultySession = requireRole(["faculty"]);

if (facultySession) {
  const welcomeText = document.getElementById("welcomeText");
  const studentsModuleTab = document.getElementById("studentsModuleTab");
  const attendanceModuleTab = document.getElementById("attendanceModuleTab");
  const resourcesModuleTab = document.getElementById("resourcesModuleTab");
  const profileModuleTab = document.getElementById("profileModuleTab");
  const studentsModule = document.getElementById("studentsModule");
  const attendanceModule = document.getElementById("attendanceModule");
  const resourcesModule = document.getElementById("resourcesModule");
  const profileModule = document.getElementById("profileModule");
  const studentTableBody = document.getElementById("studentTableBody");
  const attendanceTableBody = document.getElementById("attendanceTableBody");
  const resourcesTableBody = document.getElementById("resourcesTableBody");
  const studentWiseReport = document.getElementById("studentWiseReport");
  const subjectWiseReport = document.getElementById("subjectWiseReport");
  const attendanceAlerts = document.getElementById("attendanceAlerts");
  const studentForm = document.getElementById("studentForm");
  const attendanceForm = document.getElementById("attendanceForm");
  const resourceForm = document.getElementById("resourceForm");
  const profileForm = document.getElementById("profileForm");
  const adminMessage = document.getElementById("adminMessage");
  const attendanceMessage = document.getElementById("attendanceMessage");
  const resourceMessage = document.getElementById("resourceMessage");
  const profileMessage = document.getElementById("profileMessage");
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
    phone: document.getElementById("phone"),
    address: document.getElementById("address"),
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

  const profileFields = {
    name: document.getElementById("profileName"),
    email: document.getElementById("profileEmail"),
    phone: document.getElementById("profilePhone"),
    department: document.getElementById("profileDepartment"),
    qualification: document.getElementById("profileQualification"),
    address: document.getElementById("profileAddress"),
    currentPassword: document.getElementById("profileCurrentPassword"),
    newPassword: document.getElementById("profileNewPassword"),
    confirmPassword: document.getElementById("profileConfirmPassword")
  };

  welcomeText.textContent = `Welcome, ${facultySession.user.name}`;
  attendanceFields.facultyId.value = facultySession.user._id;

  function setModule(moduleName) {
    const config = [
      { tab: studentsModuleTab, panel: studentsModule, key: "students" },
      { tab: attendanceModuleTab, panel: attendanceModule, key: "attendance" },
      { tab: resourcesModuleTab, panel: resourcesModule, key: "resources" },
      { tab: profileModuleTab, panel: profileModule, key: "profile" }
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
                <td>${student.phone || "-"}</td>
                <td>
                  <div class="action-buttons">
                    <button type="button" onclick="editStudent('${student._id}')">Edit</button>
                    <button type="button" onclick="resetStudentPassword('${student._id}')" class="secondary">Reset Pwd</button>
                    <button type="button" class="danger" onclick="deleteStudent('${student._id}')">Delete</button>
                  </div>
                </td>
              </tr>
            `
          )
          .join("")
      : '<tr><td colspan="7">No students added yet.</td></tr>';

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

  function renderResources(resources) {
    if (!resources.length) {
      resourcesTableBody.innerHTML = '<tr><td colspan="6">No resources uploaded yet.</td><tr>';
      return;
    }

    resourcesTableBody.innerHTML = resources
      .map(
        (resource) => `
          <tr>
            <td>${resource.title}</td>
            <td>${resource.subject}</td>
            <td>${resource.type}</td>
            <td>${resource.semester || "All"}</td>
            <td>${resource.downloads}</td>
            <td>
              <div class="action-buttons">
                <a href="${resource.fileUrl}" download="${resource.fileName}" target="_blank">
                  <button type="button" class="secondary">Download</button>
                </a>
                <button type="button" class="danger" onclick="deleteResource('${resource._id}')">Delete</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");
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
    const [students, attendance, studentReport, subjectReport, alerts, resources] = await Promise.all([
      apiFetch("/api/students"),
      apiFetch("/api/attendance"),
      apiFetch("/api/reports/attendance/student-wise"),
      apiFetch("/api/reports/attendance/subject-wise"),
      apiFetch("/api/reports/attendance/alerts"),
      apiFetch("/api/resources")
    ]);

    renderStudents(students.students);
    renderAttendance(attendance.records);
    renderResources(resources.resources);
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
      fields.phone.value = student.phone || "";
      fields.address.value = student.address || "";
      fields.password.value = student.password;
      document.getElementById("saveButton").textContent = "Update Student";
      cancelEdit.classList.remove("hidden");
      setModule("students");
      showMessage(adminMessage, `Editing ${student.name}.`);
    } catch (error) {
      showMessage(adminMessage, error.message, true);
    }
  }

  async function resetStudentPassword(id) {
    const newPassword = prompt("Enter new password for student:");
    if (!newPassword) return;

    try {
      const data = await apiFetch(`/api/students/${id}/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      });
      showMessage(adminMessage, data.message);
      await refreshData();
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

  async function deleteResource(id) {
    if (!window.confirm("Delete this resource?")) {
      return;
    }

    try {
      const data = await apiFetch(`/api/resources/${id}`, { method: "DELETE" });
      showMessage(resourceMessage, data.message);
      await refreshData();
    } catch (error) {
      showMessage(resourceMessage, error.message, true);
    }
  }

  async function loadProfile() {
    try {
      const data = await apiFetch(`/api/faculty/${facultySession.user._id}`);
      const faculty = data.faculty;
      profileFields.name.value = faculty.name;
      profileFields.email.value = faculty.email;
      profileFields.phone.value = faculty.phone;
      profileFields.department.value = faculty.department;
      profileFields.qualification.value = faculty.qualification;
      profileFields.address.value = faculty.address || "";
    } catch (error) {
      showMessage(profileMessage, error.message, true);
    }
  }

  studentsModuleTab.addEventListener("click", () => setModule("students"));
  attendanceModuleTab.addEventListener("click", () => setModule("attendance"));
  resourcesModuleTab.addEventListener("click", () => {
    setModule("resources");
    loadProfile();
  });
  profileModuleTab.addEventListener("click", () => {
    setModule("profile");
    loadProfile();
  });

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
          phone: fields.phone.value.trim(),
          address: fields.address.value.trim(),
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

  resourceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append("title", document.getElementById("resourceTitle").value.trim());
    formData.append("description", document.getElementById("resourceDescription").value.trim());
    formData.append("subject", document.getElementById("resourceSubject").value.trim());
    formData.append("type", document.getElementById("resourceType").value);
    formData.append("semester", document.getElementById("resourceSemester").value);
    formData.append("file", document.getElementById("resourceFile").files[0]);

    try {
      const response = await fetch("/api/resources/upload", {
        method: "POST",
        headers: {
          "X-Faculty-Id": facultySession.user._id,
          "X-Faculty-Name": facultySession.user.name,
          "X-Faculty-Department": facultySession.user.department
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Upload failed.");
      }

      showMessage(resourceMessage, data.message);
      document.getElementById("resourceForm").reset();
      await refreshData();
    } catch (error) {
      showMessage(resourceMessage, error.message, true);
    }
  });

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (profileFields.newPassword.value && profileFields.newPassword.value !== profileFields.confirmPassword.value) {
      showMessage(profileMessage, "New passwords do not match.", true);
      return;
    }

    const updateData = {
      name: profileFields.name.value.trim(),
      email: profileFields.email.value.trim(),
      phone: profileFields.phone.value.trim(),
      address: profileFields.address.value.trim()
    };

    if (profileFields.currentPassword.value && profileFields.newPassword.value) {
      updateData.currentPassword = profileFields.currentPassword.value;
      updateData.newPassword = profileFields.newPassword.value;
    }

    try {
      const data = await apiFetch(`/api/faculty/${facultySession.user._id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      showMessage(profileMessage, data.message);
      
      // Update session
      if (data.faculty) {
        facultySession.user = data.faculty;
        saveAuthSession("faculty", data.faculty);
        welcomeText.textContent = `Welcome, ${data.faculty.name}`;
      }
      
      profileFields.currentPassword.value = "";
      profileFields.newPassword.value = "";
      profileFields.confirmPassword.value = "";
      
      setTimeout(() => {
        profileMessage.textContent = "";
      }, 3000);
    } catch (error) {
      showMessage(profileMessage, error.message, true);
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
  window.resetStudentPassword = resetStudentPassword;
  window.editAttendance = editAttendance;
  window.deleteAttendance = deleteAttendance;
  window.deleteResource = deleteResource;

  setModule("students");
  resetAttendanceForm();
  refreshData();
}