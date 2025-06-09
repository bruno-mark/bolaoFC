from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
import os
import json
import re
from datetime import datetime, timedelta
from src import app

main_bp = Blueprint('main', __name__)

# Carregar dados
def carregar_dados():
    # Carregar rodadas
    rodadas_path = os.path.join(app.static_folder, 'rodadas.json')
    if os.path.exists(rodadas_path):
        with open(rodadas_path, 'r', encoding='utf-8') as f:
            rodadas = json.load(f)
    else:
        rodadas = {}
    
    # Carregar classificação
    classificacao_path = os.path.join(app.static_folder, 'classificacao.json')
    if os.path.exists(classificacao_path):
        with open(classificacao_path, 'r', encoding='utf-8') as f:
            classificacao = json.load(f)
    else:
        classificacao = []
    
    # Carregar times
    times_path = os.path.join(app.static_folder, 'times.json')
    if os.path.exists(times_path):
        with open(times_path, 'r', encoding='utf-8') as f:
            times = json.load(f)
    else:
        times = []
    
    return rodadas, classificacao, times

# Salvar dados
def salvar_rodadas(rodadas):
    with open(os.path.join(app.static_folder, 'rodadas.json'), 'w', encoding='utf-8') as f:
        json.dump(rodadas, f, ensure_ascii=False, indent=4)

def salvar_classificacao(classificacao):
    with open(os.path.join(app.static_folder, 'classificacao.json'), 'w', encoding='utf-8') as f:
        json.dump(classificacao, f, ensure_ascii=False, indent=4)

# Verificar se o prazo para palpites expirou
def verificar_prazo_palpite(jogo):
    if not jogo.get('data') or not jogo.get('horario'):
        return False
    
    try:
        # Formato esperado: "DD/MM/YYYY" para data e "HH:MM" para horário
        data_str = jogo['data']
        hora_str = jogo['horario']
        
        # Converter para datetime
        data_hora_jogo = datetime.strptime(f"{data_str} {hora_str}", "%d/%m/%Y %H:%M")
        
        # Prazo é 15 minutos antes do jogo por padrão
        prazo = data_hora_jogo - timedelta(minutes=15)
        
        # Se o jogo tiver um prazo específico, usar esse
        if jogo.get('prazo'):
            prazo = datetime.strptime(f"{data_str} {jogo['prazo']}", "%d/%m/%Y %H:%M")
        
        # Verificar se o prazo já expirou
        agora = datetime.now()
        return agora > prazo
    except:
        # Em caso de erro no formato, assumir que o prazo não expirou
        return False

# Verificar se o prazo está próximo (menos de 2 horas)
def verificar_prazo_proximo(jogo):
    if not jogo.get('data') or not jogo.get('horario'):
        return False
    
    try:
        # Formato esperado: "DD/MM/YYYY" para data e "HH:MM" para horário
        data_str = jogo['data']
        hora_str = jogo['horario']
        
        # Converter para datetime
        data_hora_jogo = datetime.strptime(f"{data_str} {hora_str}", "%d/%m/%Y %H:%M")
        
        # Prazo é 15 minutos antes do jogo por padrão
        prazo = data_hora_jogo - timedelta(minutes=15)
        
        # Se o jogo tiver um prazo específico, usar esse
        if jogo.get('prazo'):
            prazo = datetime.strptime(f"{data_str} {jogo['prazo']}", "%d/%m/%Y %H:%M")
        
        # Verificar se o prazo está a menos de 2 horas
        agora = datetime.now()
        return agora <= prazo and (prazo - agora).total_seconds() < 7200  # 2 horas em segundos
    except:
        # Em caso de erro no formato, assumir que o prazo não está próximo
        return False

@main_bp.route('/')
def index():
    rodadas, classificacao, _ = carregar_dados()
    return render_template('index.html', 
                          classificacao=classificacao,
                          rodadas=rodadas)

@main_bp.route('/rodada/<round_id>')
def rodada(round_id):
    rodadas, _, times = carregar_dados()
    
    if round_id not in rodadas:
        return render_template('404.html', mensagem=f"Rodada {round_id} não encontrada"), 404
    
    rodada_data = rodadas[round_id]
    
    # Verificar prazos para cada jogo
    for jogo in rodada_data.get('jogos', []):
        jogo['prazo_expirado'] = verificar_prazo_palpite(jogo)
        jogo['prazo_proximo'] = verificar_prazo_proximo(jogo)
    
    return render_template('rodada.html', 
                          rodada=rodada_data,
                          round_id=round_id,
                          rodadas=rodadas,
                          times=times)

