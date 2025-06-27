document.addEventListener('DOMContentLoaded', () => {

    const apiUrl = 'https://bolaofc.onrender.com//api/times'; // Verifique se a porta e a rota estão corretas

    // Elementos do formulário
    const timeForm = document.getElementById('time-form');
    const timeIdInput = document.getElementById('time-id');
    const nomeTimeInput = document.getElementById('nome-time');
    const urlEscudoInput = document.getElementById('url-escudo');
    const formTitle = document.getElementById('form-title');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    // Elementos da Tabela
    const teamsTableBody = document.getElementById('teamsTableBody');
    const refreshBtn = document.getElementById('refresh-teams-btn');

    // Função para limpar e resetar o formulário
    const resetForm = () => {
        timeForm.reset();
        timeIdInput.value = '';
        formTitle.innerText = '➕ Adicionar Novo Time';
        cancelEditBtn.style.display = 'none';
    };

    // Função para buscar e exibir os times na tabela
    const fetchTimes = async () => {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Erro na rede ao buscar times.');
            const times = await response.json();

            teamsTableBody.innerHTML = ''; // Limpa a tabela

            if (times.length === 0) {
                teamsTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Nenhum time cadastrado.</td></tr>';
                return;
            }

            times.forEach(time => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><img src="${time.url_escudo || 'https://via.placeholder.com/40'}" alt="Escudo do ${time.nome}" class="team-logo"></td>
                    <td class="team-name">${time.nome}</td>
                    <td>
                        <button class="action-btn edit-btn" data-id="${time.id}" title="Editar">✏️</button>
                        <button class="action-btn delete-btn" data-id="${time.id}" title="Excluir">🗑️</button>
                    </td>
                `;
                teamsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Erro ao buscar times:', error);
            teamsTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: red;">Erro ao carregar os times.</td></tr>`;
        }
    };

    // Event listener para o formulário (Adicionar/Atualizar)
    timeForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const id = timeIdInput.value;
        const timeData = {
            nome: nomeTimeInput.value,
            url_escudo: urlEscudoInput.value,
            // Se sua API precisar de 'campeonato_id', você precisará adicionar um campo para isso
            // campeonato_id: document.getElementById('campeonato-select').value 
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${apiUrl}/${id}` : apiUrl;

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timeData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao salvar o time.');
            }

            resetForm();
            await fetchTimes(); // Atualiza a tabela

        } catch (error) {
            console.error('Erro ao salvar time:', error);
            alert(`Não foi possível salvar o time: ${error.message}`);
        }
    });

    // Event listener para os botões de ação na tabela (Editar/Excluir)
    teamsTableBody.addEventListener('click', async (event) => {
        const target = event.target.closest('.action-btn');
        if (!target) return;

        const id = target.dataset.id;

        // Botão de Excluir
        if (target.classList.contains('delete-btn')) {
            if (confirm('Tem certeza que deseja excluir este time?')) {
                try {
                    await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
                    await fetchTimes();
                } catch (error) {
                    console.error('Erro ao excluir time:', error);
                    alert('Não foi possível excluir o time.');
                }
            }
        }

        // Botão de Editar
        if (target.classList.contains('edit-btn')) {
            const row = target.closest('tr');
            const name = row.querySelector('.team-name').innerText;
            const logoUrl = row.querySelector('.team-logo').src;

            timeIdInput.value = id;
            nomeTimeInput.value = name;
            urlEscudoInput.value = logoUrl;
            formTitle.innerText = '✏️ Editar Time';
            cancelEditBtn.style.display = 'inline-block';

            window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola a página para o formulário
        }
    });

    // Botão para cancelar edição
    cancelEditBtn.addEventListener('click', resetForm);

    // Botão para atualizar a tabela
    refreshBtn.addEventListener('click', fetchTimes);

    // Carrega os dados iniciais
    fetchTimes();
});