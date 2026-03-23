const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// FIX #1: Correct default password
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

// FIX #2: Validation added
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

// FIX #3: DELETE endpoint
app.delete('/api/todos/:id', async (req, res) => {
   try {
      const { id } = req.params;

      const result = await pool.query(
         'DELETE FROM todos WHERE id=$1 RETURNING *',
         [id]
      );

      if (result.rowCount === 0) {
         return res.status(404).json({ error: 'Todo not found' });
      }

      res.json({ message: 'Deleted successfully' });
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

// FIX #4: PUT endpoint
app.put('/api/todos/:id', async (req, res) => {
   try {
      const { id } = req.params;
      const { title, completed } = req.body;

      if (!title || title.trim() === '') {
         return res.status(400).json({ error: 'Title is required' });
      }

      const result = await pool.query(
         'UPDATE todos SET title=$1, completed=$2 WHERE id=$3 RETURNING *',
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

// FIX #5: Do not start server in test mode
if (process.env.NODE_ENV !== 'test') {
   app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
   });
}

// FIX #6: Export app for testing
module.exports = app;