@main_bp.route('/admin', methods=['GET', 'POST'])
def admin():
    rodadas, classificacao, times = carregar_dados()
    
    # Obter ID da rodada da query string ou usar o primeiro disponível
    round_id = request.args.get('round_id')
    if not round_id or round_id not in rodadas:
        # Usar a primeira rodada disponível
        if rodadas:
            round_id = list(rodadas.keys())[0]
        else:
            return render_template('404.html', mensagem="Nenhuma rodada encontrada"), 404
    
    rodada = rodadas[round_id]
    
    # Extrair participantes da classificação
    participantes = [p['Palpiterios'] for p in classificacao]
    
    # Processar formulário de edição de palpites
    if request.method == 'POST':
        participante = request.form.get('participante')
        jogo_id = request.form.get('jogo_id')
        palpite = request.form.get('palpite')
        
        if participante and jogo_id and palpite:
            # Inicializar estrutura de palpites se não existir
            if 'palpites' not in rodada:
                rodada['palpites'] = {}
            if participante not in rodada['palpites']:
                rodada['palpites'][participante] = {}
            
            # Salvar palpite
            rodada['palpites'][participante][jogo_id] = palpite
            rodadas[round_id] = rodada
            salvar_rodadas(rodadas)
            flash(f"Palpite de {participante} para o jogo {jogo_id} salvo com sucesso!", "success")
    
    # Verificar prazos para cada jogo
    for jogo in rodada.get('jogos', []):
        jogo['prazo_expirado'] = verificar_prazo_palpite(jogo)
        jogo['prazo_proximo'] = verificar_prazo_proximo(jogo)
    
    return render_template('admin.html',
                          rodada=rodada,
                          round_id=round_id,
                          rodadas=rodadas,
                          classificacao=classificacao,
                          participantes=participantes,
                          palpites=rodada.get('palpites', {}),
                          times=times)

@main_bp.route('/atualizar-classificacao', methods=['GET', 'POST'])
def atualizar_classificacao():
    rodadas, _, _ = carregar_dados()
    
    # Inicializar estrutura de classificação
    classificacao = {}
    
    # Para cada rodada
    for rodada_id, rodada_data in rodadas.items():
        # Para cada jogo da rodada
        for jogo in rodada_data.get('jogos', []):
            # Pular jogos sem resultado
            if not jogo.get('resultado'):
                continue
                
            resultado = jogo['resultado']
            
            # Para cada participante e seus palpites
            for participante, palpites in rodada_data.get('palpites', {}).items():
                # Inicializar participante na classificação se não existir
                if participante not in classificacao:
                    classificacao[participante] = {
                        'Palpiterios': participante,
                        'Palpites': 0,
                        'Acerto Placar': 0,
                        'Acerto Result': 0,
                        'Erros': 0,
                        'Pontos': 0
                    }
                
                # Pular se não houver palpite para este jogo
                jogo_id = jogo['id']
                if jogo_id not in palpites:
                    continue
                
                palpite = palpites[jogo_id]
                classificacao[participante]['Palpites'] += 1
                
                # Verificar acerto de placar exato (3 pontos)
                if palpite == resultado:
                    classificacao[participante]['Acerto Placar'] += 1
                    classificacao[participante]['Pontos'] += 3
                    
                # Verificar acerto de resultado (1 ponto)
                elif _verificar_acerto_resultado(palpite, resultado):
                    classificacao[participante]['Acerto Result'] += 1
                    classificacao[participante]['Pontos'] += 1
                    
                # Erro (0 pontos)
                else:
                    classificacao[participante]['Erros'] += 1
    
    # Converter para lista e ordenar por pontos (decrescente)
    classificacao_lista = list(classificacao.values())
    classificacao_lista.sort(key=lambda x: (x['Pontos'], x['Acerto Placar']), reverse=True)
    
    # Salvar classificação atualizada
    salvar_classificacao(classificacao_lista)
    
    flash("Classificação atualizada com sucesso!", "success")
    return redirect(url_for('main.index'))

