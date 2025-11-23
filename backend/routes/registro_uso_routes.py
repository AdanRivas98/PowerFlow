from flask import Blueprint, request, jsonify
from extensions import db
from models.dispositivo import Dispositivo
from models.registro_uso import RegistroUso
from routes.auth_middleware import token_required
from datetime import datetime, date
from sqlalchemy import extract

registro_uso_bp = Blueprint('registros_uso', __name__)


@registro_uso_bp.route('/api/dispositivos/<int:dispositivo_id>/registros', methods=['GET'])
@token_required
def obtener_registros(usuario_actual, dispositivo_id):
    """Obtiene los registros de uso de un dispositivo para el mes actual"""
    
    # Verificar que el dispositivo existe y pertenece al usuario
    dispositivo = Dispositivo.query.get(dispositivo_id)
    
    if not dispositivo:
        return jsonify({"error": "Dispositivo no encontrado"}), 404
    
    if dispositivo.usuario_id != usuario_actual.id:
        return jsonify({"error": "No autorizado"}), 403
    
    # Obtener mes y año de los parámetros o usar el actual
    mes = request.args.get('mes', date.today().month, type=int)
    anio = request.args.get('anio', date.today().year, type=int)
    
    # Obtener registros del mes
    registros = RegistroUso.query.filter(
        RegistroUso.dispositivo_id == dispositivo_id,
        extract('month', RegistroUso.fecha) == mes,
        extract('year', RegistroUso.fecha) == anio
    ).all()
    
    # Calcular resumen
    total_horas = sum(r.horas_uso for r in registros)
    consumo_kwh = 0
    costo_estimado = 0
    
    if dispositivo.potencia_watts:
        consumo_kwh = (dispositivo.potencia_watts * total_horas) / 1000
        costo_estimado = consumo_kwh * 3.7  # Tarifa Honduras
    
    return jsonify({
        "dispositivo_id": dispositivo_id,
        "mes": mes,
        "anio": anio,
        "registros": [r.to_dict() for r in registros],
        "resumen": {
            "dias_registrados": len(registros),
            "total_horas": round(total_horas, 2),
            "consumo_kwh": round(consumo_kwh, 2),
            "costo_estimado": round(costo_estimado, 2)
        }
    }), 200


