const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Cấu hình Database
const pool = new Pool({
   user: process.env.DB_USER || 'devops_user',
   host: process.env.DB_HOST || 'localhost',
   database: process.env.DB_NAME || 'devops_db',
   password: process.env.DB_PASSWORD || 'devops_password',
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

// POST todo
app.post('/api/todos', async (req, res) => {
   try {
      const { title, completed = false } = req.body;
      if (!title || title.trim() === '') {
         return res.status(400).json({ error: 'Title is required' });
      }
      const result = await pool.query(
         'INSERT INTO todos(title, completed) VALUES($1, $2) RETURNING *',
         [title, completed]
      );
      res.status(201).json(result.rows[0]);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

// DELETE todo
app.delete('/api/todos/:id', async (req, res) => {
   try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
      if (result.rowCount === 0) {
         return res.status(404).json({ error: 'Todo not found' });
      }
      res.json({ message: 'Todo deleted successfully' });
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

// PUT todo
app.put('/api/todos/:id', async (req, res) => {
   try {
      const { id } = req.params;
      const { title, completed } = req.body;
      const result = await pool.query(
         'UPDATE todos SET title = COALESCE($1, title), completed = COALESCE($2, completed) WHERE id = $3 RETURNING *',
         [title, completed, id]
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

// QUAN TRỌNG: Chỉ chạy app.listen nếu không phải môi trường test
if (process.env.NODE_ENV !== 'test') {
   app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
   });
}
//........
module.exports = app;