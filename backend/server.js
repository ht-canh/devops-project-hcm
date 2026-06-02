const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const pool = new Pool({
   user: process.env.DB_USER || 'postgres',
   host: process.env.DB_HOST || 'localhost',
   database: process.env.DB_NAME || 'tododb',
   password: process.env.DB_PASSWORD || 'postgres',
   port: process.env.DB_PORT || 5432,
   connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 5000,
});

app.locals.pool = pool;

app.get('/health', (req, res) => {
   res.json({ status: 'healthy', version: '1.0.0' });
});

app.get('/api/todos', async (req, res) => {
   try {
      const result = await pool.query('SELECT * FROM todos ORDER BY id');
      res.json(result.rows);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

app.post('/api/todos', async (req, res) => {
   try {
      const { title, completed = false } = req.body;

      if (!title || !title.trim()) {
         return res.status(400).json({ error: 'Todo title is required' });
      }

      const result = await pool.query(
         'INSERT INTO todos(title, completed) VALUES($1, $2) RETURNING *',
         [title.trim(), completed]
      );
      res.status(201).json(result.rows[0]);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

app.delete('/api/todos/:id', async (req, res) => {
   try {
      const result = await pool.query(
         'DELETE FROM todos WHERE id = $1 RETURNING *',
         [req.params.id]
      );

      if (result.rowCount === 0) {
         return res.status(404).json({ error: 'Todo not found' });
      }

      res.json({ message: 'Todo deleted', todo: result.rows[0] });
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

app.put('/api/todos/:id', async (req, res) => {
   try {
      const { title, completed = false } = req.body;

      if (!title || !title.trim()) {
         return res.status(400).json({ error: 'Todo title is required' });
      }

      const result = await pool.query(
         'UPDATE todos SET title = $1, completed = $2 WHERE id = $3 RETURNING *',
         [title.trim(), completed, req.params.id]
      );

      if (result.rowCount === 0) {
         return res.status(404).json({ error: 'Todo not found' });
      }

      res.json(result.rows[0]);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

const port = process.env.PORT || 8080;

if (process.env.NODE_ENV !== 'test') {
   app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
   });
}

module.exports = app;
