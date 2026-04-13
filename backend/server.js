const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
dotenv.config();

// BUG #1: Wrong default password - doesn't match docker-compose!
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "tododb",
  password: process.env.DB_PASSWORD || "postgres",
  port: process.env.DB_PORT || 5432,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT false
    );
  `);
}

const port = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.json({ status: "healthy", version: "1.0.0" });
});

// GET todos
app.get("/api/todos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM todos ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BUG #2: Missing validation - will cause test to fail!
// STUDENT TODO: Add validation to reject empty title
app.post("/api/todos", async (req, res) => {
  try {
    const { title, completed = false } = req.body;

    // STUDENT FIX: Add validation here!
    // Hint: Check if title is empty or undefined
    // Return 400 status with error message if invalid
    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const result = await pool.query(
      "INSERT INTO todos(title, completed) VALUES($1, $2) RETURNING *",
      [title, completed],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BUG #3: Missing DELETE endpoint - but test expects it!
// STUDENT TODO: Implement DELETE /api/todos/:id endpoint

app.delete("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM todos WHERE id = $1`, [id]);

    res.status(200).json({ message: "Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// BUG #4: Missing PUT endpoint for updating todos
// STUDENT TODO: Implement PUT /api/todos/:id endpoint

app.put("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    // Validation: Check if todo exists first
    const checkResult = await pool.query("SELECT * FROM todos WHERE id = $1", [
      id,
    ]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }

    // Build dynamic update query based on what fields are provided
    let updateQuery = "UPDATE todos SET ";
    const updateValues = [];
    let paramCounter = 1;

    if (title !== undefined) {
      // Validate title if provided
      if (!title || title.trim() === "") {
        return res.status(400).json({
          error: "Title cannot be empty",
        });
      }
      updateValues.push(title.trim());
      updateQuery += `title = $${paramCounter}, `;
      paramCounter++;
    }

    if (completed !== undefined) {
      updateValues.push(completed);
      updateQuery += `completed = $${paramCounter}, `;
      paramCounter++;
    }

    // If no fields to update
    if (updateValues.length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
      });
    }

    // Remove trailing comma and space, add WHERE clause
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE id = $${paramCounter} RETURNING *`;
    updateValues.push(id);

    const result = await pool.query(updateQuery, updateValues);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BUG #5: Server starts even in test mode, causing port conflicts
// STUDENT FIX: Only start server if NOT in test mode
let ready;

async function init() {
  await initDB();
  console.log("DB initialized");
}

if (process.env.NODE_ENV !== "test") {
  ready = init();
  ready.then(() => {
    app.listen(port, () => {
      console.log("Hello");
      console.log(`Backend running on port ${port}`);
    });
  });
} else {
  // In test mode, ensure DB is initialized before tests run
  ready = init();
}

module.exports = { app, ready };
