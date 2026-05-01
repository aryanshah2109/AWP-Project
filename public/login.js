const adminTab = document.getElementById("adminTab");
const facultyTab = document.getElementById("facultyTab");
const studentTab = document.getElementById("studentTab");
const adminLoginForm = document.getElementById("adminLoginForm");
const facultyLoginForm = document.getElementById("facultyLoginForm");
const studentLoginForm = document.getElementById("studentLoginForm");
const loginMessage = document.getElementById("loginMessage");

const existingSession = getAuthSession();
if (existingSession) {
  if (existingSession.role === "admin") {
    redirectTo("/admin-dashboard.html");
  } else if (existingSession.role === "faculty") {
    redirectTo("/faculty-dashboard.html");
  } else if (existingSession.role === "student") {
    redirectTo("/student-dashboard.html");
  }
}

function setLoginMode(mode) {
  adminTab.classList.toggle("active", mode === "admin");
  facultyTab.classList.toggle("active", mode === "faculty");
  studentTab.classList.toggle("active", mode === "student");
  adminLoginForm.classList.toggle("hidden", mode !== "admin");
  facultyLoginForm.classList.toggle("hidden", mode !== "faculty");
  studentLoginForm.classList.toggle("hidden", mode !== "student");
  loginMessage.textContent = "";
}

adminTab.addEventListener("click", () => setLoginMode("admin"));
facultyTab.addEventListener("click", () => setLoginMode("faculty"));
studentTab.addEventListener("click", () => setLoginMode("student"));

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const data = await apiFetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: document.getElementById("adminUsername").value.trim(),
        password: document.getElementById("adminPassword").value.trim()
      })
    });

    saveAuthSession("admin", { username: "admin" });
    showMessage(loginMessage, data.message);
    redirectTo("/admin-dashboard.html");
  } catch (error) {
    showMessage(loginMessage, error.message, true);
  }
});

facultyLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const data = await apiFetch("/api/faculty/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facultyId: document.getElementById("facultyLoginId").value.trim(),
        password: document.getElementById("facultyLoginPassword").value.trim()
      })
    });

    saveAuthSession("faculty", data.faculty);
    showMessage(loginMessage, data.message);
    redirectTo("/faculty-dashboard.html");
  } catch (error) {
    showMessage(loginMessage, error.message, true);
  }
});

studentLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const data = await apiFetch("/api/student/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollmentNo: document.getElementById("studentEnrollmentNo").value.trim(),
        password: document.getElementById("studentPassword").value.trim()
      })
    });

    saveAuthSession("student", data.student);
    showMessage(loginMessage, data.message);
    redirectTo("/student-dashboard.html");
  } catch (error) {
    showMessage(loginMessage, error.message, true);
  }
});

setLoginMode("admin");
