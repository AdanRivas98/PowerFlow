import { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import "../styles/Consumo.css";

export default function Consumo() {
  const [periodo, setPeriodo] = useState("mes");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const API_URL = "http://localhost:5000";

  useEffect(() => {
    cargarDatosConsumo();
  }, [periodo]);

  // CARGAR DATOS DEL BACKEND
  const cargarDatosConsumo = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      
      // Construir URL con parámetros
      const params = new URLSearchParams({ periodo });
      const url = `${API_URL}/api/consumo/resumen?${params}`;
      
      console.log("Cargando consumo:", url);
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Datos de consumo recibidos:", data);
        
        // Si no hay comparación, crear una por defecto
        if (!data.comparacion_periodo_anterior) {
          data.comparacion_periodo_anterior = {
            diferencia_kwh: 0,
            diferencia_porcentaje: 0,
            direccion: "igual"
          };
        }
        
        setStats(data);
      } else if (response.status === 404) {
        console.warn("Endpoint de consumo no encontrado");
        // Usar datos de ejemplo si el endpoint no existe
        setStats(generarDatosEjemplo());
      } else {
        console.error("Error al cargar consumo:", response.status);
        setStats(generarDatosEjemplo());
      }
    } catch (error) {
      console.error("Error de red al cargar consumo:", error);
      // Usar datos de ejemplo en caso de error
      setStats(generarDatosEjemplo());
    } finally {
      setLoading(false);
    }
  };
  
  // Función auxiliar para generar datos de ejemplo (fallback)
  const generarDatosEjemplo = () => {
    return {
      consumo_total_kwh: 0,
      costo_total: 0,
      promedio_diario: 0,
      dias_registrados: 0,
      dia_mas_alto: null,
      comparacion_periodo_anterior: {
        diferencia_kwh: 0,
        diferencia_porcentaje: 0,
        direccion: "igual"
      },
      tendencia_diaria: [],
      por_dispositivo: [],
      por_categoria: []
    };
  };

  // Colores para categorías
  const COLORES_CATEGORIAS = {
    "Climatización": "#0078FF",
    "Electrodomésticos": "#A6FF00",
    "Electrónica": "#FF6B6B",
    "Iluminación": "#FFD93D"
  };

  // Iconos por categoría
  const ICONOS_CATEGORIAS = {
    "Climatización": "❄️",
    "Electrodomésticos": "🧊",
    "Electrónica": "💻",
    "Iluminación": "💡"
  };

  // Custom Tooltip para los gráficos
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">
            <strong>{payload[0].value} kWh</strong>
          </p>
          <p className="tooltip-cost">
            ≈ L {(payload[0].value * 3.7).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip para gráfico de pie
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{payload[0].name}</p>
          <p className="tooltip-value">
            <strong>{payload[0].value} kWh</strong>
          </p>
          <p className="tooltip-percentage">
            {payload[0].payload.porcentaje}% del total
          </p>
        </div>
      );
    }
    return null;
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-HN', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="consumo-loading">
        <div className="spinner"></div>
        <p>Cargando datos de consumo...</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Empty state cuando no hay datos
  const sinDatos = stats.consumo_total_kwh === 0 && stats.por_dispositivo.length === 0;

  return (
    <div className="consumo-container">
      {/* Header con filtros */}
      <div className="consumo-header">
        <div>
          <h1>📊 Consumo Energético</h1>
          <p>Visualiza y analiza tu consumo eléctrico</p>
        </div>
        
        <div className="periodo-selector">
          <button 
            className={`periodo-btn ${periodo === "dia" ? "active" : ""}`}
            onClick={() => setPeriodo("dia")}
          >
            Hoy
          </button>
          <button 
            className={`periodo-btn ${periodo === "semana" ? "active" : ""}`}
            onClick={() => setPeriodo("semana")}
          >
            Esta Semana
          </button>
          <button 
            className={`periodo-btn ${periodo === "mes" ? "active" : ""}`}
            onClick={() => setPeriodo("mes")}
          >
            Este Mes
          </button>
          <button 
            className={`periodo-btn ${periodo === "anio" ? "active" : ""}`}
            onClick={() => setPeriodo("anio")}
          >
            Año
          </button>
        </div>
      </div>

      {/* Mostrar empty state si no hay datos */}
      {sinDatos ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No hay datos de consumo para este período</h3>
          <p>
            Para ver estadísticas, necesitas registrar el uso de tus dispositivos.
            Ve a la sección de <strong>Notificaciones</strong> para registrar los días de uso.
          </p>
        </div>
      ) : (
        <>
          {/* Contenido normal cuando hay datos */}
      <div className="metricas-grid">
        <div className="metrica-card primary">
          <div className="metrica-icon">⚡</div>
          <div className="metrica-content">
            <span className="metrica-label">Consumo Total</span>
            <span className="metrica-valor">{stats.consumo_total_kwh || 0}</span>
            <span className="metrica-unidad">kWh</span>
          </div>
          {stats.comparacion_periodo_anterior && stats.comparacion_periodo_anterior.diferencia_porcentaje > 0 && (
            <div className={`metrica-cambio ${stats.comparacion_periodo_anterior.direccion}`}>
              {stats.comparacion_periodo_anterior.direccion === "aumento" ? "↑" : "↓"} 
              {stats.comparacion_periodo_anterior.diferencia_porcentaje}% vs mes anterior
            </div>
          )}
        </div>

        <div className="metrica-card">
          <div className="metrica-icon">💰</div>
          <div className="metrica-content">
            <span className="metrica-label">Costo Total</span>
            <span className="metrica-valor">L {(stats.costo_total || 0).toFixed(2)}</span>
          </div>
          {stats.comparacion_periodo_anterior && stats.comparacion_periodo_anterior.diferencia_kwh > 0 && (
            <div className={`metrica-cambio ${stats.comparacion_periodo_anterior.direccion}`}>
              {stats.comparacion_periodo_anterior.direccion === "aumento" ? "↑" : "↓"} 
              L {(stats.comparacion_periodo_anterior.diferencia_kwh * 3.7).toFixed(2)}
            </div>
          )}
        </div>

        <div className="metrica-card">
          <div className="metrica-icon">📅</div>
          <div className="metrica-content">
            <span className="metrica-label">Promedio Diario</span>
            <span className="metrica-valor">{(stats.promedio_diario || 0).toFixed(2)}</span>
            <span className="metrica-unidad">kWh/día</span>
          </div>
          <div className="metrica-info">
            ≈ L {((stats.promedio_diario || 0) * 3.7).toFixed(2)}/día
          </div>
        </div>

        <div className="metrica-card highlight">
          <div className="metrica-icon">🔥</div>
          <div className="metrica-content">
            <span className="metrica-label">Día Más Alto</span>
            {stats.dia_mas_alto ? (
              <>
                <span className="metrica-valor">{stats.dia_mas_alto.consumo_kwh}</span>
                <span className="metrica-unidad">kWh</span>
              </>
            ) : (
              <span className="metrica-valor">0</span>
            )}
          </div>
          {stats.dia_mas_alto && (
            <div className="metrica-info">
              {formatearFecha(stats.dia_mas_alto.fecha)} - L {stats.dia_mas_alto.costo.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Tendencia */}
      <div className="chart-section">
        <div className="section-header">
          <h2>📈 Tendencia de Consumo</h2>
          <span className="section-subtitle">Últimos 30 días</span>
        </div>
        
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.tendencia_diaria}>
              <defs>
                <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0078FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0078FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
              <XAxis 
                dataKey="fecha" 
                stroke="#666"
                tick={{ fill: '#999', fontSize: 12 }}
              />
              <YAxis 
                stroke="#666"
                tick={{ fill: '#999', fontSize: 12 }}
                label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#999' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="consumo" 
                stroke="#0078FF" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorConsumo)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid de 2 columnas: Top Consumidores y Distribución */}
      <div className="charts-grid">
        {/* Top Consumidores */}
        <div className="chart-section">
          <div className="section-header">
            <h2>🏆 Top Consumidores</h2>
            <span className="section-subtitle">Este mes</span>
          </div>
          
          <div className="top-dispositivos">
            {stats.por_dispositivo.map((dispositivo, index) => (
              <div key={dispositivo.id} className="dispositivo-item">
                <div className="dispositivo-rank">#{index + 1}</div>
                <div className="dispositivo-info">
                  <div className="dispositivo-nombre">
                    <span className="dispositivo-icon">
                      {ICONOS_CATEGORIAS[dispositivo.categoria]}
                    </span>
                    {dispositivo.nombre}
                  </div>
                  <div className="dispositivo-categoria">{dispositivo.categoria}</div>
                </div>
                <div className="dispositivo-consumo">
                  <span className="consumo-valor">{dispositivo.consumo_kwh} kWh</span>
                  <span className="consumo-costo">L {dispositivo.costo.toFixed(2)}</span>
                </div>
                <div className="dispositivo-barra-container">
                  <div 
                    className="dispositivo-barra"
                    style={{ 
                      width: `${dispositivo.porcentaje}%`,
                      backgroundColor: COLORES_CATEGORIAS[dispositivo.categoria]
                    }}
                  ></div>
                  <span className="dispositivo-porcentaje">{dispositivo.porcentaje}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución por Categoría */}
        <div className="chart-section">
          <div className="section-header">
            <h2>🎯 Distribución por Categoría</h2>
            <span className="section-subtitle">Este mes</span>
          </div>
          
          <div className="pie-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.por_categoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.porcentaje}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="valor"
                  nameKey="nombre"
                >
                  {stats.por_categoria.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORES_CATEGORIAS[entry.nombre]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="pie-legend">
              {stats.por_categoria.map((cat) => (
                <div key={cat.nombre} className="legend-item">
                  <div 
                    className="legend-color"
                    style={{ backgroundColor: COLORES_CATEGORIAS[cat.nombre] }}
                  ></div>
                  <span className="legend-nombre">
                    {ICONOS_CATEGORIAS[cat.nombre]} {cat.nombre}
                  </span>
                  <span className="legend-valor">{cat.valor} kWh</span>
                  <span className="legend-porcentaje">{cat.porcentaje}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Consejos y Insights */}
      <div className="insights-section">
        <div className="insight-card tip">
          <div className="insight-icon">💡</div>
          <div className="insight-content">
            <h3>Consejo del Mes</h3>
            <p>
              Tu aire acondicionado representa el <strong>51%</strong> de tu consumo. 
              Considera usar ventiladores o ajustar la temperatura 2°C más alta para ahorrar hasta <strong>L 100/mes</strong>.
            </p>
          </div>
        </div>

        <div className="insight-card achievement">
          <div className="insight-icon">🎉</div>
          <div className="insight-content">
            <h3>¡Buen Trabajo!</h3>
            <p>
              Has mejorado tu eficiencia energética. Tu promedio diario bajó de <strong>9.2 kWh</strong> a <strong>8.2 kWh</strong>. 
              ¡Sigue así!
            </p>
          </div>
        </div>

        <div className="insight-card warning">
          <div className="insight-icon">⚠️</div>
          <div className="insight-content">
            <h3>Atención</h3>
            <p>
              El consumo aumentó <strong>12%</strong> este mes. Revisa si hay dispositivos que estén quedando encendidos más tiempo de lo necesario.
            </p>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}