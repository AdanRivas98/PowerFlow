// src/utils/api.js

const API_URL = "http://localhost:5000";

// Helper para peticiones autenticadas
export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  // Agregar token si existe
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  // Si el token expiró o es inválido, redirigir al login
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "/";
    throw new Error("Sesión expirada");
  }

  return response;
};

// Funciones específicas para cada endpoint

// USUARIOS
export const loginUsuario = async (correo, password) => {
  const response = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo, password }),
  });
  return response.json();
};

export const registrarUsuario = async (nombre, correo, password) => {
  const response = await fetch(`${API_URL}/api/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, correo, password }),
  });
  return response.json();
};

export const obtenerUsuarios = async () => {
  const response = await fetchWithAuth("/api/usuarios");
  return response.json();
};

export const obtenerUsuario = async (id) => {
  const response = await fetchWithAuth(`/api/usuarios/${id}`);
  return response.json();
};

export const eliminarUsuario = async (id) => {
  const response = await fetchWithAuth(`/api/usuarios/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

// DISPOSITIVOS (ejemplo si tienes estos endpoints)
export const obtenerDispositivos = async () => {
  const response = await fetchWithAuth("/api/dispositivos");
  return response.json();
};

export const crearDispositivo = async (dispositivo) => {
  const response = await fetchWithAuth("/api/dispositivos", {
    method: "POST",
    body: JSON.stringify(dispositivo),
  });
  return response.json();
};

export const actualizarDispositivo = async (id, dispositivo) => {
  const response = await fetchWithAuth(`/api/dispositivos/${id}`, {
    method: "PUT",
    body: JSON.stringify(dispositivo),
  });
  return response.json();
};

export const eliminarDispositivo = async (id) => {
  const response = await fetchWithAuth(`/api/dispositivos/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

// Helper para obtener usuario actual del localStorage
export const getUsuarioActual = () => {
  const usuario = localStorage.getItem("usuario");
  return usuario ? JSON.parse(usuario) : null;
};

// Helper para cerrar sesión
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "/";
};