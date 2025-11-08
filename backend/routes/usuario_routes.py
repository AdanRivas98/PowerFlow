from flask import Blueprint, request, jsonify
from extensions import db
from models.usuario import Usuario
from werkzeug.security import generate_password_hash, check_password_hash
import re

usuario_bp = Blueprint('usuarios', __name__)

# Registrar nuevo usuario
@usuario_bp.route('/api/usuarios', methods=['POST'])
def crear_usuario():
    data = request.get_json()
    nombre = data.get('nombre')
    correo = data.get('correo')
    password = data.get('password')

    # Validar campo 'nombre'
    if not nombre:
        return jsonify({"error": "El campo 'nombre' es obligatorio"}), 400

    # Validar campo 'correo'
    if not correo:
        return jsonify({"error": "El campo 'correo' es obligatorio"}), 400

    # Validar campo 'password'
    if not password:
        return jsonify({"error": "El campo 'password' es obligatorio"}), 400
    
    # Validar formato del correo
    patron_correo = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(patron_correo, correo):
        return jsonify({"error": "El formato del correo electrónico no es válido"}), 400

    # 🔒 Validar longitud mínima de la contraseña
    if len(password) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400

    # Verificar si ya existe el correo
    if Usuario.query.filter_by(correo=correo).first():
        return jsonify({"error": "El correo ya está registrado"}), 409

    # Encriptar contraseña
    password_hash = generate_password_hash(password)

    nuevo_usuario = Usuario(nombre=nombre, correo=correo, password=password_hash)
    db.session.add(nuevo_usuario)
    db.session.commit()

    return jsonify({"mensaje": "Usuario creado exitosamente"}), 201


# Listar todos los usuarios
@usuario_bp.route('/api/usuarios', methods=['GET'])
def listar_usuarios():
    usuarios = Usuario.query.all()
    resultado = [
        {"id": u.id, "nombre": u.nombre, "correo": u.correo, "fecha_creacion": u.fecha_creacion}
        for u in usuarios
    ]
    return jsonify(resultado), 200


# Obtener un usuario por ID
@usuario_bp.route('/api/usuarios/<int:id>', methods=['GET'])
def obtener_usuario(id):
    usuario = Usuario.query.get(id)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify({
        "id": usuario.id,
        "nombre": usuario.nombre,
        "correo": usuario.correo,
        "fecha_creacion": usuario.fecha_creacion
    }), 200


# Eliminar usuario por ID
@usuario_bp.route('/api/usuarios/<int:id>', methods=['DELETE'])
def eliminar_usuario(id):
    usuario = Usuario.query.get(id)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404

    db.session.delete(usuario)
    db.session.commit()
    return jsonify({"mensaje": "Usuario eliminado correctamente"}), 200
