process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');

describe('Todos API', () => {
   afterAll(async () => {
      await app.locals.pool.end();
   });

   it('GET /health should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
   });

   it('GET /api/todos should return array', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
   });

   it('POST /api/todos creates todo with valid title', async () => {
      const res = await request(app)
         .post('/api/todos')
         .send({ title: 'Test todo' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test todo');
      expect(res.body.completed).toBe(false);
   });

   it('POST /api/todos rejects empty title', async () => {
      const res = await request(app)
         .post('/api/todos')
         .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/title/i);
   });

   it('POST /api/todos rejects whitespace-only title', async () => {
      const res = await request(app)
         .post('/api/todos')
         .send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/title/i);
   });

   it('DELETE /api/todos/:id removes todo', async () => {
      const createRes = await request(app)
         .post('/api/todos')
         .send({ title: 'To be deleted' });

      const todoId = createRes.body.id;

      const deleteRes = await request(app)
         .delete(`/api/todos/${todoId}`);

      expect(deleteRes.status).toBe(200);
   });

   it('PUT /api/todos/:id updates todo', async () => {
      const createRes = await request(app)
         .post('/api/todos')
         .send({ title: 'Original title' });

      const todoId = createRes.body.id;

      const updateRes = await request(app)
         .put(`/api/todos/${todoId}`)
         .send({ title: 'Updated title', completed: true });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.title).toBe('Updated title');
      expect(updateRes.body.completed).toBe(true);
   });
});
