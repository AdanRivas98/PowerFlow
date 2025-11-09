import { useState } from "react";
import "../styles/Dashboard.css";
import logo from "../assets/powerflow-logo.png";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="dashboard-root">
      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <img src={logo} alt="PowerFlow" className="sidebar-logo" />
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Inicio</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">💡</span>
            <span className="nav-text">Dispositivos</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">📊</span>
            <span className="nav-text">Consumo</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">🤖</span>
            <span className="nav-text">IA</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">📈</span>
            <span className="nav-text">Reportes</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Configuración</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">🔔</span>
            <span className="nav-text">Notificaciones</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item">
            <span className="nav-icon">👤</span>
            <span className="nav-text">Perfil</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="dashboard-main">
        <header className="topbar">
          <button className="hamburger" onClick={toggleSidebar}>
            <span />
            <span />
            <span />
          </button>

          <div className="topbar-titles">
            <h1>Inicio</h1>
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
                <div>
                  <span className="total-number">250</span>
                  <span className="total-unit">kWh</span>
                </div>
                <div>
                  <span className="total-number">L 925</span>
                </div>
              </div>
            </div>

            {/* Gráfico consumo diario (visual fake) */}
            <div className="card chart-card">
              <p className="card-label">Consumo diario</p>
              <div className="chart-area">
                <svg viewBox="0 0 100 40" className="chart-svg">
                  <polyline
                    points="0,30 15,28 30,24 45,27 60,21 75,18 90,22 100,20"
                    fill="none"
                    stroke="#0078FF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="chart-days">
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                </div>
              </div>
            </div>

            {/* Top 3 dispositivos */}
            <div className="card devices-card">
              <p className="card-label">Top 3 dispositivos</p>
              <ul className="devices-list">
                <li>
                  <span>Aire acondicionado</span>
                  <span>90 kWh</span>
                </li>
                <li>
                  <span>Refrigerador</span>
                  <span>60 kWh</span>
                </li>
                <li>
                  <span>Iluminación</span>
                  <span>25 kWh</span>
                </li>
              </ul>
            </div>

            {/* Predicción */}
            <div className="card prediction-card">
              <p className="card-label">Predicción</p>
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
