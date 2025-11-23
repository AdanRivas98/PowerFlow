import { useState, useEffect } from "react";
import "../styles/Notificaciones.css";

export default function Notificaciones({ onNavigateToDevice }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    hoy: 0,
    pendientes: 0
  });

  const API_URL = "http://localhost:5000";

  useEffect(() => {
    cargarNotificaciones();
    marcarComoVistas();
  }, []);

  // Cargar notificaciones desde el backend
  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/notificaciones/dispositivos-sin-registro`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Notificaciones cargadas:", data);
        
        if (data.dispositivos && Array.isArray(data.dispositivos)) {
          const notificacionesFormateadas = data.dispositivos.map(d => ({
            id: d.id,
            tipo: "sin_registro",
            titulo: "Dispositivo sin registro",
            mensaje: d.mensaje,
            dispositivo: d.nombre,
            categoria: d.categoria,
            fecha: data.fecha,
            leida: false
          }));

          setNotificaciones(notificacionesFormateadas);
          
          setStats({
            total: notificacionesFormateadas.length,
            hoy: notificacionesFormateadas.length,
            pendientes: notificacionesFormateadas.length
          });
        } else {
          setNotificaciones([]);
          setStats({ total: 0, hoy: 0, pendientes: 0 });
        }
      } else {
        console.error("Error al cargar notificaciones:", response.status);
        setNotificaciones([]);
        setStats({ total: 0, hoy: 0, pendientes: 0 });
      }
    } catch (error) {
      console.error("Error de conexión al cargar notificaciones:", error);
      setNotificaciones([]);
      setStats({ total: 0, hoy: 0, pendientes: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificaciones como vistas (para que no aparezca el badge la próxima vez)
  const marcarComoVistas = () => {
    const hoy = new Date().toISOString().split('T')[0];
    const ultimaVisita = localStorage.getItem("ultima_visita_notificaciones");
    
    if (ultimaVisita !== hoy) {
      localStorage.setItem("ultima_visita_notificaciones", hoy);
      // También limpiamos el contador
      localStorage.setItem("notificaciones_pendientes", "0");
    }
  };

  // Obtener icono según categoría
  const getIconoCategoria = (categoria) => {
    const iconos = {
      "Iluminación": "💡",
      "Climatización": "❄️",
      "Electrodomésticos": "🧊",
      "Electrónica": "💻",
      "Otros": "⚡"
    };
    return iconos[categoria] || "⚡";
  };

  // Formatear fecha
  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr + "T00:00:00");
    const hoy = new Date();
    
    if (fecha.toDateString() === hoy.toDateString()) {
      return "Hoy";
    }
    
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    
    if (fecha.toDateString() === ayer.toDateString()) {
      return "Ayer";
    }
    
    return fecha.toLocaleDateString('es-HN', { 
      day: 'numeric', 
      month: 'short',
      year: fecha.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined
    });
  };

  // Ir al dispositivo
  const irADispositivo = (notificacion) => {
    if (onNavigateToDevice) {
      onNavigateToDevice(notificacion.id);
    }
  };

  // Marcar como "No lo usé hoy" - Solo remueve la notificación sin registrar
  const marcarComoNoUsado = (notificacion) => {
    // Simplemente remover la notificación de la lista (no registrar en backend)
    const notificacionesActualizadas = notificaciones.filter(n => n.id !== notificacion.id);
    setNotificaciones(notificacionesActualizadas);
    setStats(prev => ({
      ...prev,
      total: notificacionesActualizadas.length,
      hoy: notificacionesActualizadas.length,
      pendientes: notificacionesActualizadas.length
    }));
  };

  // Marcar todas como leídas
  const marcarTodasLeidas = () => {
    const notificacionesActualizadas = notificaciones.map(n => ({
      ...n,
      leida: true
    }));
    setNotificaciones(notificacionesActualizadas);
    setStats(prev => ({ ...prev, pendientes: 0 }));
  };

  return (
    <div className="notificaciones-container">
      {/* Header */}
      <div className="notificaciones-header">
        <div>
          <h1>🔔 Notificaciones</h1>
          <p>Mantén el control de tus dispositivos</p>
        </div>
        {notificaciones.length > 0 && (
          <button className="btn-marcar-leidas" onClick={marcarTodasLeidas}>
            ✓ Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="notificaciones-stats">
        <div className="stat-item">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item highlight">
          <span className="stat-number">{stats.hoy}</span>
          <span className="stat-label">Hoy</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.pendientes}</span>
          <span className="stat-label">Pendientes</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando notificaciones...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && notificaciones.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>¡Todo al día!</h3>
          <p>No tienes notificaciones pendientes. Has registrado el uso de todos tus dispositivos.</p>
        </div>
      )}

      {/* Lista de Notificaciones */}
      {!loading && notificaciones.length > 0 && (
        <div className="notificaciones-list">
          {notificaciones.map((notificacion) => (
            <div 
              key={notificacion.id} 
              className={`notificacion-card ${notificacion.leida ? 'leida' : ''}`}
            >
              <div className="notificacion-icon">
                {getIconoCategoria(notificacion.categoria)}
              </div>
              
              <div className="notificacion-content">
                <div className="notificacion-header-card">
                  <h3>{notificacion.titulo}</h3>
                  <span className="notificacion-fecha">
                    {formatearFecha(notificacion.fecha)}
                  </span>
                </div>
                
                <p className="notificacion-mensaje">{notificacion.mensaje}</p>
                
                <div className="notificacion-footer">
                  <span className="notificacion-dispositivo">
                    📱 {notificacion.dispositivo}
                  </span>
                  <div className="notificacion-buttons">
                    <button 
                      className="btn-action primary"
                      onClick={() => irADispositivo(notificacion)}
                    >
                      Registrar ahora →
                    </button>
                    <button 
                      className="btn-action secondary"
                      onClick={() => marcarComoNoUsado(notificacion)}
                      title="Descartar esta notificación"
                    >
                      ✗ Descartar
                    </button>
                  </div>
                </div>
              </div>
              
              {!notificacion.leida && (
                <div className="notificacion-badge">●</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info adicional */}
      {!loading && notificaciones.length > 0 && (
        <div className="notificaciones-info">
          <div className="info-card">
            <span className="info-icon">💡</span>
            <div className="info-text">
              <strong>Consejo:</strong> Registra el uso de tus dispositivos diariamente para obtener estadísticas más precisas de tu consumo energético.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}