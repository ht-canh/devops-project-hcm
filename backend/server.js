const express = require('express');

require('dotenv').config();

const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const isTest = process.env.NODE_ENV === 'test';

let todos = [];
let nextTodoId = 1;

// BUG #1: Wrong default password - doesn't match docker-compose!
const pool = new Pool({
   user: process.env.DB_USER || 'admin',
   host: process.env.DB_HOST || 'localhost',
   database: process.env.DB_NAME || 'mydb',
   password: process.env.DB_PASSWORD || '123456',
   port: process.env.DB_PORT || 5432,
});

app.get('/health', (req, res) => {
   res.json({ status: 'healthy', version: '1.0.0' });
});

function createTodoRecord(title, completed = false) {
   const todo = {
      id: nextTodoId++,
      title,
      completed,
      created_at: new Date().toISOString(),
   };

   todos.push(todo);
   return todo;
}

function resetTodoStore() {
   todos = [];
   nextTodoId = 1;
}

// GET todos
app.get('/api/todos', async (req, res) => {
   try {
      if (isTest) {
         return res.json(todos);
      }

      const result = await pool.query('SELECT * FROM todos ORDER BY id');
      res.json(result.rows);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

// BUG #2: Missing validation - will cause test to fail!
// STUDENT TODO: Add validation to reject empty title
app.post('/api/todos', async (req, res) => {
   try {
      const { title, completed = false } = req.body;

      if (!title || title.trim() === '') {
         return res.status(400).json({ error: 'Title is required' });
      }

      if (isTest) {
         const todo = createTodoRecord(title.trim(), Boolean(completed));
         return res.status(201).json(todo);
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

// BUG #3: Missing DELETE endpoint - but test expects it!
// STUDENT TODO: Implement DELETE /api/todos/:id endpoint
app.delete('/api/todos/:id', async (req, res) => {
   try {
      const { id } = req.params;

      if (isTest) {
         const todoIndex = todos.findIndex((todo) => String(todo.id) === String(id));

         if (todoIndex === -1) {
            return res.status(404).json({ error: 'Todo not found' });
         }

         const [deletedTodo] = todos.splice(todoIndex, 1);
         return res.status(200).json(deletedTodo);
      }

      const result = await pool.query(
         'DELETE FROM todos WHERE id = $1 RETURNING *',
         [id]
      );

      if (result.rows.length === 0) {
         return res.status(404).json({ error: 'Todo not found' });
      }

      res.json(result.rows[0]);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});


// BUG #4: Missing PUT endpoint for updating todos
// STUDENT TODO: Implement PUT /api/todos/:id endpoint
app.put('/api/todos/:id', async (req, res) => {
   try {
      const { id } = req.params;
      const { title, completed } = req.body;

      if (title !== undefined && title.trim() === '') {
         return res.status(400).json({ error: 'Title cannot be empty' });
      }

      if (isTest) {
         const todo = todos.find((item) => String(item.id) === String(id));

         if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
         }

         if (title !== undefined) {
            todo.title = title.trim();
         }

         if (completed !== undefined) {
            todo.completed = completed;
         }

         return res.status(200).json(todo);
      }

      const checkExist = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
      if (checkExist.rows.length === 0) {
         return res.status(404).json({ error: 'Todo not found' });
      }

      const currentTodo = checkExist.rows[0];

      const updatedTitle = title !== undefined ? title : currentTodo.title;
      const updatedCompleted = completed !== undefined ? completed : currentTodo.completed;

      const result = await pool.query(
         'UPDATE todos SET title = $1, completed = $2 WHERE id = $3 RETURNING *',
         [updatedTitle, updatedCompleted, id]
      );

      res.json(result.rows[0]);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});


const port = process.env.PORT || 8080;

// BUG #5: Server starts even in test mode, causing port conflicts
// STUDENT FIX: Only start server if NOT in test mode
// app.listen(port, () => {
//    console.log(`Backend running on port ${port}`);
// });
if (!isTest) {
   pool.connect()
      .then(client => {
         console.log('Connected to PostgreSQL database successfully!');
         client.release();
         
         app.listen(port, () => {
            console.log(`Backend running on port ${port}`);
         });
      })
      .catch(err => {
         console.error('Failed to connect to PostgreSQL database:', err.message);
         process.exit(1); // Exit with failure code
      });
}

// BUG #6: App not exported - tests can't import it!
// STUDENT FIX: Export the app module
module.exports = app;
module.exports.app = app;
module.exports.pool = pool;
module.exports.resetTodoStore = resetTodoStore;