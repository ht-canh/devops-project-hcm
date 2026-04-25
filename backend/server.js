const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

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
});

app.get('/health', (req, res) => {
   res.json({ status: 'healthy', version: '1.0.0' });
});

// GET todos
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

      if (!title || !String(title).trim()) {
         return res.status(400).json({ error: 'title is required' });
      }

      const result = await pool.query(
         'INSERT INTO todos(title, completed) VALUES($1, $2) RETURNING *',
         [String(title).trim(), completed]
      );
      res.status(201).json(result.rows[0]);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

app.delete('/api/todos/:id', async (req, res) => {
   try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
         return res.status(404).json({ error: 'todo not found' });
      }

      return res.status(200).json(result.rows[0]);
   } catch (err) {
      return res.status(500).json({ error: err.message });
   }
});

app.put('/api/todos/:id', async (req, res) => {
   try {
      const { id } = req.params;
      const { title, completed } = req.body;

      if (title !== undefined && !String(title).trim()) {
         return res.status(400).json({ error: 'title cannot be empty' });
      }

      const result = await pool.query(
         `UPDATE todos
          SET title = COALESCE($1, title),
              completed = COALESCE($2, completed)
          WHERE id = $3
          RETURNING *`,
         [title !== undefined ? String(title).trim() : null, completed ?? null, id]
      );

      if (result.rows.length === 0) {
         return res.status(404).json({ error: 'todo not found' });
      }

      return res.status(200).json(result.rows[0]);
   } catch (err) {
      return res.status(500).json({ error: err.message });
   }
});

const port = process.env.PORT || 8080;

if (process.env.NODE_ENV !== 'test') {
   app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
   });
}

module.exports = app;
