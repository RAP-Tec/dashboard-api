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

    // TOTAL DE CONTATOS E CONTATOS DO MÊS ANTERIOR POR ACCOUNT_ID = 1
    const result1 = await client.query(`SELECT 
            COUNT(*) AS total_contacts,
            (SELECT COUNT(*) 
            FROM contacts 
            WHERE account_id = 1 
            AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
            AND created_at < date_trunc('month', CURRENT_DATE)) AS previous_month_contacts
        FROM contacts
        WHERE account_id = 1`);

    // TOTAL DE TEAMS E TEAMS DO MÊS ANTERIOR POR ACCOUNT_ID = 1
    const result2 = await client.query(`SELECT 
            COUNT(*) AS total_teams,
            (SELECT COUNT(*) 
            FROM teams 
            WHERE account_id = 1 
            AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
            AND created_at < date_trunc('month', CURRENT_DATE)) AS previous_month_teams
        FROM teams
        WHERE account_id = 1`);

    // TOTAL DE USERS E USERS DO MÊS ANTERIOR POR ACCOUNT_ID = 1
    const result3 = await client.query(`SELECT 
            COUNT(*) AS total_users,
            (SELECT COUNT(*) 
            FROM account_users 
            WHERE account_id = 1 
            AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
            AND created_at < date_trunc('month', CURRENT_DATE)) AS previous_month_users
        FROM account_users
        WHERE account_id = 1`);

    // TOTAL DE conversations E conversations DO MÊS ANTERIOR POR ACCOUNT_ID = 1
    const result4 = await client.query(`SELECT 
          COUNT(*) AS total_conversations,
            (SELECT COUNT(*) 
            FROM conversations 
            WHERE account_id = 1 
            AND last_activity_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
            AND last_activity_at < date_trunc('month', CURRENT_DATE)) AS previous_month_conversations
        FROM conversations
        WHERE account_id = 1`);

    // TOTAL DE conversations E conversations DO MÊS ANTERIOR POR ACCOUNT_ID = 1
    const result5 = await client.query(`SELECT 
          COUNT(*) AS total_today_conversations,
            (SELECT COUNT(*) 
            FROM conversations 
            WHERE account_id = 1 
            AND last_activity_at >= CURRENT_DATE 
            AND last_activity_at < CURRENT_DATE + INTERVAL '1 day') AS total_yesterday_conversations
        FROM conversations
        WHERE account_id = 1
        AND last_activity_at >= CURRENT_DATE - INTERVAL '1 day'
        AND last_activity_at < CURRENT_DATE;`);
    
    // TOTAL DE messages E messages DO MÊS ANTERIOR POR ACCOUNT_ID = 1
    const result6 = await client.query(`SELECT 
          COUNT(*) AS total_messages,
            (SELECT COUNT(*) 
            FROM messages 
            WHERE account_id = 1 
            AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
            AND created_at < date_trunc('month', CURRENT_DATE)) AS previous_month_messages
        FROM messages
        WHERE account_id = 1;`);
    

    // Estrutura os resultados
    const data = {
      tabela1: result1.rows,
      tabela2: result2.rows,
      tabela3: result3.rows,
      tabela4: result4.rows,
      tabela5: result5.rows,
      tabela6: result6.rows,
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
