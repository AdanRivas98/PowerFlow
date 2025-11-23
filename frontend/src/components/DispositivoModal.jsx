import { useState, useEffect } from "react";
import "../styles/DispositivoModal.css";

export default function DispositivoModal({ 
  showModal, 
  onClose, 
  onSave, 
  editingDevice 
}) {
  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "",
    potencia_watts: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState(null);

  // Estado del calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState([]);
  const [horasUsoDia, setHorasUsoDia] = useState(6);

  const API_URL = "http://localhost:5000";

  const CATEGORIAS = [
    "Iluminación",
    "Climatización",
    "Electrodomésticos",
    "Electrónica",
    "Otros"
  ];

  // Obtener el mes y año actual del calendario
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Cargar datos si estamos editando
  useEffect(() => {
    if (showModal) {
      if (editingDevice) {
        setFormData({
          nombre: editingDevice.nombre || "",
          categoria: editingDevice.categoria || "",
          potencia_watts: editingDevice.potencia_watts || ""
        });
        setHorasUsoDia(editingDevice.horas_uso_dia || 6);
        // Cargar registros existentes del dispositivo
        cargarRegistrosExistentes(editingDevice.id);
      } else {
        setFormData({
          nombre: "",
          categoria: "",
          potencia_watts: ""
        });
        setSelectedDays([]);
        setHorasUsoDia(6);
        setSuggestions(null);
      }
      setErrors({});
      // Resetear al mes actual
      setCurrentDate(new Date());
    }
  }, [editingDevice, showModal]);

  // Cargar registros existentes del dispositivo
  const cargarRegistrosExistentes = async (dispositivoId) => {
    try {
      const token = localStorage.getItem("token");
      const mes = currentDate.getMonth() + 1;
      const anio = currentDate.getFullYear();

      const response = await fetch(
        `${API_URL}/api/dispositivos/${dispositivoId}/registros?mes=${mes}&anio=${anio}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.registros && data.registros.length > 0) {
          const fechas = data.registros.map(r => r.fecha);
          setSelectedDays(fechas);
          // Usar las horas del primer registro como referencia
          if (data.registros[0].horas_uso) {
            setHorasUsoDia(data.registros[0].horas_uso);
          }
        } else {
          setSelectedDays([]);
        }
      }
    } catch (error) {
      console.error("Error al cargar registros:", error);
      setSelectedDays([]);
    }
  };

  // Generar días del calendario
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Ajustar para que la semana empiece en Lunes (0 = Lunes, 6 = Domingo)
    let startingDay = firstDay.getDay() - 1;
    if (startingDay < 0) startingDay = 6;

    const days = [];

    // Días vacíos antes del primer día del mes
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, date: null });
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ day, date: dateStr });
    }

    return days;
  };

  // Verificar si un día es hoy
  const isToday = (dateStr) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
  };

  // Verificar si un día está seleccionado
  const isDaySelected = (dateStr) => {
    return selectedDays.includes(dateStr);
  };

  // Toggle selección de día
  const toggleDay = (dateStr) => {
    if (!dateStr) return;
    
    setSelectedDays(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  // Seleccionar todos los días del mes
  const selectAllDays = () => {
    const days = generateCalendarDays();
    const allDates = days.filter(d => d.date !== null).map(d => d.date);
    setSelectedDays(allDates);
  };

  // Limpiar selección
  const clearSelection = () => {
    setSelectedDays([]);
  };

  // Calcular resumen
  const calculateSummary = () => {
    const diasRegistrados = selectedDays.length;
    const totalHoras = diasRegistrados * horasUsoDia;
    const potencia = parseFloat(formData.potencia_watts) || 0;
    const consumoKwh = (potencia * totalHoras) / 1000;
    const costoEstimado = consumoKwh * 3.7; // Tarifa Honduras

    return {
      diasRegistrados,
      totalHoras: totalHoras.toFixed(1),
      consumoKwh: consumoKwh.toFixed(2),
      costoEstimado: costoEstimado.toFixed(2)
    };
  };

  const summary = calculateSummary();

  // Manejar cambios en el nombre (trigger para sugerencias)
  const handleNombreChange = async (e) => {
    const nombre = e.target.value;
    setFormData({ ...formData, nombre });
    
    if (nombre.length >= 3 && !editingDevice) {
      await buscarSugerencias(nombre);
    } else if (nombre.length < 3) {
      setSuggestions(null);
    }
  };

  // Buscar sugerencias con IA
  const buscarSugerencias = async (nombre) => {
    try {
      setIsSuggesting(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/dispositivos/sugerir`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nombre })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sugerencia) {
          setSuggestions(data.sugerencia);
        }
      }
    } catch (error) {
      console.error("Error al buscar sugerencias:", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Aplicar sugerencias
  const aplicarSugerencias = () => {
    if (suggestions) {
      setFormData({
        ...formData,
        categoria: suggestions.categoria || formData.categoria,
        potencia_watts: suggestions.potencia_watts || formData.potencia_watts
      });
      setSuggestions(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Validar formulario
  const validarFormulario = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    }

    if (!formData.categoria) {
      newErrors.categoria = "Selecciona una categoría";
    }

    if (formData.potencia_watts && isNaN(formData.potencia_watts)) {
      newErrors.potencia_watts = "Debe ser un número válido";
    }

    if (formData.potencia_watts && formData.potencia_watts < 0) {
      newErrors.potencia_watts = "No puede ser negativo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      // 1. Guardar/actualizar el dispositivo
      const urlDispositivo = editingDevice 
        ? `${API_URL}/api/dispositivos/${editingDevice.id}`
        : `${API_URL}/api/dispositivos`;
      
      const methodDispositivo = editingDevice ? "PUT" : "POST";

      const dispositivoData = {
        nombre: formData.nombre.trim(),
        categoria: formData.categoria,
        potencia_watts: formData.potencia_watts ? parseFloat(formData.potencia_watts) : null,
        horas_uso_dia: parseFloat(horasUsoDia)
      };

      const responseDispositivo = await fetch(urlDispositivo, {
        method: methodDispositivo,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dispositivoData)
      });

      if (!responseDispositivo.ok) {
        const errorData = await responseDispositivo.json();
        alert(`Error: ${errorData.error || "No se pudo guardar el dispositivo"}`);
        return;
      }

      const dispositivoGuardado = await responseDispositivo.json();
      const dispositivoId = editingDevice ? editingDevice.id : dispositivoGuardado.dispositivo.id;

      // 2. Guardar los registros de uso si hay días seleccionados
      if (selectedDays.length > 0) {
        const registrosData = {
          fechas: selectedDays,
          horas_uso: parseFloat(horasUsoDia),
          mes: currentMonth + 1,
          anio: currentYear
        };

        const responseRegistros = await fetch(
          `${API_URL}/api/dispositivos/${dispositivoId}/registros`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(registrosData)
          }
        );

        if (!responseRegistros.ok) {
          console.warn("Error al guardar registros de uso");
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error de conexión al guardar el dispositivo");
    } finally {
      setIsLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingDevice ? "✏️ Editar Dispositivo" : "➕ Agregar Dispositivo"}</h2>
          <button className="modal-close" onClick={onClose} disabled={isLoading}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* SECCIÓN 1: Información del Dispositivo */}
            <div className="section">
              <div className="section-header">
                <span className="section-icon">📝</span>
                <span className="section-title">Información del Dispositivo</span>
              </div>

              {/* Campo Nombre */}
              <div className="form-group">
                <label htmlFor="nombre">
                  Nombre del dispositivo <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleNombreChange}
                  placeholder="Ej: Aire Acondicionado Sala"
                  disabled={isLoading}
                  className={errors.nombre ? "input-error" : ""}
                  autoFocus
                />
                {errors.nombre && (
                  <span className="error-message">{errors.nombre}</span>
                )}
                {isSuggesting && (
                  <span className="info-message">🔍 Buscando información del dispositivo...</span>
                )}
              </div>

              {/* Sugerencias de IA */}
              {suggestions && !editingDevice && (
                <div className="suggestions-box">
                  <div className="suggestions-header">
                    <span className="suggestions-icon">🤖</span>
                    <span className="suggestions-title">Sugerencias de IA</span>
                  </div>
                  <div className="suggestions-content">
                    <div className="suggestion-item">
                      <strong>Categoría:</strong> {suggestions.categoria}
                    </div>
                    {suggestions.potencia_watts && (
                      <div className="suggestion-item">
                        <strong>Potencia estimada:</strong> {suggestions.potencia_watts} W
                      </div>
                    )}
                  </div>
                  <div className="suggestions-actions">
                    <button
                      type="button"
                      className="btn-suggestion accept"
                      onClick={aplicarSugerencias}
                    >
                      ✓ Aplicar
                    </button>
                    <button
                      type="button"
                      className="btn-suggestion reject"
                      onClick={() => setSuggestions(null)}
                    >
                      ✕ Rechazar
                    </button>
                  </div>
                </div>
              )}

              {/* Campo Categoría */}
              <div className="form-group">
                <label htmlFor="categoria">
                  Categoría <span className="required">*</span>
                </label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={errors.categoria ? "input-error" : ""}
                >
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.categoria && (
                  <span className="error-message">{errors.categoria}</span>
                )}
              </div>

              {/* Campo Potencia */}
              <div className="form-group">
                <label htmlFor="potencia_watts">
                  Potencia (Watts)
                </label>
                <input
                  type="number"
                  id="potencia_watts"
                  name="potencia_watts"
                  value={formData.potencia_watts}
                  onChange={handleChange}
                  placeholder="Ej: 1500"
                  step="0.1"
                  min="0"
                  disabled={isLoading}
                  className={errors.potencia_watts ? "input-error" : ""}
                />
                {errors.potencia_watts && (
                  <span className="error-message">{errors.potencia_watts}</span>
                )}
                <span className="help-text">
                  💡 Si no conoces la potencia, la IA puede estimarla
                </span>
              </div>
            </div>

            {/* SECCIÓN 2: Registro de Uso */}
            <div className="section">
              <div className="section-header">
                <span className="section-icon">📅</span>
                <span className="section-title">
                  Registro de Uso - {monthNames[currentMonth]} {currentYear}
                </span>
              </div>

              <div className="calendar-container">
                <div className="calendar-header">
                  <span className="calendar-month">
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <div className="calendar-nav">
                    <button
                      type="button"
                      onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
                      disabled={isLoading}
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
                      disabled={isLoading}
                    >
                      ▶
                    </button>
                  </div>
                </div>

                <div className="calendar-weekdays">
                  <span>L</span>
                  <span>M</span>
                  <span>M</span>
                  <span>J</span>
                  <span>V</span>
                  <span>S</span>
                  <span>D</span>
                </div>

                <div className="calendar-days">
                  {generateCalendarDays().map((dayObj, index) => (
                    <div
                      key={index}
                      className={`calendar-day 
                        ${dayObj.day === null ? 'empty' : ''} 
                        ${dayObj.date && isDaySelected(dayObj.date) ? 'selected' : ''} 
                        ${dayObj.date && isToday(dayObj.date) ? 'today' : ''}`}
                      onClick={() => toggleDay(dayObj.date)}
                    >
                      {dayObj.day}
                    </div>
                  ))}
                </div>

                <div className="calendar-actions">
                  <button
                    type="button"
                    className="btn-select-all"
                    onClick={selectAllDays}
                    disabled={isLoading}
                  >
                    ✓ Seleccionar todo el mes
                  </button>
                  <button
                    type="button"
                    className="btn-clear"
                    onClick={clearSelection}
                    disabled={isLoading}
                  >
                    Limpiar
                  </button>
                </div>

                <div className="hours-input-row">
                  <label>⏰ Horas de uso por día:</label>
                  <input
                    type="number"
                    value={horasUsoDia}
                    onChange={(e) => setHorasUsoDia(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="24"
                    step="0.5"
                    disabled={isLoading}
                  />
                  <span>horas</span>
                </div>
              </div>

              {/* Resumen */}
              {formData.potencia_watts && selectedDays.length > 0 && (
                <div className="summary-box">
                  <div className="summary-title">📊 Resumen del Mes</div>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <div className="summary-value">{summary.diasRegistrados}</div>
                      <div className="summary-label">Días registrados</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-value">{summary.consumoKwh}</div>
                      <div className="summary-label">kWh estimados</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-value">L {summary.costoEstimado}</div>
                      <div className="summary-label">Costo estimado</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Guardando..." : (editingDevice ? "Guardar Cambios" : "Agregar Dispositivo")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}