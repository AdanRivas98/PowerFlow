from flask import Blueprint, request, jsonify
from extensions import db
from models.dispositivo import Dispositivo
from routes.auth_middleware import token_required
import json
import os

dispositivo_bp = Blueprint('dispositivos', __name__)

# Clave API de Groq
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

# Base de datos estática de dispositivos comunes (fallback)
DISPOSITIVOS_COMUNES = {
    # Iluminación
    "bombilla": {"potencia_watts": 10, "categoria": "Iluminación"},
    "bombillo": {"potencia_watts": 10, "categoria": "Iluminación"},
    "led": {"potencia_watts": 10, "categoria": "Iluminación"},
    "foco": {"potencia_watts": 60, "categoria": "Iluminación"},
    "lampara": {"potencia_watts": 15, "categoria": "Iluminación"},
    "luz": {"potencia_watts": 15, "categoria": "Iluminación"},
    
    # Climatización
    "aire acondicionado": {"potencia_watts": 1500, "categoria": "Climatización"},
    "ac": {"potencia_watts": 1500, "categoria": "Climatización"},
    "ventilador": {"potencia_watts": 75, "categoria": "Climatización"},
    "abanico": {"potencia_watts": 75, "categoria": "Climatización"},
    "calefactor": {"potencia_watts": 1500, "categoria": "Climatización"},
    
    # Electrodomésticos
    "refrigerador": {"potencia_watts": 180, "categoria": "Electrodomésticos"},
    "refri": {"potencia_watts": 180, "categoria": "Electrodomésticos"},
    "nevera": {"potencia_watts": 180, "categoria": "Electrodomésticos"},
    "lavadora": {"potencia_watts": 500, "categoria": "Electrodomésticos"},
    "secadora": {"potencia_watts": 2000, "categoria": "Electrodomésticos"},
    "microondas": {"potencia_watts": 1200, "categoria": "Electrodomésticos"},
    "horno": {"potencia_watts": 2000, "categoria": "Electrodomésticos"},
    "estufa": {"potencia_watts": 2000, "categoria": "Electrodomésticos"},
    "plancha": {"potencia_watts": 1200, "categoria": "Electrodomésticos"},
    "licuadora": {"potencia_watts": 400, "categoria": "Electrodomésticos"},
    "cafetera": {"potencia_watts": 800, "categoria": "Electrodomésticos"},
    "tostadora": {"potencia_watts": 1000, "categoria": "Electrodomésticos"},
    
    # Electrónica
    "laptop": {"potencia_watts": 65, "categoria": "Electrónica"},
    "computadora": {"potencia_watts": 300, "categoria": "Electrónica"},
    "pc": {"potencia_watts": 300, "categoria": "Electrónica"},
    "tv": {"potencia_watts": 100, "categoria": "Electrónica"},
    "televisor": {"potencia_watts": 100, "categoria": "Electrónica"},
    "television": {"potencia_watts": 100, "categoria": "Electrónica"},
    "monitor": {"potencia_watts": 40, "categoria": "Electrónica"},
    "consola": {"potencia_watts": 150, "categoria": "Electrónica"},
    "playstation": {"potencia_watts": 150, "categoria": "Electrónica"},
    "xbox": {"potencia_watts": 150, "categoria": "Electrónica"},
    "celular": {"potencia_watts": 10, "categoria": "Electrónica"},
    "cargador": {"potencia_watts": 20, "categoria": "Electrónica"},
    "router": {"potencia_watts": 10, "categoria": "Electrónica"},
    "impresora": {"potencia_watts": 30, "categoria": "Electrónica"},
}


def buscar_en_db_estatica(nombre):
    nombre_lower = nombre.lower()
    
    # Buscar coincidencia exacta o parcial
    for key, value in DISPOSITIVOS_COMUNES.items():
        if key in nombre_lower:
            print(f"✅ Encontrado en BD estática: {key} -> {value}")
            return value
    
    return None


