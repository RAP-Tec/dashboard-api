import { Client } from 'pg';
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());

// Configuração do banco de dados
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT),
};

app.get('/fetch-data', async (req, res) => {
  // Obter account_id da query string, com valor padrão 1 se não for fornecido
  const accountId = req.query.account_id ? Number(req.query.account_id) : 1;
  
  // Validar se account_id é um número válido
  if (isNaN(accountId)) {
    return res.status(400).json({ error: 'account_id deve ser um número válido' });
  }
  
  // Criar um novo cliente para cada requisição
  const client = new Client(dbConfig);
  
  try {
    await client.connect();

    // TOTAL DE CONTATOS E CONTATOS DO MÊS ANTERIOR
    const result1 = await client.query(`SELECT 
            COUNT(*) AS total_contacts,
            (SELECT COUNT(*) 
            FROM contacts 
            WHERE account_id = $1 
            AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
            AND created_at < date_trunc('month', CURRENT_DATE)) AS previous_month_contacts
        FROM contacts
        WHERE account_id = $1`, [accountId]);

    // TOTAL DE TEAMS E TEAMS DO MÊS ANTERIOR
    const result2 = await client.query(`SELECT 
            COUNT(*) AS total_teams,
            (SELECT COUNT(*) 
            FROM teams 
            WHERE account_id = $1 
            AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
            AND created_at < date_trunc('month', CURRENT_DATE)) AS previous_month_teams
        FROM teams
        WHERE account_id = $1`, [accountId]);

    // TOTAL DE USERS E USERS DO MÊS ANTERIOR
    const result3 = await client.query(`SELECT 
            COUNT(*) AS total_users,
            (SELECT COUNT(*) 
            FROM account_users 
            WHERE account_id = $1 
            AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
            AND created_at < date_trunc('month', CURRENT_DATE)) AS previous_month_users
        FROM account_users
        WHERE account_id = $1`, [accountId]);

    // TOTAL DE conversations E conversations DO MÊS ANTERIOR
    const result4 = await client.query(`SELECT 
          COUNT(*) AS total_conversations,
            (SELECT COUNT(*) 
            FROM conversations 
            WHERE account_id = $1 
            AND last_activity_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
            AND last_activity_at < date_trunc('month', CURRENT_DATE)) AS previous_month_conversations
        FROM conversations
        WHERE account_id = $1`, [accountId]);

    // TOTAL DE conversations E conversations DO MÊS ANTERIOR
    const result5 = await client.query(`SELECT 
          COUNT(*) AS total_today_conversations,
            (SELECT COUNT(*) 
            FROM conversations 
            WHERE account_id = $1 
            AND last_activity_at >= CURRENT_DATE 
            AND last_activity_at < CURRENT_DATE + INTERVAL '1 day') AS total_yesterday_conversations
        FROM conversations
        WHERE account_id = $1
        AND last_activity_at >= CURRENT_DATE - INTERVAL '1 day'
        AND last_activity_at < CURRENT_DATE`, [accountId]);
    
    // TOTAL DE messages E messages DO MÊS ANTERIOR
    const result6 = await client.query(`SELECT 
          COUNT(*) AS total_messages,
            (SELECT COUNT(*) 
            FROM messages 
            WHERE account_id = $1 
            AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
            AND created_at < date_trunc('month', CURRENT_DATE)) AS previous_month_messages
        FROM messages
        WHERE account_id = $1`, [accountId]);

    // TOTAL DE messages E messages DO MÊS ANTERIOR
    const result7 = await client.query(`SELECT 
          COUNT(*) AS total_today_conversations,
            (SELECT COUNT(*) 
            FROM conversations 
            WHERE account_id = $1 
            AND last_activity_at >= CURRENT_DATE 
            AND last_activity_at < CURRENT_DATE + INTERVAL '1 day') AS total_today_conversations_with_status_1,
            ROUND(
                (CAST(
                    (SELECT COUNT(*) 
                    FROM conversations 
                    WHERE account_id = $1 
                    AND last_activity_at >= CURRENT_DATE 
                    AND last_activity_at < CURRENT_DATE + INTERVAL '1 day'
                    AND status = 1) AS NUMERIC) / 
                CAST(
                    COUNT(*) AS NUMERIC)
                ) * 100, 2) AS percentage
        FROM conversations
        WHERE account_id = $1
        AND last_activity_at >= CURRENT_DATE
        AND last_activity_at < CURRENT_DATE + INTERVAL '1 day'`, [accountId]);

    // TOTAL DE messages E messages DO MÊS ANTERIOR
    const result8 = await client.query(`SELECT 
          status,
            CASE 
                WHEN status = 0 THEN 'open'
                WHEN status = 1 THEN 'resolved'
                WHEN status = 2 THEN 'pending'
                WHEN status = 3 THEN 'snoozed'
                ELSE 'open'
            END AS status_label,
            COUNT(*) AS total_conversations,
            ROUND(
                (CAST(COUNT(*) AS NUMERIC) / 
                (SELECT COUNT(*) 
                  FROM conversations 
                  WHERE account_id = $1 
                  AND last_activity_at >= CURRENT_DATE 
                  AND last_activity_at < CURRENT_DATE + INTERVAL '1 day')
                ) * 100, 2) AS percentage
        FROM conversations
        WHERE account_id = $1
        AND last_activity_at >= CURRENT_DATE
        AND last_activity_at < CURRENT_DATE + INTERVAL '1 day'
        GROUP BY status
        ORDER BY status`, [accountId]);

    // TOTAL DE messages E messages DO MÊS ANTERIOR
    const result9 = await client.query(`SELECT 
          TO_CHAR(last_activity_at, 'HH24') AS hour,
            COUNT(*) AS total_conversations
        FROM conversations
        WHERE account_id = $1
        AND last_activity_at >= CURRENT_DATE
        AND last_activity_at < CURRENT_DATE + INTERVAL '1 day'
        AND last_activity_at >= NOW() - INTERVAL '10 hours'
        GROUP BY TO_CHAR(last_activity_at, 'HH24')
        ORDER BY hour ASC`, [accountId]);
    

    // Estrutura os resultados
    const data = {
      tabela1: result1.rows,
      tabela2: result2.rows,
      tabela3: result3.rows,
      tabela4: result4.rows,
      tabela5: result5.rows,
      tabela6: result6.rows,
      tabela7: result7.rows,
      tabela8: result8.rows,
      tabela9: result9.rows,
    };

    // Retorna os dados na resposta HTTP
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  } finally {
    // Fecha a conexão do cliente atual
    await client.end();
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
