// Variáveis globais
let teams = [];
let rodadas = [];
let confrontoCount = 0;

// Função para carregar times da API
async function loadTeams() {
    try {
        const response = await fetch('http://localhost:3010/api/times');
        if (!response.ok) throw new Error('Erro ao carregar times');
        teams = await response.json();
        
        // Adiciona emoji baseado no nome do time
        teams.forEach(team => {
            team.logo = getTeamLogo(team.nome);
        });
    } catch (error) {
        console.error('Erro ao carregar times:', error);
        // Fallback para dados estáticos se a API falhar
        teams = getStaticTeams();
    }
}

// Função auxiliar para determinar emoji do time
function getTeamLogo(teamName) {
    const logos = {
        'Flamengo': '🔴',
        'Palmeiras': '🟢',
        'São Paulo': '⚪',
        'Corinthians': '⚫',
        'Santos': '⚪',
        'Grêmio': '🔵',
        'Internacional': '🔴',
        'Atlético-MG': '⚫',
        'Cruzeiro': '🔵',
        'Botafogo': '⚫',
        'Vasco': '⚫',
        'Fluminense': '🟢',
        'Bahia': '🔵',
        'Athletico-PR': '🔴',
        'Fortaleza': '🔵',
        'Bragantino': '⚪',
        'Goiás': '🟢',
        'Coritiba': '🟢',
        'América-MG': '🟢',
        'Avaí': '🔵'
    };
    return logos[teamName] || '⚽';
}

// Fallback para dados estáticos
function getStaticTeams() {
    return [
        { id: 1, nome: "Flamengo", logo: "🔴" },
        { id: 2, nome: "Palmeiras", logo: "🟢" },
        { id: 3, nome: "São Paulo", logo: "⚪" },
        { id: 4, nome: "Corinthians", logo: "⚫" },
        { id: 5, nome: "Santos", logo: "⚪" },
        { id: 6, nome: "Grêmio", logo: "🔵" },
        { id: 7, nome: "Internacional", logo: "🔴" },
        { id: 8, nome: "Atlético-MG", logo: "⚫" },
        { id: 9, nome: "Cruzeiro", logo: "🔵" },
        { id: 10, nome: "Botafogo", logo: "⚫" },
        { id: 11, nome: "Vasco", logo: "⚫" },
        { id: 12, nome: "Fluminense", logo: "🟢" },
        { id: 13, nome: "Bahia", logo: "🔵" },
        { id: 14, nome: "Athletico-PR", logo: "🔴" },
        { id: 15, nome: "Fortaleza", logo: "🔵" },
        { id: 16, nome: "Bragantino", logo: "⚪" },
        { id: 17, nome: "Goiás", logo: "🟢" },
        { id: 18, nome: "Coritiba", logo: "🟢" },
        { id: 19, nome: "América-MG", logo: "🟢" },
        { id: 20, nome: "Avaí", logo: "🔵" }
    ].map(team => ({ ...team, nome: team.nome }));
}

// Função para carregar rodadas da API
async function loadRodadas() {
    try {
        const response = await fetch('http://localhost:3010/api/rodadas');
        if (!response.ok) throw new Error('Erro ao carregar rodadas');
        rodadas = await response.json();
        
        // Carrega os confrontos (jogos) para cada rodada
        await Promise.all(rodadas.map(async rodada => {
            try {
                const jogosResponse = await fetch(`http://localhost:3010/api/jogos?rodada_id=${rodada.id}`);
                if (jogosResponse.ok) {
                    const jogos = await jogosResponse.json();
                    rodada.confrontosDetalhes = jogos.map(jogo => ({
                        timeA: { id: jogo.time_casa_id, nome: jogo.time_casa_nome },
                        timeB: { id: jogo.time_fora_id, nome: jogo.time_fora_nome }
                    }));
                }
            } catch (error) {
                console.error(`Erro ao carregar jogos da rodada ${rodada.id}:`, error);
            }
        }));
        
        updateRodadasTable();
    } catch (error) {
        console.error('Erro ao carregar rodadas:', error);
        // Fallback para dados estáticos se a API falhar
        rodadas = [
            {
                id: 1,
                numero: 1,
                campeonato: "Campeonato Brasileiro 2024",
                confrontos: 5,
                status: "ativa",
                dataCriacao: "15/06/2024"
            },
            {
                id: 2,
                numero: 2,
                campeonato: "Campeonato Brasileiro 2024",
                confrontos: 5,
                status: "aguardando",
                dataCriacao: "20/06/2024"
            }
        ];
        updateRodadasTable();
    }
}

