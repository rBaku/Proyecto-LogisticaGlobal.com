const request = require('supertest');
const express = require('express');
const chai = require('chai');
const jwt = require('jsonwebtoken');
const {initializePool } = require('../db');
const usersRouter = require('../routes/users');
const expect = chai.expect;
const cookieParser = require('cookie-parser');
let pool;

describe('API /api/users (Integración)', () => {
  let app;
  let token;

  before(async function () {
    this.timeout(10000);

    pool = await initializePool();

    // Crear la app con los middlewares reales
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/users', usersRouter);
  });

  beforeEach(async () => {
    token = jwt.sign({ id: 9992, role: 'admin' }, process.env.JWT_SECRET);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        INSERT INTO users (id, username, email, password, role, full_name)
        VALUES 
          (99991, 'testuser1', 'test1@example.com', 'hashed', 'supervisor', 'User One')
        ON CONFLICT (id) DO NOTHING
      `);

      await client.query(`
        INSERT INTO users (id, username, email, password, role, full_name)
        VALUES 
          (99992, 'testuser2', 'test2@example.com', 'hashed', 'admin', 'User Two')
        ON CONFLICT (id) DO NOTHING
      `);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });

  afterEach(async () => {
    await pool.query('DELETE FROM users WHERE id >= 99991');
    await pool.query('DELETE FROM users WHERE username = $1', ['newuser']);
  });

  // Test con token válido
  it('GET / debería devolver lista de usuarios', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Cookie', [`access_token=${token}`])
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    const usernames = res.body.map(u => u.username);
    expect(usernames).to.include('testuser1');
    expect(usernames).to.include('testuser2');
  });

  it('GET /:id debería devolver un usuario existente', async () => {
    const res = await request(app)
      .get('/api/users/99991')
      .set('Cookie', [`access_token=${token}`])
    expect(res.status).to.equal(200);
    expect(res.body).to.include({
      id: 99991,
      username: 'testuser1',
      email: 'test1@example.com',
      role: 'supervisor',
      full_name: 'User One'
    });
  });

  it('POST / debería crear un nuevo usuario correctamente', async () => {
    const newUser = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'securepass123',
      role: 'user',
      full_name: 'New User'
    };

    const res = await request(app)
      .post('/api/users')
      .set('Cookie', `access_token=${token}`)
      .send(newUser);

    expect(res.status).to.equal(201);
    expect(res.body).to.include({
      username: 'newuser',
      email: 'newuser@example.com',
      role: 'user',
      full_name: 'New User'
    });

    await pool.query('DELETE FROM users WHERE username = $1', ['newuser']);
  });

  it('POST / debería fallar si falta username', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Cookie', `access_token=${token}`)
      .send({
        email: 'falta@example.com',
        password: '123456'
      });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('POST / debería fallar si el username o email ya existen', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Cookie', `access_token=${token}`)
      .send({
        username: 'testuser1',
        email: 'otro@example.com',
        password: '123456'
      });

    expect(res.status).to.equal(409);
    expect(res.body).to.have.property('error');
  });

  it('PUT /:id debería actualizar un usuario', async () => {
    const res = await request(app)
      .put('/api/users/99991')
      .set('Cookie', `access_token=${token}`)
      .send({
        full_name: 'Actualizado User One',
        role: 'supervisor'
      });

    expect(res.status).to.equal(200);
    expect(res.body).to.include({
      id: 99991,
      full_name: 'Actualizado User One',
      role: 'supervisor'
    });
  });

  it('PUT /:id debería devolver 404 si no existe', async () => {
    const res = await request(app)
      .put('/api/users/99999')
      .set('Cookie', `access_token=${token}`)
      .send({ full_name: 'No Existe' });

    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('error');
  });

  it('DELETE /:id debería eliminar un usuario', async () => {
    await pool.query(`
      INSERT INTO users (id, username, email, password, role)
      VALUES (99995, 'deleteuser', 'delete@example.com', 'hashed', 'supervisor')
    `);

    const res = await request(app)
      .delete('/api/users/99995')
      .set('Cookie', [`access_token=${token}`])

    expect(res.status).to.equal(204);

    const check = await request(app)
      .get('/api/users/99995')
      .set('Cookie', [`access_token=${token}`])

    expect(check.status).to.equal(404);
  });

  it('DELETE /:id debería devolver 404 si el usuario no existe', async () => {
    const res = await request(app)
      .delete('/api/users/99999')
      .set('Cookie', [`access_token=${token}`])

    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('error');
  });

  it('GET /username/:username debería devolver usuario por username', async () => {
    const res = await request(app)
      .get('/api/users/username/testuser1')
      .set('Cookie', [`access_token=${token}`])

    expect(res.status).to.equal(200);
    expect(res.body).to.include({
      username: 'testuser1',
      full_name: 'User One',
      role: 'supervisor'
    });
  });

  it('GET /username/:username debería devolver 404 si no existe', async () => {
    const res = await request(app)
      .get('/api/users/username/noexiste')
      .set('Cookie', [`access_token=${token}`])

    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('error');
  });
});