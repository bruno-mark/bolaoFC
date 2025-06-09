import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))  # DON'T CHANGE THIS !!!

from flask import Flask, render_template, request, redirect, url_for, flash
from src.routes.main_routes import main_bp
from src.routes.teams_routes import teams_bp
from src.routes.rounds_routes import rounds_bp

app = Flask(__name__)
app.secret_key = 'bolao_campeonato_brasileiro'  # Chave para mensagens flash

# Registrar blueprints
app.register_blueprint(main_bp)
app.register_blueprint(teams_bp)
app.register_blueprint(rounds_bp)

# Criar diretórios necessários
with app.app_context():
    # Diretório para uploads de escudos
    uploads_dir = os.path.join(app.static_folder, 'uploads', 'escudos')
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)

# Rota para tratamento de erros 404
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
