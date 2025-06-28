const request = require('supertest');
const express = require('express');
const chai = require('chai');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { query, initializePool } = require('../db');
const loginRouter = require('../routes/login');

const expect = chai.expect;

describe('API /login (Integración)', () => {
  let app;

  before(async function () {
    this.timeout(10000);
    await initializePool();

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/', loginRouter);
  });

  beforeEach(async () => {
    const passwordHashed = await bcrypt.hash('miclave123', 10);
    await query(`
      INSERT INTO users (id, username, email, password, role, full_name)
      VALUES 
        (9994, 'loginuser', 'login@example.com', $1, 'user', 'Login Tester')
    `, [passwordHashed]);
  });

  afterEach(async () => {
    await query(`DELETE FROM users WHERE id = 9994`);
  });

  it('POST /login debería autenticar con credenciales válidas', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'loginuser', password: 'miclave123' });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');
    expect(res.body.user).to.include({
      username: 'loginuser',
      email: 'login@example.com',
      role: 'user',
      full_name: 'Login Tester'
    });
    expect(res.headers['set-cookie']).to.satisfy((cookies) =>
      cookies.some(cookie => cookie.includes('access_token'))
    );
  });

  it('POST /login debería fallar con contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'loginuser', password: 'wrongpassword' });

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('error');
  });

  it('POST /login debería fallar con usuario no existente', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'nouser', password: 'miclave123' });

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('error');
  });

  it('POST /login debería fallar si faltan campos', async () => {
    const res = await request(app)
      .post('/login')
      .send({ password: 'miclave123' });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('POST /logout debería limpiar la cookie', async () => {
    const res = await request(app)
      .post('/logout');

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message');
    expect(res.headers['set-cookie']).to.satisfy((cookies) =>
      cookies.some(cookie => cookie.includes('access_token=;'))
    );
  });

});