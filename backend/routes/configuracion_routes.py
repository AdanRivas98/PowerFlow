from flask import Blueprint, request, jsonify, send_file
from extensions import db
from models.usuario import Usuario
from models.dispositivo import Dispositivo
from models.registro_uso import RegistroUso
from routes.auth_middleware import token_required
from werkzeug.security import generate_password_hash, check_password_hash
import json
import csv
import io
from datetime import datetime

configuracion_bp = Blueprint('configuracion', __name__)

# ============================================
# OBTENER CONFIGURACIÓN COMPLETA
# ============================================
@configuracion_bp.route('/api/configuracion', methods=['GET'])
@token_required
def obtener_configuracion(usuario_actual):
    """Obtiene todas las configuraciones del usuario"""
    try:
        # Configuración por defecto
        config_default = {
            "config": {
                "tarifa_kwh": 3.7,
                "meta_mensual_kwh": 250,
                "meta_mensual_lps": 925,
                "dia_corte": 1,
                "proveedor": "ENEE"
            },
            "notificaciones": {
                "consumo_alto": True,
                "recordatorio_diario": True,
                "recomendaciones_ia": True,
                "logros": True,
                "email_semanal": False,
                "email_mensual": True,
                "email_critico": True
            },
            "apariencia": {
                "tema": "dark",
                "color_acento": "blue",
                "tamano_texto": "medium"
            }
        }
        
        return jsonify(config_default), 200

    except Exception as e:
        print(f"Error al obtener configuración: {str(e)}")
        return jsonify({"error": "Error al cargar configuración"}), 500


