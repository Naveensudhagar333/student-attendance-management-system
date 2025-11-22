// login.js
// Simple role-based login (admin/teacher). Creates default demo data if missing.

function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const role = document.querySelector('input[name="role"]:checked').value;

  // simple static users
  const creds = {
    admin: { user: "admin", pass: "admin123" },
    teacher: { user: "teacher", pass: "teach123" }
  };

  const expect = creds[role];

  if (user === expect.user && pass === expect.pass) {
    // initialize demo data if empty
    Utils.ensureDemoData();
    localStorage.setItem("currentUser", JSON.stringify({ user, role }));
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid credentials");
  }
}
