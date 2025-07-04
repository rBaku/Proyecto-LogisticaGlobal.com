// tests/report.test.js
const request = require('supertest');
const express = require('express');
const chai = require('chai');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');
const { query, initializePool } = require('../db');
const reportRouter = require('../routes/report');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const expect = chai.expect;
const uuid = uuidv4();

describe('API /api/report (Integración)', () => {
  let app;
  let token;

  before(async function () {
    sinon.stub(console, 'error');
    this.timeout(10000);
    await initializePool();

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/report', reportRouter);
  });

  beforeEach(async () => {
    token = jwt.sign({ id: 9992, role: 'admin' }, process.env.JWT_SECRET);

    await query(`
      INSERT INTO Robots (id, name, state)
      VALUES ('RBT-ReportTest', 'Robot Reporte', 'operativo')
      ON CONFLICT (id) DO NOTHING;
    `);
    await query(`
      INSERT INTO Users (id, username, email, password, role, full_name)
      VALUES (9992, 'admin_report', 'admin@report.com', 'pass', 'admin', 'Admin Report')
      ON CONFLICT (id) DO NOTHING;
    `);
    await query(`
      INSERT INTO Users (id, username, email, password, role, full_name)
      VALUES (10003, 'tecnico_report', 'tec@report.com', 'pass', 'tecnico', 'Técnico Reporte')
      ON CONFLICT (id) DO NOTHING;
    `);
    await query(`
      INSERT INTO Incidents (
        id, company_report_id, robot_id, incident_timestamp, location,
        type, cause, gravity, status, created_by, created_at, updated_at, finished_by, finished_at
      )
      VALUES (
        $1, 'INC-Report-001', 'RBT-ReportTest', '2025-06-15T10:00:00Z', 'Zona X',
        'Error de software', 'Bug crítico', 8, 'Resuelto', 9992, NOW(), NOW(), 10003, '2025-06-20T12:00:00Z'
      )
    `, [uuid]);
    await query(`
      INSERT INTO incident_technicians (incident_id, technician_user_id)
      VALUES ($1, 10003)
    `, [uuid]);
  });

  afterEach(async () => {
    await query(`DELETE FROM incident_technicians WHERE incident_id = $1`, [uuid]);
    await query(`DELETE FROM incidents WHERE id = $1`, [uuid]);
    await query(`DELETE FROM robots WHERE id = 'RBT-ReportTest'`);
    await query(`DELETE FROM users WHERE id IN (9992, 10003)`);
  });

  after(() => {
    console.error.restore();
  });

  it('GET /?period=monthly&month=6&year=2025 debería devolver reporte mensual', async () => {
    const res = await request(app)
        .get('/api/report?period=monthly&month=6&year=2025')
        .set('Cookie', [`access_token=${token}`]);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('incidents').that.is.an('array');
    expect(res.body).to.have.property('summary').that.is.an('object');

    // ✅ Verifica que el incidente de prueba esté incluido por ID
    const nuestros = res.body.incidents.filter(i => i.id === uuid);
    expect(nuestros.length).to.equal(1);

    // ✅ Verifica sobre la respuesta
    const resumen = res.body.summary;
    expect(resumen.avgGravity).to.be.a('number');
    expect(resumen.avgResolutionTimeHours).to.be.a('number');
    expect(resumen.byType).to.have.property('Error de software');
    expect(resumen.byStatus).to.have.property('Resuelto');
    });

  it('GET /?period=yearly&year=2025 debería devolver reporte anual', async () => {
    const res = await request(app)
      .get('/api/report?period=yearly&year=2025')
      .set('Cookie', [`access_token=${token}`]);

    expect(res.status).to.equal(200);
    expect(res.body.summary.total).to.be.gte(1);
    expect(res.body.incidents).to.be.an('array');
  });

  it('GET / sin parámetros válidos debería devolver 400', async () => {
    const res = await request(app)
      .get('/api/report')
      .set('Cookie', [`access_token=${token}`]);

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error').that.includes('Periodo inválido');
  });

  it('GET /?period=monthly sin mes o año debería devolver 400', async () => {
    const res = await request(app)
      .get('/api/report?period=monthly&month=6') // falta el año
      .set('Cookie', [`access_token=${token}`]);

    expect(res.status).to.equal(400);
    expect(res.body.error).to.include('Debe especificar mes');
  });

  it('GET /?period=monthly con mes inválido debería devolver 400', async () => {
    const res = await request(app)
      .get('/api/report?period=monthly&month=13&year=2025')
      .set('Cookie', [`access_token=${token}`]);

    expect(res.status).to.equal(400);
    expect(res.body.error).to.include('Mes inválido');
  });
});