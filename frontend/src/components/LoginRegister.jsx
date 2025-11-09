import { useState } from "react";
import "../styles/LoginRegister.css";
import logo from "../assets/powerflow-logo.png"; 

export default function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ nombre: "", correo: "", password: "" });
  const [mensaje, setMensaje] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      setMensaje(`✅ Bienvenido, ${formData.correo}`);
    } else {
      setMensaje("✅ Cuenta creada correctamente. Ahora puedes iniciar sesión.");
      setIsLogin(true);
    }
  };

  const toggleForm = () => {
    setMensaje("");
    setIsLogin(!isLogin);
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
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  name="password"
                  placeholder="********"
                  onChange={handleChange}
                  required
                />
              </div>

              <button className="pulse-btn" type="submit">
                <span>Ingresar</span>
              </button>
            </form>

            {mensaje && <p className="mensaje success">{mensaje}</p>}

            <p className="footer-text">
              ¿No tienes cuenta?{" "}
              <span onClick={toggleForm}>Crear una Cuenta</span>
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
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  name="correo"
                  placeholder="adan@example.com"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  name="password"
                  placeholder="********"
                  onChange={handleChange}
                  required
                />
              </div>

              <button className="pulse-btn" type="submit">
                <span>Registrarse</span>
              </button>
            </form>

            {mensaje && <p className="mensaje success">{mensaje}</p>}

            <p className="footer-text">
              ¿Ya tienes una cuenta?{" "}
              <span onClick={toggleForm}>Iniciar sesión</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
