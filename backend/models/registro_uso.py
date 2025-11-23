from extensions import db
from datetime import datetime

class RegistroUso(db.Model):
    __tablename__ = 'registros_uso'

    id = db.Column(db.Integer, primary_key=True)
    dispositivo_id = db.Column(db.Integer, db.ForeignKey('dispositivos.id'), nullable=False)
    fecha = db.Column(db.Date, nullable=False)
    horas_uso = db.Column(db.Float, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación con Dispositivo
    dispositivo = db.relationship('Dispositivo', back_populates='registros_uso')

    # Índice único para evitar duplicados (un registro por día por dispositivo)
    __table_args__ = (
        db.UniqueConstraint('dispositivo_id', 'fecha', name='unique_dispositivo_fecha'),
    )

    def __repr__(self):
        return f"<RegistroUso {self.dispositivo_id} - {self.fecha} - {self.horas_uso}h>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "dispositivo_id": self.dispositivo_id,
            "fecha": self.fecha.isoformat(),
            "horas_uso": self.horas_uso
        }