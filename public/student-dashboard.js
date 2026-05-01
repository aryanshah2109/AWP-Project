const studentSession = requireRole(["student"]);

if (studentSession) {
  const welcomeText = document.getElementById("welcomeText");
  const studentDetails = document.getElementById("studentDetails");
  const studentAttendanceSummary = document.getElementById("studentAttendanceSummary");
  const logoutButton = document.getElementById("logoutButton");

  welcomeText.textContent = `Welcome, ${studentSession.user.name}`;

  function renderStudentDashboard(student) {
    studentDetails.innerHTML = `
      <div class="student-card"><strong>Name:</strong> ${student.name}</div>
      <div class="student-card"><strong>Enrollment No:</strong> ${student.enrollmentNo}</div>
      <div class="student-card"><strong>Email:</strong> ${student.email}</div>
      <div class="student-card"><strong>Department:</strong> ${student.department}</div>
      <div class="student-card"><strong>Semester:</strong> ${student.semester}</div>
    `;
  }

  function renderStudentAttendanceSummary(summary, records) {
    const recentRecords = records.slice(0, 6);

    studentAttendanceSummary.innerHTML = `
      <div class="report-item ${summary.shortage ? "alert-item" : ""}">
        <strong>Overall Attendance</strong><br />
        ${summary.attended}/${summary.total} classes | ${summary.percentage}%<br />
        ${summary.shortage ? "Shortage alert: Yes" : "Shortage alert: No"}
      </div>
      ${
        recentRecords.length
          ? recentRecords
              .map(
                (record) => `
                  <div class="report-item">
                    <strong>${record.subject}</strong><br />
                    ${record.date} | ${record.status}
                  </div>
                `
              )
              .join("")
          : '<div class="report-item">No attendance records yet.</div>'
      }
    `;
  }

  async function loadStudentDashboard() {
    renderStudentDashboard(studentSession.user);

    try {
      const data = await apiFetch(
        `/api/students/${studentSession.user._id}/attendance-summary`
      );
      renderStudentAttendanceSummary(data.summary, data.records);
    } catch (error) {
      studentAttendanceSummary.innerHTML = `<div class="report-item alert-item">${error.message}</div>`;
    }
  }

  logoutButton.addEventListener("click", () => {
    clearAuthSession();
    redirectTo("/login.html");
  });

  loadStudentDashboard();
}
