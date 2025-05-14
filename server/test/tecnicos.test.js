const request = require('supertest');
const express = require('express');
const chai = require('chai');
const { query, initializePool } = require('../db');
const tecnicosRouter = require('../routes/tecnicos');
const robotsRouter = require('../routes/robots'); // para prueba FK
const incidentesRouter = require('../routes/incidentes'); // para prueba FK

const expect = chai.expect;

describe('API /api/tecnicos (Integración)', () => {
  let app;

  before(async function () {
    this.timeout(10000); // puede tardar la conexión
    await initializePool();

    // Mini‑app con solo las rutas necesarias
    app = express();
    app.use(express.json());
    app.use('/api/tecnicos', tecnicosRouter);
    app.use('/api/robots', robotsRouter);
    app.use('/api/incidentes', incidentesRouter);
  });

  beforeEach(async () => {
    // Técnico base para varias pruebas
    await query(`
      INSERT INTO Technicians (id, full_name) VALUES
      ('TECH-TestGet1', 'Técnico Alpha')
      ON CONFLICT (id) DO NOTHING;
    `);
  });

  afterEach(async () => {
    // Limpiar bases de datos de pruebas
    await query("DELETE FROM Incidents WHERE company_report_id LIKE 'TEC-FK-%'");
    await query("DELETE FROM Robots WHERE id LIKE 'RBT-TechFK%'");
    await query("DELETE FROM Technicians WHERE id LIKE 'TECH-Test%'");
  });

  /* ---------- GET ---------- */

  it('GET / debería devolver lista de técnicos', async () => {
    const res = await request(app).get('/api/tecnicos');

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    const ids = res.body.map(t => t.id);
    expect(ids).to.include('TECH-TestGet1');
  });

  it('GET /:id debería devolver el técnico solicitado', async () => {
    const res = await request(app).get('/api/tecnicos/TECH-TestGet1');

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('id', 'TECH-TestGet1');
    expect(res.body).to.have.property('full_name', 'Técnico Alpha');
  });

  it('GET /:id debería devolver 404 si el técnico no existe', async () => {
    const res = await request(app).get('/api/tecnicos/NO-EXISTE');
    expect(res.status).to.equal(404);
  });

  /* ---------- POST ---------- */

  it('POST / debería crear un nuevo técnico', async () => {
    const nuevo = { id: 'TECH-TestCreate', full_name: 'Técnico Nuevo' };

    const res = await request(app).post('/api/tecnicos').send(nuevo);

    expect(res.status).to.equal(201);
    expect(res.body).to.include(nuevo);
  });

  it('POST / debería retornar 400 si faltan campos obligatorios', async () => {
    const res = await request(app).post('/api/tecnicos').send({ id: 'TECH-Bad' });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('POST / debería retornar 409 si el id ya existe', async () => {
    const dup = { id: 'TECH-TestGet1', full_name: 'Otro Nombre' };
    const res = await request(app).post('/api/tecnicos').send(dup);
    expect(res.status).to.equal(409);
  });

  /* ---------- PUT ---------- */

  it('PUT /:id debería actualizar el nombre del técnico', async () => {
    const res = await request(app)
      .put('/api/tecnicos/TECH-TestGet1')
      .send({ full_name: 'Técnico Beta' });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('full_name', 'Técnico Beta');
  });

  it('PUT /:id debería devolver 400 si falta full_name', async () => {
    const res = await request(app).put('/api/tecnicos/TECH-TestGet1').send({});
    expect(res.status).to.equal(400);
  });

  it('PUT /:id debería devolver 404 si el técnico no existe', async () => {
    const res = await request(app).put('/api/tecnicos/NO-EXISTE').send({ full_name: 'Nada' });
    expect(res.status).to.equal(404);
  });

  it('PUT /:id debería devolver 409 si el nombre ya existe en otro técnico', async () => {
    await query("INSERT INTO Technicians (id, full_name) VALUES ('TECH-TestDup', 'Nombre Duplicado')");
    const res = await request(app)
      .put('/api/tecnicos/TECH-TestGet1')
      .send({ full_name: 'Nombre Duplicado' });

    expect(res.status).to.equal(409);
  });

  /* ---------- DELETE ---------- */

  it('DELETE /:id debería eliminar un técnico existente', async () => {
    await query("INSERT INTO Technicians (id, full_name) VALUES ('TECH-TestDelete', 'Para Borrar')");

    const res = await request(app).delete('/api/tecnicos/TECH-TestDelete');

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message');

    // Comprobar que ya no existe
    const getRes = await request(app).get('/api/tecnicos');
    const ids = getRes.body.map(t => t.id);
    expect(ids).to.not.include('TECH-TestDelete');
  });

  it('DELETE /:id debería devolver 404 si el técnico no existe', async () => {
    const res = await request(app).delete('/api/tecnicos/NO-EXISTE');
    expect(res.status).to.equal(404);
  });

  it('DELETE /:id debería devolver 409 si el técnico tiene incidentes asociados', async () => {
    /* 1. Crear técnico, robot e incidente que lo use */
    await query("INSERT INTO Technicians (id, full_name) VALUES ('TECH-TestInUse', 'En Uso')");
    await query("INSERT INTO Robots (id, name, is_operational) VALUES ('RBT-TechFK', 'Robot FK', true)");
    await query(`
      INSERT INTO Incidents (
        id, company_report_id, robot_id, incident_timestamp, location,
        type, cause, assigned_technician_id, gravity, status
      )
      VALUES (
        gen_random_uuid(), 'TEC-FK-001', 'RBT-TechFK', NOW(), 'Zona FK',
        'Prueba', 'Prueba', 'TECH-TestInUse', 5, 'Creado'
      );
    `);

    /* 2. Intentar eliminar */
    const res = await request(app).delete('/api/tecnicos/TECH-TestInUse');

    expect(res.status).to.equal(409);
  });
});