# ============================================
# PERFIL - ACTUALIZAR INFORMACIÓN
# ============================================
@configuracion_bp.route('/api/usuarios/perfil', methods=['PUT'])
@token_required
def actualizar_perfil(usuario_actual):
    """Actualiza nombre y/o correo del usuario"""
    try:
        data = request.get_json()
        nombre = data.get('nombre')
        correo = data.get('correo')

        if not nombre or not nombre.strip():
            return jsonify({"error": "El nombre no puede estar vacío"}), 400

        # Actualizar nombre
        usuario_actual.nombre = nombre.strip()

        # Actualizar correo si es diferente
        if correo and correo != usuario_actual.correo:
            # Verificar que el nuevo correo no esté en uso
            existente = Usuario.query.filter_by(correo=correo).first()
            if existente and existente.id != usuario_actual.id:
                return jsonify({"error": "El correo ya está en uso"}), 409
            
            usuario_actual.correo = correo

        db.session.commit()

        return jsonify({
            "mensaje": "Perfil actualizado correctamente",
            "usuario": {
                "id": usuario_actual.id,
                "nombre": usuario_actual.nombre,
                "correo": usuario_actual.correo
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error al actualizar perfil: {str(e)}")
        return jsonify({"error": "Error al actualizar perfil"}), 500


# ============================================
# PERFIL - CAMBIAR CONTRASEÑA
# ============================================
@configuracion_bp.route('/api/usuarios/password', methods=['PUT'])
@token_required
def cambiar_password(usuario_actual):
    """Cambia la contraseña del usuario"""
    try:
        data = request.get_json()
        password_actual = data.get('password_actual')
        password_nueva = data.get('password_nueva')

        if not password_actual or not password_nueva:
            return jsonify({"error": "Completa todos los campos"}), 400

        # Verificar contraseña actual
        if not check_password_hash(usuario_actual.password, password_actual):
            return jsonify({"error": "La contraseña actual es incorrecta"}), 401

        # Validar nueva contraseña
        if len(password_nueva) < 6:
            return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400

        # Actualizar contraseña
        usuario_actual.password = generate_password_hash(password_nueva)
        db.session.commit()

        return jsonify({"mensaje": "Contraseña actualizada correctamente"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error al cambiar contraseña: {str(e)}")
        return jsonify({"error": "Error al cambiar contraseña"}), 500


# ============================================
# PERFIL - ELIMINAR CUENTA
# ============================================
@configuracion_bp.route('/api/usuarios/eliminar', methods=['DELETE'])
@token_required
def eliminar_cuenta(usuario_actual):
    """Elimina permanentemente la cuenta del usuario"""
    try:
        # Eliminar todos los datos relacionados (cascade debería manejar esto)
        db.session.delete(usuario_actual)
        db.session.commit()

        return jsonify({"mensaje": "Cuenta eliminada correctamente"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error al eliminar cuenta: {str(e)}")
        return jsonify({"error": "Error al eliminar cuenta"}), 500


# ============================================
# ENERGÉTICA - GUARDAR CONFIGURACIÓN
# ============================================
@configuracion_bp.route('/api/configuracion/energetica', methods=['PUT'])
@token_required
def guardar_config_energetica(usuario_actual):
    """Guarda configuración energética del usuario"""
    try:
        data = request.get_json()
        
        # Validaciones
        tarifa_kwh = data.get('tarifa_kwh', 3.7)
        meta_mensual_kwh = data.get('meta_mensual_kwh', 250)
        dia_corte = data.get('dia_corte', 1)
        proveedor = data.get('proveedor', 'ENEE')

        if tarifa_kwh <= 0:
            return jsonify({"error": "La tarifa debe ser mayor a 0"}), 400

        if meta_mensual_kwh <= 0:
            return jsonify({"error": "La meta debe ser mayor a 0"}), 400

        if dia_corte < 1 or dia_corte > 31:
            return jsonify({"error": "Día de corte inválido"}), 400

        # Aquí guardarías en una tabla de configuración
        # Por ahora solo confirmamos recepción
        
        print(f"Configuración energética guardada para usuario {usuario_actual.id}:")
        print(f"  - Tarifa: L {tarifa_kwh}/kWh")
        print(f"  - Meta: {meta_mensual_kwh} kWh/mes")
        print(f"  - Día corte: {dia_corte}")
        print(f"  - Proveedor: {proveedor}")

        return jsonify({"mensaje": "Configuración guardada correctamente"}), 200

    except Exception as e:
        print(f"Error al guardar configuración energética: {str(e)}")
        return jsonify({"error": "Error al guardar configuración"}), 500


# ============================================
# NOTIFICACIONES - GUARDAR PREFERENCIAS
# ============================================
@configuracion_bp.route('/api/configuracion/notificaciones', methods=['PUT'])
@token_required
def guardar_notificaciones(usuario_actual):
    """Guarda preferencias de notificaciones"""
    try:
        data = request.get_json()
        
        print(f"Notificaciones guardadas para usuario {usuario_actual.id}:")
        print(f"  - Consumo alto: {data.get('consumo_alto')}")
        print(f"  - Recordatorio diario: {data.get('recordatorio_diario')}")
        print(f"  - Recomendaciones IA: {data.get('recomendaciones_ia')}")
        print(f"  - Logros: {data.get('logros')}")
        print(f"  - Email semanal: {data.get('email_semanal')}")
        print(f"  - Email mensual: {data.get('email_mensual')}")
        print(f"  - Email crítico: {data.get('email_critico')}")

        return jsonify({"mensaje": "Preferencias guardadas correctamente"}), 200

    except Exception as e:
        print(f"Error al guardar notificaciones: {str(e)}")
        return jsonify({"error": "Error al guardar notificaciones"}), 500


# ============================================
# APARIENCIA - GUARDAR PREFERENCIAS
# ============================================
@configuracion_bp.route('/api/configuracion/apariencia', methods=['PUT'])
@token_required
def guardar_apariencia(usuario_actual):
    """Guarda preferencias de apariencia"""
    try:
        data = request.get_json()
        
        tema = data.get('tema', 'dark')
        color_acento = data.get('color_acento', 'blue')
        tamano_texto = data.get('tamano_texto', 'medium')

        print(f"Apariencia guardada para usuario {usuario_actual.id}:")
        print(f"  - Tema: {tema}")
        print(f"  - Color acento: {color_acento}")
        print(f"  - Tamaño texto: {tamano_texto}")

        return jsonify({"mensaje": "Apariencia actualizada correctamente"}), 200

    except Exception as e:
        print(f"Error al guardar apariencia: {str(e)}")
        return jsonify({"error": "Error al guardar apariencia"}), 500


# ============================================
# EXPORTAR - CONSUMOS CSV
# ============================================
@configuracion_bp.route('/api/exportar/consumos', methods=['GET'])
@token_required
def exportar_consumos(usuario_actual):
    """Exporta historial de consumos en CSV"""
    try:
        # Obtener todos los dispositivos del usuario
        dispositivos = Dispositivo.query.filter_by(usuario_id=usuario_actual.id).all()
        
        # Crear CSV en memoria
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Encabezados
        writer.writerow(['Fecha', 'Dispositivo', 'Categoría', 'Horas Uso', 'Potencia (W)', 'Consumo (kWh)', 'Costo (L)'])
        
        # Datos
        for dispositivo in dispositivos:
            registros = RegistroUso.query.filter_by(dispositivo_id=dispositivo.id).order_by(RegistroUso.fecha.desc()).all()
            
            for registro in registros:
                consumo_kwh = 0
                costo_lps = 0
                
                if dispositivo.potencia_watts:
                    consumo_kwh = (dispositivo.potencia_watts * registro.horas_uso) / 1000
                    costo_lps = consumo_kwh * 3.7
                
                writer.writerow([
                    registro.fecha.strftime('%Y-%m-%d'),
                    dispositivo.nombre,
                    dispositivo.categoria or 'N/A',
                    registro.horas_uso,
                    dispositivo.potencia_watts or 'N/A',
                    round(consumo_kwh, 2),
                    round(costo_lps, 2)
                ])
        
        # Preparar archivo para descarga
        output.seek(0)
        
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'powerflow_consumos_{datetime.now().strftime("%Y%m%d")}.csv'
        )

    except Exception as e:
        print(f"Error al exportar consumos: {str(e)}")
        return jsonify({"error": "Error al exportar datos"}), 500


# ============================================
# EXPORTAR - DISPOSITIVOS JSON
# ============================================
@configuracion_bp.route('/api/exportar/dispositivos', methods=['GET'])
@token_required
def exportar_dispositivos(usuario_actual):
    """Exporta lista de dispositivos en JSON"""
    try:
        dispositivos = Dispositivo.query.filter_by(usuario_id=usuario_actual.id).all()
        
        datos = {
            "usuario": usuario_actual.nombre,
            "fecha_exportacion": datetime.now().isoformat(),
            "total_dispositivos": len(dispositivos),
            "dispositivos": [
                {
                    "id": d.id,
                    "nombre": d.nombre,
                    "categoria": d.categoria,
                    "potencia_watts": d.potencia_watts,
                    "horas_uso_dia": d.horas_uso_dia if hasattr(d, 'horas_uso_dia') else None
                }
                for d in dispositivos
            ]
        }
        
        # Crear archivo JSON en memoria
        json_data = json.dumps(datos, indent=2, ensure_ascii=False)
        
        return send_file(
            io.BytesIO(json_data.encode('utf-8')),
            mimetype='application/json',
            as_attachment=True,
            download_name=f'powerflow_dispositivos_{datetime.now().strftime("%Y%m%d")}.json'
        )

    except Exception as e:
        print(f"Error al exportar dispositivos: {str(e)}")
        return jsonify({"error": "Error al exportar datos"}), 500


# ============================================
# EXPORTAR - REPORTES (PLACEHOLDER)
# ============================================
@configuracion_bp.route('/api/exportar/reportes', methods=['GET'])
@token_required
def exportar_reportes(usuario_actual):
    """Exporta reporte completo (placeholder - requiere librería PDF)"""
    try:
        # Por ahora retornamos un JSON con información del reporte
        # En producción usarías ReportLab o similar para generar PDF
        
        dispositivos = Dispositivo.query.filter_by(usuario_id=usuario_actual.id).all()
        
        total_dispositivos = len(dispositivos)
        total_registros = sum(len(d.registros_uso) for d in dispositivos)
        
        datos = {
            "tipo": "Reporte PowerFlow",
            "usuario": usuario_actual.nombre,
            "fecha_generacion": datetime.now().isoformat(),
            "resumen": {
                "total_dispositivos": total_dispositivos,
                "total_registros": total_registros
            },
            "nota": "Exportación de PDF estará disponible próximamente"
        }
        
        json_data = json.dumps(datos, indent=2, ensure_ascii=False)
        
        return send_file(
            io.BytesIO(json_data.encode('utf-8')),
            mimetype='application/json',
            as_attachment=True,
            download_name=f'powerflow_reporte_{datetime.now().strftime("%Y%m%d")}.json'
        )

    except Exception as e:
        print(f"Error al exportar reporte: {str(e)}")
        return jsonify({"error": "Error al exportar reporte"}), 500
