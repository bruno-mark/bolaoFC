// Data dos times (normalmente viria de uma API)
        const teams = [
            { id: 1, name: "Flamengo", logo: "🔴" },
            { id: 2, name: "Palmeiras", logo: "🟢" },
            { id: 3, name: "São Paulo", logo: "⚪" },
            { id: 4, name: "Corinthians", logo: "⚫" },
            { id: 5, name: "Santos", logo: "⚪" },
            { id: 6, name: "Grêmio", logo: "🔵" },
            { id: 7, name: "Internacional", logo: "🔴" },
            { id: 8, name: "Atlético-MG", logo: "⚫" },
            { id: 9, name: "Cruzeiro", logo: "🔵" },
            { id: 10, name: "Botafogo", logo: "⚫" },
            { id: 11, name: "Vasco", logo: "⚫" },
            { id: 12, name: "Fluminense", logo: "🟢" },
            { id: 13, name: "Bahia", logo: "🔵" },
            { id: 14, name: "Athletico-PR", logo: "🔴" },
            { id: 15, name: "Fortaleza", logo: "🔵" },
            { id: 16, name: "Bragantinho", logo: "⚪" },
            { id: 17, name: "Goiás", logo: "🟢" },
            { id: 18, name: "Coritiba", logo: "🟢" },
            { id: 19, name: "América-MG", logo: "🟢" },
            { id: 20, name: "Avaí", logo: "🔵" }
        ];

        let confrontoCount = 0;
        let rodadas = [
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

        // Confrontos functionality
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
                        ${teams.map(team => `<option value="${team.id}">${team.logo} ${team.name}</option>`).join('')}
                    </select>
                    
                    <div class="vs-text">VS</div>
                    
                    <select class="team-select" name="timeB_${confrontoCount}" required>
                        <option value="">Selecione o Time B</option>
                        ${teams.map(team => `<option value="${team.id}">${team.logo} ${team.name}</option>`).join('')}
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
        document.getElementById('newRodadaForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const campeonato = document.getElementById('campeonato').value;
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
            
            // Criar nova rodada
            const novaRodada = {
                id: rodadas.length + 1,
                numero: parseInt(numeroRodada),
                campeonato: document.getElementById('campeonato').selectedOptions[0].text,
                confrontos: confrontosData.length,
                status: 'aguardando',
                dataCriacao: new Date().toLocaleDateString('pt-BR'),
                confrontosDetalhes: confrontosData
            };
            
            rodadas.push(novaRodada);
            
            // Atualizar tabela
            updateRodadasTable();
            
            // Mostrar mensagem de sucesso
            showSuccessMessage();
            
            // Fechar modal
            closeNewRodadaModal();
            
            console.log('Nova rodada criada:', novaRodada);
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

        function deleteRodada(id) {
            if (confirm('Tem certeza que deseja excluir esta rodada?')) {
                rodadas = rodadas.filter(r => r.id !== id);
                updateRodadasTable();
                alert('Rodada excluída com sucesso!');
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

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Página de Administração de Rodadas carregada!');
            
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

        // Função para exportar dados das rodadas (para integração futura)
        function exportRodadasData() {
            return {
                rodadas: rodadas,
                teams: teams,
                confrontos: rodadas.map(rodada => ({
                    rodadaId: rodada.id,
                    confrontos: rodada.confrontosDetalhes || []
                }))
            };
        }

        // Função para simular salvamento no backend
        async function saveRodadaToBackend(rodadaData) {
            try {
                // Aqui você faria a chamada para sua API
                // const response = await fetch('/api/rodadas', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify(rodadaData)
                // });
                
                console.log('Dados que seriam enviados para o backend:', rodadaData);
                return { success: true, id: Date.now() };
            } catch (error) {
                console.error('Erro ao salvar rodada:', error);
                return { success: false, error: error.message };
            }
        }

        // Função para carregar times do backend (simulada)
        async function loadTeamsFromBackend() {
            try {
                // const response = await fetch('/api/teams');
                // const teams = await response.json();
                
                // Por enquanto retorna os times estáticos
                return teams;
            } catch (error) {
                console.error('Erro ao carregar times:', error);
                return teams; // fallback para dados estáticos
            }
        }

        // Função para gerar automaticamente confrontos (funcionalidade extra)
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

        // Inicializar botão de geração automática
        setTimeout(addAutoGenerateButton, 100);