module.exports = (app, pool) => {
    ///////////////////////
    // Rotas de Usuários///
    ///////////////////////
    app.get('/api/usuarios', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM usuarios ORDER BY nome');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
    });

    /////////////////////////
    // Rotas de Campeonatos//
    /////////////////////////

    app.get('/api/campeonatos', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM campeonatos ORDER BY ano DESC, nome');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar campeonatos' });
    }
    });

    

    /////////////////////
    // Rotas de Rodadas//
    /////////////////////
    app.get('/api/rodadas', async (req, res) => {
    try {
        const query = `
        SELECT r.*, c.nome as campeonato_nome 
        FROM rodadas r
        JOIN campeonatos c ON r.campeonato_id = c.id
        ORDER BY r.numero
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar rodadas' });
    }
    });
    // Rota para criar uma nova rodada
    app.post('/api/rodadas', async (req, res) => {
        const { numero, campeonato_id, status } = req.body;
        
        try {
            const query = `
                INSERT INTO rodadas (numero, campeonato_id, status)
                VALUES ($1, $2, $3)
                RETURNING *
            `;
            const { rows } = await pool.query(query, [numero, campeonato_id, status]);
            res.status(201).json(rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao criar rodada' });
        }
    });

    // Rota para excluir uma rodada
    app.delete('/api/rodadas/:id', async (req, res) => {
        const { id } = req.params;
        
        try {
            // Primeiro exclui os jogos da rodada
            await pool.query('DELETE FROM jogos WHERE rodada_id = $1', [id]);
            
            // Depois exclui a rodada
            await pool.query('DELETE FROM rodadas WHERE id = $1', [id]);
            
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao excluir rodada' });
        }
    });

    ////////////////////
    // Rotas de Jogos///
    ////////////////////
    app.get('/api/jogos', async (req, res) => {
    try {
        const query = `
        SELECT 
            j.*,
            r.numero as rodada_numero,
            tc.nome as time_casa_nome,
            tf.nome as time_fora_nome
        FROM jogos j
        JOIN rodadas r ON j.rodada_id = r.id
        JOIN times tc ON j.time_casa_id = tc.id
        JOIN times tf ON j.time_fora_id = tf.id
        ORDER BY r.numero
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar jogos' });
    }
    });

    // Rota para buscar jogos com filtro de rodada
    app.get('/api/jogos', async (req, res) => {
        const { rodada_id } = req.query;
        
        try {
            let query = `
                SELECT 
                    j.*,
                    tc.nome as time_casa_nome,
                    tf.nome as time_fora_nome
                FROM jogos j
                JOIN times tc ON j.time_casa_id = tc.id
                JOIN times tf ON j.time_fora_id = tf.id
            `;
            
            const params = [];
            
            if (rodada_id) {
                query += ' WHERE j.rodada_id = $1';
                params.push(rodada_id);
            }
            
            query += ' ORDER BY j.id';
            
            const { rows } = await pool.query(query, params);
            res.json(rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao buscar jogos' });
        }
    });

    // Rota para criar um novo jogo
    app.post('/api/jogos', async (req, res) => {
        const { rodada_id, time_casa_id, time_fora_id } = req.body;
        
        try {
            const query = `
                INSERT INTO jogos (rodada_id, time_casa_id, time_fora_id)
                VALUES ($1, $2, $3)
                RETURNING *
            `;
            const { rows } = await pool.query(query, [rodada_id, time_casa_id, time_fora_id]);
            res.status(201).json(rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao criar jogo' });
        }
    });

    //////////////////////
    // Rotas de Palpites//
    //////////////////////
    app.get('/api/palpites', async (req, res) => {
    try {
        const query = `
        SELECT 
            p.*,
            u.nome as usuario_nome,
            j.id as jogo_id,
            tc.nome as time_casa_nome,
            tf.nome as time_fora_nome,
            r.numero as rodada_numero
        FROM palpites p
        JOIN usuarios u ON p.usuario_id = u.id
        JOIN jogos j ON p.jogo_id = j.id
        JOIN times tc ON j.time_casa_id = tc.id
        JOIN times tf ON j.time_fora_id = tf.id
        JOIN rodadas r ON j.rodada_id = r.id
        ORDER BY p.data_palpite DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar palpites' });
    }
    });

    app.post('/api/palpites', async (req, res) => {
    const { usuario_id, jogo_id, palpite_gols_casa, palpite_gols_fora } = req.body;
    
    // Verifica se o usuário já fez palpite para este jogo
    try {
        const checkQuery = 'SELECT * FROM palpites WHERE usuario_id = $1 AND jogo_id = $2';
        const checkResult = await pool.query(checkQuery, [usuario_id, jogo_id]);
        
        if (checkResult.rows.length > 0) {
        return res.status(400).json({ error: 'Usuário já fez palpite para este jogo' });
        }
        
        const insertQuery = `
        INSERT INTO palpites 
            (usuario_id, jogo_id, palpite_gols_casa, palpite_gols_fora) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *
        `;
        const { rows } = await pool.query(insertQuery, 
        [usuario_id, jogo_id, palpite_gols_casa, palpite_gols_fora]);
        
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao registrar palpite' });
    }
    });

    ////////////////////////
    // Rotas de Pontuações//
    ////////////////////////
    app.get('/api/pontuacoes', async (req, res) => {
    try {
        const query = `
        SELECT 
            p.*,
            u.nome as usuario_nome,
            c.nome as campeonato_nome
        FROM pontuacoes p
        JOIN usuarios u ON p.usuario_id = u.id
        JOIN campeonatos c ON p.campeonato_id = c.id
        ORDER BY p.pontos_total DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar pontuações' });
    }
    });

    // Rota para calcular pontuações (pode ser chamada após os jogos serem finalizados)
    app.post('/api/calcular-pontuacoes/:campeonato_id', async (req, res) => {
    const { campeonato_id } = req.params;
    
    try {
        // Primeiro, zera as pontuações atuais para o campeonato
        await pool.query(
        'UPDATE pontuacoes SET pontos_total = 0 WHERE campeonato_id = $1',
        [campeonato_id]
        );
        
        // Calcula os pontos para cada palpite
        const calculoQuery = `
        INSERT INTO pontuacoes (usuario_id, campeonato_id, pontos_total)
        SELECT 
            p.usuario_id,
            r.campeonato_id,
            SUM(
            CASE
                WHEN p.palpite_gols_casa = j.gols_casa AND p.palpite_gols_fora = j.gols_fora THEN 3
                WHEN SIGN(p.palpite_gols_casa - p.palpite_gols_fora) = SIGN(j.gols_casa - j.gols_fora) THEN 1
                ELSE 0
            END
            ) as pontos
        FROM palpites p
        JOIN jogos j ON p.jogo_id = j.id
        JOIN rodadas r ON j.rodada_id = r.id
        WHERE r.campeonato_id = $1
            AND j.gols_casa IS NOT NULL
            AND j.gols_fora IS NOT NULL
        GROUP BY p.usuario_id, r.campeonato_id
        ON CONFLICT (usuario_id, campeonato_id) 
        DO UPDATE SET pontos_total = EXCLUDED.pontos_total
        `;
        
        await pool.query(calculoQuery, [campeonato_id]);
        
        res.json({ success: true, message: 'Pontuações calculadas com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao calcular pontuações' });
    }
    })
};