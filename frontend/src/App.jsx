import { useState, useEffect } from "react";
import LoginRegister from "./components/LoginRegister";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [view, setView] = useState("loading"); // "loading", "login", "dashboard"

  useEffect(() => {
    // Verificar si hay una sesión activa al cargar la app
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");

    if (token && usuario) {
      // Si hay token y usuario, ir al dashboard
      setView("dashboard");
    } else {
      // Si no hay sesión, ir al login
      setView("login");
    }
  }, []);

  const handleLoginSuccess = () => {
    setView("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setView("login");
  };

  // Pantalla de carga mientras verificamos la sesión
  if (view === "loading") {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        fontSize: "24px",
        fontWeight: "bold"
      }}>
        ⚡ Cargando PowerFlow...
      </div>
    );
  }

  return view === "login" ? (
    <LoginRegister onLoginSuccess={handleLoginSuccess} />
  ) : (
    <Dashboard onLogout={handleLogout} />
  );
}