# Função auxiliar para verificar acerto de resultado
def _verificar_acerto_resultado(palpite, resultado):
    # Extrair gols do palpite (formato: "Time1 (NxN) Time2")
    match_palpite = re.search(r'\((\d+)x(\d+)\)', palpite)
    if not match_palpite:
        return False
    
    gols_casa_palpite = int(match_palpite.group(1))
    gols_fora_palpite = int(match_palpite.group(2))
    
    # Extrair gols do resultado (formato: "NxN")
    match_resultado = re.search(r'(\d+)x(\d+)', resultado)
    if not match_resultado:
        return False
    
    gols_casa_resultado = int(match_resultado.group(1))
    gols_fora_resultado = int(match_resultado.group(2))
    
    # Verificar se acertou o vencedor ou empate
    if gols_casa_palpite > gols_fora_palpite and gols_casa_resultado > gols_fora_resultado:
        return True  # Acertou vitória do time da casa
    elif gols_casa_palpite < gols_fora_palpite and gols_casa_resultado < gols_fora_resultado:
        return True  # Acertou vitória do time visitante
    elif gols_casa_palpite == gols_fora_palpite and gols_casa_resultado == gols_fora_resultado:
        return True  # Acertou empate
    
    return False  # Errou o resultado

# Nova rota para palpites em lote
@main_bp.route('/palpites/lote/<round_id>', methods=['GET'])
def palpites_lote(round_id):
    rodadas, classificacao, times = carregar_dados()
    
    # Verificar se a rodada existe
    if round_id not in rodadas:
        if rodadas:
            # Usar a primeira rodada disponível
            round_id = list(rodadas.keys())[0]
        else:
            return render_template('404.html', mensagem="Nenhuma rodada encontrada"), 404
    
    rodada = rodadas[round_id]
    
    # Obter participante da query string ou usar o primeiro disponível
    participante_atual = request.args.get('participante')
    if not participante_atual and classificacao:
        participante_atual = classificacao[0]['Palpiterios']
    
    # Extrair participantes da classificação
    participantes = [p['Palpiterios'] for p in classificacao]
    
    # Verificar prazos para cada jogo
    jogos_abertos = 0
    jogos_fechados = 0
    
    for jogo in rodada.get('jogos', []):
        jogo['prazo_expirado'] = verificar_prazo_palpite(jogo)
        jogo['prazo_proximo'] = verificar_prazo_proximo(jogo)
        
        if jogo['prazo_expirado']:
            jogos_fechados += 1
        else:
            jogos_abertos += 1
    
    return render_template('palpites_lote.html',
                          rodada=rodada,
                          current_round_id=round_id,
                          rodadas=rodadas,
                          participantes=participantes,
                          participante_atual=participante_atual,
                          palpites=rodada.get('palpites', {}),
                          times=times,
                          jogos_abertos=jogos_abertos,
                          jogos_fechados=jogos_fechados)

# Rota para salvar palpites em lote
@main_bp.route('/palpites/lote/<round_id>/salvar', methods=['POST'])
def salvar_palpites_lote(round_id):
    rodadas, _, _ = carregar_dados()
    
    # Verificar se a rodada existe
    if round_id not in rodadas:
        flash("Rodada não encontrada", "danger")
        return redirect(url_for('main.index'))
    
    rodada = rodadas[round_id]
    
    # Obter participante do formulário
    participante = request.form.get('participante')
    if not participante:
        flash("Participante não especificado", "danger")
        return redirect(url_for('main.palpites_lote', round_id=round_id))
    
    # Inicializar estrutura de palpites se não existir
    if 'palpites' not in rodada:
        rodada['palpites'] = {}
    if participante not in rodada['palpites']:
        rodada['palpites'][participante] = {}
    
    # Processar palpites
    palpites_salvos = 0
    palpites_ignorados = 0
    
    for jogo in rodada.get('jogos', []):
        jogo_id = jogo['id']
        palpite_key = f"palpite_{jogo_id}"
        
        if palpite_key in request.form and request.form[palpite_key].strip():
            # Verificar se o prazo expirou
            if verificar_prazo_palpite(jogo):
                palpites_ignorados += 1
                continue
            
            # Salvar palpite
            rodada['palpites'][participante][jogo_id] = request.form[palpite_key].strip()
            palpites_salvos += 1
    
    # Salvar rodadas atualizadas
    rodadas[round_id] = rodada
    salvar_rodadas(rodadas)
    
    # Feedback ao usuário
    if palpites_salvos > 0:
        flash(f"{palpites_salvos} palpites salvos com sucesso!", "success")
    if palpites_ignorados > 0:
        flash(f"{palpites_ignorados} palpites ignorados (prazo expirado)", "warning")
    if palpites_salvos == 0 and palpites_ignorados == 0:
        flash("Nenhum palpite foi fornecido", "info")
    
    return redirect(url_for('main.palpites_lote', round_id=round_id, participante=participante))

