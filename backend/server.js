const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// FIX BUG #1: Cấu hình DB chuẩn theo Docker Compose và Lab Secret
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'devops_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', version: '1.0.0' });
});

// GET todos
app.get('/api/todos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM todos ORDER BY id');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// FIX BUG #2: Thêm Validation để chặn title rỗng (Pass bài test POST)
app.post('/api/todos', async (req, res) => {
    const { title, completed = false } = req.body;

    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO todos(title, completed) VALUES($1, $2) RETURNING *',
            [title, completed]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// FIX BUG #3: Triển khai DELETE endpoint (Pass bài test DELETE)
app.delete('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        res.status(200).json({ message: 'Todo deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// FIX BUG #4: Triển khai PUT endpoint (Pass bài test PUT)
app.put('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { title, completed } = req.body;
    try {
        const result = await pool.query(
            'UPDATE todos SET title = $1, completed = $2 WHERE id = $3 RETURNING *',
            [title, completed, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const port = process.env.PORT || 8080;

// FIX BUG #5: Chỉ khởi động server khi KHÔNG phải đang chạy Test
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Backend running on port ${port}`);
    });
}

module.exports = app;