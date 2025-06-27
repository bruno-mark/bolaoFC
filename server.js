// Importa o framework Express para criar e gerenciar o servidor web
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();
const apiRoutes = require('./src/routes/index'); 

const { Pool } = require("pg");

dotenv.config();

// Cria uma instância do aplicativo Express
const port = process.env.PORT;
app.use(cors());
app.use(express.json()); 

// Rota principal da API
app.use('/api', apiRoutes);

// Coneta ao banco de dados PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log('✅ Conectado ao PostgreSQL'))
  .catch(err => console.error('❌ Erro ao conectar:', err));

// Inicia o servidor na porta definida e exibe uma mensagem no console
app.listen(port, function () {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});

app.get('/', (req, res) => {
  res.send('🚀 API rodando com sucesso!');
});

//require('./src/routes/api.js')(app, pool);
