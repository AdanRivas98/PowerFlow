from extensions import db

class Dispositivo(db.Model):
    __tablename__ = 'dispositivos'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)

    nombre = db.Column(db.String(100), nullable=False)
    potencia_watts = db.Column(db.Float, nullable=True)
    categoria = db.Column(db.String(50), nullable=True)
    horas_uso_dia = db.Column(db.Float, default=6.0, nullable=False)  # NUEVO CAMPO

    # Relaciones
    usuario = db.relationship('Usuario', back_populates='dispositivos')
    consumos = db.relationship('Consumo', back_populates='dispositivo', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Dispositivo {self.nombre} ({self.potencia_watts} W)>"
    
    def calcular_consumo_mensual(self):
        """Calcula el consumo mensual estimado en kWh"""
        if self.potencia_watts and self.horas_uso_dia:
            return (self.potencia_watts * self.horas_uso_dia * 30) / 1000
        return 0
    
    def calcular_costo_mensual(self, tarifa_kwh=3.7):
        """Calcula el costo mensual en Lempiras (tarifa por defecto: L3.70/kWh)"""
        consumo = self.calcular_consumo_mensual()
        return consumo * tarifa_kwh