@registro_uso_bp.route('/api/dispositivos/<int:dispositivo_id>/registros', methods=['POST'])
@token_required
def guardar_registros(usuario_actual, dispositivo_id):
    """Guarda o actualiza los registros de uso (días seleccionados)"""
    
    # Verificar que el dispositivo existe y pertenece al usuario
    dispositivo = Dispositivo.query.get(dispositivo_id)
    
    if not dispositivo:
        return jsonify({"error": "Dispositivo no encontrado"}), 404
    
    if dispositivo.usuario_id != usuario_actual.id:
        return jsonify({"error": "No autorizado"}), 403
    
    data = request.get_json()
    fechas = data.get('fechas', [])  # Lista de fechas en formato "YYYY-MM-DD"
    horas_uso = data.get('horas_uso', 0)
    mes = data.get('mes', date.today().month)
    anio = data.get('anio', date.today().year)
    
    if not isinstance(fechas, list):
        return jsonify({"error": "El campo 'fechas' debe ser una lista"}), 400
    
    if horas_uso < 0 or horas_uso > 24:
        return jsonify({"error": "Las horas deben estar entre 0 y 24"}), 400
    
    try:
        # Eliminar registros existentes del mes para este dispositivo
        RegistroUso.query.filter(
            RegistroUso.dispositivo_id == dispositivo_id,
            extract('month', RegistroUso.fecha) == mes,
            extract('year', RegistroUso.fecha) == anio
        ).delete(synchronize_session=False)
        
        # Crear nuevos registros para las fechas seleccionadas
        registros_creados = []
        for fecha_str in fechas:
            try:
                fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
                
                # Verificar que la fecha corresponde al mes/año correcto
                if fecha.month == mes and fecha.year == anio:
                    nuevo_registro = RegistroUso(
                        dispositivo_id=dispositivo_id,
                        fecha=fecha,
                        horas_uso=horas_uso
                    )
                    db.session.add(nuevo_registro)
                    registros_creados.append(fecha_str)
            except ValueError:
                continue  # Ignorar fechas con formato inválido
        
        db.session.commit()
        
        # Calcular resumen actualizado
        total_horas = len(registros_creados) * horas_uso
        consumo_kwh = 0
        costo_estimado = 0
        
        if dispositivo.potencia_watts:
            consumo_kwh = (dispositivo.potencia_watts * total_horas) / 1000
            costo_estimado = consumo_kwh * 3.7
        
        return jsonify({
            "mensaje": "Registros guardados exitosamente",
            "dias_guardados": len(registros_creados),
            "resumen": {
                "dias_registrados": len(registros_creados),
                "total_horas": round(total_horas, 2),
                "consumo_kwh": round(consumo_kwh, 2),
                "costo_estimado": round(costo_estimado, 2)
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al guardar registros: {str(e)}"}), 500


@registro_uso_bp.route('/api/notificaciones/dispositivos-sin-registro', methods=['GET'])
@token_required
def obtener_dispositivos_sin_registro(usuario_actual):
    """Obtiene los dispositivos del usuario que no tienen registro para hoy"""
    
    hoy = date.today()
    
    # Obtener todos los dispositivos del usuario
    dispositivos = Dispositivo.query.filter_by(usuario_id=usuario_actual.id).all()
    
    dispositivos_sin_registro = []
    
    for dispositivo in dispositivos:
        # Verificar si tiene registro hoy
        registro_hoy = RegistroUso.query.filter(
            RegistroUso.dispositivo_id == dispositivo.id,
            RegistroUso.fecha == hoy
        ).first()
        
        if not registro_hoy:
            dispositivos_sin_registro.append({
                "id": dispositivo.id,
                "nombre": dispositivo.nombre,
                "categoria": dispositivo.categoria,
                "mensaje": f"No has registrado el uso de '{dispositivo.nombre}' para hoy"
            })
    
    return jsonify({
        "fecha": hoy.isoformat(),
        "total_sin_registro": len(dispositivos_sin_registro),
        "dispositivos": dispositivos_sin_registro
    }), 200


@registro_uso_bp.route('/api/dispositivos/<int:dispositivo_id>/consumo-mensual', methods=['GET'])
@token_required
def obtener_consumo_mensual(usuario_actual, dispositivo_id):
    """Obtiene el consumo mensual calculado basado en registros reales"""
    
    # Verificar que el dispositivo existe y pertenece al usuario
    dispositivo = Dispositivo.query.get(dispositivo_id)
    
    if not dispositivo:
        return jsonify({"error": "Dispositivo no encontrado"}), 404
    
    if dispositivo.usuario_id != usuario_actual.id:
        return jsonify({"error": "No autorizado"}), 403
    
    mes = request.args.get('mes', date.today().month, type=int)
    anio = request.args.get('anio', date.today().year, type=int)
    
    # Obtener registros del mes
    registros = RegistroUso.query.filter(
        RegistroUso.dispositivo_id == dispositivo_id,
        extract('month', RegistroUso.fecha) == mes,
        extract('year', RegistroUso.fecha) == anio
    ).all()
    
    if not registros:
        return jsonify({
            "dispositivo_id": dispositivo_id,
            "mes": mes,
            "anio": anio,
            "tiene_registros": False,
            "mensaje": "Sin registros"
        }), 200
    
    total_horas = sum(r.horas_uso for r in registros)
    consumo_kwh = 0
    costo_estimado = 0
    
    if dispositivo.potencia_watts:
        consumo_kwh = (dispositivo.potencia_watts * total_horas) / 1000
        costo_estimado = consumo_kwh * 3.7
    
    return jsonify({
        "dispositivo_id": dispositivo_id,
        "dispositivo_nombre": dispositivo.nombre,
        "mes": mes,
        "anio": anio,
        "tiene_registros": True,
        "dias_registrados": len(registros),
        "total_horas": round(total_horas, 2),
        "consumo_kwh": round(consumo_kwh, 2),
        "costo_estimado": round(costo_estimado, 2),
        "potencia_watts": dispositivo.potencia_watts
    }), 200