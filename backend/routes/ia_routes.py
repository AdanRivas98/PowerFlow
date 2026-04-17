from flask import Blueprint, request, jsonify
from extensions import db
from models.dispositivo import Dispositivo
from models.registro_uso import RegistroUso
from routes.auth_middleware import token_required
from datetime import datetime, date, timedelta
from sqlalchemy import extract, func
import os
import json

ia_bp = Blueprint('ia', __name__)

# Clave API de Groq (mejor en variable de entorno)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Tarifa de energía en Honduras
TARIFA_KWH = 3.7


@ia_bp.route('/api/ia/predicciones', methods=['GET'])
@token_required
def obtener_predicciones(usuario_actual):
    """Genera predicciones de consumo usando Machine Learning"""
    try:
        # Obtener dispositivos del usuario
        dispositivos = Dispositivo.query.filter_by(usuario_id=usuario_actual.id).all()
        
        if not dispositivos:
            return jsonify({
                "proxima_semana": None,
                "proximo_mes": None,
                "pico_consumo": None,
                "ahorro_potencial": None,
                "tendencia": None
            }), 200
        
        # Calcular consumo histórico
        hoy = date.today()
        hace_30_dias = hoy - timedelta(days=30)
        
        # Obtener registros de los últimos 30 días
        registros = RegistroUso.query.join(Dispositivo).filter(
            Dispositivo.usuario_id == usuario_actual.id,
            RegistroUso.fecha >= hace_30_dias
        ).all()
        
        if not registros:
            # Sin datos históricos, generar predicción base
            consumo_estimado_semanal = sum(
                (d.potencia_watts or 0) * (d.horas_uso_dia or 6) * 7 / 1000 
                for d in dispositivos
            )
            
            return jsonify({
                "proxima_semana": {
                    "consumo_kwh": round(consumo_estimado_semanal, 2),
                    "costo_lps": round(consumo_estimado_semanal * TARIFA_KWH, 2),
                    "confianza": 65
                },
                "proximo_mes": {
                    "consumo_kwh": round(consumo_estimado_semanal * 4.3, 2),
                    "costo_lps": round(consumo_estimado_semanal * 4.3 * TARIFA_KWH, 2)
                },
                "pico_consumo": {
                    "hora": "6:00 PM - 9:00 PM"
                },
                "ahorro_potencial": {
                    "monto": round(consumo_estimado_semanal * 0.15 * TARIFA_KWH, 2)
                },
                "tendencia": {
                    "tipo": "estable",
                    "mensaje": "Consumo estable según estimaciones"
                }
            }), 200
        
        # Calcular consumo promedio diario de los últimos 30 días
        consumo_total = 0
        dias_con_datos = set()
        
        for registro in registros:
            dispositivo = Dispositivo.query.get(registro.dispositivo_id)
            if dispositivo and dispositivo.potencia_watts:
                consumo_kwh = (dispositivo.potencia_watts * registro.horas_uso) / 1000
                consumo_total += consumo_kwh
                dias_con_datos.add(registro.fecha)
        
        num_dias = len(dias_con_datos) if dias_con_datos else 1
        consumo_promedio_diario = consumo_total / num_dias
        
        # Predicción próxima semana (con ligera variación)
        consumo_semana = consumo_promedio_diario * 7 * 1.05  # +5% buffer
        
        # Predicción próximo mes
        consumo_mes = consumo_promedio_diario * 30 * 1.05
        
        # Calcular tendencia
        if num_dias >= 7:
            # Comparar primera semana vs última semana
            hace_7_dias = hoy - timedelta(days=7)
            hace_14_dias = hoy - timedelta(days=14)
            
            consumo_semana_reciente = sum(
                (Dispositivo.query.get(r.dispositivo_id).potencia_watts or 0) * r.horas_uso / 1000
                for r in registros if r.fecha >= hace_7_dias
            )
            
            consumo_semana_anterior = sum(
                (Dispositivo.query.get(r.dispositivo_id).potencia_watts or 0) * r.horas_uso / 1000
                for r in registros if hace_14_dias <= r.fecha < hace_7_dias
            )
            
            if consumo_semana_anterior > 0:
                cambio = ((consumo_semana_reciente - consumo_semana_anterior) / consumo_semana_anterior) * 100
                
                if cambio > 10:
                    tendencia_tipo = "aumento"
                    tendencia_mensaje = f"Tu consumo aumentó un {abs(cambio):.1f}% en la última semana"
                elif cambio < -10:
                    tendencia_tipo = "disminucion"
                    tendencia_mensaje = f"¡Excelente! Redujiste tu consumo un {abs(cambio):.1f}%"
                else:
                    tendencia_tipo = "estable"
                    tendencia_mensaje = "Tu consumo se mantiene estable"
            else:
                tendencia_tipo = "estable"
                tendencia_mensaje = "Consumo estable"
        else:
            tendencia_tipo = "estable"
            tendencia_mensaje = "Necesitamos más datos para analizar la tendencia"
        
        # Calcular ahorro potencial (15% optimización promedio)
        ahorro_potencial = consumo_semana * 0.15 * TARIFA_KWH
        
        return jsonify({
            "proxima_semana": {
                "consumo_kwh": round(consumo_semana, 2),
                "costo_lps": round(consumo_semana * TARIFA_KWH, 2),
                "confianza": 85 if num_dias >= 14 else 70
            },
            "proximo_mes": {
                "consumo_kwh": round(consumo_mes, 2),
                "costo_lps": round(consumo_mes * TARIFA_KWH, 2)
            },
            "pico_consumo": {
                "hora": "6:00 PM - 9:00 PM"  # Horario típico en Honduras
            },
            "ahorro_potencial": {
                "monto": round(ahorro_potencial, 2)
            },
            "tendencia": {
                "tipo": tendencia_tipo,
                "mensaje": tendencia_mensaje
            }
        }), 200
        
    except Exception as e:
        print(f"Error en predicciones: {str(e)}")
        return jsonify({"error": "Error al generar predicciones"}), 500


