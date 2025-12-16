import { useState, useEffect } from "react";
import "../styles/Reportes.css";
import { 
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Reportes() {
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [datosReporte, setDatosReporte] = useState(null);
  const [filtros, setFiltros] = useState({
    periodo: "mes",
    tipo: "completo",
    mesSeleccionado: new Date().getMonth() + 1,
    anioSeleccionado: new Date().getFullYear()
  });
  const [aniosDisponibles, setAniosDisponibles] = useState([]);

  const API_URL = "http://localhost:5000";

  const COLORES_CATEGORIAS = {
    "Climatización": "#0078FF",
    "Electrodomésticos": "#A6FF00",
    "Electrónica": "#FF6B6B",
    "Iluminación": "#FFD93D",
    "Otros": "#9CA3AF"
  };

  const ICONOS_CATEGORIAS = {
    "Climatización": "❄️",
    "Electrodomésticos": "🧊",
    "Electrónica": "💻",
    "Iluminación": "💡",
    "Otros": "⚡"
  };

  const MESES = [
    { valor: 1, nombre: "Enero" },
    { valor: 2, nombre: "Febrero" },
    { valor: 3, nombre: "Marzo" },
    { valor: 4, nombre: "Abril" },
    { valor: 5, nombre: "Mayo" },
    { valor: 6, nombre: "Junio" },
    { valor: 7, nombre: "Julio" },
    { valor: 8, nombre: "Agosto" },
    { valor: 9, nombre: "Septiembre" },
    { valor: 10, nombre: "Octubre" },
    { valor: 11, nombre: "Noviembre" },
    { valor: 12, nombre: "Diciembre" }
  ];

  useEffect(() => {
    cargarAniosDisponibles();
  }, []);

  const cargarAniosDisponibles = async () => {
    try {
      const anioActual = new Date().getFullYear();
      const anios = [];
      
      for (let anio = 2024; anio <= anioActual; anio++) {
        anios.push(anio);
      }
      
      setAniosDisponibles(anios);
    } catch (error) {
      console.error("Error al cargar años:", error);
      setAniosDisponibles([new Date().getFullYear()]);
    }
  };

  const generarReporte = async () => {
    setGenerando(true);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      let params = new URLSearchParams();
      
      if (filtros.periodo === "mes") {
        params.append("periodo", "mes");
        params.append("mes", filtros.mesSeleccionado);
        params.append("anio", filtros.anioSeleccionado);
      } else if (filtros.periodo === "anio") {
        params.append("periodo", "anio");
        params.append("anio", filtros.anioSeleccionado);
      } else {
        params.append("periodo", filtros.periodo);
      }
      
      const response = await fetch(`${API_URL}/api/consumo/resumen?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const datos = await response.json();
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        datos.usuario = usuario;
        datos.fecha_generacion = new Date().toLocaleString('es-HN');
        
        if (filtros.periodo === "mes") {
          const mesNombre = MESES.find(m => m.valor === filtros.mesSeleccionado)?.nombre;
          datos.periodo_descripcion = `${mesNombre} ${filtros.anioSeleccionado}`;
        } else if (filtros.periodo === "anio") {
          datos.periodo_descripcion = `Año ${filtros.anioSeleccionado}`;
        } else if (filtros.periodo === "dia") {
          datos.periodo_descripcion = "Hoy";
        } 
        setDatosReporte(datos);
      } else {
        alert("Error al generar el reporte");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión al generar el reporte");
    } finally {
      setLoading(false);
      setGenerando(false);
    }
  };

  const descargarPDF = () => {
    window.print();
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toLocaleDateString('es-HN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="reporte-tooltip">
          <p className="tooltip-fecha">{payload[0].payload.fecha}</p>
          <p className="tooltip-valor">
            <strong>{payload[0].value} kWh</strong>
          </p>
          {payload[0].payload.costo && (
            <p className="tooltip-costo">L {payload[0].payload.costo}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="reportes-container">
      <div className="reportes-header no-print">
        <div>
          <h1>📊 Reportes</h1>
          <p>Genera reportes personalizados de tu consumo energético</p>
        </div>
      </div>

      <div className="filtros-panel no-print">
        <h3>🔍 Configuración del Reporte</h3>
        
        <div className="filtros-grid">
          <div className="filtro-grupo">
            <label>Período</label>
            <select 
              value={filtros.periodo}
              onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
            >
              <option value="dia">Hoy</option>
              <option value="mes">Mes</option>
              <option value="anio">Año</option>
            </select>
          </div>

          {filtros.periodo === "mes" && (
            <div className="filtro-grupo">
              <label>Seleccionar Mes</label>
              <select 
                value={filtros.mesSeleccionado}
                onChange={(e) => setFiltros({...filtros, mesSeleccionado: parseInt(e.target.value)})}
              >
                {MESES.map((mes) => (
                  <option key={mes.valor} value={mes.valor}>{mes.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {(filtros.periodo === "mes" || filtros.periodo === "anio") && (
            <div className="filtro-grupo">
              <label>Seleccionar Año</label>
              <select 
                value={filtros.anioSeleccionado}
                onChange={(e) => setFiltros({...filtros, anioSeleccionado: parseInt(e.target.value)})}
              >
                {aniosDisponibles.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>
          )}

        </div>

        <div className="acciones-reporte">
          <button 
            className="btn-generar"
            onClick={generarReporte}
            disabled={generando}
          >
            {generando ? <>🔄 Generando...</> : <>📄 Generar Reporte</>}
          </button>

          {datosReporte && (
            <>
              <button className="btn-pdf" onClick={descargarPDF}>
                📥 Descargar PDF
              </button>
              <button className="btn-imprimir" onClick={() => window.print()}>
                🖨️ Imprimir
              </button>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="reportes-loading">
          <div className="spinner"></div>
          <p>Generando reporte...</p>
        </div>
      )}

      {datosReporte && !loading && (
        <div className="reporte-vista-previa" id="reporte-contenido">
          <div className="reporte-portada">
            <div className="logo-reporte">⚡ PowerFlow</div>
            <h1 className="titulo-reporte">Reporte de Consumo Energético</h1>
            
            <div className="info-reporte">
              <div className="info-item">
                <span className="info-label">Usuario:</span>
                <span className="info-valor">{datosReporte.usuario?.nombre}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Período:</span>
                <span className="info-valor">
                  {datosReporte.periodo_descripcion || 
                   `${formatearFecha(datosReporte.inicio)} - ${formatearFecha(datosReporte.fin)}`}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Generado:</span>
                <span className="info-valor">{datosReporte.fecha_generacion}</span>
              </div>
            </div>
          </div>

          <section className="reporte-seccion">
            <h2 className="seccion-titulo">📋 Resumen Ejecutivo</h2>
            
            <div className="resumen-grid">
              <div className="resumen-card primary">
                <div className="resumen-icono">⚡</div>
                <div className="resumen-info">
                  <span className="resumen-label">Consumo Total</span>
                  <span className="resumen-valor">{datosReporte.consumo_total_kwh || 0}</span>
                  <span className="resumen-unidad">kWh</span>
                </div>
              </div>

              <div className="resumen-card">
                <div className="resumen-icono">💰</div>
                <div className="resumen-info">
                  <span className="resumen-label">Costo Total</span>
                  <span className="resumen-valor">L {(datosReporte.costo_total || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="resumen-card">
                <div className="resumen-icono">📅</div>
                <div className="resumen-info">
                  <span className="resumen-label">Promedio Diario</span>
                  <span className="resumen-valor">{(datosReporte.promedio_diario || 0).toFixed(2)}</span>
                  <span className="resumen-unidad">kWh/día</span>
                </div>
              </div>

              <div className="resumen-card">
                <div className="resumen-icono">📊</div>
                <div className="resumen-info">
                  <span className="resumen-label">Días Registrados</span>
                  <span className="resumen-valor">{datosReporte.dias_registrados || 0}</span>
                  <span className="resumen-unidad">días</span>
                </div>
              </div>
            </div>

            {datosReporte.comparacion_periodo_anterior && 
             datosReporte.comparacion_periodo_anterior.diferencia_porcentaje > 0 && (
              <div className={`comparacion-box ${datosReporte.comparacion_periodo_anterior.direccion}`}>
                <span className="comparacion-icono">
                  {datosReporte.comparacion_periodo_anterior.direccion === "aumento" ? "📈" : "📉"}
                </span>
                <span className="comparacion-texto">
                  {datosReporte.comparacion_periodo_anterior.direccion === "aumento" ? "Aumento" : "Disminución"} 
                  {" "}de <strong>{datosReporte.comparacion_periodo_anterior.diferencia_porcentaje}%</strong>
                  {" "}({datosReporte.comparacion_periodo_anterior.diferencia_kwh} kWh) 
                  vs período anterior
                </span>
              </div>
            )}
          </section>

          {datosReporte.tendencia_diaria && datosReporte.tendencia_diaria.length > 0 && (
            <section className="reporte-seccion">
              <h2 className="seccion-titulo">📈 Tendencia de Consumo</h2>
              
              <div className="grafico-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={datosReporte.tendencia_diaria}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                    <XAxis 
                      dataKey="fecha" 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#666"
                      label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fill: '#666' } }}
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="consumo" 
                      stroke="#0078FF" 
                      strokeWidth={3}
                      dot={{ fill: '#0078FF', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {datosReporte.por_dispositivo && datosReporte.por_dispositivo.length > 0 && (
            <section className="reporte-seccion">
              <h2 className="seccion-titulo">🏆 Top 5 Consumidores</h2>
              
              <div className="tabla-dispositivos">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Dispositivo</th>
                      <th>Categoría</th>
                      <th>Consumo (kWh)</th>
                      <th>Costo (L)</th>
                      <th>% del Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosReporte.por_dispositivo.slice(0, 5).map((dispositivo, index) => (
                      <tr key={dispositivo.id}>
                        <td className="rank">#{index + 1}</td>
                        <td className="dispositivo-nombre">
                          <span className="dispositivo-icono">
                            {ICONOS_CATEGORIAS[dispositivo.categoria] || "⚡"}
                          </span>
                          {dispositivo.nombre}
                        </td>
                        <td>{dispositivo.categoria}</td>
                        <td className="valor-consumo">{dispositivo.consumo_kwh}</td>
                        <td className="valor-costo">L {dispositivo.costo.toFixed(2)}</td>
                        <td>
                          <div className="porcentaje-bar">
                            <div 
                              className="porcentaje-fill"
                              style={{ 
                                width: `${dispositivo.porcentaje}%`,
                                backgroundColor: COLORES_CATEGORIAS[dispositivo.categoria]
                              }}
                            ></div>
                            <span className="porcentaje-texto">{dispositivo.porcentaje}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {datosReporte.por_categoria && datosReporte.por_categoria.length > 0 && (
            <section className="reporte-seccion">
              <h2 className="seccion-titulo">🎯 Distribución por Categoría</h2>
              
              <div className="distribucion-container">
                <div className="grafico-pie">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={datosReporte.por_categoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.porcentaje}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="valor"
                      >
                        {datosReporte.por_categoria.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORES_CATEGORIAS[entry.nombre] || "#9CA3AF"} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="leyenda-categorias">
                  {datosReporte.por_categoria.map((cat) => (
                    <div key={cat.nombre} className="leyenda-item">
                      <div 
                        className="leyenda-color"
                        style={{ backgroundColor: COLORES_CATEGORIAS[cat.nombre] }}
                      ></div>
                      <div className="leyenda-info">
                        <span className="leyenda-nombre">
                          {ICONOS_CATEGORIAS[cat.nombre]} {cat.nombre}
                        </span>
                        <span className="leyenda-valor">{cat.valor} kWh ({cat.porcentaje}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="reporte-seccion">
            <h2 className="seccion-titulo">💡 Recomendaciones</h2>
            
            <div className="recomendaciones-grid">
              {datosReporte.por_dispositivo && datosReporte.por_dispositivo.length > 0 && (
                <div className="recomendacion-card tip">
                  <div className="recomendacion-icono">💡</div>
                  <div className="recomendacion-contenido">
                    <h4>Dispositivo con Mayor Consumo</h4>
                    <p>
                      Tu <strong>{datosReporte.por_dispositivo[0].nombre}</strong> representa 
                      el <strong>{datosReporte.por_dispositivo[0].porcentaje}%</strong> del consumo total.
                      Considera optimizar su uso o programar horarios de funcionamiento.
                    </p>
                  </div>
                </div>
              )}

              {datosReporte.comparacion_periodo_anterior && 
               datosReporte.comparacion_periodo_anterior.direccion === "aumento" && (
                <div className="recomendacion-card warning">
                  <div className="recomendacion-icono">⚠️</div>
                  <div className="recomendacion-contenido">
                    <h4>Incremento Detectado</h4>
                    <p>
                      Tu consumo aumentó <strong>{datosReporte.comparacion_periodo_anterior.diferencia_porcentaje}%</strong> 
                      {" "}respecto al período anterior. 
                      Revisa si agregaste nuevos dispositivos o aumentaste las horas de uso.
                    </p>
                  </div>
                </div>
              )}

              {datosReporte.promedio_diario > 0 && (
                <div className="recomendacion-card achievement">
                  <div className="recomendacion-icono">🎯</div>
                  <div className="recomendacion-contenido">
                    <h4>Meta Sugerida</h4>
                    <p>
                      Tu consumo promedio es <strong>{datosReporte.promedio_diario.toFixed(2)} kWh/día</strong>.
                      {" "}Intenta reducirlo a {(datosReporte.promedio_diario * 0.9).toFixed(2)} kWh/día 
                      para ahorrar aproximadamente <strong>L {((datosReporte.costo_total || 0) * 0.1).toFixed(2)}</strong> este mes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <footer className="reporte-footer">
            <div className="footer-contenido">
              <p>⚡ <strong>PowerFlow</strong> - Sistema de Monitoreo Energético</p>
              <p>Este reporte fue generado automáticamente el {datosReporte.fecha_generacion}</p>
              <p>Para más información, visita www.powerflow.hn</p>
            </div>
          </footer>
        </div>
      )}

      {!datosReporte && !loading && (
        <div className="empty-state-reporte">
          <div className="empty-icon">📊</div>
          <h3>Genera tu primer reporte</h3>
          <p>Selecciona el período y tipo de reporte que deseas generar</p>
          <p className="empty-hint">Los reportes se generan con tus datos reales de consumo</p>
        </div>
      )}
    </div>
  );
}