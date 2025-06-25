 // Sidebar functionality
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');
            
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }

        // Refresh data functionality
        function refreshData() {
            const refreshIcon = document.getElementById('refreshIcon');
            refreshIcon.innerHTML = '<div class="loading"></div>';
            
            // Simulate data loading
            setTimeout(() => {
                refreshIcon.innerHTML = '🔄';
                // Here you would typically fetch new data from your API
                console.log('Data refreshed!');
            }, 2000);
        }

        // Sample data structure for future JSON integration
        const sampleData = {
            players: [
                {
                    id: 1,
                    name: "João Silva",
                    points: 85,
                    bets: 12,
                    hits: 9,
                    accuracy: 75,
                    lastBet: "Hoje"
                },
                {
                    id: 2,
                    name: "Maria Santos",
                    points: 78,
                    bets: 12,
                    hits: 8,
                    accuracy: 67,
                    lastBet: "Ontem"
                }
                // More players...
            ],
            stats: {
                activePlayers: 12,
                rounds: 8,
                totalBets: 96,
                overallAccuracy: 67
            }
        };

        // Function to load data from JSON (for future implementation)
        async function loadDataFromJSON() {
            try {
                // This would be your actual JSON endpoint
                // const response = await fetch('/api/classification');
                // const data = await response.json();
                
                // For now, using sample data
                updateTable(sampleData.players);
                updateStats(sampleData.stats);
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }

        function updateTable(players) {
            const tbody = document.getElementById('classificationTableBody');
            tbody.innerHTML = players.map((player, index) => `
                <tr>
                    <td class="position">${index + 1}º</td>
                    <td class="player-name">${player.name}</td>
                    <td><strong>${player.points} pts</strong></td>
                    <td>${player.bets}</td>
                    <td>${player.hits}</td>
                    <td>${player.accuracy}%</td>
                    <td>${player.lastBet}</td>
                </tr>
            `).join('');
        }

        function updateStats(stats) {
            // Update stats cards with real data
            const statCards = document.querySelectorAll('.stat-number');
            statCards[0].textContent = stats.activePlayers;
            statCards[1].textContent = stats.rounds;
            statCards[2].textContent = stats.totalBets;
            statCards[3].textContent = stats.overallAccuracy + '%';
        }

        // Close sidebar when clicking on nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                toggleSidebar();
            });
        });

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Sistema de Palpites carregado!');
            // loadDataFromJSON(); // Uncomment when you have your JSON endpoint
        });