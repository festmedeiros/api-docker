require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const logger = require('./logs/logger-winston');
const port = 3000;

const app = express();
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT
});

db.connect(err => {
  if (err) {
    logger.error('Erro ao conectar no banco de dados:', err);
    throw err;
  }
  logger.info('Conectado ao MySQL!');
  db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255)
    )`);
});

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'User API',
      version: '1.0.0',
      description: 'CRUD de usuários com MySQL'
    }
  },
  apis: ['server.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista todos os usuários
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
app.get('/users', (req, res) => {
  try {
    db.query('SELECT * FROM users', (err, results) => {
      if (err) throw err;
      logger.info('GET /users - Lista de usuários retornada');
      res.json(results);
    });
  } catch (err) {
    logger.error('Erro ao listar usuários:', err);
    res.status(500).json({ erro: 'Erro ao listar usuários' });
  }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Cria um novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado
 */
app.post('/users', (req, res) => {
  try {
    const { name, email } = req.body;
    db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], (err, result) => {
      if (err) throw err;
      logger.info(`POST /users - Usuário criado: ${name}`);
      res.status(201).json({ id: result.insertId, name, email });
    });
  } catch (err) {
    logger.error('Erro ao criar usuário:', err);
    res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Atualiza um usuário
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado
 */
app.put('/users/:id', (req, res) => {
  try {
    const { name, email } = req.body;
    db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.params.id], (err) => {
      if (err) throw err;
      logger.info(`PUT /users/${req.params.id} - Usuário atualizado`);
      res.json({ id: req.params.id, name, email });
    });
  } catch (err) {
    logger.error(`Erro ao atualizar usuário ${req.params.id}:`, err);
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Remove um usuário
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Usuário removido
 */
app.delete('/users/:id', (req, res) => {
  try {
    db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
      if (err) throw err;
      logger.info(`DELETE /users/${req.params.id} - Usuário removido`);
      res.status(204).send();
    });
  } catch (err) {
    logger.error(`Erro ao remover usuário ${req.params.id}:`, err);
    res.status(500).json({ erro: 'Erro ao remover usuário' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`Swagger em http://localhost:${port}/swagger`);
});
