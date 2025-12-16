import { useState, useEffect, useRef } from "react";
import "../styles/IA.css";

export default function IA() {
  const [loading, setLoading] = useState(true);
  const [predicciones, setPredicciones] = useState(null);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [patrones, setPatrones] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "¡Hola! Soy tu asistente de energía inteligente. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef(null);

  const API_URL = "http://localhost:5000";

  useEffect(() => {
    cargarDatosIA();
  }, []);

  // Auto-scroll en el chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const cargarDatosIA = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Cargar predicciones
      const predRes = await fetch(`${API_URL}/api/ia/predicciones`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (predRes.ok) {
        const predData = await predRes.json();
        setPredicciones(predData);
      }

      // Cargar recomendaciones
      const recRes = await fetch(`${API_URL}/api/ia/recomendaciones`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecomendaciones(recData.recomendaciones || []);
      }

      // Cargar patrones
      const patRes = await fetch(`${API_URL}/api/ia/patrones`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (patRes.ok) {
        const patData = await patRes.json();
        setPatrones(patData);
      }

    } catch (error) {
      console.error("Error al cargar datos IA:", error);
    } finally {
      setLoading(false);
    }
  };

  const enviarMensajeChat = async () => {
    if (!inputMessage.trim() || sendingMessage) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    // Agregar mensaje del usuario
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setSendingMessage(true);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/ia/chat`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mensaje: userMessage })
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.respuesta 
        }]);
      } else {
        setChatMessages(prev => [...prev, { 
          role: "assistant", 
          content: "Lo siento, ocurrió un error. Por favor intenta de nuevo." 
        }]);
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      setChatMessages(prev => [...prev, { 
        role: "assistant", 
        content: "No pude conectarme al servidor. Verifica tu conexión." 
      }]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensajeChat();
    }
  };

  if (loading) {
    return (
      <div className="ia-loading">
        <div className="ia-spinner"></div>
        <p>Analizando tus datos con IA...</p>
      </div>
    );
  }

  return (
    <div className="ia-container">
      {/* Header */}
      <div className="ia-header">
        <div className="ia-header-content">
          <div className="ia-header-icon">🤖</div>
          <div>
            <h1>Inteligencia Artificial</h1>
            <p>Análisis predictivo y recomendaciones personalizadas</p>
          </div>
        </div>
      </div>

      {/* Grid Principal - Predicciones y Patrones */}
      <div className="ia-main-grid">
        {/* Predicciones */}
        <div className="ia-card predicciones-card">
          <div className="ia-card-header">
            <h2>📈 Predicciones de Consumo</h2>
            <span className="ia-badge">Machine Learning</span>
          </div>
          
          {predicciones ? (
            <div className="predicciones-content">
              {/* Predicción Principal */}
              <div className="prediccion-principal">
                <div className="prediccion-label">Próxima Semana</div>
                <div className="prediccion-valor">
                  {predicciones.proxima_semana?.consumo_kwh || "N/A"}
                  <span className="prediccion-unidad">kWh</span>
                </div>
                <div className="prediccion-costo">
                  ≈ L {predicciones.proxima_semana?.costo_lps || "N/A"}
                </div>
                <div className="prediccion-confianza">
                  <div className="confianza-bar">
                    <div 
                      className="confianza-fill"
                      style={{ width: `${predicciones.proxima_semana?.confianza || 0}%` }}
                    ></div>
                  </div>
                  <span>{predicciones.proxima_semana?.confianza || 0}% de confianza</span>
                </div>
              </div>

              {/* Predicciones Adicionales */}
              <div className="predicciones-grid">
                <div className="prediccion-item">
                  <div className="prediccion-icono">📅</div>
                  <div className="prediccion-info">
                    <span className="prediccion-titulo">Próximo Mes</span>
                    <span className="prediccion-dato">
                      {predicciones.proximo_mes?.consumo_kwh || "N/A"} kWh
                    </span>
                  </div>
                </div>

                <div className="prediccion-item">
                  <div className="prediccion-icono">⚡</div>
                  <div className="prediccion-info">
                    <span className="prediccion-titulo">Pico de Consumo</span>
                    <span className="prediccion-dato">
                      {predicciones.pico_consumo?.hora || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="prediccion-item">
                  <div className="prediccion-icono">💰</div>
                  <div className="prediccion-info">
                    <span className="prediccion-titulo">Ahorro Potencial</span>
                    <span className="prediccion-dato ahorro">
                      L {predicciones.ahorro_potencial?.monto || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tendencia */}
              {predicciones.tendencia && (
                <div className={`tendencia-badge ${predicciones.tendencia.tipo}`}>
                  <span className="tendencia-icono">
                    {predicciones.tendencia.tipo === "aumento" ? "📈" : 
                     predicciones.tendencia.tipo === "disminucion" ? "📉" : "➡️"}
                  </span>
                  <span>{predicciones.tendencia.mensaje}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="ia-empty">
              <span className="ia-empty-icon">📊</span>
              <p>No hay suficientes datos para generar predicciones</p>
            </div>
          )}
        </div>

        {/* Análisis de Patrones */}
        <div className="ia-card patrones-card">
          <div className="ia-card-header">
            <h2>🔍 Análisis de Patrones</h2>
            <span className="ia-badge">Deep Learning</span>
          </div>
          
          {patrones ? (
            <div className="patrones-content">
              {/* Patrón Detectado */}
              {patrones.patron_principal && (
                <div className="patron-destacado">
                  <div className="patron-icono">🎯</div>
                  <div className="patron-info">
                    <h3>{patrones.patron_principal.nombre}</h3>
                    <p>{patrones.patron_principal.descripcion}</p>
                    <div className="patron-frecuencia">
                      Detectado {patrones.patron_principal.frecuencia}
                    </div>
                  </div>
                </div>
              )}

              {/* Insights */}
              <div className="insights-lista">
                <h3 className="insights-titulo">Insights Detectados</h3>
                {patrones.insights?.map((insight, index) => (
                  <div key={index} className="insight-item">
                    <div className="insight-icono">💡</div>
                    <div className="insight-texto">{insight}</div>
                  </div>
                ))}
              </div>

              {/* Horarios de Mayor Consumo */}
              {patrones.horarios_pico && (
                <div className="horarios-pico">
                  <h3>⏰ Horarios de Mayor Consumo</h3>
                  <div className="horarios-grid">
                    {patrones.horarios_pico.map((horario, index) => (
                      <div key={index} className="horario-item">
                        <span className="horario-hora">{horario.hora}</span>
                        <span className="horario-consumo">{horario.consumo} kWh</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dispositivos con Patrones Anómalos */}
              {patrones.anomalias && patrones.anomalias.length > 0 && (
                <div className="anomalias-section">
                  <h3>⚠️ Dispositivos con Comportamiento Anómalo</h3>
                  {patrones.anomalias.map((anomalia, index) => (
                    <div key={index} className="anomalia-item">
                      <span className="anomalia-dispositivo">{anomalia.dispositivo}</span>
                      <span className="anomalia-detalle">{anomalia.detalle}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="ia-empty">
              <span className="ia-empty-icon">🔍</span>
              <p>Analizando patrones de consumo...</p>
            </div>
          )}
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="ia-card recomendaciones-card">
        <div className="ia-card-header">
          <h2>💡 Recomendaciones Personalizadas</h2>
          <span className="ia-badge recomendaciones-badge">
            {recomendaciones.length} nuevas
          </span>
        </div>
        
        {recomendaciones.length > 0 ? (
          <div className="recomendaciones-grid">
            {recomendaciones.map((rec, index) => (
              <div key={index} className={`recomendacion-item prioridad-${rec.prioridad}`}>
                <div className="recomendacion-header">
                  <span className="recomendacion-icono">{rec.icono || "💡"}</span>
                  <span className={`recomendacion-prioridad ${rec.prioridad}`}>
                    {rec.prioridad === "alta" ? "Alta" : 
                     rec.prioridad === "media" ? "Media" : "Baja"}
                  </span>
                </div>
                <h3 className="recomendacion-titulo">{rec.titulo}</h3>
                <p className="recomendacion-descripcion">{rec.descripcion}</p>
                {rec.ahorro_estimado && (
                  <div className="recomendacion-ahorro">
                    <span className="ahorro-icono">💰</span>
                    <span>Ahorro estimado: L {rec.ahorro_estimado}/mes</span>
                  </div>
                )}
                {rec.impacto && (
                  <div className="recomendacion-impacto">
                    Impacto: {rec.impacto}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="ia-empty">
            <span className="ia-empty-icon">✅</span>
            <p>¡Excelente! Estás optimizando muy bien tu consumo energético</p>
          </div>
        )}
      </div>

      {/* Chatbot Asistente */}
      <div className="ia-card chatbot-card">
        <div className="ia-card-header">
          <h2>💬 Asistente Inteligente</h2>
          <span className="ia-badge">GPT-4</span>
        </div>
        
        <div className="chatbot-content">
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === "assistant" ? "🤖" : "👤"}
                </div>
                <div className="message-bubble">
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            {sendingMessage && (
              <div className="chat-message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-bubble typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Pregunta sobre tu consumo energético..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendingMessage}
            />
            <button 
              className="chat-send-btn"
              onClick={enviarMensajeChat}
              disabled={!inputMessage.trim() || sendingMessage}
            >
              <span>📤</span>
            </button>
          </div>

          {/* Sugerencias Rápidas */}
          <div className="chat-suggestions">
            <button 
              className="suggestion-btn"
              onClick={() => setInputMessage("¿Cómo puedo reducir mi consumo?")}
            >
              ¿Cómo reducir consumo?
            </button>
            <button 
              className="suggestion-btn"
              onClick={() => setInputMessage("¿Cuál es mi dispositivo más costoso?")}
            >
              Dispositivo más costoso
            </button>
            <button 
              className="suggestion-btn"
              onClick={() => setInputMessage("Dame consejos de ahorro")}
            >
              Consejos de ahorro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
