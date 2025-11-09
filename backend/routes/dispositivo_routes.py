from flask import Blueprint, request, jsonify
from extensions import db
from models.dispositivo import Dispositivo
from routes.auth_middleware import token_required

dispositivo_bp = Blueprint('dispositivos', __name__)

# 🟢 Crear un nuevo dispositivo (solo usuarios logueados)
@dispositivo_bp.route('/api/dispositivos', methods=['POST'])
@token_required
def crear_dispositivo(usuario_actual):
    data = request.get_json()
    nombre = data.get('nombre')
    potencia_watts = data.get('potencia_watts')
    categoria = data.get('categoria')

    if not nombre:
        return jsonify({"error": "El campo 'nombre' es obligatorio"}), 400

    nuevo_dispositivo = Dispositivo(
        usuario_id=usuario_actual.id,
        nombre=nombre,
        potencia_watts=potencia_watts,
        categoria=categoria
    )

    db.session.add(nuevo_dispositivo)
    db.session.commit()

    return jsonify({
        "mensaje": "Dispositivo registrado correctamente",
        "usuario": usuario_actual.nombre,
        "dispositivo": {
            "id": nuevo_dispositivo.id,
            "nombre": nuevo_dispositivo.nombre,
            "potencia_watts": nuevo_dispositivo.potencia_watts,
            "categoria": nuevo_dispositivo.categoria
        }
    }), 201


# 🔵 Listar dispositivos del usuario logueado
@dispositivo_bp.route('/api/dispositivos', methods=['GET'])
@token_required
def listar_dispositivos(usuario_actual):
    dispositivos = Dispositivo.query.filter_by(usuario_id=usuario_actual.id).all()

    if not dispositivos:
        return jsonify({"mensaje": "No tienes dispositivos registrados"}), 200

    resultado = [
        {
            "id": d.id,
            "nombre": d.nombre,
            "potencia_watts": d.potencia_watts,
            "categoria": d.categoria
        }
        for d in dispositivos
    ]
    return jsonify(resultado), 200