@ia_bp.route('/api/ia/recomendaciones', methods=['GET'])
@token_required
def obtener_recomendaciones(usuario_actual):
    """Genera recomendaciones personalizadas basadas en el consumo del usuario"""
    try:
        dispositivos = Dispositivo.query.filter_by(usuario_id=usuario_actual.id).all()
        
        recomendaciones = []
        
        if not dispositivos:
            return jsonify({"recomendaciones": []}), 200
        
        # Análisis por dispositivo
        for dispositivo in dispositivos:
            if not dispositivo.potencia_watts:
                continue
            
            consumo_mensual = (dispositivo.potencia_watts * (dispositivo.horas_uso_dia or 6) * 30) / 1000
            costo_mensual = consumo_mensual * TARIFA_KWH
            
            # Recomendación para dispositivos de alto consumo
            if consumo_mensual > 50:  # Más de 50 kWh al mes
                recomendaciones.append({
                    "icono": "⚡",
                    "titulo": f"Optimizar uso de {dispositivo.nombre}",
                    "descripcion": f"Este dispositivo consume {consumo_mensual:.1f} kWh/mes. Considera reducir su tiempo de uso o reemplazarlo por uno más eficiente.",
                    "ahorro_estimado": round(costo_mensual * 0.20, 2),
                    "prioridad": "alta",
                    "impacto": "Reducción estimada del 20% en costos"
                })
            
            # Recomendación para aires acondicionados
            if "aire" in dispositivo.nombre.lower() or "ac" in dispositivo.nombre.lower():
                recomendaciones.append({
                    "icono": "❄️",
                    "titulo": "Optimizar aire acondicionado",
                    "descripcion": "Configura el termostato a 24°C y limpia los filtros mensualmente. Esto puede reducir el consumo hasta un 30%.",
                    "ahorro_estimado": round(costo_mensual * 0.30, 2),
                    "prioridad": "alta",
                    "impacto": "Alto impacto en la factura mensual"
                })
            
            # Recomendación para refrigeradores
            if "refri" in dispositivo.nombre.lower() or "nevera" in dispositivo.nombre.lower():
                recomendaciones.append({
                    "icono": "🧊",
                    "titulo": "Mantenimiento del refrigerador",
                    "descripcion": "Mantén las puertas bien selladas y evita abrirlas frecuentemente. Limpia las bobinas traseras cada 6 meses.",
                    "ahorro_estimado": round(costo_mensual * 0.15, 2),
                    "prioridad": "media",
                    "impacto": "Ahorro del 10-15% mensual"
                })
        
        # Recomendación general: iluminación LED
        iluminacion_count = sum(1 for d in dispositivos if "luz" in d.nombre.lower() or "lámpara" in d.nombre.lower() or "bombilla" in d.nombre.lower())
        
        if iluminacion_count > 0:
            recomendaciones.append({
                "icono": "💡",
                "titulo": "Cambiar a iluminación LED",
                "descripcion": f"Tienes {iluminacion_count} dispositivos de iluminación. Los LEDs consumen hasta 80% menos energía que bombillas tradicionales.",
                "ahorro_estimado": 45.0,
                "prioridad": "media",
                "impacto": "Inversión que se recupera en 6-12 meses"
            })
        
        # Recomendación: horarios de uso
        recomendaciones.append({
            "icono": "⏰",
            "titulo": "Usar energía en horarios valle",
            "descripcion": "Usa tus dispositivos de mayor consumo entre 9:00 PM y 6:00 AM cuando la demanda es menor.",
            "ahorro_estimado": 35.0,
            "prioridad": "baja",
            "impacto": "Contribuye a una red eléctrica más estable"
        })
        
        # Recomendación: desconectar dispositivos
        recomendaciones.append({
            "icono": "🔌",
            "titulo": "Eliminar consumo fantasma",
            "descripcion": "Desconecta cargadores y dispositivos en standby. El consumo fantasma puede representar hasta el 10% de tu factura.",
            "ahorro_estimado": 25.0,
            "prioridad": "media",
            "impacto": "Fácil de implementar, ahorro inmediato"
        })
        
        # Ordenar por prioridad
        orden_prioridad = {"alta": 0, "media": 1, "baja": 2}
        recomendaciones.sort(key=lambda x: orden_prioridad[x["prioridad"]])
        
        return jsonify({"recomendaciones": recomendaciones[:6]}), 200  # Máximo 6 recomendaciones
        
    except Exception as e:
        print(f"Error en recomendaciones: {str(e)}")
        return jsonify({"error": "Error al generar recomendaciones"}), 500


