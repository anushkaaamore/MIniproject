import Dashboard from "../components/Dashboard";

export default function TeacherPanel({ onLogout }) {
  const teacherName = localStorage.getItem("teacher_name") || "Teacher";
  return (
    <div className="page-shell">
      <div className="topbar">
        <p className="topbar-title">
          Welcome, <strong>{teacherName}</strong>
        </p>
        <button
          className="btn btn-danger"
          onClick={() => {
            localStorage.removeItem("teacher_token");
            localStorage.removeItem("teacher_name");
            onLogout();
          }}
        >
          Logout
        </button>
      </div>
      <Dashboard />
    </div>
  );
}
