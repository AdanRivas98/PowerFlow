from extensions import db

class Dispositivo(db.Model):
    __tablename__ = 'dispositivos'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)

    nombre = db.Column(db.String(100), nullable=False)
    potencia_watts = db.Column(db.Float, nullable=True)  #IA
    categoria = db.Column(db.String(50), nullable=True)

    # Relaciones
    usuario = db.relationship('Usuario', back_populates='dispositivos')
    consumos = db.relationship('Consumo', back_populates='dispositivo', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Dispositivo {self.nombre} ({self.potencia_watts} W)>"
