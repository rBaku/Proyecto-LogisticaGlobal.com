const request = require('supertest');
const express = require('express');
const chai = require('chai');
const { query, initializePool } = require('../db');
const incidentesRouter = require('../routes/incidentes');
const expect = chai.expect;

describe('API /api/incidentes (Integración)', () => {
  let app;

  before(async function () {
    this.timeout(10000); // Espera por si tarda conexión
    await initializePool();

    app = express();
    app.use(express.json());
    app.use('/api/incidentes', incidentesRouter);
  });

  beforeEach(async () => {
  // Insertar robot necesario para cumplir la clave foránea
  await query(`
    INSERT INTO Robots (id, name, is_operational)
    VALUES ('RBT-TestGet1', 'Robot Prueba', true);
  `);
  // Insertar técnico necesario
  await query(`
    INSERT INTO Technicians (id, full_name)
    VALUES ('TECH-Test', 'Técnico de Prueba')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Insertar incidente de prueba
  await query(`
    INSERT INTO Incidents (
      id, company_report_id, robot_id, incident_timestamp, location,
      type, cause, assigned_technician_id, gravity, status
    )
    VALUES (
      gen_random_uuid(), 'INC-Test-001', 'RBT-TestGet1', '2024-01-01T10:00:00Z', 'Zona A',
      'Error mecánico', 'Desgaste de pieza', 'TECH-Test', 5, 'Creado'
    );
  `);

});

  afterEach(async () => {
    await query(`DELETE FROM Incidents WHERE company_report_id IN (
      'INC-Test-001', 'INC-Test-POST', 'INC-Test-BadGravity', 'INC-Test-BadGravity2', 'INC-Test-BadGravity3', 'INC-Test-Delete'
    )`);
    await query(`DELETE FROM Robots WHERE id = 'RBT-TestGet1'`);
    await query(`DELETE FROM Technicians WHERE id = 'TECH-Test'`);
  });

  it('GET / debería devolver una lista de incidentes', async () => {
    const res = await request(app).get('/api/incidentes');

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    const ids = res.body.map(inc => inc.company_report_id);
    expect(ids).to.include('INC-Test-001');
  });
  it('GET /:id debería devolver el incidente correspondiente por UUID', async () => {
    // Obtener el ID insertado en beforeEach
    const { rows } = await query(`SELECT id FROM Incidents WHERE company_report_id = 'INC-Test-001'`);
    const incidenteId = rows[0].id;

    const res = await request(app).get(`/api/incidentes/${incidenteId}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('company_report_id', 'INC-Test-001');
    expect(res.body).to.have.property('id', incidenteId);
  });

  it('GET /:id debería devolver 404 si no existe el incidente', async () => {
    const res = await request(app).get('/api/incidentes/00000000-0000-0000-0000-000000000000');
    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('message').that.includes('Incidente no encontrado');
  });

  it('POST / debería crear un nuevo incidente correctamente', async () => {
    const body = {
      company_report_id: 'INC-Test-POST',
      robot_id: 'RBT-TestGet1',
      incident_timestamp: '2024-05-01T12:00:00Z',
      location: 'Zona B',
      type: 'Fallo eléctrico',
      cause: 'Cortocircuito',
      assigned_technician_id: 'TECH-002',
      gravity: 7
    };

    const res = await request(app).post('/api/incidentes').send(body);

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('company_report_id', 'INC-Test-POST');
  });

  it('POST / debería rechazar si faltan campos obligatorios', async () => {
    const res = await request(app).post('/api/incidentes').send({
      robot_id: 'RBT-TestGet1',
      incident_timestamp: '2024-05-01T12:00:00Z',
      location: 'Zona C',
      type: 'Fallo',
      cause: 'Desconocido',
      assigned_technician_id: 'TECH-003'
      // Falta company_report_id
    });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error').that.includes('Faltan campos obligatorios');
  });

  it('POST / debería rechazar gravedad inválida (< 1)', async () => {
    const res = await request(app).post('/api/incidentes').send({
      company_report_id: 'INC-Test-BadGravity',
      robot_id: 'RBT-TestGet1',
      incident_timestamp: '2024-05-01T12:00:00Z',
      location: 'Zona D',
      type: 'Choque',
      cause: 'Mal cálculo',
      assigned_technician_id: 'TECH-004',
      gravity: 0 // Inválida
    });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error').that.includes('gravedad');
  });

  it('POST / debería rechazar gravedad inválida (> 10)', async () => {
    const res = await request(app).post('/api/incidentes').send({
      company_report_id: 'INC-Test-BadGravity2',
      robot_id: 'RBT-TestGet1',
      incident_timestamp: '2024-05-01T12:00:00Z',
      location: 'Zona E',
      type: 'Sobrecalentamiento',
      cause: 'Falla en sensor',
      assigned_technician_id: 'TECH-005',
      gravity: 11
    });

    expect(res.status).to.equal(400);
  });

  it('POST / debería rechazar gravedad inválida (texto)', async () => {
    const res = await request(app).post('/api/incidentes').send({
      company_report_id: 'INC-Test-BadGravity3',
      robot_id: 'RBT-TestGet1',
      incident_timestamp: '2024-05-01T12:00:00Z',
      location: 'Zona F',
      type: 'Error de sistema',
      cause: 'Valor nulo inesperado',
      assigned_technician_id: 'TECH-006',
      gravity: 'grave'
    });

    expect(res.status).to.equal(400);
  });
  it('PUT /:id debería actualizar un incidente existente', async () => {
    const { rows } = await query(`SELECT id FROM Incidents WHERE company_report_id = 'INC-Test-001'`);
    const incidenteId = rows[0].id;

    const res = await request(app).put(`/api/incidentes/${incidenteId}`).send({
      location: 'Zona Actualizada',
      type: 'Error lógico',
      cause: 'Fallo en programación',
      assigned_technician_id: 'TECH-Test',
      gravity: 6,
      status: 'En revisión',
      technician_comment: 'En análisis'
    });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('location', 'Zona Actualizada');
    expect(res.body).to.have.property('status', 'En revisión');
    expect(res.body).to.have.property('technician_comment', 'En análisis');
  });

  it('PUT /:id debería devolver 404 si el incidente no existe', async () => {
    const res = await request(app).put('/api/incidentes/00000000-0000-0000-0000-000000000000').send({
      location: 'Zona Fantasma',
      type: 'Falla desconocida',
      cause: 'N/A',
      assigned_technician_id: 'TECH-000',
      gravity: 3,
      status: 'Creado',
      technician_comment: null
    });

    expect(res.status).to.equal(404);
  });

  it('DELETE /:id debería eliminar el incidente si existe', async () => {
    // Insertar uno específicamente para borrar
    const insert = await query(`
      INSERT INTO Incidents (
        id, company_report_id, robot_id, incident_timestamp, location,
        type, cause, assigned_technician_id, gravity, status
      )
      VALUES (
        gen_random_uuid(), 'INC-Test-Delete', 'RBT-TestGet1', NOW(), 'Zona Borrar',
        'Error crítico', 'Sobrecarga', 'TECH-Test', 9, 'Creado'
      ) RETURNING id;
    `);
    const incidenteId = insert.rows[0].id;

    const res = await request(app).delete(`/api/incidentes/${incidenteId}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message').that.includes('eliminado');
  });

  it('DELETE /:id debería devolver 404 si el incidente no existe', async () => {
    const res = await request(app).delete('/api/incidentes/00000000-0000-0000-0000-000000000000');
    expect(res.status).to.equal(404);
  });
});