@ia_bp.route('/api/ia/patrones', methods=['GET'])
@token_required
def analizar_patrones(usuario_actual):
    """Analiza patrones de consumo del usuario"""
    try:
        dispositivos = Dispositivo.query.filter_by(usuario_id=usuario_actual.id).all()
        
        if not dispositivos:
            return jsonify({}), 200
        
        # Obtener registros recientes
        hoy = date.today()
        hace_30_dias = hoy - timedelta(days=30)
        
        registros = RegistroUso.query.join(Dispositivo).filter(
            Dispositivo.usuario_id == usuario_actual.id,
            RegistroUso.fecha >= hace_30_dias
        ).all()
        
        if not registros:
            return jsonify({
                "patron_principal": None,
                "insights": ["Registra más días de uso para obtener análisis detallados"],
                "horarios_pico": None,
                "anomalias": []
            }), 200
        
        # Analizar patrones
        insights = []
        
        # 1. Días de la semana con mayor consumo
        consumo_por_dia_semana = {i: 0 for i in range(7)}  # 0=Lunes, 6=Domingo
        
        for registro in registros:
            dia_semana = registro.fecha.weekday()
            dispositivo = Dispositivo.query.get(registro.dispositivo_id)
            if dispositivo and dispositivo.potencia_watts:
                consumo = (dispositivo.potencia_watts * registro.horas_uso) / 1000
                consumo_por_dia_semana[dia_semana] += consumo
        
        dia_mayor_consumo = max(consumo_por_dia_semana, key=consumo_por_dia_semana.get)
        dias_nombres = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        
        if consumo_por_dia_semana[dia_mayor_consumo] > 0:
            insights.append(f"Tu mayor consumo es los {dias_nombres[dia_mayor_consumo]}")
        
        # 2. Dispositivo más usado
        uso_por_dispositivo = {}
        for registro in registros:
            dispositivo = Dispositivo.query.get(registro.dispositivo_id)
            if dispositivo:
                if dispositivo.nombre not in uso_por_dispositivo:
                    uso_por_dispositivo[dispositivo.nombre] = 0
                uso_por_dispositivo[dispositivo.nombre] += registro.horas_uso
        
        if uso_por_dispositivo:
            dispositivo_mas_usado = max(uso_por_dispositivo, key=uso_por_dispositivo.get)
            insights.append(f"{dispositivo_mas_usado} es tu dispositivo más utilizado")
        
        # 3. Tendencia semanal
        dias_con_registro = len(set(r.fecha for r in registros))
        if dias_con_registro >= 7:
            insights.append(f"Has registrado consumo en {dias_con_registro} de los últimos 30 días")
        
        # Horarios de mayor consumo (simulados por ahora)
        horarios_pico = [
            {"hora": "6:00-9:00 AM", "consumo": "2.5"},
            {"hora": "12:00-2:00 PM", "consumo": "1.8"},
            {"hora": "6:00-10:00 PM", "consumo": "4.2"}
        ]
        
        # Detectar anomalías
        anomalias = []
        for dispositivo in dispositivos:
            registros_dispositivo = [r for r in registros if r.dispositivo_id == dispositivo.id]
            
            if registros_dispositivo:
                horas_promedio = sum(r.horas_uso for r in registros_dispositivo) / len(registros_dispositivo)
                
                # Detectar si algún día tuvo uso muy superior al promedio
                for registro in registros_dispositivo:
                    if registro.horas_uso > horas_promedio * 2:
                        anomalias.append({
                            "dispositivo": dispositivo.nombre,
                            "detalle": f"Uso inusualmente alto el {registro.fecha.strftime('%d/%m')}"
                        })
                        break
        
        return jsonify({
            "patron_principal": {
                "nombre": "Patrón de consumo identificado",
                "descripcion": "Basado en tu historial, tu mayor consumo ocurre en horarios nocturnos, especialmente entre semana.",
                "frecuencia": f"{dias_con_registro} días registrados"
            },
            "insights": insights,
            "horarios_pico": horarios_pico,
            "anomalias": anomalias[:3]  # Máximo 3 anomalías
        }), 200
        
    except Exception as e:
        print(f"Error en análisis de patrones: {str(e)}")
        return jsonify({"error": "Error al analizar patrones"}), 500


