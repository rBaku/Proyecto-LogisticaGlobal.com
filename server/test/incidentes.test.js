const request = require('supertest');
const express = require('express');
const chai = require('chai');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');
const { query, initializePool } = require('../db');
const incidentesRouter = require('../routes/incidentes');
const expect = chai.expect;
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const uuid = uuidv4();

describe('API /api/incidentes (Integración)', () => {
  let app;
  let token;

  before(async function () {
    sinon.stub(console, 'error'); // evita imprimir en consola
    this.timeout(10000); // Espera por si tarda conexión
    await initializePool();

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/incidentes', incidentesRouter);
  });

  beforeEach(async function() {
    this.timeout(10000);
    // Generar un token válido antes de cada test
    token = jwt.sign({ id: 9992, role: 'admin' }, process.env.JWT_SECRET);

    // Insertar robot necesario para cumplir la clave foránea
    await query(`
      INSERT INTO Robots (id, name, state)
      VALUES ('RBT-TestGet1', 'Robot Prueba', 'operativo')
      ON CONFLICT (id) DO NOTHING;
    `);
    // Insertar técnicos necesario
    await query(`
      INSERT INTO Users (id, username, email, password, role, full_name)
      VALUES ('10001', 'tecnico_test1','test1@example.com','password','tecnico','Técnico de Prueba 1')
      ON CONFLICT (id) DO NOTHING;
    `);
    await query(`
      INSERT INTO Users (id, username, email, password, role, full_name)
      VALUES ('10002', 'tecnico_test2','test2@example.com','password','tecnico','Técnico de Prueba 2')
      ON CONFLICT (id) DO NOTHING;
    `);
    await query(`
      INSERT INTO users (id, username, email, password, role, full_name)
      VALUES ('9992', 'Test_Admin', 'testadmin@example.com', 'password', 'admin', 'Administrador de Prueba')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insertar incidente de prueba
    await query(`
      INSERT INTO incidents (
        id, company_report_id, robot_id, incident_timestamp, location,
        type, cause, status, gravity, technician_comment, 
        created_at, updated_at, signed_by_user_id, signed_at,
        created_by, updated_by, finished_by, finished_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18
      )
    `, [
      uuid, 'INC-Test-001', 'RBT-TestGet1', '2024-01-01T10:00:00Z', 'Zona A',
      'Error mecánico', 'Desgaste de pieza', 'Creado', 5, 'Comentario del técnico',
      new Date(), new Date(), null, null, null, null, null, null
    ]);
    //asociar 2 técnicos al incidente
    await query(`
      INSERT INTO incident_technicians (
        incident_id, technician_user_id
      ) VALUES (
        $1, $2
      )
    `, [
      uuid, '10001'
    ]);
    await query(`
      INSERT INTO incident_technicians (
        incident_id, technician_user_id
      ) VALUES (
        $1, $2
      )
    `, [
      uuid, '10002'
    ]);
});

  afterEach(async () => {
    // Eliminar técnicos asociados primero
    await query(`
      DELETE FROM incident_technicians
      WHERE incident_id IN (
        SELECT id FROM incidents WHERE company_report_id LIKE 'INC-Test-%'
      );
    `);

    // Eliminar todos los incidentes de prueba
    await query(`DELETE FROM incidents WHERE company_report_id LIKE 'INC-Test-%';`);

    // Eliminar incidente de beforeEach si tiene otro company_report_id
    await query(`DELETE FROM incident_technicians WHERE incident_id = $1`, [uuid]);
    await query(`DELETE FROM incidents WHERE id = $1`, [uuid]);

    // Finalmente eliminar robot y técnicos
    await query(`DELETE FROM robots WHERE id = 'RBT-TestGet1'`);
    await query(`DELETE FROM users WHERE id IN (10001, 10002)`);
  });
  after(() => {
    console.error.restore(); // restaura comportamiento original
  });

  it('GET / debería devolver una lista de incidentes con técnicos asignados', async () => {
    const res = await request(app)
      .get('/api/incidentes')
      .set('Cookie', [`access_token=${token}`]);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');

    const incidente = res.body.find(inc => inc.company_report_id === 'INC-Test-001');
    expect(incidente).to.exist;

    expect(incidente.robot_id).to.equal('RBT-TestGet1');
    expect(incidente.status).to.equal('Creado');
    expect(incidente.location).to.equal('Zona A');

    // Verifica que el campo de técnicos exista y contenga los IDs correctos
    expect(incidente).to.have.property('assigned_technicians').that.is.an('array');
    // Extrae los IDs de los técnicos como strings (si quieres comparar como string)
    const tecnicoIds = incidente.assigned_technicians.map(t => String(t.id));
    // Verifica que estén los técnicos esperados
    expect(tecnicoIds).to.include.members(['10001', '10002']);

    expect(incidente).to.have.property('created_by_name'); // puede ser null
    expect(incidente).to.have.property('updated_by_name');
    expect(incidente).to.have.property('signed_by_name');
    expect(incidente).to.have.property('finished_by_name');
  });
  it('GET /:id debería devolver el incidente correspondiente por UUID', async () => {
    const { rows } = await query(`SELECT id FROM Incidents WHERE company_report_id = 'INC-Test-001'`);
    const incidenteId = rows[0].id;

    const res = await request(app)
      .get(`/api/incidentes/${incidenteId}`)
      .set('Cookie', [`access_token=${token}`]); // autenticación si tu ruta la requiere

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('company_report_id', 'INC-Test-001');
    expect(res.body).to.have.property('id', incidenteId);
    expect(res.body).to.have.property('assigned_technicians').that.is.an('array');

    const tecnicoIds = res.body.assigned_technicians.map(t => t.id);
    expect(tecnicoIds).to.include.members([10001, 10002]);
    expect(res.body).to.have.property('created_by_name');
    expect(res.body).to.have.property('updated_by_name');
    expect(res.body).to.have.property('signed_by_name');
    expect(res.body).to.have.property('finished_by_name');
  });

  it('GET /:id debería devolver 404 si no existe el incidente', async () => {
    const res = await request(app)
      .get('/api/incidentes/00000000-0000-0000-0000-000000000000')
      .set('Cookie', [`access_token=${token}`])
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
      assigned_technicians: [10001],
      gravity: 7
    };

    const res = await request(app)
      .post('/api/incidentes')
      .set('Cookie', [`access_token=${token}`])
      .send(body);

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('company_report_id', 'INC-Test-POST');
  });
  it('POST / debería rechazar si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/incidentes')
      .set('Cookie', [`access_token=${token}`])
      .send({
        robot_id: 'RBT-TestGet1',
        incident_timestamp: '2024-05-01T12:00:00Z',
        location: 'Zona C',
        type: 'Fallo',
        cause: 'Desconocido',
        assigned_technicians: [10002] // válido, pero falta report_id
      });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error').that.includes('Faltan campos obligatorios');
  });

  it('POST / debería rechazar gravedad inválida (< 1)', async () => {
    const res = await request(app)
      .post('/api/incidentes')
      .set('Cookie', [`access_token=${token}`])
      .send({
        company_report_id: 'INC-Test-BadGravity',
        robot_id: 'RBT-TestGet1',
        incident_timestamp: '2024-05-01T12:00:00Z',
        location: 'Zona D',
        type: 'Choque',
        cause: 'Mal cálculo',
        assigned_technicians: [10001],
        gravity: 0
      });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error').that.includes('gravedad');
  });

  it('POST / debería rechazar gravedad inválida (> 10)', async () => {
    const res = await request(app)
      .post('/api/incidentes')
      .set('Cookie', [`access_token=${token}`])
      .send({
        company_report_id: 'INC-Test-BadGravity2',
        robot_id: 'RBT-TestGet1',
        incident_timestamp: '2024-05-01T12:00:00Z',
        location: 'Zona E',
        type: 'Sobrecalentamiento',
        cause: 'Falla en sensor',
        assigned_technicians: [10001],
        gravity: 11
      });

    expect(res.status).to.equal(400);
  });

  it('POST / debería rechazar gravedad inválida (texto)', async () => {
    const res = await request(app)
      .post('/api/incidentes')
      .set('Cookie', [`access_token=${token}`])
      .send({
        company_report_id: 'INC-Test-BadGravity3',
        robot_id: 'RBT-TestGet1',
        incident_timestamp: '2024-05-01T12:00:00Z',
        location: 'Zona F',
        type: 'Error de sistema',
        cause: 'Valor nulo inesperado',
        assigned_technicians: [10001],
        gravity: 'grave'
      });

    expect(res.status).to.equal(400);
  });
  it('PUT /:id debería actualizar un incidente existente', async () => {
    const { rows } = await query(`SELECT id FROM Incidents WHERE company_report_id = 'INC-Test-001'`);
    const incidenteId = rows[0].id;

    const res = await request(app)
      .put(`/api/incidentes/${incidenteId}`)
      .set('Cookie', [`access_token=${token}`])
      .send({
        location: 'Zona Actualizada',
        type: 'Error lógico',
        cause: 'Fallo en programación',
        assigned_technicians: [10002],
        gravity: 6,
        status: 'En revisión',
        technician_comment: 'En análisis'
      });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('location', 'Zona Actualizada');
    expect(res.body).to.have.property('status', 'En revisión');
    expect(res.body).to.have.property('technician_comment', 'En análisis');
  });
  it('PUT /:id debería asignar updated_by y updated_at al actualizar', async () => {
    const { rows } = await query(`SELECT id FROM Incidents WHERE company_report_id = 'INC-Test-001'`);
    const incidenteId = rows[0].id;

    const res = await request(app)
      .put(`/api/incidentes/${incidenteId}`)
      .set('Cookie', [`access_token=${token}`])
      .send({
        status: 'En revisión'
      });

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('En revisión');
    expect(res.body.updated_by).to.equal(9992); // ID del usuario del token
    expect(res.body.updated_at).to.be.a('string');
  });

  it('PUT /:id con status "Firmado" debería asignar signed_by_user_id y signed_at', async () => {
    const { rows } = await query(`SELECT id FROM Incidents WHERE company_report_id = 'INC-Test-001'`);
    const incidenteId = rows[0].id;

    const res = await request(app)
      .put(`/api/incidentes/${incidenteId}`)
      .set('Cookie', [`access_token=${token}`]) // token de admin
      .send({
        status: 'Firmado'
      });

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('Firmado');
    expect(res.body.signed_by_user_id).to.equal(9992);
    expect(res.body.signed_at).to.be.a('string');
  });

  it('PUT /:id con status "Resuelto" hecho por técnico debería asignar finished_by y finished_at', async () => {
    // Crear token de usuario técnico
    const tecnicoToken = jwt.sign({ id: 10001, role: 'tecnico' }, process.env.JWT_SECRET);

    const { rows } = await query(`SELECT id FROM Incidents WHERE company_report_id = 'INC-Test-001'`);
    const incidenteId = rows[0].id;

    const res = await request(app)
      .put(`/api/incidentes/${incidenteId}`)
      .set('Cookie', [`access_token=${tecnicoToken}`])
      .send({
        status: 'Resuelto'
      });

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('Resuelto');
    expect(res.body.finished_by).to.equal(10001);
    expect(res.body.finished_at).to.be.a('string');
  });

  it('PUT /:id debería devolver 404 si el incidente no existe', async () => {
    const res = await request(app)
      .put('/api/incidentes/00000000-0000-0000-0000-000000000000')
      .set('Cookie', [`access_token=${token}`])
      .send({
        location: 'Zona Fantasma',
        type: 'Falla desconocida',
        cause: 'N/A',
        assigned_technicians: [10001],
        gravity: 3,
        status: 'Creado',
        technician_comment: null
      });

    expect(res.status).to.equal(404);
  });

  it('DELETE /:id debería eliminar el incidente si existe', async () => {
    const insert = await query(`
      INSERT INTO Incidents (
        id, company_report_id, robot_id, incident_timestamp, location,
        type, cause, gravity, status
      )
      VALUES (
        gen_random_uuid(), 'INC-Test-Delete', 'RBT-TestGet1', NOW(), 'Zona Borrar',
        'Error crítico', 'Sobrecarga', 9, 'Creado'
      ) RETURNING id;
    `);

    const incidenteId = insert.rows[0].id;

    // Insertar técnico asociado
    await query(`
      INSERT INTO Incident_Technicians (incident_id, technician_user_id)
      VALUES ($1, $2);
    `, [incidenteId, 10001]);

    const res = await request(app)
      .delete(`/api/incidentes/${incidenteId}`)
      .set('Cookie', [`access_token=${token}`]);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message').that.includes('eliminado');
  });

  it('DELETE /:id debería devolver 404 si el incidente no existe', async () => {
    const res = await request(app)
      .delete('/api/incidentes/00000000-0000-0000-0000-000000000000')
      .set('Cookie', [`access_token=${token}`]);

    expect(res.status).to.equal(404);
  });
});