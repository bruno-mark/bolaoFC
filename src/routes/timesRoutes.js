////////////////////
// Rotas de Times///
////////////////////

// src/routes/timesRoutes.js

const express = require('express');
const router = express.Router(); // MUITO IMPORTANTE: Usar express.Router()
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ROTA: GET /api/times (Busca todos os times)
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM times ORDER BY nome ASC');
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ROTA: POST /api/times (Cria um novo time)
router.post('/', async (req, res) => {
    try {
        const { nome, url_escudo, campeonato_id } = req.body; // Adicionei campeonato_id
        if (!nome || !url_escudo || !campeonato_id) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }
        const novoTime = await pool.query(
            'INSERT INTO times (nome, url_escudo, campeonato_id) VALUES ($1, $2, $3) RETURNING *',
            [nome, url_escudo, campeonato_id]
        );
        res.status(201).json(novoTime.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ROTA: PUT /api/times/:id (Atualiza um time)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, url_escudo } = req.body;
        await pool.query(
            'UPDATE times SET nome = $1, url_escudo = $2 WHERE id = $3',
            [nome, url_escudo, id]
        );
        res.json({ message: 'Time atualizado com sucesso!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ROTA: DELETE /api/times/:id (Deleta um time)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM times WHERE id = $1', [id]);
        res.json({ message: 'Time deletado com sucesso!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router; // MUITO IMPORTANTE: Exportar o router