def estimar_con_groq(nombre):
    """Estima usando Groq API (IA)"""
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        prompt = f"""Eres un experto en electrodomésticos y consumo eléctrico.

Para el dispositivo: "{nombre}"

Responde SOLO con un objeto JSON válido en este formato exacto (sin texto adicional):
{{"potencia_watts": número, "categoria": "categoría"}}

Categorías válidas: Iluminación, Climatización, Electrodomésticos, Electrónica, Otros

Ejemplos de potencias comunes:
- Bombilla LED: 10W
- Laptop: 65W  
- Refrigerador: 180W
- Aire Acondicionado: 1500W
- TV: 100W
- Microondas: 1200W

Si no estás seguro, da una estimación conservadora."""
        
        data = {
            "model": "llama-3.3-70b-versatile",  # Modelo potente y gratis
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 100
        }
        
        print(f"🤖 Consultando Groq API para: {nombre}")
        response = requests.post(url, headers=headers, json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content'].strip()
            
            # Limpiar posible markdown
            content = content.replace('```json', '').replace('```', '').strip()
            
            print(f"📥 Respuesta de Groq: {content}")
            
            # Parsear JSON
            sugerencia = json.loads(content)
            
            # Validar que tenga los campos necesarios
            if 'potencia_watts' in sugerencia and 'categoria' in sugerencia:
                print(f"✅ Sugerencia válida de Groq: {sugerencia}")
                return sugerencia
            
        print(f"⚠️ Groq API respondió con status: {response.status_code}")
        return None
        
    except Exception as e:
        print(f"❌ Error en Groq API: {str(e)}")
        return None


# Endpoint para sugerencias (BD estática + Groq IA)
@dispositivo_bp.route('/api/dispositivos/sugerir', methods=['POST'])
@token_required
def sugerir_dispositivo(usuario_actual):
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    
    if not nombre or len(nombre) < 3:
        return jsonify({"error": "Nombre muy corto"}), 400
    
    print(f"\n🔍 Buscando sugerencias para: '{nombre}'")
    
    # 1. Primero buscar en BD estática (rápido y gratis)
    sugerencia = buscar_en_db_estatica(nombre)
    
    # 2. Si no encuentra, usar Groq API
    if not sugerencia:
        print("🤖 No encontrado en BD estática, consultando Groq IA...")
        sugerencia = estimar_con_groq(nombre)
    
    # 3. Si todo falla, devolver valores por defecto
    if not sugerencia:
        print("⚠️ No se pudo estimar, usando valores por defecto")
        sugerencia = {
            "potencia_watts": None,
            "categoria": "Otros"
        }
    
    return jsonify({
        "sugerencia": sugerencia,
        "metodo": "bd_estatica" if nombre.lower() in ' '.join(DISPOSITIVOS_COMUNES.keys()) else "groq_ia"
    }), 200


# Crear un nuevo dispositivo (actualizado con horas_uso_dia)
@dispositivo_bp.route('/api/dispositivos', methods=['POST'])
@token_required
def crear_dispositivo(usuario_actual):
    data = request.get_json()
    nombre = data.get('nombre')
    potencia_watts = data.get('potencia_watts')
    categoria = data.get('categoria')
    horas_uso_dia = data.get('horas_uso_dia', 6)  # Default 6 horas

    if not nombre:
        return jsonify({"error": "El campo 'nombre' es obligatorio"}), 400
    
    if not categoria:
        return jsonify({"error": "El campo 'categoría' es obligatorio"}), 400

    nuevo_dispositivo = Dispositivo(
        usuario_id=usuario_actual.id,
        nombre=nombre,
        potencia_watts=potencia_watts,
        categoria=categoria,
        horas_uso_dia=horas_uso_dia
    )

    db.session.add(nuevo_dispositivo)
    db.session.commit()

    return jsonify({
        "mensaje": "Dispositivo registrado correctamente",
        "dispositivo": {
            "id": nuevo_dispositivo.id,
            "nombre": nuevo_dispositivo.nombre,
            "potencia_watts": nuevo_dispositivo.potencia_watts,
            "categoria": nuevo_dispositivo.categoria,
            "horas_uso_dia": nuevo_dispositivo.horas_uso_dia
        }
    }), 201


# Listar dispositivos del usuario logueado
@dispositivo_bp.route('/api/dispositivos', methods=['GET'])
@token_required
def listar_dispositivos(usuario_actual):
    dispositivos = Dispositivo.query.filter_by(usuario_id=usuario_actual.id).all()

    if not dispositivos:
        return jsonify([]), 200

    resultado = [
        {
            "id": d.id,
            "nombre": d.nombre,
            "potencia_watts": d.potencia_watts,
            "categoria": d.categoria,
            "horas_uso_dia": d.horas_uso_dia if hasattr(d, 'horas_uso_dia') else 6
        }
        for d in dispositivos
    ]
    return jsonify(resultado), 200


# Editar dispositivo
@dispositivo_bp.route('/api/dispositivos/<int:id>', methods=['PUT'])
@token_required
def editar_dispositivo(usuario_actual, id):
    dispositivo = Dispositivo.query.get(id)
    
    if not dispositivo:
        return jsonify({"error": "Dispositivo no encontrado"}), 404
    
    if dispositivo.usuario_id != usuario_actual.id:
        return jsonify({"error": "No autorizado"}), 403
    
    data = request.get_json()
    
    if 'nombre' in data:
        dispositivo.nombre = data['nombre']
    if 'potencia_watts' in data:
        dispositivo.potencia_watts = data['potencia_watts']
    if 'categoria' in data:
        dispositivo.categoria = data['categoria']
    if 'horas_uso_dia' in data:
        dispositivo.horas_uso_dia = data['horas_uso_dia']
    
    db.session.commit()
    
    return jsonify({
        "mensaje": "Dispositivo actualizado correctamente",
        "dispositivo": {
            "id": dispositivo.id,
            "nombre": dispositivo.nombre,
            "potencia_watts": dispositivo.potencia_watts,
            "categoria": dispositivo.categoria,
            "horas_uso_dia": dispositivo.horas_uso_dia if hasattr(dispositivo, 'horas_uso_dia') else 6
        }
    }), 200


# Eliminar dispositivo
@dispositivo_bp.route('/api/dispositivos/<int:id>', methods=['DELETE'])
@token_required
def eliminar_dispositivo(usuario_actual, id):
    dispositivo = Dispositivo.query.get(id)
    
    if not dispositivo:
        return jsonify({"error": "Dispositivo no encontrado"}), 404
    
    if dispositivo.usuario_id != usuario_actual.id:
        return jsonify({"error": "No autorizado"}), 403
    
    nombre = dispositivo.nombre
    db.session.delete(dispositivo)
    db.session.commit()
    
    return jsonify({
        "mensaje": f"Dispositivo '{nombre}' eliminado correctamente"
    }), 200