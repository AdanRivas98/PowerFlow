import { useState, useEffect } from "react";
import "../styles/Configuracion.css";

export default function Configuracion() {
  const [activeSection, setActiveSection] = useState("perfil");
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  // Estados para configuración
  const [perfil, setPerfil] = useState({
    nombre: "",
    correo: "",
    correo_nuevo: ""
  });

  const [password, setPassword] = useState({
    actual: "",
    nueva: "",
    confirmar: ""
  });

  const [config, setConfig] = useState({
    tarifa_kwh: 3.7,
    meta_mensual_kwh: 250,
    meta_mensual_lps: 925,
    dia_corte: 1,
    proveedor: "ENEE"
  });

  const [notificaciones, setNotificaciones] = useState({
    consumo_alto: true,
    recordatorio_diario: true,
    recomendaciones_ia: true,
    logros: true,
    email_semanal: false,
    email_mensual: true,
    email_critico: true
  });

  const [apariencia, setApariencia] = useState({
    tema: "dark",
    color_acento: "blue",
    tamano_texto: "medium"
  });

  const API_URL = "http://localhost:5000";

  useEffect(() => {
    cargarDatosUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatosUsuario = async () => {
    try {
      setLoading(true);
      const usuarioData = localStorage.getItem("usuario");
      
      if (usuarioData) {
        const user = JSON.parse(usuarioData);
        setUsuario(user);
        setPerfil({
          nombre: user.nombre || "",
          correo: user.correo || "",
          correo_nuevo: ""
        });
      }

      // Cargar configuraciones guardadas del usuario
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/configuracion`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.config) {
          setConfig({
            tarifa_kwh: data.config.tarifa_kwh || 3.7,
            meta_mensual_kwh: data.config.meta_mensual_kwh || 250,
            meta_mensual_lps: data.config.meta_mensual_lps || 925,
            dia_corte: data.config.dia_corte || 1,
            proveedor: data.config.proveedor || "ENEE"
          });
        }

        if (data.notificaciones) {
          setNotificaciones({
            ...notificaciones,
            ...data.notificaciones
          });
        }

        if (data.apariencia) {
          setApariencia({
            ...apariencia,
            ...data.apariencia
          });
        }
      }

    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (texto, tipo = "success") => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000);
  };

  // PERFIL - Actualizar información
  const handleActualizarPerfil = async () => {
    if (!perfil.nombre.trim()) {
      mostrarMensaje("El nombre no puede estar vacío", "error");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/usuarios/perfil`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre: perfil.nombre,
          correo: perfil.correo_nuevo || perfil.correo
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Actualizar localStorage
        const usuarioActualizado = { ...usuario, nombre: perfil.nombre };
        if (perfil.correo_nuevo) {
          usuarioActualizado.correo = perfil.correo_nuevo;
        }
        localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
        setUsuario(usuarioActualizado);
        setPerfil({ ...perfil, correo: perfil.correo_nuevo || perfil.correo, correo_nuevo: "" });
        
        mostrarMensaje("Perfil actualizado correctamente", "success");
      } else {
        mostrarMensaje(data.error || "Error al actualizar perfil", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  };

  // PERFIL - Cambiar contraseña
  const handleCambiarPassword = async () => {
    if (!password.actual || !password.nueva || !password.confirmar) {
      mostrarMensaje("Completa todos los campos", "error");
      return;
    }

    if (password.nueva.length < 6) {
      mostrarMensaje("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }

    if (password.nueva !== password.confirmar) {
      mostrarMensaje("Las contraseñas no coinciden", "error");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/usuarios/password`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password_actual: password.actual,
          password_nueva: password.nueva
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPassword({ actual: "", nueva: "", confirmar: "" });
        mostrarMensaje("Contraseña actualizada correctamente", "success");
      } else {
        mostrarMensaje(data.error || "Error al cambiar contraseña", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  };

  // ENERGÉTICA - Guardar configuración
  const handleGuardarConfigEnergetica = async () => {
    if (config.tarifa_kwh <= 0) {
      mostrarMensaje("La tarifa debe ser mayor a 0", "error");
      return;
    }

    if (config.meta_mensual_kwh <= 0) {
      mostrarMensaje("La meta debe ser mayor a 0", "error");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/configuracion/energetica`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        mostrarMensaje("Configuración energética guardada", "success");
      } else {
        mostrarMensaje("Error al guardar configuración", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  };

  // Calcular meta en Lempiras al cambiar kWh o tarifa
  useEffect(() => {
    const meta_lps = (config.meta_mensual_kwh * config.tarifa_kwh).toFixed(2);
    if (meta_lps !== config.meta_mensual_lps) {
      setConfig(prev => ({ ...prev, meta_mensual_lps: parseFloat(meta_lps) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.meta_mensual_kwh, config.tarifa_kwh]);

  

  const menuItems = [
    { id: "perfil", icon: "👤", label: "Perfil" },
    { id: "energetica", icon: "⚡", label: "Energética" },
    { id: "acerca", icon: "ℹ️", label: "Acerca de" }
  ];

  if (loading) {
    return (
      <div className="config-loading">
        <div className="spinner"></div>
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="configuracion-container">
      {/* Header */}
      <div className="config-header">
        <div className="config-header-content">
          <div className="config-header-icon">⚙️</div>
          <div>
            <h1>Configuración</h1>
            <p>Personaliza tu experiencia PowerFlow</p>
          </div>
        </div>
      </div>

      {/* Mensaje de feedback */}
      {mensaje.texto && (
        <div className={`config-mensaje ${mensaje.tipo}`}>
          <span className="mensaje-icono">
            {mensaje.tipo === "success" ? "✅" : "❌"}
          </span>
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Layout principal */}
      <div className="config-layout">
        {/* Sidebar */}
        <aside className="config-sidebar">
          <nav className="config-nav">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`config-nav-item ${activeSection === item.id ? "active" : ""}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Panel principal */}
        <main className="config-main">
          
          {/* SECCIÓN: PERFIL */}
          {activeSection === "perfil" && (
            <div className="config-section">
              <h2 className="section-title">👤 Perfil de Usuario</h2>

              {/* Información personal */}
              <div className="config-card">
                <h3 className="card-title">Información Personal</h3>
                
                <div className="form-group">
                  <label>Nombre completo</label>
                  <input
                    type="text"
                    value={perfil.nombre}
                    onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="form-group">
                  <label>Correo electrónico actual</label>
                  <input
                    type="email"
                    value={perfil.correo}
                    disabled
                    className="input-disabled"
                  />
                </div>

                <div className="form-group">
                  <label>Nuevo correo electrónico (opcional)</label>
                  <input
                    type="email"
                    value={perfil.correo_nuevo}
                    onChange={(e) => setPerfil({ ...perfil, correo_nuevo: e.target.value })}
                    placeholder="nuevo@ejemplo.com"
                  />
                  <small className="form-help">Deja vacío si no deseas cambiar tu correo</small>
                </div>

                <button 
                  className="btn-primary"
                  onClick={handleActualizarPerfil}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>

              {/* Cambiar contraseña */}
              <div className="config-card">
                <h3 className="card-title">Cambiar Contraseña</h3>
                
                <div className="form-group">
                  <label>Contraseña actual</label>
                  <input
                    type="password"
                    value={password.actual}
                    onChange={(e) => setPassword({ ...password, actual: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-group">
                  <label>Nueva contraseña</label>
                  <input
                    type="password"
                    value={password.nueva}
                    onChange={(e) => setPassword({ ...password, nueva: e.target.value })}
                    placeholder="••••••••"
                  />
                  <small className="form-help">Mínimo 6 caracteres</small>
                </div>

                <div className="form-group">
                  <label>Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={password.confirmar}
                    onChange={(e) => setPassword({ ...password, confirmar: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>

                <button 
                  className="btn-primary"
                  onClick={handleCambiarPassword}
                  disabled={saving}
                >
                  {saving ? "Cambiando..." : "Cambiar Contraseña"}
                </button>
              </div>

            </div>
          )}

          {/* SECCIÓN: ENERGÉTICA */}
          {activeSection === "energetica" && (
            <div className="config-section">
              <h2 className="section-title">⚡ Configuración Energética</h2>

              <div className="config-card">
                <h3 className="card-title">Tarifa Eléctrica</h3>
                
                <div className="form-group">
                  <label>Tarifa por kWh (Lempiras)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.tarifa_kwh}
                    onChange={(e) => setConfig({ ...config, tarifa_kwh: parseFloat(e.target.value) || 0 })}
                  />
                  <small className="form-help">Tarifa promedio en Honduras: L 3.70/kWh</small>
                </div>
              </div>

              <div className="config-card">
                <h3 className="card-title">Meta de Consumo</h3>
                
                <div className="form-group">
                  <label>Meta mensual (kWh)</label>
                  <input
                    type="number"
                    min="0"
                    value={config.meta_mensual_kwh}
                    onChange={(e) => setConfig({ ...config, meta_mensual_kwh: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="meta-preview">
                  <div className="meta-preview-label">Equivale a:</div>
                  <div className="meta-preview-value">
                    L {config.meta_mensual_lps.toFixed(2)}/mes
                  </div>
                </div>

                <button 
                  className="btn-primary"
                  onClick={handleGuardarConfigEnergetica}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar Configuración"}
                </button>
              </div>
            </div>
          )}

          {/* SECCIÓN: ACERCA DE */}
          {activeSection === "acerca" && (
            <div className="config-section">
              <h2 className="section-title">ℹ️ Acerca de PowerFlow</h2>

              <div className="config-card about-card">
                <div className="about-logo">
                  <span className="about-icon">⚡</span>
                  <h3>PowerFlow</h3>
                  <p className="about-tagline">Gestión Inteligente de Energía</p>
                </div>

                <div className="about-info">
                  <div className="info-row">
                    <span className="info-label">Versión:</span>
                    <span className="info-value">1.0.0</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Última actualización:</span>
                    <span className="info-value">Diciembre 2024</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Desarrollado por:</span>
                    <span className="info-value">PowerFlow Team</span>
                  </div>
                </div>
              </div>

              <div className="config-card">
                <h3 className="card-title">Enlaces Útiles</h3>
                
                <div className="links-grid">
                  <a href="#" className="link-item">
                    <span className="link-icon">📖</span>
                    <span>Centro de Ayuda</span>
                  </a>
                  <a href="#" className="link-item">
                    <span className="link-icon">📧</span>
                    <span>Contactar Soporte</span>
                  </a>
                  <a href="#" className="link-item">
                    <span className="link-icon">📋</span>
                    <span>Términos y Condiciones</span>
                  </a>
                  <a href="#" className="link-item">
                    <span className="link-icon">🔒</span>
                    <span>Política de Privacidad</span>
                  </a>
                </div>
              </div>

              <div className="config-card">
                <h3 className="card-title">Redes Sociales</h3>
                
                <div className="social-links">
                  <a href="#" className="social-link facebook">
                    <span>📘</span> Facebook
                  </a>
                  <a href="#" className="social-link twitter">
                    <span>🐦</span> Twitter
                  </a>
                  <a href="#" className="social-link instagram">
                    <span>📸</span> Instagram
                  </a>
                </div>
              </div>

              <div className="config-card">
                <p className="copyright">
                  © 2025 PowerFlow. Todos los derechos reservados.
                </p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}