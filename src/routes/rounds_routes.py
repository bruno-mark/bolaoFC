from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
import json
import os
from datetime import datetime

rounds_bp = Blueprint('rounds', __name__)

# Carregar dados das rodadas
def load_rounds():
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
    rounds_file = os.path.join(static_dir, 'rodadas.json')
    
    if not os.path.exists(rounds_file):
        # Criar arquivo vazio se não existir
        with open(rounds_file, 'w', encoding='utf-8') as f:
            json.dump({}, f, ensure_ascii=False)
        return {}
    
    with open(rounds_file, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

# Salvar dados das rodadas
def save_rounds(rounds):
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
    rounds_file = os.path.join(static_dir, 'rodadas.json')
    
    with open(rounds_file, 'w', encoding='utf-8') as f:
        json.dump(rounds, f, ensure_ascii=False)

# Carregar dados dos times
def load_teams():
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
    teams_file = os.path.join(static_dir, 'times.json')
    
    if not os.path.exists(teams_file):
        return []
    
    with open(teams_file, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

# Carregar dados dos palpites
def load_bets():
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
    bets_file = os.path.join(static_dir, 'palpites.json')
    
    if not os.path.exists(bets_file):
        # Criar arquivo vazio se não existir
        with open(bets_file, 'w', encoding='utf-8') as f:
            json.dump({}, f, ensure_ascii=False)
        return {}
    
    with open(bets_file, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

# Salvar dados dos palpites
def save_bets(bets):
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
    bets_file = os.path.join(static_dir, 'palpites.json')
    
    with open(bets_file, 'w', encoding='utf-8') as f:
        json.dump(bets, f, ensure_ascii=False)

# Rota para listar rodadas
@rounds_bp.route('/rodadas')
def list_rounds():
    rounds = load_rounds()
    return render_template('rodadas.html', rounds=rounds)

# Rota para adicionar rodada
@rounds_bp.route('/rodadas/adicionar', methods=['GET', 'POST'])
def add_round():
    if request.method == 'POST':
        numero = request.form.get('numero')
        
        if not numero:
            flash('Número da rodada é obrigatório!', 'danger')
            return redirect(url_for('rounds.add_round'))
        
        numero = int(numero)
        round_id = f"rodada_{numero}"
        
        # Verificar se já existe rodada com esse número
        rounds = load_rounds()
        if round_id in rounds:
            flash('Já existe uma rodada com esse número!', 'danger')
            return redirect(url_for('rounds.add_round'))
        
        # Adicionar nova rodada
        rounds[round_id] = {
            "numero": numero,
            "jogos": []
        }
        
        save_rounds(rounds)
        
        flash('Rodada adicionada com sucesso!', 'success')
        return redirect(url_for('rounds.edit_round', round_id=round_id))
    
    return render_template('adicionar_rodada.html')

# Rota para editar rodada
@rounds_bp.route('/rodadas/editar/<round_id>', methods=['GET', 'POST'])
def edit_round(round_id):
    rounds = load_rounds()
    teams = load_teams()
    
    if round_id not in rounds:
        flash('Rodada não encontrada!', 'danger')
        return redirect(url_for('rounds.list_rounds'))
    
    round_data = rounds[round_id]
    
    return render_template('editar_rodada.html', round=round_data, round_id=round_id, teams=teams)

# Rota para adicionar jogo à rodada
@rounds_bp.route('/rodadas/<round_id>/adicionar-jogo', methods=['POST'])
def add_match(round_id):
    rounds = load_rounds()
    
    if round_id not in rounds:
        flash('Rodada não encontrada!', 'danger')
        return redirect(url_for('rounds.list_rounds'))
    
    time_casa_id = request.form.get('time_casa')
    time_visitante_id = request.form.get('time_visitante')
    data = request.form.get('data')
    horario = request.form.get('horario')
    
    if not time_casa_id or not time_visitante_id or not data or not horario:
        flash('Todos os campos são obrigatórios!', 'danger')
        return redirect(url_for('rounds.edit_round', round_id=round_id))
    
    if time_casa_id == time_visitante_id:
        flash('Os times da casa e visitante não podem ser iguais!', 'danger')
        return redirect(url_for('rounds.edit_round', round_id=round_id))
    
    # Carregar times para obter nomes
    teams = load_teams()
    time_casa = next((t for t in teams if t['id'] == time_casa_id), None)
    time_visitante = next((t for t in teams if t['id'] == time_visitante_id), None)
    
    if not time_casa or not time_visitante:
        flash('Time não encontrado!', 'danger')
        return redirect(url_for('rounds.edit_round', round_id=round_id))
    
    # Gerar ID único para o jogo
    match_id = f"jogo_{rounds[round_id]['numero']}_{len(rounds[round_id]['jogos']) + 1}"
    
    # Adicionar jogo à rodada
    new_match = {
        "id": match_id,
        "time_casa": time_casa_id,
        "time_visitante": time_visitante_id,
        "data": data,
        "horario": horario,
        "resultado": ""
    }
    
    rounds[round_id]['jogos'].append(new_match)
    save_rounds(rounds)
    
    flash('Jogo adicionado com sucesso!', 'success')
    return redirect(url_for('rounds.edit_round', round_id=round_id))

# Rota para remover jogo da rodada
@rounds_bp.route('/rodadas/<round_id>/remover-jogo/<match_id>', methods=['POST'])
def remove_match(round_id, match_id):
    rounds = load_rounds()
    
    if round_id not in rounds:
        flash('Rodada não encontrada!', 'danger')
        return redirect(url_for('rounds.list_rounds'))
    
    # Remover jogo da rodada
    rounds[round_id]['jogos'] = [j for j in rounds[round_id]['jogos'] if j['id'] != match_id]
    save_rounds(rounds)
    
    flash('Jogo removido com sucesso!', 'success')
    return redirect(url_for('rounds.edit_round', round_id=round_id))

# Rota para atualizar resultado de jogo
@rounds_bp.route('/rodadas/<round_id>/atualizar-resultado/<match_id>', methods=['POST'])
def update_match_result(round_id, match_id):
    rounds = load_rounds()
    
    if round_id not in rounds:
        flash('Rodada não encontrada!', 'danger')
        return redirect(url_for('rounds.list_rounds'))
    
    resultado = request.form.get('resultado')
    
    # Validar formato do resultado (NxN)
    import re
    if not re.match(r'^\d+x\d+$', resultado):
        flash('Formato de resultado inválido! Use o formato NxN (ex: 2x1)', 'danger')
        return redirect(url_for('rounds.edit_round', round_id=round_id))
    
    # Atualizar resultado do jogo
    for jogo in rounds[round_id]['jogos']:
        if jogo['id'] == match_id:
            jogo['resultado'] = resultado
            break
    
    save_rounds(rounds)
    
    flash('Resultado atualizado com sucesso!', 'success')
    return redirect(url_for('rounds.edit_round', round_id=round_id))

# Rota para remover rodada
@rounds_bp.route('/rodadas/remover/<round_id>', methods=['POST'])
def remove_round(round_id):
    rounds = load_rounds()
    
    if round_id not in rounds:
        flash('Rodada não encontrada!', 'danger')
        return redirect(url_for('rounds.list_rounds'))
    
    # Remover rodada
    del rounds[round_id]
    save_rounds(rounds)
    
    # Remover palpites associados à rodada
    bets = load_bets()
    if round_id in bets:
        del bets[round_id]
        save_bets(bets)
    
    flash('Rodada removida com sucesso!', 'success')
    return redirect(url_for('rounds.list_rounds'))

# Rota para visualizar rodada específica
@rounds_bp.route('/rodada/<round_id>')
def view_round(round_id):
    rounds = load_rounds()
    teams = load_teams()
    bets = load_bets()
    
    if round_id not in rounds:
        flash('Rodada não encontrada!', 'danger')
        return redirect(url_for('main.index'))
    
    round_data = rounds[round_id]
    round_bets = bets.get(round_id, {})
    
    # Carregar classificação para exibir junto com a rodada
    from src.routes.main_routes import load_data
    classificacao, _, _ = load_data()
    
    return render_template('ver_rodada.html', 
                          round=round_data, 
                          round_id=round_id, 
                          teams=teams, 
                          bets=round_bets,
                          classificacao=classificacao)
