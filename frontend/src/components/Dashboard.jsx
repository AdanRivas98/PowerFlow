import { useState, useEffect } from "react";
import "../styles/Dashboard.css";
import logo from "../assets/powerflow-logo.png"; 
import Dispositivos from "./Dispositivos";  

export default function Dashboard({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Inicio");
  const [usuario, setUsuario] = useState(null);
  const [dispositivos, setDispositivos] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = "http://localhost:5000";

  useEffect(() => {
    // Verificar autenticación y cargar datos del usuario
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
      cargarDispositivos();
    } catch (error) {
      console.error("Error al parsear usuario:", error);
      if (onLogout) {
        onLogout();
      }
    }
  }, []);

  const cargarDispositivos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      console.log("Cargando dispositivos...");
      
      const response = await fetch(`${API_URL}/api/dispositivos`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Dispositivos cargados:", data);
        
        // Asegurar que data sea un array
        if (Array.isArray(data)) {
          setDispositivos(data);
        } else {
          console.warn("La respuesta no es un array:", typeof data);
          setDispositivos([]);
        }
      } else if (response.status === 404) {
        console.warn("Endpoint /api/dispositivos no encontrado, usando array vacío");
        setDispositivos([]);
      } else if (response.status === 401) {
        console.error("Token inválido o expirado");
        setDispositivos([]);
      } else {
        console.log("Error al cargar dispositivos, status:", response.status);
        setDispositivos([]);
      }
    } catch (error) {
      console.error("Error de red al cargar dispositivos:", error);
      // Si hay error de red, asumir que el endpoint no existe aún
      console.log("Probablemente el endpoint /api/dispositivos no existe aún");
      setDispositivos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("¿Seguro que deseas cerrar sesión?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      if (onLogout) {
        onLogout();
      }
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleNavClick = (section) => {
    setActiveSection(section);
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  };

  const navItems = [
    { icon: "🏠", text: "Inicio" },
    { icon: "💡", text: "Dispositivos" },
    { icon: "📊", text: "Consumo" },
    { icon: "🤖", text: "IA" },
    { icon: "📈", text: "Reportes" },
    { icon: "⚙️", text: "Configuración" },
    { icon: "🔔", text: "Notificaciones" }
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

  // Calcular top 3 dispositivos por consumo (ejemplo con datos reales)
  const getTopDispositivos = () => {
    // Verificar que dispositivos sea un array válido
    if (!Array.isArray(dispositivos) || dispositivos.length === 0) {
      return [
        { icon: "❄️", nombre: "Aire acondicionado", consumo: "90 kWh" },
        { icon: "🧊", nombre: "Refrigerador", consumo: "60 kWh" },
        { icon: "💡", nombre: "Iluminación", consumo: "25 kWh" }
      ];
    }

    // Ordenar dispositivos por potencia y tomar los 3 primeros
    // Crear una copia del array antes de ordenar para no mutar el original
    return [...dispositivos]
      .sort((a, b) => b.potencia_watts - a.potencia_watts)
      .slice(0, 3)
      .map(d => ({
        icon: getDispositivoIcon(d.tipo),
        nombre: d.nombre,
        consumo: `${(d.potencia_watts / 1000 * 30).toFixed(0)} kWh` // Estimación mensual
      }));
  };

  const getDispositivoIcon = (tipo) => {
    const iconos = {
      "aire_acondicionado": "❄️",
      "refrigerador": "🧊",
      "iluminacion": "💡",
      "television": "📺",
      "computadora": "💻",
      "lavadora": "🌀",
      "microondas": "🔥",
      "ventilador": "🌀"
    };
    return iconos[tipo] || "⚡";
  };

  if (!usuario) {
    return null; // No mostrar nada mientras carga
  }

  return (
    <div className="dashboard-root">
      {/* Overlay para cerrar sidebar en móvil */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* SIDEBAR */}
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
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => handleNavClick("Perfil")}>
            <span className="nav-icon">👤</span>
            <span className="nav-text">Perfil</span>
          </button>
          <button className="nav-item" onClick={handleLogout} style={{ color: "#ff4444" }}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
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
          {activeSection === "Inicio" && (
            <section className="cards-grid">
              {/* Total mensual */}
              <div className="card total-card">
                <p className="card-label">Total mensual</p>
                <div className="total-values">
                  <div className="total-row">
                    <span className="total-number">250</span>
                    <span className="total-unit">kWh</span>
                  </div>
                  <div className="total-row">
                    <span className="total-cost">L 925</span>
                  </div>
                </div>
              </div>

              {/* Gráfico consumo diario */}
              <div className="card chart-card">
                <p className="card-label">Consumo diario</p>
                <div className="chart-area">
                  <svg viewBox="0 0 100 40" className="chart-svg">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0078FF" />
                        <stop offset="100%" stopColor="#A6FF00" />
                      </linearGradient>
                    </defs>
                    <polyline
                      points="0,30 15,28 30,24 45,27 60,21 75,18 90,22 100,20"
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="0" cy="30" r="2" fill="#0078FF" />
                    <circle cx="15" cy="28" r="2" fill="#0078FF" />
                    <circle cx="30" cy="24" r="2" fill="#0078FF" />
                    <circle cx="45" cy="27" r="2" fill="#0078FF" />
                    <circle cx="60" cy="21" r="2" fill="#0078FF" />
                    <circle cx="75" cy="18" r="2" fill="#A6FF00" />
                    <circle cx="90" cy="22" r="2" fill="#A6FF00" />
                    <circle cx="100" cy="20" r="2" fill="#A6FF00" />
                  </svg>
                  <div className="chart-days">
                    <span>L</span>
                    <span>M</span>
                    <span>M</span>
                    <span>J</span>
                    <span>V</span>
                    <span>S</span>
                    <span>D</span>
                  </div>
                </div>
              </div>

              {/* Top 3 dispositivos */}
              <div className="card devices-card">
                <p className="card-label">Top 3 dispositivos</p>
                {loading ? (
                  <p style={{ textAlign: "center", padding: "20px" }}>Cargando...</p>
                ) : (
                  <ul className="devices-list">
                    {getTopDispositivos().map((device, index) => (
                      <li key={index}>
                        <span className="device-name">
                          <span className="device-icon">{device.icon}</span>
                          {device.nombre}
                        </span>
                        <span className="device-consumption">{device.consumo}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Predicción */}
              <div className="card prediction-card">
                <p className="card-label">Predicción IA</p>
                <div className="prediction-content">
                  <div className="prediction-icon">
                    <div className="bulb-circle">
                      <span>⚡</span>
                    </div>
                  </div>
                  <p className="prediction-text">
                    El consumo para la próxima semana se estima en{" "}
                    <strong>270 kWh</strong>.
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeSection === "Perfil" && (
            <section className="cards-grid">
              <div className="card" style={{ gridColumn: "1 / -1", padding: "30px" }}>
                <h2 style={{ marginBottom: "20px" }}>Mi Perfil</h2>
                <div style={{ display: "grid", gap: "15px" }}>
                  <div>
                    <strong>Nombre:</strong> {usuario.nombre}
                  </div>
                  <div>
                    <strong>Correo:</strong> {usuario.correo}
                  </div>
                  <div>
                    <strong>ID de Usuario:</strong> {usuario.id}
                  </div>
                  <div>
                    <strong>Dispositivos registrados:</strong> {Array.isArray(dispositivos) ? dispositivos.length : 0}
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSection === "Dispositivos" && (  
            <Dispositivos />
          )}

          {activeSection !== "Inicio" && activeSection !== "Perfil" && activeSection !== "Dispositivos" && (
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