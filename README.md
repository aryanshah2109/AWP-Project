# College ERP System

A basic College ERP project with:

- Admin login
- Faculty login
- Student login
- Add student
- Update student
- Delete student
- View student details
- Faculty management
- Daily attendance marking
- Student-wise attendance reports
- Subject-wise attendance reports
- Attendance shortage alerts
- Share resources

## Tech Stack

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- MongoDB

## MongoDB Configuration

This project is configured to use:

`mongodb://127.0.0.1:27018/college_erp`

Make sure MongoDB is running locally on port `27018`.

## Default Admin Login

- Username: `admin`
- Password: `admin123`

## User Roles

- Admin can manage students, faculty, and attendance.
- Faculty can manage students and attendance.
- Students can view their own profile and attendance summary.

## How to Run

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open in browser:

`http://localhost:3000`

## Pages

- `/login.html` for admin, faculty, and student login
- `/admin-dashboard.html` for admin management
- `/faculty-dashboard.html` for faculty management
- `/student-dashboard.html` for student self-service

## Project Structure

```text
college-erp-system/
|-- public/
|   |-- admin-dashboard.html
|   |-- admin-dashboard.js
|   |-- faculty-dashboard.html
|   |-- faculty-dashboard.js
|   |-- index.html
|   |-- login.html
|   |-- login.js
|   |-- shared.js
|   |-- student-dashboard.html
|   |-- student-dashboard.js
|   |-- styles.css
|-- src/
|   |-- models/
|       |-- Student.js
|-- package.json
|-- README.md
|-- server.js
```

## Notes

- Student login uses `enrollmentNo` and `password`.
- Attendance shortage alerts use a `75%` threshold.
- Faculty management includes profile details, qualifications, subject allocation, workload, leave, and attendance summary fields.
- Passwords are stored in plain text in this beginner project to keep the code simple.
- For a production project, use password hashing, sessions, role-based auth, and input validation.