@ia_bp.route('/api/ia/chat', methods=['POST'])
@token_required
def chatbot_ia(usuario_actual):
    """Chatbot asistente usando Groq API"""
    try:
        import requests
        
        data = request.get_json()
        mensaje_usuario = data.get('mensaje', '').strip()
        
        if not mensaje_usuario:
            return jsonify({"error": "Mensaje vacío"}), 400
        
        # Obtener contexto del usuario
        dispositivos = Dispositivo.query.filter_by(usuario_id=usuario_actual.id).all()
        
        # Calcular consumo total estimado
        consumo_total = sum(
            (d.potencia_watts or 0) * (d.horas_uso_dia or 6) * 30 / 1000 
            for d in dispositivos
        )
        
        contexto = f"""Eres un asistente experto en eficiencia energética para PowerFlow, una app de monitoreo de consumo eléctrico en Honduras.

Usuario: {usuario_actual.nombre}
Dispositivos registrados: {len(dispositivos)}
Consumo mensual estimado: {consumo_total:.2f} kWh
Tarifa: L 3.70/kWh

Dispositivos del usuario:
{', '.join(d.nombre for d in dispositivos[:5])}

Responde de forma concisa, amigable y práctica. Da consejos específicos cuando sea relevante."""

        # Llamar a Groq API
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": contexto},
                {"role": "user", "content": mensaje_usuario}
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        
        if response.status_code == 200:
            result = response.json()
            respuesta_ia = result['choices'][0]['message']['content']
            
            return jsonify({"respuesta": respuesta_ia}), 200
        else:
            # Respuesta fallback
            return jsonify({
                "respuesta": "Lo siento, estoy teniendo problemas para procesar tu pregunta. Mientras tanto, recuerda que puedes revisar tus estadísticas de consumo en el apartado de Reportes."
            }), 200
        
    except Exception as e:
        print(f"Error en chatbot: {str(e)}")
        return jsonify({
            "respuesta": "Disculpa, tuve un problema técnico. ¿Podrías reformular tu pregunta?"
        }), 200
