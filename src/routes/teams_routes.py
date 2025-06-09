from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, current_app
import json
import os
import uuid
from werkzeug.utils import secure_filename

teams_bp = Blueprint('teams', __name__)

# Carregar dados dos times
def load_teams():
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
    teams_file = os.path.join(static_dir, 'times.json')
    
    if not os.path.exists(teams_file):
        # Criar arquivo vazio se não existir
        with open(teams_file, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False)
        return []
    
    with open(teams_file, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

# Salvar dados dos times
def save_teams(teams):
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
    teams_file = os.path.join(static_dir, 'times.json')
    
    with open(teams_file, 'w', encoding='utf-8') as f:
        json.dump(teams, f, ensure_ascii=False)

# Rota para listar times
@teams_bp.route('/times')
def list_teams():
    teams = load_teams()
    return render_template('times.html', times=teams)

# Rota para adicionar time
@teams_bp.route('/times/adicionar', methods=['GET', 'POST'])
def add_team():
    if request.method == 'POST':
        nome = request.form.get('nome')
        sigla = request.form.get('sigla')
        
        if not nome or not sigla:
            flash('Nome e sigla são obrigatórios!', 'danger')
            return redirect(url_for('teams.add_team'))
        
        # Gerar ID baseado no nome (slug)
        team_id = nome.lower().replace(' ', '_')
        
        # Verificar se já existe time com esse ID
        teams = load_teams()
        if any(team['id'] == team_id for team in teams):
            flash('Já existe um time com esse nome!', 'danger')
            return redirect(url_for('teams.add_team'))
        
        # Processar upload do escudo
        escudo = None
        if 'escudo' in request.files:
            file = request.files['escudo']
            if file and file.filename:
                filename = secure_filename(f"{team_id}_{uuid.uuid4().hex[:8]}.png")
                uploads_dir = os.path.join(current_app.static_folder, 'uploads', 'escudos')
                
                # Criar diretório se não existir
                if not os.path.exists(uploads_dir):
                    os.makedirs(uploads_dir)
                
                file_path = os.path.join(uploads_dir, filename)
                file.save(file_path)
                escudo = f"uploads/escudos/{filename}"
        
        # Adicionar novo time
        new_team = {
            'id': team_id,
            'nome': nome,
            'sigla': sigla,
            'escudo': escudo
        }
        
        teams.append(new_team)
        save_teams(teams)
        
        flash('Time adicionado com sucesso!', 'success')
        return redirect(url_for('teams.list_teams'))
    
    return render_template('adicionar_time.html')

# Rota para editar time
@teams_bp.route('/times/editar/<team_id>', methods=['GET', 'POST'])
def edit_team(team_id):
    teams = load_teams()
    team = next((t for t in teams if t['id'] == team_id), None)
    
    if not team:
        flash('Time não encontrado!', 'danger')
        return redirect(url_for('teams.list_teams'))
    
    if request.method == 'POST':
        nome = request.form.get('nome')
        sigla = request.form.get('sigla')
        
        if not nome or not sigla:
            flash('Nome e sigla são obrigatórios!', 'danger')
            return redirect(url_for('teams.edit_team', team_id=team_id))
        
        # Atualizar dados do time
        team['nome'] = nome
        team['sigla'] = sigla
        
        # Processar upload do escudo (se houver)
        if 'escudo' in request.files:
            file = request.files['escudo']
            if file and file.filename:
                # Remover escudo antigo se existir
                if team['escudo'] and os.path.exists(os.path.join(current_app.static_folder, team['escudo'])):
                    try:
                        os.remove(os.path.join(current_app.static_folder, team['escudo']))
                    except:
                        pass
                
                filename = secure_filename(f"{team_id}_{uuid.uuid4().hex[:8]}.png")
                uploads_dir = os.path.join(current_app.static_folder, 'uploads', 'escudos')
                
                if not os.path.exists(uploads_dir):
                    os.makedirs(uploads_dir)
                
                file_path = os.path.join(uploads_dir, filename)
                file.save(file_path)
                team['escudo'] = f"uploads/escudos/{filename}"
        
        save_teams(teams)
        flash('Time atualizado com sucesso!', 'success')
        return redirect(url_for('teams.list_teams'))
    
    return render_template('editar_time.html', team=team)

# Rota para remover time
@teams_bp.route('/times/remover/<team_id>', methods=['POST'])
def remove_team(team_id):
    teams = load_teams()
    team = next((t for t in teams if t['id'] == team_id), None)
    
    if not team:
        flash('Time não encontrado!', 'danger')
        return redirect(url_for('teams.list_teams'))
    
    # Remover escudo se existir
    if team['escudo'] and os.path.exists(os.path.join(current_app.static_folder, team['escudo'])):
        try:
            os.remove(os.path.join(current_app.static_folder, team['escudo']))
        except:
            pass
    
    # Remover time da lista
    teams = [t for t in teams if t['id'] != team_id]
    save_teams(teams)
    
    flash('Time removido com sucesso!', 'success')
    return redirect(url_for('teams.list_teams'))
