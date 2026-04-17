import { useState, useEffect } from "react";
import "../styles/Dashboard.css";
import logo from "../assets/powerflow-logo.png"; 
import Dispositivos from "./Dispositivos";
import Notificaciones from "./Notificaciones";
import Consumo from "./Consumo";
import Reportes from "./Reportes";
import IA from "./IA";
import Configuracion from "./Configuracion";

export default function Dashboard({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Consumo");
  const [usuario, setUsuario] = useState(null);
  const [notificacionesCount, setNotificacionesCount] = useState(0);
  const [dispositivoIdParaEditar, setDispositivoIdParaEditar] = useState(null);

  const API_URL = "http://localhost:5000";
  
// Verificar autenticación y cargar datos del usuario
  useEffect(() => {
    const usuarioData = localStorage.getItem("usuario");
    const token = localStorage.getItem("token");

    console.log("Dashboard montado, verificando auth:", { usuarioData: !!usuarioData, token: !!token });

    if (!usuarioData || !token) {
      console.log("Sin sesión, redirigiendo al login");
      if (onLogout) {
        onLogout();
      }
      return;
    }

    try {
      const usuarioObj = JSON.parse(usuarioData);
      console.log("Usuario cargado:", usuarioObj);
      setUsuario(usuarioObj);
      cargarNotificaciones();
    } catch (error) {
      console.error("Error al parsear usuario:", error);
      if (onLogout) {
        onLogout();
      }
    }
  }, []);

  // Cargar notificaciones y filtrar las descartadas
  const cargarNotificaciones = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Verificar si ya visitó notificaciones EN ESTA SESIÓN
      const visitoNotificacionesEstaSesion = sessionStorage.getItem("visito_notificaciones");
      
      // Si ya visitó en esta sesión, no mostrar el badge
      if (visitoNotificacionesEstaSesion === "true") {
        console.log("✓ Ya visitó notificaciones en esta sesión, badge oculto");
        setNotificacionesCount(0);
        return;
      }
      
      const response = await fetch(`${API_URL}/api/notificaciones/dispositivos-sin-registro`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Obtener dispositivos descartados en esta sesión
        const descartadosStr = sessionStorage.getItem("notificaciones_descartadas");
        const descartados = descartadosStr ? JSON.parse(descartadosStr) : [];
        
        console.log("Dispositivos descartados en esta sesión:", descartados);
        
        // Filtrar los dispositivos descartados
        const dispositivosPendientes = data.dispositivos.filter(
          d => !descartados.includes(d.id)
        );
        
        const count = dispositivosPendientes.length;
        console.log(`📊 Notificaciones: ${count} pendientes (${descartados.length} descartadas)`);
        setNotificacionesCount(count);
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
      setNotificacionesCount(0);
    }
  };

  const handleLogout = () => {
    if (window.confirm("¿Seguro que deseas cerrar sesión?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      sessionStorage.clear();
      console.log("✓ SessionStorage limpiado al cerrar sesión");
      if (onLogout) {
        onLogout();
      }
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleNavClick = (section) => {
    setActiveSection(section);
    
    // Resetear el contador y marcar que visitó
    if (section === "Notificaciones") {
      setNotificacionesCount(0);
      sessionStorage.setItem("visito_notificaciones", "true");
      console.log("✓ Usuario entró a Notificaciones, badge ocultado para esta sesión");
    }
    
    // Limpiar el dispositivo para editar cuando se cambia de sección
    setDispositivoIdParaEditar(null);
    
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  };

  // Función para navegar desde notificaciones al modal de dispositivo
  const handleNavigateToDevice = (dispositivoId) => {
    setDispositivoIdParaEditar(dispositivoId);
    setActiveSection("Dispositivos");
    
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  };

  // Callback para cuando se descarta una notificación
  const handleNotificacionDescartada = () => {
    cargarNotificaciones();
  };

  const navItems = [
    { icon: "📊", text: "Consumo" },
    { icon: "🔔", text: "Notificaciones", badge: notificacionesCount },
    { icon: "💡", text: "Dispositivos" },
    { icon: "📈", text: "Reportes" },
    { icon: "🤖", text: "IA" },
    { icon: "⚙️", text: "Configuración" }
  ];

  // Obtener iniciales del usuario
  const getInitials = () => {
    if (!usuario) return "??";
    const nombres = usuario.nombre.split(" ");
    if (nombres.length >= 2) {
      return `${nombres[0][0]}${nombres[1][0]}`.toUpperCase();
    }
    return usuario.nombre.substring(0, 2).toUpperCase();
  };

  if (!usuario) {
    return null;
  }

  return (
    <div className="dashboard-root">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <img src={logo} alt="PowerFlow" className="sidebar-logo" />
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.text}
              className={`nav-item ${activeSection === item.text ? "active" : ""}`}
              onClick={() => handleNavClick(item.text)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.text}</span>
              {item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout} style={{ color: "#ff4444" }}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <button 
            className="hamburger" 
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>

          <div className="topbar-titles">
            <h1>{activeSection}</h1>
            <p>Conoce tu energía. Controla tu consumo.</p>
          </div>

          <div className="topbar-user">
            <div className="avatar" title={usuario.nombre}>
              {getInitials()}
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          {activeSection === "Dispositivos" && (  
            <Dispositivos dispositivoIdParaEditar={dispositivoIdParaEditar} />
          )}

          {activeSection === "Notificaciones" && (
            <Notificaciones 
              onNavigateToDevice={handleNavigateToDevice}
              onNotificacionDescartada={handleNotificacionDescartada}
            />
          )}

          {activeSection === "Consumo" && (
            <Consumo />
          )}

          {activeSection === "Reportes" && (
            <Reportes />
          )}

          {activeSection === "IA" && (
            <IA />
          )}

          {activeSection === "Configuración" && (
            <Configuracion />
          )}

          {activeSection !== "Perfil" && 
           activeSection !== "Dispositivos" && 
           activeSection !== "Notificaciones" && 
           activeSection !== "Consumo" &&
           activeSection !== "PRUEBA TERNA" &&
           activeSection !== "Reportes" &&
           activeSection !== "IA" &&
           activeSection !== "Configuración" && (
            <section className="cards-grid">
              <div className="card" style={{ gridColumn: "1 / -1", padding: "30px", textAlign: "center" }}>
                <h2>{activeSection}</h2>
                <p style={{ color: "#666", marginTop: "10px" }}>
                  Esta sección estará disponible próximamente.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}