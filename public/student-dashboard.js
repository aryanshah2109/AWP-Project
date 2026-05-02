// public/student-dashboard.js
const studentSession = requireRole(["student"]);

if (studentSession) {
  const welcomeText = document.getElementById("welcomeText");
  const profileModuleTab = document.getElementById("profileModuleTab");
  const attendanceModuleTab = document.getElementById("attendanceModuleTab");
  const resourcesModuleTab = document.getElementById("resourcesModuleTab");
  const profileModule = document.getElementById("profileModule");
  const attendanceModule = document.getElementById("attendanceModule");
  const resourcesModule = document.getElementById("resourcesModule");
  const studentDetails = document.getElementById("studentDetails");
  const studentAttendanceSummary = document.getElementById("studentAttendanceSummary");
  const attendanceRecordsBody = document.getElementById("attendanceRecordsBody");
  const resourcesTableBody = document.getElementById("resourcesTableBody");
  const filterSubject = document.getElementById("filterSubject");
  const filterSemester = document.getElementById("filterSemester");
  const filterButton = document.getElementById("filterButton");
  const logoutButton = document.getElementById("logoutButton");
  const profileForm = document.getElementById("profileForm");
  const profileMessage = document.getElementById("profileMessage");

  const profileFields = {
    name: document.getElementById("profileName"),
    email: document.getElementById("profileEmail"),
    phone: document.getElementById("profilePhone"),
    address: document.getElementById("profileAddress"),
    currentPassword: document.getElementById("profileCurrentPassword"),
    newPassword: document.getElementById("profileNewPassword"),
    confirmPassword: document.getElementById("profileConfirmPassword")
  };

  welcomeText.textContent = `Welcome, ${studentSession.user.name}`;

  let allResources = [];

  function setModule(moduleName) {
    const config = [
      { tab: profileModuleTab, panel: profileModule, key: "profile" },
      { tab: attendanceModuleTab, panel: attendanceModule, key: "attendance" },
      { tab: resourcesModuleTab, panel: resourcesModule, key: "resources" }
    ];

    config.forEach(({ tab, panel, key }) => {
      const active = key === moduleName;
      tab.classList.toggle("active", active);
      panel.classList.toggle("hidden", !active);
    });
  }

  function renderStudentDashboard(student) {
    studentDetails.innerHTML = `
      <div class="student-card"><strong>Name:</strong> ${student.name}</div>
      <div class="student-card"><strong>Enrollment No:</strong> ${student.enrollmentNo}</div>
      <div class="student-card"><strong>Email:</strong> ${student.email}</div>
      <div class="student-card"><strong>Department:</strong> ${student.department}</div>
      <div class="student-card"><strong>Semester:</strong> ${student.semester}</div>
      <div class="student-card"><strong>Phone:</strong> ${student.phone || "Not provided"}</div>
      <div class="student-card"><strong>Address:</strong> ${student.address || "Not provided"}</div>
    `;
    
    profileFields.name.value = student.name;
    profileFields.email.value = student.email;
    profileFields.phone.value = student.phone || "";
    profileFields.address.value = student.address || "";
  }

  function renderStudentAttendanceSummary(summary, records) {
    studentAttendanceSummary.innerHTML = `
      <div class="report-item ${summary.shortage ? "alert-item" : ""}">
        <strong>Overall Attendance</strong><br />
        ${summary.attended}/${summary.total} classes | ${summary.percentage}%<br />
        ${summary.shortage ? "⚠️ Shortage alert: Below 75%" : "✅ On track"}
      </div>
    `;

    attendanceRecordsBody.innerHTML = records.length
      ? records
          .map(
            (record) => `
              <tr>
                <td>${record.date}</td>
                <td>${record.subject}</td>
                <td>${record.status}</td>
                <td>${record.faculty?.name || "-"}</td>
              </tr>
            `
          )
          .join("")
      : '<tr><td colspan="4">No attendance records yet.</td></tr>';
  }

  function renderResources(resources) {
    if (!resources.length) {
      resourcesTableBody.innerHTML = '<tr><td colspan="8">No resources available.</td></tr>';
      return;
    }

    resourcesTableBody.innerHTML = resources
      .map(
        (resource) => `
          <tr>
            <td>${resource.title}</td>
            <td>${resource.description || "-"}</td>
            <td>${resource.subject}</td>
            <td>${resource.type}</td>
            <td>${resource.uploaderName}</td>
            <td>${resource.semester || "All"}</td>
            <td>${resource.downloads}</td>
            <td>
              <div class="action-buttons">
                <a href="${resource.fileUrl}" download="${resource.fileName}" target="_blank">
                  <button type="button" class="secondary" onclick="trackDownload('${resource._id}')">Download</button>
                </a>
              </div>
            </td>
          </tr>
        `
      )
      .join("");
  }

  async function trackDownload(resourceId) {
    try {
      await apiFetch(`/api/resources/${resourceId}/download`, { method: "POST" });
    } catch (error) {
      console.error("Failed to track download:", error);
    }
  }

  function populateSubjectFilter(resources) {
    const subjects = [...new Set(resources.map(r => r.subject))];
    filterSubject.innerHTML = '<option value="">All Subjects</option>' +
      subjects.map(subject => `<option value="${subject}">${subject}</option>`).join("");
  }

  function filterResources() {
    const subject = filterSubject.value;
    const semester = filterSemester.value;
    
    let filtered = allResources;
    
    if (subject) {
      filtered = filtered.filter(r => r.subject === subject);
    }
    
    if (semester) {
      filtered = filtered.filter(r => r.semester === parseInt(semester) || !r.semester);
    }
    
    renderResources(filtered);
  }

  async function loadStudentDashboard() {
    renderStudentDashboard(studentSession.user);

    try {
      const [attendanceData, resourcesData] = await Promise.all([
        apiFetch(`/api/students/${studentSession.user._id}/attendance-summary`),
        apiFetch("/api/resources")
      ]);
      
      renderStudentAttendanceSummary(attendanceData.summary, attendanceData.records);
      
      allResources = resourcesData.resources || [];
      populateSubjectFilter(allResources);
      renderResources(allResources);
    } catch (error) {
      studentAttendanceSummary.innerHTML = `<div class="report-item alert-item">${error.message}</div>`;
    }
  }

  profileModuleTab.addEventListener("click", () => {
    setModule("profile");
    loadStudentDashboard();
  });
  
  attendanceModuleTab.addEventListener("click", () => {
    setModule("attendance");
    loadStudentDashboard();
  });
  
  resourcesModuleTab.addEventListener("click", () => {
    setModule("resources");
    loadStudentDashboard();
  });

  filterButton.addEventListener("click", filterResources);
  filterSubject.addEventListener("change", filterResources);
  filterSemester.addEventListener("change", filterResources);

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
      const data = await apiFetch(`/api/students/${studentSession.user._id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      showMessage(profileMessage, data.message);
      
      if (data.student) {
        studentSession.user = data.student;
        saveAuthSession("student", data.student);
        welcomeText.textContent = `Welcome, ${data.student.name}`;
        renderStudentDashboard(data.student);
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

  logoutButton.addEventListener("click", () => {
    clearAuthSession();
    redirectTo("/login.html");
  });

  window.trackDownload = trackDownload;

  setModule("profile");
  loadStudentDashboard();
}