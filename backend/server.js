const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// CONFIGURATION: Matches your docker-compose.yml exactly
const pool = new Pool({
   user: process.env.DB_USER || 'myuser',
   host: process.env.DB_HOST || 'postgres',
   database: process.env.DB_NAME || 'mydatabase',
   password: process.env.DB_PASSWORD || 'mypassword',
   port: process.env.DB_PORT || 5432,
});

// FIX: This removes the "Cannot GET /" error
app.get('/', (req, res) => {
   res.json({ 
      message: "The Sterling Vance Estate API is running!",
      endpoints: ["/health", "/api/todos"]
   });
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
      console.error("Database connection error:", err.message);
      res.status(500).json({ error: "Could not connect to database" });
   }
});

// POST todo with validation
app.post('/api/todos', async (req, res) => {
   try {
      const { title, completed = false } = req.body;

      // STUDENT FIX: Reject empty titles
      if (!title || title.trim() === "") {
         return res.status(400).json({ error: "Title is required" });
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
      const result = await pool.query('DELETE FROM todos WHERE id = $1', [id]);
      if (result.rowCount === 0) {
         return res.status(404).json({ error: "Todo not found" });
      }
      res.status(204).send();
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
         'UPDATE todos SET title = $1, completed = $2 WHERE id = $3 RETURNING *',
         [title, completed, id]
      );
      if (result.rows.length === 0) {
         return res.status(404).json({ error: "Todo not found" });
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