# Nova rota para histórico de palpites
@main_bp.route('/historico/<participante>')
def historico_palpites(participante):
    rodadas, classificacao, times = carregar_dados()
    
    # Verificar se o participante existe
    participantes = [p['Palpiterios'] for p in classificacao]
    if participante not in participantes:
        if participantes:
            # Usar o primeiro participante disponível
            participante = participantes[0]
        else:
            return render_template('404.html', mensagem="Nenhum participante encontrado"), 404
    
    # Obter filtros da query string
    filtro_rodada = request.args.get('rodada', '')
    filtro_time = request.args.get('time', '')
    filtro_resultado = request.args.get('resultado', '')
    
    # Coletar todos os palpites do participante
    palpites_filtrados = []
    estatisticas = {
        'total_palpites': 0,
        'acertos_placar': 0,
        'acertos_resultado': 0,
        'erros': 0,
        'percentual_acertos_placar': 0,
        'percentual_acertos_resultado': 0,
        'percentual_erros': 0
    }
    
    # Dados para o gráfico
    grafico = {
        'labels': [],
        'pontos': [],
        'acertos_placar': [],
        'acertos_resultado': []
    }
    
    # Para cada rodada
    for rodada_id, rodada_data in sorted(rodadas.items(), key=lambda x: x[1].get('numero', 0)):
        # Pular se filtro de rodada estiver ativo e não for esta rodada
        if filtro_rodada and filtro_rodada != rodada_id:
            continue
        
        # Inicializar contadores para o gráfico
        pontos_rodada = 0
        acertos_placar_rodada = 0
        acertos_resultado_rodada = 0
        
        # Para cada jogo da rodada
        for jogo in rodada_data.get('jogos', []):
            # Pular se não houver palpite para este jogo
            jogo_id = jogo['id']
            if participante not in rodada_data.get('palpites', {}) or jogo_id not in rodada_data['palpites'][participante]:
                continue
            
            # Obter informações do jogo
            time_casa_id = jogo.get('time_casa', '')
            time_visitante_id = jogo.get('time_visitante', '')
            
            # Pular se filtro de time estiver ativo e não for um dos times do jogo
            if filtro_time and filtro_time != time_casa_id and filtro_time != time_visitante_id:
                continue
            
            # Obter nomes e escudos dos times
            time_casa = next((t['nome'] for t in times if t['id'] == time_casa_id), time_casa_id)
            time_visitante = next((t['nome'] for t in times if t['id'] == time_visitante_id), time_visitante_id)
            time_casa_escudo = next((t.get('escudo', '') for t in times if t['id'] == time_casa_id), '')
            time_visitante_escudo = next((t.get('escudo', '') for t in times if t['id'] == time_visitante_id), '')
            
            # Obter palpite e resultado
            palpite = rodada_data['palpites'][participante][jogo_id]
            resultado = jogo.get('resultado', '')
            
            # Determinar status do palpite
            status = 'pendente'
            if resultado:
                if palpite == resultado:
                    status = 'acerto_placar'
                    estatisticas['acertos_placar'] += 1
                    pontos_rodada += 3
                    acertos_placar_rodada += 1
                elif _verificar_acerto_resultado(palpite, resultado):
                    status = 'acerto_resultado'
                    estatisticas['acertos_resultado'] += 1
                    pontos_rodada += 1
                    acertos_resultado_rodada += 1
                else:
                    status = 'erro'
                    estatisticas['erros'] += 1
            
            # Pular se filtro de resultado estiver ativo e não for este status
            if filtro_resultado and filtro_resultado != status:
                continue
            
            # Adicionar palpite à lista filtrada
            palpites_filtrados.append({
                'rodada_id': rodada_id,
                'rodada_numero': rodada_data.get('numero', 0),
                'jogo_id': jogo_id,
                'time_casa': time_casa,
                'time_visitante': time_visitante,
                'time_casa_escudo': time_casa_escudo,
                'time_visitante_escudo': time_visitante_escudo,
                'data': jogo.get('data', ''),
                'horario': jogo.get('horario', ''),
                'palpite': palpite,
                'resultado': resultado,
                'status': status
            })
            
            estatisticas['total_palpites'] += 1
        
        # Adicionar dados ao gráfico se a rodada tiver jogos
        if rodada_data.get('jogos'):
            grafico['labels'].append(f"Rodada {rodada_data.get('numero', 0)}")
            grafico['pontos'].append(pontos_rodada)
            grafico['acertos_placar'].append(acertos_placar_rodada)
            grafico['acertos_resultado'].append(acertos_resultado_rodada)
    
    # Calcular percentuais
    if estatisticas['total_palpites'] > 0:
        estatisticas['percentual_acertos_placar'] = round(estatisticas['acertos_placar'] / estatisticas['total_palpites'] * 100, 1)
        estatisticas['percentual_acertos_resultado'] = round(estatisticas['acertos_resultado'] / estatisticas['total_palpites'] * 100, 1)
        estatisticas['percentual_erros'] = round(estatisticas['erros'] / estatisticas['total_palpites'] * 100, 1)
    
    # Ordenar palpites por rodada e data
    palpites_filtrados.sort(key=lambda x: (x['rodada_numero'], x['data'], x['horario']))
    
    return render_template('historico.html',
                          participante_atual=participante,
                          participantes=participantes,
                          palpites_filtrados=palpites_filtrados,
                          estatisticas=estatisticas,
                          grafico=grafico,
                          rodadas=rodadas,
                          times=times,
                          filtro_rodada=filtro_rodada,
                          filtro_time=filtro_time,
                          filtro_resultado=filtro_resultado)

