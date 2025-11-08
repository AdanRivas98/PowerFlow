from datetime import date
from extensions import db

class Consumo(db.Model):
    __tablename__ = 'consumos'

    id = db.Column(db.Integer, primary_key=True)
    dispositivo_id = db.Column(db.Integer, db.ForeignKey('dispositivos.id'), nullable=False)

    fecha = db.Column(db.Date, default=date.today, nullable=False)
    horas_uso = db.Column(db.Float, nullable=False)

    consumo_kwh = db.Column(db.Float, nullable=False)
    costo_lps = db.Column(db.Float, nullable=False)

    # Relación
    dispositivo = db.relationship('Device', back_populates='consumos')

    def __repr__(self):
        return f"<Consumption {self.fecha} - {self.consumo_kwh} kWh>"
