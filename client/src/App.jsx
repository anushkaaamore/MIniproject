import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import TeacherPanel from "./pages/TeacherPanel";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.getItem("teacher_token")));
  return loggedIn ? <TeacherPanel onLogout={() => setLoggedIn(false)} /> : <LoginPage onLogin={() => setLoggedIn(true)} />;
}