# Nova rota para dashboard personalizado
@main_bp.route('/dashboard/<participante>')
def dashboard(participante):
    rodadas, classificacao, times = carregar_dados()
    
    # Verificar se o participante existe
    participantes = [p['Palpiterios'] for p in classificacao]
    if participante not in participantes:
        if participantes:
            # Usar o primeiro participante disponível
            participante = participantes[0]
        else:
            return render_template('404.html', mensagem="Nenhum participante encontrado"), 404
    
    # Encontrar posição do participante na classificação
    posicao = next((i + 1 for i, p in enumerate(classificacao) if p['Palpiterios'] == participante), 0)
    
    # Obter estatísticas do participante
    estatisticas = next((p for p in classificacao if p['Palpiterios'] == participante), {
        'Pontos': 0,
        'Acerto Placar': 0,
        'Acerto Result': 0,
        'Erros': 0
    })
    
    # Formatar estatísticas para o template
    estatisticas_formatadas = {
        'pontos': estatisticas.get('Pontos', 0),
        'acertos_placar': estatisticas.get('Acerto Placar', 0),
        'acertos_resultado': estatisticas.get('Acerto Result', 0),
        'erros': estatisticas.get('Erros', 0)
    }
    
    # Coletar jogos pendentes para palpite
    jogos_pendentes = []
    proxima_rodada = None
    
    # Para cada rodada
    for rodada_id, rodada_data in sorted(rodadas.items(), key=lambda x: x[1].get('numero', 0)):
        # Para cada jogo da rodada
        for jogo in rodada_data.get('jogos', []):
            # Verificar se o prazo expirou
            jogo['prazo_expirado'] = verificar_prazo_palpite(jogo)
            jogo['prazo_proximo'] = verificar_prazo_proximo(jogo)
            
            # Pular jogos com prazo expirado ou que já têm resultado
            if jogo['prazo_expirado'] or jogo.get('resultado'):
                continue
            
            # Verificar se o participante já fez palpite para este jogo
            jogo_id = jogo['id']
            if participante in rodada_data.get('palpites', {}) and jogo_id in rodada_data['palpites'][participante]:
                continue
            
            # Obter informações do jogo
            time_casa_id = jogo.get('time_casa', '')
            time_visitante_id = jogo.get('time_visitante', '')
            
            # Obter nomes e escudos dos times
            time_casa = next((t['nome'] for t in times if t['id'] == time_casa_id), time_casa_id)
            time_visitante = next((t['nome'] for t in times if t['id'] == time_visitante_id), time_visitante_id)
            time_casa_escudo = next((t.get('escudo', '') for t in times if t['id'] == time_casa_id), '')
            time_visitante_escudo = next((t.get('escudo', '') for t in times if t['id'] == time_visitante_id), '')
            
            # Adicionar jogo à lista de pendentes
            jogos_pendentes.append({
                'rodada_id': rodada_id,
                'rodada_numero': rodada_data.get('numero', 0),
                'jogo_id': jogo_id,
                'time_casa': time_casa,
                'time_visitante': time_visitante,
                'time_casa_escudo': time_casa_escudo,
                'time_visitante_escudo': time_visitante_escudo,
                'data': jogo.get('data', ''),
                'horario': jogo.get('horario', ''),
                'prazo': jogo.get('prazo', ''),
                'prazo_proximo': jogo['prazo_proximo']
            })
            
            # Definir próxima rodada como a primeira rodada com jogos pendentes
            if not proxima_rodada:
                proxima_rodada = rodada_id
    
    # Ordenar jogos pendentes por data e horário
    jogos_pendentes.sort(key=lambda x: (x['data'], x['horario']))
    
    # Limitar a 5 jogos para não sobrecarregar o dashboard
    jogos_pendentes = jogos_pendentes[:5]
    
    # Coletar últimos resultados
    ultimos_resultados = []
    
    # Para cada rodada (em ordem decrescente)
    for rodada_id, rodada_data in sorted(rodadas.items(), key=lambda x: x[1].get('numero', 0), reverse=True):
        # Para cada jogo da rodada
        for jogo in rodada_data.get('jogos', []):
            # Pular jogos sem resultado
            if not jogo.get('resultado'):
                continue
            
            # Pular se o participante não fez palpite para este jogo
            jogo_id = jogo['id']
            if participante not in rodada_data.get('palpites', {}) or jogo_id not in rodada_data['palpites'][participante]:
                continue
            
            # Obter informações do jogo
            time_casa_id = jogo.get('time_casa', '')
            time_visitante_id = jogo.get('time_visitante', '')
            
            # Obter nomes e escudos dos times
            time_casa = next((t['nome'] for t in times if t['id'] == time_casa_id), time_casa_id)
            time_visitante = next((t['nome'] for t in times if t['id'] == time_visitante_id), time_visitante_id)
            time_casa_escudo = next((t.get('escudo', '') for t in times if t['id'] == time_casa_id), '')
            time_visitante_escudo = next((t.get('escudo', '') for t in times if t['id'] == time_visitante_id), '')
            
            # Obter palpite e resultado
            palpite = rodada_data['palpites'][participante][jogo_id]
            resultado = jogo['resultado']
            
            # Determinar status do palpite
            status = 'pendente'
            if palpite == resultado:
                status = 'acerto_placar'
            elif _verificar_acerto_resultado(palpite, resultado):
                status = 'acerto_resultado'
            else:
                status = 'erro'
            
            # Adicionar resultado à lista
            ultimos_resultados.append({
                'rodada_id': rodada_id,
                'rodada_numero': rodada_data.get('numero', 0),
                'jogo_id': jogo_id,
                'time_casa': time_casa,
                'time_visitante': time_visitante,
                'time_casa_escudo': time_casa_escudo,
                'time_visitante_escudo': time_visitante_escudo,
                'data': jogo.get('data', ''),
                'palpite': palpite,
                'resultado': resultado,
                'status': status
            })
    
    # Limitar a 5 resultados para não sobrecarregar o dashboard
    ultimos_resultados = ultimos_resultados[:5]
    
    # Dados para o gráfico
    grafico = {
        'labels': [],
        'pontos': [],
        'acertos_placar': [],
        'acertos_resultado': []
    }
    
    # Para cada rodada
    for rodada_id, rodada_data in sorted(rodadas.items(), key=lambda x: x[1].get('numero', 0)):
        # Inicializar contadores para o gráfico
        pontos_rodada = 0
        acertos_placar_rodada = 0
        acertos_resultado_rodada = 0
        
        # Para cada jogo da rodada
        for jogo in rodada_data.get('jogos', []):
            # Pular jogos sem resultado
            if not jogo.get('resultado'):
                continue
            
            # Pular se o participante não fez palpite para este jogo
            jogo_id = jogo['id']
            if participante not in rodada_data.get('palpites', {}) or jogo_id not in rodada_data['palpites'][participante]:
                continue
            
            # Obter palpite e resultado
            palpite = rodada_data['palpites'][participante][jogo_id]
            resultado = jogo['resultado']
            
            # Determinar pontuação
            if palpite == resultado:
                pontos_rodada += 3
                acertos_placar_rodada += 1
            elif _verificar_acerto_resultado(palpite, resultado):
                pontos_rodada += 1
                acertos_resultado_rodada += 1
        
        # Adicionar dados ao gráfico se a rodada tiver jogos com resultado
        if pontos_rodada > 0 or acertos_placar_rodada > 0 or acertos_resultado_rodada > 0:
            grafico['labels'].append(f"Rodada {rodada_data.get('numero', 0)}")
            grafico['pontos'].append(pontos_rodada)
            grafico['acertos_placar'].append(acertos_placar_rodada)
            grafico['acertos_resultado'].append(acertos_resultado_rodada)
    
    return render_template('dashboard.html',
                          participante=participante,
                          participantes=participantes,
                          posicao=posicao,
                          estatisticas=estatisticas_formatadas,
                          jogos_pendentes=jogos_pendentes,
                          ultimos_resultados=ultimos_resultados,
                          classificacao=classificacao,
                          grafico=grafico,
                          proxima_rodada=proxima_rodada or list(rodadas.keys())[0] if rodadas else None)

