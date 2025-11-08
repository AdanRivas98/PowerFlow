
import os
from flask import Flask
from flask_cors import CORS
from extensions import db  # importamos la instancia de SQLAlchemy

def create_app():
    app = Flask(__name__)

    # Ruta absoluta al archivo de base de datos SQLite
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(basedir, '..', 'database', 'powerflow.db')
    db_uri = 'sqlite:///' + db_path

    # Configuración básica de Flask + SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'clave-super-secreta-powerflow'  # luego la pasamos a .env

    # Inicializamos extensiones
    db.init_app(app)
    CORS(app)

    # Registramos modelos y creamos tablas
    with app.app_context():
        from models import Usuario, Dispositivo, Consumo, SugerencIA
        db.create_all()

    # Ruta simple de prueba
    @app.route("/")
    def home():
        return "PowerFlow API funcionando correctamente ⚡"

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)

