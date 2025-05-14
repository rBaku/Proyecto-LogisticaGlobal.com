const request = require('supertest');
const express = require('express');
const chai = require('chai');
const { query, initializePool } = require('../db');
const robotsRouter = require('../routes/robots');
const expect = chai.expect;

describe('API /api/robots (Integración)', () => {
  let app;

  before(async function () {
    this.timeout(10000); // Espera hasta 10 segundos por si la conexión a Azure tarda

    await initializePool();

    app = express();
    app.use(express.json());
    app.use('/api/robots', robotsRouter);
});

  beforeEach(async () => { //Inserta estos valores para hacer pruebas, luego se borran
  await query(`
    INSERT INTO Robots (id, name, is_operational)
    VALUES 
      ('RBT-TestGet1', 'Robot Alfa', true),
      ('RBT-TestGet2', 'Robot Beta', false)
  `);
});
  afterEach(async () => { //Borra estos valores que eran para hacer pruebas despues de realizarla para evitar basura en la BD
    await query('DELETE FROM Robots WHERE id IN ($1, $2, $3, $4)', ['RBT-TestGet1', 'RBT-TestGet2', 'RBT-TestDuplicate', 'RBT-MissingName']);
  });

  it('GET / debería devolver lista de robots desde la base de datos', async () => {
    const res = await request(app).get('/api/robots');

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    const ids = res.body.map(r => r.id);
    expect(ids).to.include('RBT-TestGet1');
    expect(ids).to.include('RBT-TestGet2');
  });
  it('GET /:id debería devolver un robot existente', async () => {
  const res = await request(app).get('/api/robots/RBT-TestGet1');
  
  expect(res.status).to.equal(200);
  expect(res.body).to.be.an('object');
  expect(res.body).to.have.property('id', 'RBT-TestGet1');
  expect(res.body).to.have.property('name');
  expect(res.body).to.have.property('is_operational');
});
  it('POST / debería crear un nuevo robot correctamente', async () => {
    const newRobot = {
      id: 'RBT-TestCreate',
      name: 'Robot Gamma',
      is_operational: true,
    };

    const res = await request(app)
      .post('/api/robots')
      .send(newRobot);

    expect(res.status).to.equal(201);
    expect(res.body).to.include(newRobot);

    // Verificar que esté en la base de datos
    const getRes = await request(app).get('/api/robots');
    const ids = getRes.body.map(r => r.id);
    expect(ids).to.include('RBT-TestCreate');

    // Cleanup
    await query('DELETE FROM Robots WHERE id = $1', ['RBT-TestCreate']);
  });
  
  it('POST / debería fallar si se intenta insertar un robot con un ID duplicado', async () => {
    // Insertar un robot con un ID fijo
    await query(`
      INSERT INTO Robots (id, name, is_operational)
      VALUES ('RBT-TestDuplicate', 'Robot Único', true)
    `);

    // Intentar insertar el mismo ID de nuevo a través de la API
    const res = await request(app)
      .post('/api/robots')
      .send({ id: 'RBT-TestDuplicate', name: 'Duplicado', is_operational: false });

    expect(res.status).to.be.oneOf([400, 409, 500]); // depende de cómo manejes el error en tu backend
    expect(res.body).to.have.property('error');
  });

  it('POST / debería fallar si falta el campo "id"', async () => {
  const res = await request(app).post('/api/robots').send({
    name: 'Faltante de ID',
    is_operational: true
  });
  expect(res.status).to.equal(400);
  expect(res.body).to.have.property('error');
});

it('POST / debería fallar si falta el campo "name"', async () => {
  const res = await request(app).post('/api/robots').send({
    id: 'RBT-MissingName',
    is_operational: true
  });
  expect(res.status).to.equal(400);
  expect(res.body).to.have.property('error');
});

  it('PUT /:id debería actualizar un robot existente', async () => {
    const updatedData = {
      name: 'Robot Alfa Actualizado',
      is_operational: false,
    };

    const res = await request(app)
      .put('/api/robots/RBT-TestGet1')
      .send(updatedData);

    expect(res.status).to.equal(200);
    expect(res.body).to.include({ id: 'RBT-TestGet1', ...updatedData });

    // Verificar en base de datos
    const getRes = await request(app).get('/api/robots');
    const robot = getRes.body.find(r => r.id === 'RBT-TestGet1');
    expect(robot).to.include(updatedData);
  });

  it('PUT /:id debería devolver 404 si el robot no existe', async () => {
    const res = await request(app)
      .put('/api/robots/NO-EXISTE')
      .send({ name: 'Inexistente', is_operational: false });

    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('error');
  });
  it('DELETE /:id debería eliminar un robot existente', async () => {
    // Insertar un robot a eliminar
    await query(`
      INSERT INTO Robots (id, name, is_operational)
      VALUES ('RBT-TestDelete', 'Robot Eliminable', true)
    `);

    const res = await request(app).delete('/api/robots/RBT-TestDelete');

    expect(res.status).to.equal(204);

    // Verificar que ya no esté
    const getRes = await request(app).get('/api/robots');
    const ids = getRes.body.map(r => r.id);
    expect(ids).to.not.include('RBT-TestDelete');
  });

   it('DELETE /:id debería devolver 404 si el robot no existe', async () => {
    const res = await request(app).delete('/api/robots/NO-EXISTE');

    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('error');
  });
});