# Nova rota para configuração de prazos
@main_bp.route('/configurar-prazos/<round_id>', methods=['GET'])
def configurar_prazos(round_id):
    rodadas, _, times = carregar_dados()
    
    # Verificar se a rodada existe
    if round_id not in rodadas:
        if rodadas:
            # Usar a primeira rodada disponível
            round_id = list(rodadas.keys())[0]
        else:
            return render_template('404.html', mensagem="Nenhuma rodada encontrada"), 404
    
    rodada = rodadas[round_id]
    
    # Verificar prazos para cada jogo
    jogos_abertos = 0
    jogos_fechados = 0
    
    for jogo in rodada.get('jogos', []):
        jogo['prazo_expirado'] = verificar_prazo_palpite(jogo)
        jogo['prazo_proximo'] = verificar_prazo_proximo(jogo)
        
        if jogo['prazo_expirado']:
            jogos_fechados += 1
        else:
            jogos_abertos += 1
    
    return render_template('configurar_prazos.html',
                          rodada=rodada,
                          current_round_id=round_id,
                          rodadas=rodadas,
                          times=times,
                          jogos_abertos=jogos_abertos,
                          jogos_fechados=jogos_fechados)

# Rota para salvar configurações de prazos
@main_bp.route('/configurar-prazos/<round_id>/salvar', methods=['POST'])
def salvar_prazos(round_id):
    rodadas, _, _ = carregar_dados()
    
    # Verificar se a rodada existe
    if round_id not in rodadas:
        flash("Rodada não encontrada", "danger")
        return redirect(url_for('main.index'))
    
    rodada = rodadas[round_id]
    
    # Processar prazos
    prazos_salvos = 0
    
    for jogo in rodada.get('jogos', []):
        jogo_id = jogo['id']
        prazo_key = f"prazo_{jogo_id}"
        
        if prazo_key in request.form:
            prazo = request.form[prazo_key].strip()
            
            # Se o prazo estiver vazio, remover o prazo personalizado
            if not prazo:
                if 'prazo' in jogo:
                    del jogo['prazo']
            else:
                # Salvar prazo personalizado
                jogo['prazo'] = prazo
            
            prazos_salvos += 1
    
    # Salvar rodadas atualizadas
    rodadas[round_id] = rodada
    salvar_rodadas(rodadas)
    
    # Feedback ao usuário
    flash(f"Configurações de prazo salvas com sucesso para {prazos_salvos} jogos!", "success")
    
    return redirect(url_for('main.configurar_prazos', round_id=round_id))
