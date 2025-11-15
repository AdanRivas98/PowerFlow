import { useState, useEffect } from "react";
import "../styles/Dispositivos.css";
import DispositivoModal from "./DispositivoModal";

export default function Dispositivos() {
  const [dispositivos, setDispositivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [viewMode, setViewMode] = useState("grid");
  const [editingDevice, setEditingDevice] = useState(null);

  const API_URL = "http://localhost:5000";

  // Categorías disponibles
  const CATEGORIAS = [
    "Todos",
    "Iluminación",
    "Climatización",
    "Electrodomésticos",
    "Electrónica"
  ];

  // Iconos por categoría
  const ICONOS = {
    "Iluminación": "💡",
    "Climatización": "❄️",
    "Electrodomésticos": "🧊",
    "Electrónica": "💻",
    "Otros": "⚡"
  };

  useEffect(() => {
    cargarDispositivos();
  }, []);

  // Cargar dispositivos desde el backend
  const cargarDispositivos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/dispositivos`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Dispositivos cargados:", data);
        
        // Si el backend devuelve un mensaje en lugar de array vacío
        if (Array.isArray(data)) {
          setDispositivos(data);
        } else {
          setDispositivos([]);
        }
      } else {
        console.log("Error al cargar dispositivos, status:", response.status);
        setDispositivos([]);
      }
    } catch (error) {
      console.error("Error al cargar dispositivos:", error);
      setDispositivos([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar dispositivos
  const dispositivosFiltrados = dispositivos.filter(dispositivo => {
    const matchSearch = dispositivo.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === "Todos" || dispositivo.categoria === selectedCategory;
    return matchSearch && matchCategory;
  });

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    const total = dispositivos.length;
    
    // Consumo estimado mensual (en kWh)
    // Asumiendo 6 horas de uso diario promedio
    const consumoMensual = dispositivos.reduce((acc, d) => {
      const watts = d.potencia_watts || 0;
      const consumo = (watts * 6 * 30) / 1000; // kWh
      return acc + consumo;
    }, 0);

    // Costo aproximado (Honduras: ~L 3.70 por kWh promedio)
    const costoMensual = consumoMensual * 3.7;

    return {
      total,
      consumoMensual: consumoMensual.toFixed(2),
      costoMensual: costoMensual.toFixed(2)
    };
  };

  const stats = calcularEstadisticas();

  // Obtener icono por categoría
  const getIcono = (categoria) => {
    return ICONOS[categoria] || ICONOS["Otros"];
  };

  // Calcular consumo mensual de un dispositivo
  const calcularConsumoDispositivo = (potencia) => {
    if (!potencia) return "N/A";
    const consumo = (potencia * 6 * 30) / 1000;
    return consumo.toFixed(2);
  };

  // Abrir modal para agregar
  const handleAgregarClick = () => {
    setEditingDevice(null);
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEditarClick = (dispositivo) => {
    setEditingDevice(dispositivo);
    setShowModal(true);
  };

  // Eliminar dispositivo
  const handleEliminarClick = async (dispositivo) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${dispositivo.nombre}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/dispositivos/${dispositivo.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        console.log("Dispositivo eliminado:", dispositivo.nombre);
        cargarDispositivos(); // Recargar lista
      } else {
        alert("Error al eliminar el dispositivo");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error de conexión al eliminar el dispositivo");
    }
  };

  return (
    <div className="dispositivos-container">
      {/* Header */}
      <div className="dispositivos-header">
        <div>
          <h1>💡 Mis Dispositivos</h1>
          <p>Gestiona y monitorea todos tus dispositivos eléctricos</p>
        </div>
        <button className="btn-primary" onClick={handleAgregarClick}>
          <span>➕</span>
          Agregar Dispositivo
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Dispositivos</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Consumo Estimado Mensual</div>
          <div className="stat-value">
            {stats.consumoMensual}
            <span className="stat-unit">kWh</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Costo Aproximado</div>
          <div className="stat-value">
            L {stats.costoMensual}
            <span className="stat-unit">/mes</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar dispositivos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        
        {CATEGORIAS.map((categoria) => (
          <button
            key={categoria}
            className={`filter-btn ${selectedCategory === categoria ? "active" : ""}`}
            onClick={() => setSelectedCategory(categoria)}
          >
            {categoria}
          </button>
        ))}

        <div style={{ flex: 1 }}></div>

        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Vista en cuadrícula"
          >
            ⊞
          </button>
          <button
            className={`view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
            title="Vista en lista"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando dispositivos...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && dispositivosFiltrados.length === 0 && dispositivos.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">💡</div>
          <h3>No tienes dispositivos registrados</h3>
          <p>Comienza agregando tus dispositivos para monitorear su consumo energético</p>
          <button className="btn-primary" onClick={handleAgregarClick}>
            <span>➕</span>
            Agregar tu primer dispositivo
          </button>
        </div>
      )}

      {/* No Results */}
      {!loading && dispositivosFiltrados.length === 0 && dispositivos.length > 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No se encontraron dispositivos</h3>
          <p>Intenta con otra búsqueda o categoría</p>
        </div>
      )}

      {/* Devices Grid/List */}
      {!loading && dispositivosFiltrados.length > 0 && (
        <div className={`devices-${viewMode}`}>
          {dispositivosFiltrados.map((dispositivo) => (
            <div key={dispositivo.id} className="device-card">
              <div className="device-header">
                <div className="device-icon">
                  {getIcono(dispositivo.categoria)}
                </div>
                <div className="device-actions">
                  <button
                    className="icon-btn"
                    onClick={() => handleEditarClick(dispositivo)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn delete"
                    onClick={() => handleEliminarClick(dispositivo)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="device-name">{dispositivo.nombre}</div>
              
              {dispositivo.categoria && (
                <span className="device-category">{dispositivo.categoria}</span>
              )}

              <div className="device-info">
                <div className="info-row">
                  <span className="info-label">Potencia</span>
                  <span className="info-value">
                    {dispositivo.potencia_watts ? `${dispositivo.potencia_watts} W` : "No especificada"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Uso diario estimado</span>
                  <span className="info-value">6 horas</span>
                </div>
              </div>

              {dispositivo.potencia_watts && (
                <div className="consumption-estimate">
                  <div className="estimate-label">Consumo mensual estimado</div>
                  <div className="estimate-value">
                    {calcularConsumoDispositivo(dispositivo.potencia_watts)} kWh
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal - Por ahora solo placeholder */}
      {showModal && (
  <DispositivoModal
    showModal={showModal}
    onClose={() => setShowModal(false)}
    onSave={cargarDispositivos} // Recargar la lista después de guardar
    editingDevice={editingDevice}
  />
)}
    </div>
  );
}