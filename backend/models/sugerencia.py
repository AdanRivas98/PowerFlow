from datetime import datetime
from extensions import db

class SugerencIA(db.Model):
    __tablename__ = 'sugerencias_ia'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)

    mensaje = db.Column(db.Text, nullable=False)
    fecha_generacion = db.Column(db.DateTime, default=datetime.utcnow)

    # Relación
    usuario = db.relationship('Usuario', back_populates='sugerencias')

    def __repr__(self):
        return f"<SugerencIA usuario={self.usuario_id}>"
