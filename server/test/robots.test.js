const { expect, sinon } = require('./helpers/testSetup');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const app = require('../app');
const pool = require('../db');

describe('Robots API', () => {
  beforeEach(() => {
    sinon.stub(pool, 'query');
  });

  describe('POST /api/robots', () => {
    it('debería crear un nuevo robot', async () => {
      const mockRobot = {
        id: 'ROB-001',
        name: 'Robot 1',
        is_operational: true
      };

      pool.query.resolves({ rows: [mockRobot], rowCount: 1 });

      const res = await chai.request(app)
        .post('/api/robots')
        .send(mockRobot);

      expect(res).to.have.status(201);
      expect(res.body).to.deep.equal(mockRobot);
    });

    it('debería fallar si el nombre ya existe', async () => {
      const duplicateError = new Error('Duplicate');
      duplicateError.code = '23505';
      pool.query.rejects(duplicateError);

      const res = await chai.request(app)
        .post('/api/robots')
        .send({
          id: 'ROB-001',
          name: 'Robot Existente',
          is_operational: true
        });

      expect(res).to.have.status(409);
    });
  });

  describe('GET /api/robots', () => {
    it('debería obtener todos los robots', async () => {
      const mockRobots = [
        { id: 'ROB-001', name: 'Robot 1', is_operational: true },
        { id: 'ROB-002', name: 'Robot 2', is_operational: false }
      ];

      pool.query.resolves({ rows: mockRobots });

      const res = await chai.request(app).get('/api/robots');

      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal(mockRobots);
    });
  });

  describe('PUT /api/robots/:id', () => {
    it('debería actualizar solo el nombre del robot', async () => {
      const updatedRobot = {
        id: 'ROB-001',
        name: 'Nuevo Nombre',
        is_operational: true
      };

      pool.query.resolves({ rows: [updatedRobot], rowCount: 1 });

      const res = await chai.request(app)
        .put('/api/robots/ROB-001')
        .send({ name: 'Nuevo Nombre' });

      expect(res).to.have.status(200);
      expect(res.body.name).to.equal('Nuevo Nombre');
    });

    it('debería validar que is_operational sea booleano', async () => {
      const res = await chai.request(app)
        .put('/api/robots/ROB-001')
        .send({ is_operational: 'no' });

      expect(res).to.have.status(400);
    });
  });

  describe('DELETE /api/robots/:id', () => {
    it('debería manejar robots con incidentes asociados', async () => {
      const fkError = new Error('FK violation');
      fkError.code = '23503';
      pool.query.rejects(fkError);

      const res = await chai.request(app).delete('/api/robots/ROB-001');

      expect(res).to.have.status(409);
      expect(res.body.error).to.include('incidentes asociados');
    });
  });
});