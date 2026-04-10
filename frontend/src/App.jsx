import { useEffect, useState } from 'react';
import './App.css';

// STUDENT TODO: This API_URL works for local development
// For Docker, you may need to configure nginx proxy or use container networking
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [theme, setTheme] = useState('light');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/todos`);
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    try {
      await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo.trim(), completed: false })
      });
      setNewTodo('');
      fetchTodos();
    } catch (err) {
      alert('Failed to add todo');
    }
  };

  const toggleTodo = async (todo) => {
    try {
      await fetch(`${API_URL}/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: todo.title,
          completed: !todo.completed
        })
      });
      fetchTodos();
    } catch (err) {
      alert('Failed to update todo');
    }
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const saveEdit = async (todo) => {
    const title = editingTitle.trim();
    if (!title) {
      alert('Title cannot be empty');
      return;
    }

    try {
      await fetch(`${API_URL}/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          completed: todo.completed
        })
      });
      cancelEdit();
      fetchTodos();
    } catch (err) {
      alert('Failed to save todo');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await fetch(`${API_URL}/api/todos/${id}`, { method: 'DELETE' });
      if (editingId === id) {
        cancelEdit();
      }
      fetchTodos();
    } catch (err) {
      alert('Failed to delete todo');
    }
  };

  const handleAddKeyDown = (event) => {
    if (event.key === 'Enter') {
      addTodo();
    }
  };

  const handleEditKeyDown = (event, todo) => {
    if (event.key === 'Enter') {
      saveEdit(todo);
    }
    if (event.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className={`app theme-${theme}`}>
      <div className="app-card">
        <header className="app-header">
          <div>
            <h1>DevOps Todo App</h1>
            <p className="subtitle">Frontend Updated</p>
          </div>
          <button className="theme-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? 'Light On' : 'Light Off'}
          </button>
        </header>

        <div className="todo-form">
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="Add new todo..."
          />
          <button className="primary-btn" onClick={addTodo}>
            Add
          </button>
        </div>

        {loading && <p className="status-text">Loading todos...</p>}

        <ul className="todo-list">
          {todos.map((todo) => {
            const isEditing = editingId === todo.id;
            return (
              <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <button
                  className="toggle-btn"
                  onClick={() => toggleTodo(todo)}
                  title="Toggle completed"
                >
                  {todo.completed ? '✅' : '⏳'}
                </button>

                <div className="todo-main">
                  {isEditing ? (
                    <input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(event) => handleEditKeyDown(event, todo)}
                      autoFocus
                    />
                  ) : (
                    <span className="todo-title">{todo.title}</span>
                  )}
                </div>

                <div className="todo-actions">
                  {isEditing ? (
                    <>
                      <button className="primary-btn" onClick={() => saveEdit(todo)}>Save</button>
                      <button className="secondary-btn" onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="secondary-btn" onClick={() => startEdit(todo)}>Edit</button>
                      <button className="danger-btn" onClick={() => deleteTodo(todo.id)}>Delete</button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default App;
