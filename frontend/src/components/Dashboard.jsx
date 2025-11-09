import { useState } from "react";
import "../styles/Dashboard.css";
import logo from "../assets/powerflow-logo.png";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Inicio");

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
            <div className="avatar">AR</div>
          </div>
        </header>

        <main className="dashboard-content">
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
                  {/* Puntos en la línea */}
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
              <ul className="devices-list">
                <li>
                  <span className="device-name">
                    <span className="device-icon">❄️</span>
                    Aire acondicionado
                  </span>
                  <span className="device-consumption">90 kWh</span>
                </li>
                <li>
                  <span className="device-name">
                    <span className="device-icon">🧊</span>
                    Refrigerador
                  </span>
                  <span className="device-consumption">60 kWh</span>
                </li>
                <li>
                  <span className="device-name">
                    <span className="device-icon">💡</span>
                    Iluminación
                  </span>
                  <span className="device-consumption">25 kWh</span>
                </li>
              </ul>
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
        </main>
      </div>
    </div>
  );
}