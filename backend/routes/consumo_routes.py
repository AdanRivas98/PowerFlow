from flask import Blueprint, request, jsonify
from extensions import db
from models.dispositivo import Dispositivo
from models.registro_uso import RegistroUso
from routes.auth_middleware import token_required
from datetime import datetime, date, timedelta
from sqlalchemy import extract, func
from collections import defaultdict

consumo_bp = Blueprint('consumo', __name__)

@consumo_bp.route('/api/consumo/resumen', methods=['GET'])
@token_required
def obtener_resumen_consumo(usuario_actual):
    """
    Obtiene el resumen de consumo energético del usuario
    
    Query params:
    - periodo: 'dia' | 'semana' | 'mes' | 'anio' (default: 'mes')
    - mes: número del mes (1-12) - solo para periodo='mes'
    - anio: año (YYYY) - solo para periodo='mes'
    """
    
    try:
        # Obtener parámetros
        periodo = request.args.get('periodo', 'mes')
        mes_param = request.args.get('mes', type=int)
        anio_param = request.args.get('anio', type=int)
        
        # Calcular fechas según período
        hoy = date.today()
        
        if periodo == 'dia':
            fecha_inicio = hoy
            fecha_fin = hoy
        elif periodo == 'semana':
            fecha_inicio = hoy - timedelta(days=6)
            fecha_fin = hoy
        elif periodo == 'mes':
            if mes_param and anio_param:
                mes = mes_param
                anio = anio_param
            else:
                mes = hoy.month
                anio = hoy.year
            
            fecha_inicio = date(anio, mes, 1)
            # Último día del mes
            if mes == 12:
                fecha_fin = date(anio, 12, 31)
            else:
                fecha_fin = date(anio, mes + 1, 1) - timedelta(days=1)
        elif periodo == 'anio':
            fecha_inicio = date(hoy.year, 1, 1)
            fecha_fin = date(hoy.year, 12, 31)
        else:
            return jsonify({"error": "Período no válido"}), 400
        
        # Obtener todos los dispositivos del usuario
        dispositivos = Dispositivo.query.filter_by(usuario_id=usuario_actual.id).all()
        
        if not dispositivos:
            return jsonify({
                "mensaje": "No tienes dispositivos registrados",
                "consumo_total_kwh": 0,
                "costo_total": 0,
                "promedio_diario": 0,
                "dias_registrados": 0,
                "dia_mas_alto": None,
                "comparacion_periodo_anterior": None,
                "tendencia_diaria": [],
                "por_dispositivo": [],
                "por_categoria": []
            }), 200
        
        dispositivos_ids = [d.id for d in dispositivos]
        
        # Obtener registros del período
        registros = RegistroUso.query.filter(
            RegistroUso.dispositivo_id.in_(dispositivos_ids),
            RegistroUso.fecha >= fecha_inicio,
            RegistroUso.fecha <= fecha_fin
        ).all()
        
        if not registros:
            return jsonify({
                "mensaje": "No hay registros para este período",
                "periodo": periodo,
                "inicio": fecha_inicio.isoformat(),
                "fin": fecha_fin.isoformat(),
                "consumo_total_kwh": 0,
                "costo_total": 0,
                "promedio_diario": 0,
                "dias_registrados": 0,
                "dia_mas_alto": None,
                "comparacion_periodo_anterior": None,
                "tendencia_diaria": [],
                "por_dispositivo": [],
                "por_categoria": []
            }), 200
        
        # Crear mapas de dispositivos para acceso rápido
        dispositivos_map = {d.id: d for d in dispositivos}
        
        # **CALCULAR CONSUMO TOTAL**
        consumo_total_kwh = 0
        consumo_por_dispositivo = defaultdict(lambda: {"horas": 0, "kwh": 0, "costo": 0})
        consumo_por_dia = defaultdict(float)
        
        for registro in registros:
            dispositivo = dispositivos_map.get(registro.dispositivo_id)
            if not dispositivo or not dispositivo.potencia_watts:
                continue
            
            # Calcular consumo de este registro
            consumo_kwh = (dispositivo.potencia_watts * registro.horas_uso) / 1000
            costo = consumo_kwh * 3.7  # Tarifa Honduras
            
            # Acumular totales
            consumo_total_kwh += consumo_kwh
            
            # Acumular por dispositivo
            consumo_por_dispositivo[registro.dispositivo_id]["horas"] += registro.horas_uso
            consumo_por_dispositivo[registro.dispositivo_id]["kwh"] += consumo_kwh
            consumo_por_dispositivo[registro.dispositivo_id]["costo"] += costo
            
            # Acumular por día
            consumo_por_dia[registro.fecha] += consumo_kwh
        
        costo_total = consumo_total_kwh * 3.7
        
        # **CALCULAR DÍAS REGISTRADOS Y PROMEDIO**
        dias_unicos = len(set(r.fecha for r in registros))
        promedio_diario = consumo_total_kwh / dias_unicos if dias_unicos > 0 else 0
        
        # **ENCONTRAR DÍA MÁS ALTO**
        dia_mas_alto = None
        if consumo_por_dia:
            fecha_max = max(consumo_por_dia, key=consumo_por_dia.get)
            consumo_max = consumo_por_dia[fecha_max]
            dia_mas_alto = {
                "fecha": fecha_max.isoformat(),
                "consumo_kwh": round(consumo_max, 2),
                "costo": round(consumo_max * 3.7, 2)
            }
        
        # **COMPARACIÓN CON PERÍODO ANTERIOR**
        comparacion = None
        if periodo == 'mes':
            # Calcular mes anterior
            if mes == 1:
                mes_anterior = 12
                anio_anterior = anio - 1
            else:
                mes_anterior = mes - 1
                anio_anterior = anio
            
            fecha_inicio_anterior = date(anio_anterior, mes_anterior, 1)
            if mes_anterior == 12:
                fecha_fin_anterior = date(anio_anterior, 12, 31)
            else:
                fecha_fin_anterior = date(anio_anterior, mes_anterior + 1, 1) - timedelta(days=1)
            
            # Obtener registros del período anterior
            registros_anteriores = RegistroUso.query.filter(
                RegistroUso.dispositivo_id.in_(dispositivos_ids),
                RegistroUso.fecha >= fecha_inicio_anterior,
                RegistroUso.fecha <= fecha_fin_anterior
            ).all()
            
            # Calcular consumo anterior
            consumo_anterior = 0
            for registro in registros_anteriores:
                dispositivo = dispositivos_map.get(registro.dispositivo_id)
                if dispositivo and dispositivo.potencia_watts:
                    consumo_anterior += (dispositivo.potencia_watts * registro.horas_uso) / 1000
            
            if consumo_anterior > 0:
                diferencia_kwh = consumo_total_kwh - consumo_anterior
                diferencia_porcentaje = (diferencia_kwh / consumo_anterior) * 100
                
                comparacion = {
                    "diferencia_kwh": round(abs(diferencia_kwh), 2),
                    "diferencia_porcentaje": round(abs(diferencia_porcentaje), 1),
                    "direccion": "aumento" if diferencia_kwh > 0 else "disminucion"
                }
        
        # **TENDENCIA DIARIA**
        tendencia_diaria = []
        fecha_actual = fecha_inicio
        while fecha_actual <= fecha_fin:
            consumo = consumo_por_dia.get(fecha_actual, 0)
            tendencia_diaria.append({
                "dia": fecha_actual.day,
                "fecha": fecha_actual.strftime("%d/%m"),
                "consumo": round(consumo, 1),
                "costo": round(consumo * 3.7, 2)
            })
            fecha_actual += timedelta(days=1)
        
        # **CONSUMO POR DISPOSITIVO (TOP)**
        por_dispositivo = []
        for disp_id, datos in consumo_por_dispositivo.items():
            dispositivo = dispositivos_map[disp_id]
            porcentaje = (datos["kwh"] / consumo_total_kwh * 100) if consumo_total_kwh > 0 else 0
            
            por_dispositivo.append({
                "id": dispositivo.id,
                "nombre": dispositivo.nombre,
                "categoria": dispositivo.categoria,
                "consumo_kwh": round(datos["kwh"], 1),
                "costo": round(datos["costo"], 2),
                "porcentaje": round(porcentaje, 1)
            })
        
        # Ordenar por consumo descendente y tomar top 5
        por_dispositivo.sort(key=lambda x: x["consumo_kwh"], reverse=True)
        por_dispositivo = por_dispositivo[:5]
        
        # **CONSUMO POR CATEGORÍA**
        consumo_por_categoria_dict = defaultdict(float)
        for disp_id, datos in consumo_por_dispositivo.items():
            dispositivo = dispositivos_map[disp_id]
            categoria = dispositivo.categoria or "Otros"
            consumo_por_categoria_dict[categoria] += datos["kwh"]
        
        por_categoria = []
        for categoria, valor in consumo_por_categoria_dict.items():
            porcentaje = (valor / consumo_total_kwh * 100) if consumo_total_kwh > 0 else 0
            por_categoria.append({
                "nombre": categoria,
                "valor": round(valor, 1),
                "porcentaje": round(porcentaje, 1)
            })
        
        # Ordenar por valor descendente
        por_categoria.sort(key=lambda x: x["valor"], reverse=True)
        
        # **RESPUESTA FINAL**
        return jsonify({
            "periodo": periodo,
            "inicio": fecha_inicio.isoformat(),
            "fin": fecha_fin.isoformat(),
            "consumo_total_kwh": round(consumo_total_kwh, 1),
            "costo_total": round(costo_total, 2),
            "promedio_diario": round(promedio_diario, 2),
            "dias_registrados": dias_unicos,
            "dia_mas_alto": dia_mas_alto,
            "comparacion_periodo_anterior": comparacion,
            "tendencia_diaria": tendencia_diaria,
            "por_dispositivo": por_dispositivo,
            "por_categoria": por_categoria
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_resumen_consumo: {str(e)}")
        return jsonify({"error": f"Error al obtener resumen: {str(e)}"}), 500