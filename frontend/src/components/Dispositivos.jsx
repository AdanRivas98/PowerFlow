import { useState, useEffect, useRef } from "react";
import "../styles/Dispositivos.css";
import DispositivoModal from "./DispositivoModal";

export default function Dispositivos({ dispositivoIdParaEditar }) {
  const [dispositivos, setDispositivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [viewMode, setViewMode] = useState("grid");
  const [editingDevice, setEditingDevice] = useState(null);
  const [registrosMensuales, setRegistrosMensuales] = useState({});
  
  // Ref para controlar que el modal solo se abra una vez desde notificaciones
  const modalAbiertoRef = useRef(false);

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

  // Efecto para abrir el modal cuando viene desde notificaciones
  useEffect(() => {
    if (dispositivoIdParaEditar && dispositivos.length > 0 && !modalAbiertoRef.current) {
      const dispositivo = dispositivos.find(d => d.id === dispositivoIdParaEditar);
      if (dispositivo) {
        handleEditarClick(dispositivo);
        modalAbiertoRef.current = true;
      }
    }
  }, [dispositivoIdParaEditar, dispositivos]);

  // Resetear el ref cuando se cierra el modal o se limpia dispositivoIdParaEditar
  useEffect(() => {
    if (!dispositivoIdParaEditar) {
      modalAbiertoRef.current = false;
    }
  }, [dispositivoIdParaEditar]);

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
        
        if (Array.isArray(data)) {
          setDispositivos(data);
          // Cargar registros mensuales para cada dispositivo
          await cargarRegistrosTodos(data);
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

  // Cargar registros mensuales para todos los dispositivos
  const cargarRegistrosTodos = async (listaDispositivos) => {
    const token = localStorage.getItem("token");
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();

    const registrosTemp = {};

    for (const dispositivo of listaDispositivos) {
      try {
        const response = await fetch(
          `${API_URL}/api/dispositivos/${dispositivo.id}/registros?mes=${mes}&anio=${anio}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          registrosTemp[dispositivo.id] = {
            diasRegistrados: data.resumen?.dias_registrados || 0,
            totalHoras: data.resumen?.total_horas || 0,
            consumoKwh: data.resumen?.consumo_kwh || 0,
            costoEstimado: data.resumen?.costo_estimado || 0
          };
        } else {
          registrosTemp[dispositivo.id] = {
            diasRegistrados: 0,
            totalHoras: 0,
            consumoKwh: 0,
            costoEstimado: 0
          };
        }
      } catch (error) {
        console.error(`Error al cargar registros del dispositivo ${dispositivo.id}:`, error);
        registrosTemp[dispositivo.id] = {
          diasRegistrados: 0,
          totalHoras: 0,
          consumoKwh: 0,
          costoEstimado: 0
        };
      }
    }

    setRegistrosMensuales(registrosTemp);
  };

  // Filtrar dispositivos
  const dispositivosFiltrados = dispositivos.filter(dispositivo => {
    const matchSearch = dispositivo.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === "Todos" || dispositivo.categoria === selectedCategory;
    return matchSearch && matchCategory;
  });

  // Calcular estadísticas globales
  const calcularEstadisticas = () => {
    const total = dispositivos.length;
    
    // Sumar consumo real de todos los dispositivos (basado en registros)
    let consumoMensualReal = 0;
    let costoMensualReal = 0;

    Object.values(registrosMensuales).forEach(registro => {
      consumoMensualReal += registro.consumoKwh || 0;
      costoMensualReal += registro.costoEstimado || 0;
    });

    return {
      total,
      consumoMensual: consumoMensualReal.toFixed(2),
      costoMensual: costoMensualReal.toFixed(2)
    };
  };

  const stats = calcularEstadisticas();

  // Obtener icono por categoría
  const getIcono = (categoria) => {
    return ICONOS[categoria] || ICONOS["Otros"];
  };

  // Obtener datos de registro de un dispositivo
  const getRegistroDispositivo = (dispositivoId) => {
    return registrosMensuales[dispositivoId] || {
      diasRegistrados: 0,
      totalHoras: 0,
      consumoKwh: 0,
      costoEstimado: 0
    };
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
        cargarDispositivos();
      } else {
        alert("Error al eliminar el dispositivo");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error de conexión al eliminar el dispositivo");
    }
  };

  // Obtener nombre del mes actual
  const getNombreMesActual = () => {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return meses[new Date().getMonth()];
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
          <div className="stat-label">Consumo Real - {getNombreMesActual()}</div>
          <div className="stat-value">
            {stats.consumoMensual}
            <span className="stat-unit">kWh</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Costo del Mes</div>
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
          {dispositivosFiltrados.map((dispositivo) => {
            const registro = getRegistroDispositivo(dispositivo.id);
            
            return (
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
                    <span className="info-label">Horas/día</span>
                    <span className="info-value">
                      {dispositivo.horas_uso_dia || 6} horas
                    </span>
                  </div>
                  <div className="info-row highlight">
                    <span className="info-label">📅 Días registrados</span>
                    <span className="info-value days">
                      {registro.diasRegistrados} días
                    </span>
                  </div>
                </div>

                {/* Consumo mensual basado en registros reales */}
                <div className="consumption-estimate">
                  <div className="estimate-label">Consumo mensual estimado</div>
                  <div className="estimate-value">
                    {registro.consumoKwh > 0 
                      ? `${registro.consumoKwh} kWh` 
                      : (dispositivo.potencia_watts 
                          ? `${((dispositivo.potencia_watts * (dispositivo.horas_uso_dia || 6) * 30) / 1000).toFixed(2)} kWh`
                          : "N/A"
                        )
                    }
                  </div>
                  {registro.costoEstimado > 0 && (
                    <div className="estimate-cost">
                      Costo: L {registro.costoEstimado}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <DispositivoModal
          showModal={showModal}
          onClose={() => setShowModal(false)}
          onSave={cargarDispositivos}
          editingDevice={editingDevice}
        />
      )}
    </div>
  );
}