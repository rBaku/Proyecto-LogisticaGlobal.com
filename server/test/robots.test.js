const request = require('supertest');
const express = require('express');
const chai = require('chai');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { query, initializePool } = require('../db');
const robotsRouter = require('../routes/robots');

const expect = chai.expect;

describe('API /api/robots (Integración)', () => {
  let app;
  let token;

  before(async function () {
    this.timeout(10000);
    await initializePool();

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/robots', robotsRouter);
  });

  beforeEach(async () => {
    token = jwt.sign({ id: 9999, role: 'admin' }, process.env.JWT_SECRET);

    await query(`
      INSERT INTO robots (id, name, state)
      VALUES 
        ('rb9991', 'TestBot Uno', 'Activo'),
        ('rb9992', 'TestBot Dos', 'Inactivo')
    `);
  });

  afterEach(async () => {
    await query(`DELETE FROM robots WHERE id IN ('rb9991', 'rb9992', 'rb9993')`);
  });

  it('GET / debería retornar todos los robots con incidentes pendientes', async () => {
    const res = await request(app)
      .get('/api/robots')
      .set('Cookie', [`access_token=${token}`]);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.some(r => r.name === 'TestBot Uno')).to.be.true;
  });

  it('GET /:id debería retornar un robot específico', async () => {
    const res = await request(app)
      .get('/api/robots/rb9991')
      .set('Cookie', [`access_token=${token}`]);

    expect(res.status).to.equal(200);
    expect(res.body).to.include({
      id: 'rb9991',
      name: 'TestBot Uno',
      state: 'Activo'
    });
  });

  it('POST / debería crear un nuevo robot', async () => {
    const res = await request(app)
      .post('/api/robots')
      .set('Cookie', [`access_token=${token}`])
      .send({
        id: 'rb9993',
        name: 'NuevoBot',
        state: 'Disponible'
      });

    expect(res.status).to.equal(201);
    expect(res.body).to.include({
      id: 'rb9993',
      name: 'NuevoBot',
      state: 'Disponible'
    });
  });

  it('POST / debería fallar si el ID ya existe', async () => {
    const res = await request(app)
      .post('/api/robots')
      .set('Cookie', [`access_token=${token}`])
      .send({
        id: 'rb9991',
        name: 'NombreDistinto',
        state: 'En uso'
      });

    expect(res.status).to.equal(409);
    expect(res.body).to.have.property('error');
  });

  it('POST / debería fallar si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/robots')
      .set('Cookie', [`access_token=${token}`])
      .send({
        id: 'rb9993',
        name: 'SinEstado'
        // falta state
      });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('PUT /:id debería actualizar un robot (name y state)', async () => {
    const res = await request(app)
      .put('/api/robots/rb9991')
      .set('Cookie', [`access_token=${token}`])
      .send({
        name: 'Bot Actualizado',
        state: 'Mantenimiento'
      });

    expect(res.status).to.equal(200);
    expect(res.body).to.include({
      id: 'rb9991',
      name: 'Bot Actualizado',
      state: 'Mantenimiento'
    });
  });

  it('PUT /:id debería fallar si el estado no es string válido', async () => {
    const res = await request(app)
      .put('/api/robots/rb9991')
      .set('Cookie', [`access_token=${token}`])
      .send({
        state: 12345 // debe ser string
      });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('PUT /:id debería retornar 404 si el robot no existe', async () => {
    const res = await request(app)
      .put('/api/robots/inexistente')
      .set('Cookie', [`access_token=${token}`])
      .send({ name: 'NuevoNombre' });

    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('error');
  });

  it('DELETE /:id debería eliminar un robot existente', async () => {
    await query(`
      INSERT INTO robots (id, name, state) 
      VALUES ('rb9993', 'BotParaEliminar', 'Disponible')
    `);

    const res = await request(app)
      .delete('/api/robots/rb9993')
      .set('Cookie', [`access_token=${token}`]);

    expect(res.status).to.equal(204);

    const check = await request(app)
      .get('/api/robots/rb9993')
      .set('Cookie', [`access_token=${token}`]);

    expect(check.status).to.equal(404);
  });

  it('DELETE /:id debería retornar 404 si el robot no existe', async () => {
    const res = await request(app)
      .delete('/api/robots/noexiste')
      .set('Cookie', [`access_token=${token}`]);

    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('error');
  });
});