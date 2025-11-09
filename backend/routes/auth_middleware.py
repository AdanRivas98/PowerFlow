from functools import wraps
from flask import request, jsonify
import jwt
from models.usuario import Usuario

# Usa la misma clave que en usuario_routes.py
SECRET_KEY = "powerflow_secret_key_2025"

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Buscar el token en el encabezado "Authorization"
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        # Si no se envió token
        if not token:
            return jsonify({"error": "Token no proporcionado. Acceso denegado."}), 401

        try:
            # Decodificar el token
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

            # Verificar que el usuario aún exista
            usuario_actual = Usuario.query.get(data['id'])
            if not usuario_actual:
                return jsonify({"error": "Usuario no encontrado o token inválido"}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "El token ha expirado, inicia sesión nuevamente"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido o manipulado"}), 401

        # ✅ Si todo está bien, continuar con la función original
        return f(usuario_actual, *args, **kwargs)

    return decorated