// Função para criar uma nova rodada via API
async function createRodada(rodadaData) {
    try {
        // Primeiro cria a rodada
        const rodadaResponse = await fetch('http://localhost:3010/api/rodadas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                numero: rodadaData.numero,
                campeonato_id: rodadaData.campeonato_id,
                status: rodadaData.status
            })
        });
        
        if (!rodadaResponse.ok) throw new Error('Erro ao criar rodada');
        
        const novaRodada = await rodadaResponse.json();
        
        // Depois cria os jogos (confrontos)
        await Promise.all(rodadaData.confrontosDetalhes.map(async confronto => {
            const jogoResponse = await fetch('http://localhost:3010/api/jogos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rodada_id: novaRodada.id,
                    time_casa_id: confronto.timeA.id,
                    time_fora_id: confronto.timeB.id
                })
            });
            
            if (!jogoResponse.ok) {
                console.error('Erro ao criar jogo:', await jogoResponse.text());
            }
        }));
        
        return { success: true, rodada: novaRodada };
    } catch (error) {
        console.error('Erro ao criar rodada:', error);
        return { success: false, error: error.message };
    }
}

// Função para excluir uma rodada via API
async function deleteRodadaAPI(id) {
    try {
        const response = await fetch(`http://localhost:3010/api/rodadas/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erro ao excluir rodada');
        return { success: true };
    } catch (error) {
        console.error('Erro ao excluir rodada:', error);
        return { success: false, error: error.message };
    }
}

// Sidebar functionality
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Modal functionality
function openNewRodadaModal() {
    document.getElementById('newRodadaModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeNewRodadaModal() {
    document.getElementById('newRodadaModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    resetForm();
}

function resetForm() {
    document.getElementById('newRodadaForm').reset();
    document.getElementById('confrontosContainer').innerHTML = '';
    confrontoCount = 0;
}

// Adicionar novo confronto
function addConfronto() {
    confrontoCount++;
    const container = document.getElementById('confrontosContainer');
    
    const confrontoDiv = document.createElement('div');
    confrontoDiv.className = 'confronto-item';
    confrontoDiv.id = `confronto-${confrontoCount}`;
    
    confrontoDiv.innerHTML = `
        <div class="confronto-grid">
            <select class="team-select" name="timeA_${confrontoCount}" required>
                <option value="">Selecione o Time A</option>
                ${teams.map(team => `<option value="${team.id}">${team.logo} ${team.nome}</option>`).join('')}
            </select>
            
            <div class="vs-text">VS</div>
            
            <select class="team-select" name="timeB_${confrontoCount}" required>
                <option value="">Selecione o Time B</option>
                ${teams.map(team => `<option value="${team.id}">${team.logo} ${team.nome}</option>`).join('')}
            </select>
            
            <button type="button" class="remove-confronto" onclick="removeConfronto(${confrontoCount})">
                ✕
            </button>
        </div>
    `;
    
    container.appendChild(confrontoDiv);
    
    // Adicionar event listeners para evitar times duplicados
    const selects = confrontoDiv.querySelectorAll('.team-select');
    selects.forEach(select => {
        select.addEventListener('change', validateTeamSelection);
    });
}

function removeConfronto(id) {
    const confronto = document.getElementById(`confronto-${id}`);
    if (confronto) {
        confronto.remove();
    }
}

function validateTeamSelection(event) {
    const currentSelect = event.target;
    const confrontoDiv = currentSelect.closest('.confronto-item');
    const otherSelect = confrontoDiv.querySelector('.team-select:not([name="' + currentSelect.name + '"])');
    
    if (currentSelect.value && currentSelect.value === otherSelect.value) {
        alert('Um time não pode jogar contra ele mesmo!');
        currentSelect.value = '';
        return;
    }
    
    // Verificar se o time já está sendo usado em outro confronto
    const allSelects = document.querySelectorAll('.team-select');
    const usedTeams = Array.from(allSelects)
        .filter(select => select !== currentSelect && select.value)
        .map(select => select.value);
    
    if (currentSelect.value && usedTeams.includes(currentSelect.value)) {
        alert('Este time já está sendo usado em outro confronto!');
        currentSelect.value = '';
    }
}

// Form submission
document.getElementById('newRodadaForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const campeonatoSelect = document.getElementById('campeonato');
    const campeonato_id = campeonatoSelect.value;
    const campeonato_nome = campeonatoSelect.selectedOptions[0].text;
    const numeroRodada = document.getElementById('numeroRodada').value;
    const confrontos = document.querySelectorAll('.confronto-item');
    
    if (confrontos.length === 0) {
        alert('Adicione pelo menos um confronto!');
        return;
    }
    
    // Validar se todos os confrontos estão preenchidos
    let valid = true;
    const confrontosData = [];
    
    confrontos.forEach(confronto => {
        const selects = confronto.querySelectorAll('.team-select');
        const timeA = selects[0].value;
        const timeB = selects[1].value;
        
        if (!timeA || !timeB) {
            valid = false;
            return;
        }
        
        confrontosData.push({
            timeA: teams.find(t => t.id == timeA),
            timeB: teams.find(t => t.id == timeB)
        });
    });
    
    if (!valid) {
        alert('Todos os confrontos devem estar preenchidos!');
        return;
    }
    
    // Criar objeto da nova rodada
    const novaRodada = {
        numero: parseInt(numeroRodada),
        campeonato_id: campeonato_id,
        campeonato: campeonato_nome,
        confrontos: confrontosData.length,
        status: 'aguardando',
        dataCriacao: new Date().toLocaleDateString('pt-BR'),
        confrontosDetalhes: confrontosData
    };
    
    // Enviar para a API
    const result = await createRodada(novaRodada);
    
    if (result.success) {
        // Atualizar a lista de rodadas
        await loadRodadas();
        
        // Mostrar mensagem de sucesso
        showSuccessMessage();
        
        // Fechar modal
        closeNewRodadaModal();
    } else {
        alert(`Erro ao criar rodada: ${result.error}`);
    }
});

function updateRodadasTable() {
    const tbody = document.getElementById('rodadasTableBody');
    tbody.innerHTML = rodadas.map(rodada => `
        <tr>
            <td><strong>Rodada ${rodada.numero}</strong></td>
            <td>${rodada.campeonato}</td>
            <td>${rodada.confrontos} confrontos</td>
            <td><span class="status-badge status-${rodada.status}">${getStatusText(rodada.status)}</span></td>
            <td>${rodada.dataCriacao}</td>
            <td>
                <button class="btn btn-warning" onclick="editRodada(${rodada.id})">✏️ Editar</button>
                <button class="btn btn-danger" onclick="deleteRodada(${rodada.id})">🗑️ Excluir</button>
            </td>
        </tr>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        'ativa': 'Ativa',
        'finalizada': 'Finalizada',
        'aguardando': 'Aguardando'
    };
    return statusMap[status] || status;
}

function showSuccessMessage() {
    const message = document.getElementById('successMessage');
    message.classList.add('show');
    setTimeout(() => {
        message.classList.remove('show');
    }, 3000);
}

function editRodada(id) {
    alert(`Editar rodada ${id} - Funcionalidade em desenvolvimento`);
}

async function deleteRodada(id) {
    if (confirm('Tem certeza que deseja excluir esta rodada?')) {
        const result = await deleteRodadaAPI(id);
        
        if (result.success) {
            // Atualizar a lista de rodadas
            await loadRodadas();
            alert('Rodada excluída com sucesso!');
        } else {
            alert(`Erro ao excluir rodada: ${result.error}`);
        }
    }
}

// Close sidebar when clicking on nav items
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        toggleSidebar();
    });
});

