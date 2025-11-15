import { useState, useEffect } from "react";

export default function DispositivoModal({ 
  showModal, 
  onClose, 
  onSave, 
  editingDevice 
}) {
  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "",
    potencia_watts: "",
    horas_uso_dia: "6"
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState(null);

  const API_URL = "http://localhost:5000";

  const CATEGORIAS = [
    "Iluminación",
    "Climatización",
    "Electrodomésticos",
    "Electrónica",
    "Otros"
  ];

  // Cargar datos si estamos editando
  useEffect(() => {
    if (editingDevice) {
      setFormData({
        nombre: editingDevice.nombre || "",
        categoria: editingDevice.categoria || "",
        potencia_watts: editingDevice.potencia_watts || "",
        horas_uso_dia: editingDevice.horas_uso_dia || "6"
      });
    } else {
      setFormData({
        nombre: "",
        categoria: "",
        potencia_watts: "",
        horas_uso_dia: "6"
      });
      setSuggestions(null);
    }
    setErrors({});
  }, [editingDevice, showModal]);

  // Manejar cambios en el nombre (trigger para sugerencias)
  const handleNombreChange = async (e) => {
    const nombre = e.target.value;
    setFormData({ ...formData, nombre });
    
    // Si el nombre tiene al menos 3 caracteres, buscar sugerencias
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
        console.log("Sugerencias recibidas:", data);
        
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

  // Rechazar sugerencias
  const rechazarSugerencias = () => {
    setSuggestions(null);
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

    if (!formData.horas_uso_dia || isNaN(formData.horas_uso_dia)) {
      newErrors.horas_uso_dia = "Ingresa horas válidas";
    }

    if (formData.horas_uso_dia && (formData.horas_uso_dia < 0 || formData.horas_uso_dia > 24)) {
      newErrors.horas_uso_dia = "Debe estar entre 0 y 24 horas";
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
      const url = editingDevice 
        ? `${API_URL}/api/dispositivos/${editingDevice.id}`
        : `${API_URL}/api/dispositivos`;
      
      const method = editingDevice ? "PUT" : "POST";

      const dataToSend = {
        nombre: formData.nombre.trim(),
        categoria: formData.categoria,
        potencia_watts: formData.potencia_watts ? parseFloat(formData.potencia_watts) : null,
        horas_uso_dia: parseFloat(formData.horas_uso_dia)
      };

      const response = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Dispositivo guardado:", data);
        onSave();
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "No se pudo guardar el dispositivo"}`);
      }
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
                    onClick={rechazarSugerencias}
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
                💡 Si no conoces la potencia, déjalo vacío. La IA lo estimará.
              </span>
            </div>

            {/* Campo Horas de Uso */}
            <div className="form-group">
              <label htmlFor="horas_uso_dia">
                Horas de uso promedio por día <span className="required">*</span>
              </label>
              <input
                type="number"
                id="horas_uso_dia"
                name="horas_uso_dia"
                value={formData.horas_uso_dia}
                onChange={handleChange}
                placeholder="Ej: 6"
                step="0.5"
                min="0"
                max="24"
                disabled={isLoading}
                className={errors.horas_uso_dia ? "input-error" : ""}
              />
              {errors.horas_uso_dia && (
                <span className="error-message">{errors.horas_uso_dia}</span>
              )}
              <span className="help-text">
                ⏰ Estima cuántas horas al día usas este dispositivo
              </span>
            </div>

            {/* Estimación de Consumo */}
            {formData.potencia_watts && formData.horas_uso_dia && (
              <div className="consumption-preview">
                <div className="preview-label">📊 Consumo estimado mensual</div>
                <div className="preview-value">
                  {((formData.potencia_watts * formData.horas_uso_dia * 30) / 1000).toFixed(2)} kWh
                </div>
                <div className="preview-cost">
                  Costo aproximado: L {((formData.potencia_watts * formData.horas_uso_dia * 30 * 3.7) / 1000).toFixed(2)}/mes
                </div>
              </div>
            )}

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