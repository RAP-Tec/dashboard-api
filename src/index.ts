import { Client } from 'pg';
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());

// Configuração do banco de dados
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT),
});

app.get('/fetch-data', async (req, res) => {
  try {
    await client.connect();

    // Executa dois SELECTs
    const result1 = await client.query('SELECT * FROM accounts LIMIT 5');
    const result2 = await client.query('SELECT * FROM users LIMIT 5');

    // Estrutura os resultados
    const data = {
      tabela1: result1.rows,
      tabela2: result2.rows,
    };

    // Retorna os dados na resposta HTTP
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  } finally {
    await client.end();
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
