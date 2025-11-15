import { useState } from "react";
import "../styles/LoginRegister.css";
import logo from "../assets/powerflow-logo.png";

export default function LoginRegister({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ nombre: "", correo: "", password: "" });
  const [mensaje, setMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "", color: "" });
  const [validationErrors, setValidationErrors] = useState({
    correo: "",
    password: "",
    nombre: ""
  });

  const API_URL = "http://localhost:5000";

  // Validación en tiempo real del correo
  const validateEmail = (email) => {
    if (!email) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Formato de correo inválido";
    }
    return "";
  };

  // Validación en tiempo real de la contraseña
  const validatePassword = (password) => {
    if (!password) return "";
    if (password.length < 6) {
      return "Mínimo 6 caracteres";
    }
    if (password.length > 50) {
      return "Máximo 50 caracteres";
    }
    return "";
  };

  // Calcular fortaleza de la contraseña
  const calculatePasswordStrength = (password) => {
    if (!password) {
      return { score: 0, text: "", color: "" };
    }

    let score = 0;
    
    // Longitud
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complejidad
    if (/[a-z]/.test(password)) score += 1; // Minúsculas
    if (/[A-Z]/.test(password)) score += 1; // Mayúsculas
    if (/[0-9]/.test(password)) score += 1; // Números
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // Caracteres especiales

    // Determinar nivel
    if (score <= 2) {
      return { score: 1, text: "Débil", color: "#dc3545" };
    } else if (score <= 4) {
      return { score: 2, text: "Media", color: "#ffc107" };
    } else if (score <= 5) {
      return { score: 3, text: "Buena", color: "#28a745" };
    } else {
      return { score: 4, text: "Excelente", color: "#20c997" };
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Limpiar error del campo
    if (fieldError) {
      setFieldError("");
    }

    // Validación en tiempo real
    if (name === "correo") {
      const error = validateEmail(value);
      setValidationErrors({ ...validationErrors, correo: error });
    }
    
    if (name === "password") {
      const error = validatePassword(value);
      setValidationErrors({ ...validationErrors, password: error });
      
      // Calcular fortaleza solo en modo registro
      if (!isLogin) {
        const strength = calculatePasswordStrength(value);
        setPasswordStrength(strength);
      }
    }

    if (name === "nombre") {
      const error = value.trim().length < 3 ? "Mínimo 3 caracteres" : "";
      setValidationErrors({ ...validationErrors, nombre: error });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMensaje("");
    setFieldError("");

    // Validar antes de enviar
    if (validationErrors.correo || validationErrors.password || validationErrors.nombre) {
      setMensaje("❌ Por favor corrige los errores en el formulario");
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // LOGIN
        console.log("Intentando login con:", { correo: formData.correo });
        
        const response = await fetch(`${API_URL}/api/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo: formData.correo,
            password: formData.password,
          }),
        });

        console.log("Respuesta del servidor:", response.status, response.statusText);
        
        const data = await response.json();
        console.log("Datos recibidos del backend:", data);

        if (response.ok) {
          if (!data.token) {
            console.error("❌ El backend no devolvió un token");
            setMensaje("❌ Error: No se recibió token del servidor");
            return;
          }
          
          if (!data.usuario) {
            console.error("❌ El backend no devolvió datos de usuario");
            setMensaje("❌ Error: No se recibieron datos de usuario");
            return;
          }
          
          localStorage.setItem("token", data.token);
          localStorage.setItem("usuario", JSON.stringify(data.usuario));
          
          console.log("✅ Login exitoso:", data.usuario);
          
          setMensaje(`✅ Bienvenido, ${data.usuario.nombre}`);
          
          setTimeout(() => {
            console.log("⏰ Ejecutando redirección al dashboard...");
            if (onLoginSuccess) {
              console.log("✅ Llamando a onLoginSuccess");
              onLoginSuccess();
            }
          }, 800);
        } else {
          console.error("❌ Error en login:", data);
          setMensaje(`❌ ${data.error}`);
          
          if (data.error && (data.error.toLowerCase().includes("correo") || 
                            data.error.toLowerCase().includes("registrado") ||
                            data.error.toLowerCase().includes("no existe"))) {
            setFieldError("correo");
            setFormData({ ...formData, correo: "", password: "" });
          } else if (data.error && data.error.toLowerCase().includes("contraseña")) {
            setFieldError("password");
            setFormData({ ...formData, password: "" });
          } else {
            setFormData({ ...formData, password: "" });
          }
        }
      } else {
        // REGISTRO
        const response = await fetch(`${API_URL}/api/usuarios`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: formData.nombre,
            correo: formData.correo,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setMensaje("✅ Cuenta creada correctamente. Ahora puedes iniciar sesión.");
          setTimeout(() => {
            setIsLogin(true);
            setFormData({ nombre: "", correo: "", password: "" });
            setPasswordStrength({ score: 0, text: "", color: "" });
            setMensaje("");
          }, 2000);
        } else {
          console.error("❌ Error en registro:", data);
          setMensaje(`❌ ${data.error}`);
          
          if (data.error && (data.error.toLowerCase().includes("correo ya está") || 
                            data.error.toLowerCase().includes("correo ya esta"))) {
            setFieldError("correo");
            setFormData({ ...formData, correo: "", password: "" });
          } else if (data.error && data.error.toLowerCase().includes("contraseña")) {
            setFieldError("password");
            setFormData({ ...formData, password: "" });
          } else if (data.error && data.error.toLowerCase().includes("nombre")) {
            setFieldError("nombre");
            setFormData({ ...formData, nombre: "" });
          } else {
            setFormData({ ...formData, password: "" });
          }
        }
      }
    } catch (error) {
      console.error("❌ Error capturado en try-catch:", error);
      
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setMensaje("❌ No se puede conectar con el servidor. Verifica que Flask esté corriendo en http://localhost:5000");
      } else {
        setMensaje("❌ Error de conexión con el servidor.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setMensaje("");
    setFieldError("");
    setValidationErrors({ correo: "", password: "", nombre: "" });
    setPasswordStrength({ score: 0, text: "", color: "" });
    setFormData({ nombre: "", correo: "", password: "" });
    setShowPassword(false);
    setIsLogin(!isLogin);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="energy-bg"></div>

      <div className="card">
        <img src={logo} alt="PowerFlow Logo" className="logo" />

        <div className="form-wrapper">
          {/* LOGIN */}
          <div className={`form-content ${isLogin ? "active" : ""}`}>
            <h2>Iniciar sesión</h2>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  name="correo"
                  placeholder="adan@example.com"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className={fieldError === "correo" ? "input-error" : ""}
                  autoFocus={fieldError === "correo"}
                />
                {validationErrors.correo && (
                  <span className="validation-error">{validationErrors.correo}</span>
                )}
              </div>

              <div className="input-group">
                <label>Contraseña</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="********"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className={fieldError === "password" ? "input-error" : ""}
                    autoFocus={fieldError === "password"}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <span className="validation-error">{validationErrors.password}</span>
                )}
              </div>

              <button className="pulse-btn" type="submit" disabled={isLoading}>
                <span>{isLoading ? "Cargando..." : "Ingresar"}</span>
              </button>
            </form>

            {mensaje && <p className={`mensaje ${mensaje.includes('❌') ? 'error' : 'success'}`}>{mensaje}</p>}

            <p className="footer-text">
              ¿No tienes cuenta?{" "}
              <span onClick={toggleForm} style={{ cursor: "pointer" }}>Crear una Cuenta</span>
            </p>
          </div>

          {/* REGISTRO */}
          <div className={`form-content ${!isLogin ? "active" : ""}`}>
            <h2>Crear cuenta</h2>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Adán Rivas"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className={fieldError === "nombre" ? "input-error" : ""}
                  autoFocus={fieldError === "nombre"}
                />
                {validationErrors.nombre && (
                  <span className="validation-error">{validationErrors.nombre}</span>
                )}
              </div>

              <div className="input-group">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  name="correo"
                  placeholder="adan@example.com"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className={fieldError === "correo" ? "input-error" : ""}
                  autoFocus={fieldError === "correo"}
                />
                {validationErrors.correo && (
                  <span className="validation-error">{validationErrors.correo}</span>
                )}
              </div>

              <div className="input-group">
                <label>Contraseña</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="********"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    minLength={6}
                    className={fieldError === "password" ? "input-error" : ""}
                    autoFocus={fieldError === "password"}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <span className="validation-error">{validationErrors.password}</span>
                )}
                
                {/* Indicador de fortaleza de contraseña */}
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill"
                        style={{
                          width: `${(passwordStrength.score / 4) * 100}%`,
                          backgroundColor: passwordStrength.color,
                          transition: "all 0.3s ease"
                        }}
                      ></div>
                    </div>
                    <span 
                      className="strength-text"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                )}
                
                {/* Requisitos de contraseña */}
                <div className="password-requirements">
                  <small style={{ color: "#666", fontSize: "12px" }}>
                    <span className={formData.password.length >= 6 ? "requirement-met" : ""}>
                      ✓ Mínimo 6 caracteres
                    </span>
                  </small>
                </div>
              </div>

              <button className="pulse-btn" type="submit" disabled={isLoading}>
                <span>{isLoading ? "Cargando..." : "Registrarse"}</span>
              </button>
            </form>

            {mensaje && <p className={`mensaje ${mensaje.includes('❌') ? 'error' : 'success'}`}>{mensaje}</p>}

            <p className="footer-text">
              ¿Ya tienes una cuenta?{" "}
              <span onClick={toggleForm} style={{ cursor: "pointer" }}>Iniciar sesión</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}