from extensions import db
from datetime import datetime, date
from sqlalchemy import extract

class Dispositivo(db.Model):
    __tablename__ = 'dispositivos'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)

    nombre = db.Column(db.String(100), nullable=False)
    potencia_watts = db.Column(db.Float, nullable=True)
    categoria = db.Column(db.String(50), nullable=True)
    horas_uso_dia = db.Column(db.Float, default=6.0, nullable=True)  # Para compatibilidad

    # Relaciones
    usuario = db.relationship('Usuario', back_populates='dispositivos')
    consumos = db.relationship('Consumo', back_populates='dispositivo', cascade="all, delete-orphan")
    registros_uso = db.relationship('RegistroUso', back_populates='dispositivo', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Dispositivo {self.nombre} ({self.potencia_watts} W)>"
    
    def obtener_registros_mes(self, mes=None, anio=None):
        """Obtiene los registros de uso del mes especificado"""
        from models.registro_uso import RegistroUso
        
        if mes is None:
            mes = date.today().month
        if anio is None:
            anio = date.today().year
        
        registros = RegistroUso.query.filter(
            RegistroUso.dispositivo_id == self.id,
            extract('month', RegistroUso.fecha) == mes,
            extract('year', RegistroUso.fecha) == anio
        ).all()
        
        return registros
    
    def calcular_consumo_mensual_real(self, mes=None, anio=None):
        """Calcula el consumo mensual basado en registros reales"""
        registros = self.obtener_registros_mes(mes, anio)
        
        if not registros or not self.potencia_watts:
            return None
        
        total_horas = sum(r.horas_uso for r in registros)
        consumo_kwh = (self.potencia_watts * total_horas) / 1000
        
        return {
            "dias_registrados": len(registros),
            "total_horas": total_horas,
            "consumo_kwh": round(consumo_kwh, 2),
            "costo_estimado": round(consumo_kwh * 3.7, 2)  # Tarifa Honduras
        }
    
    def tiene_registro_hoy(self):
        """Verifica si el dispositivo tiene registro para hoy"""
        from models.registro_uso import RegistroUso
        
        hoy = date.today()
        registro = RegistroUso.query.filter(
            RegistroUso.dispositivo_id == self.id,
            RegistroUso.fecha == hoy
        ).first()
        
        return registro is not None