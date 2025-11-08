from datetime import datetime
from extensions import db

class Usuario(db.Model):
    __tablename__ = 'usuarios'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    correo = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    dispositivos = db.relationship('Device', back_populates='usuario', cascade="all, delete-orphan")
    sugerencias = db.relationship('SuggestionIA', back_populates='usuario', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.correo}>"
