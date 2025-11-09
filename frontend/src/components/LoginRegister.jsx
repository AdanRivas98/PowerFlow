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

  return (
    <div className="login-container">
      <div className="energy-bg"></div>

      <div className="card">
        <img src={logo} alt="PowerFlow Logo" className="logo" />

        {/* LOGIN */}
        <div className={`fade ${isLogin ? "active" : ""}`}>
          <h2>Iniciar sesión</h2>

          <form onSubmit={handleSubmit}>
            <label>Correo electrónico</label>
            <input
              type="email"
              name="correo"
              placeholder="adan@example.com"
              onChange={handleChange}
              required
            />

            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              placeholder="********"
              onChange={handleChange}
              required
            />

            <button className="pulse-btn" type="submit">Ingresar</button>
          </form>

          {mensaje && <p className="footer-text">{mensaje}</p>}

          <p className="footer-text">
            ¿No tienes cuenta?{" "}
            <span onClick={() => setIsLogin(false)}>Crear una Cuenta</span>
          </p>
        </div>

        {/* REGISTRO */}
        <div className={`fade ${!isLogin ? "active" : ""}`}>
          <h2>Crear cuenta</h2>

          <form onSubmit={handleSubmit}>
            <label>Nombre completo</label>
            <input
              type="text"
              name="nombre"
              placeholder="Adán Rivas"
              onChange={handleChange}
              required
            />

            <label>Correo electrónico</label>
            <input
              type="email"
              name="correo"
              placeholder="adan@example.com"
              onChange={handleChange}
              required
            />

            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              placeholder="********"
              onChange={handleChange}
              required
            />

            <button className="pulse-btn" type="submit">Registrarse</button>
          </form>

          {mensaje && <p className="footer-text">{mensaje}</p>}

          <p className="footer-text">
            ¿Ya tienes una cuenta?{" "}
            <span onClick={() => setIsLogin(true)}>Iniciar sesión</span>
          </p>
        </div>
      </div>
    </div>
  );
}
