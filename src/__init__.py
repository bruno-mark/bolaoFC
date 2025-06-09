from flask import Flask

# Criar a aplicação Flask
app = Flask(__name__)
app.secret_key = 'brasileirinhasfc_secret_key'

# Configurações da aplicação
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
