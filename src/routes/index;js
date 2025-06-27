// src/routes/index.js

const express = require('express');
const router = express.Router();

// Importa os roteadores específicos
const timesRoutes = require('./timesRoutes');
// const rodadasRoutes = require('./rodadasRoutes'); // << Você vai criar este
// const jogosRoutes = require('./jogosRoutes');   // << E este no futuro

// Diz ao roteador principal para usar os roteadores específicos
router.use('/times', timesRoutes);
// router.use('/rodadas', rodadasRoutes);
// router.use('/jogos', jogosRoutes);

module.exports = router;