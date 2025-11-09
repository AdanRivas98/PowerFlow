import { useState } from "react";
import LoginRegister from "./components/LoginRegister";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [view, setView] = useState("dashboard");

  const handleLoginSuccess = () => {
    setView("dashboard");
  };

  return view === "login" ? (
    <LoginRegister onLoginSuccess={handleLoginSuccess} />
  ) : (
    <Dashboard />
  );
}