// Close modal when clicking outside
document.getElementById('newRodadaModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeNewRodadaModal();
    }
});

// Função para gerar automaticamente confrontos
function generateAutomaticConfrontos() {
    const availableTeams = [...teams];
    const confrontosContainer = document.getElementById('confrontosContainer');
    
    // Limpar confrontos existentes
    confrontosContainer.innerHTML = '';
    confrontoCount = 0;
    
    // Gerar confrontos automaticamente (5 confrontos = 10 times)
    const numConfrontos = Math.min(5, Math.floor(availableTeams.length / 2));
    
    for (let i = 0; i < numConfrontos; i++) {
        addConfronto();
        
        // Selecionar times aleatórios
        const randomIndexA = Math.floor(Math.random() * availableTeams.length);
        const teamA = availableTeams.splice(randomIndexA, 1)[0];
        
        const randomIndexB = Math.floor(Math.random() * availableTeams.length);
        const teamB = availableTeams.splice(randomIndexB, 1)[0];
        
        // Preencher os selects
        const confrontoAtual = document.getElementById(`confronto-${confrontoCount}`);
        const selectA = confrontoAtual.querySelector(`select[name="timeA_${confrontoCount}"]`);
        const selectB = confrontoAtual.querySelector(`select[name="timeB_${confrontoCount}"]`);
        
        selectA.value = teamA.id;
        selectB.value = teamB.id;
    }
    
    alert(`${numConfrontos} confrontos gerados automaticamente!`);
}

// Adicionar botão para gerar confrontos automaticamente
function addAutoGenerateButton() {
    const confrontosSection = document.querySelector('.confrontos-section h3').parentElement;
    const autoButton = document.createElement('button');
    autoButton.type = 'button';
    autoButton.className = 'btn btn-warning';
    autoButton.innerHTML = '🎲 Gerar Automaticamente';
    autoButton.onclick = generateAutomaticConfrontos;
    confrontosSection.appendChild(autoButton);
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Página de Administração de Rodadas carregada!');
    
    // Carregar times e rodadas
    await loadTeams();
    await loadRodadas();
    
    // Adicionar botão de geração automática
    addAutoGenerateButton();
    
    // Adicionar um confronto inicial quando abrir o modal
    const originalOpenModal = openNewRodadaModal;
    openNewRodadaModal = function() {
        originalOpenModal();
        setTimeout(() => {
            if (document.getElementById('confrontosContainer').children.length === 0) {
                addConfronto();
            }
        }, 100);
    };
});