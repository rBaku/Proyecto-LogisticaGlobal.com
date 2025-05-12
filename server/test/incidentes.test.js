const { expect, sinon } = require('./helpers/testSetup');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const app = require('../app'); // Asegúrate de exportar tu app Express
const pool = require('../db');

describe('Incidentes API', () => {
  beforeEach(() => {
    sinon.stub(pool, 'query');
  });

  describe('POST /api/incidentes', () => {
    it('debería crear un nuevo incidente con gravedad', async () => {
      const mockIncidente = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        company_report_id: 'INC-2023-001',
        robot_id: 'ROB-001',
        incident_timestamp: '2023-01-01T12:00:00Z',
        location: 'Area 51',
        type: 'Falla mecánica',
        cause: 'Sobrecalentamiento',
        assigned_technician_id: 'TEC-001',
        gravity: 5,
        status: 'Creado'
      };

      pool.query.resolves({ rows: [mockIncidente], rowCount: 1 });

      const res = await chai.request(app)
        .post('/api/incidentes')
        .send(mockIncidente);

      expect(res).to.have.status(201);
      expect(res.body).to.deep.equal(mockIncidente);
      expect(pool.query).to.have.been.calledOnce;
    });

    it('debería fallar si faltan campos obligatorios', async () => {
      const res = await chai.request(app)
        .post('/api/incidentes')
        .send({});

      expect(res).to.have.status(400);
      expect(res.body.error).to.include('Faltan campos obligatorios');
    });

    it('debería manejar errores de la base de datos', async () => {
      pool.query.rejects(new Error('Error de conexión a BD'));

      const res = await chai.request(app)
        .post('/api/incidentes')
        .send({
          company_report_id: 'INC-2023-001',
          robot_id: 'ROB-001',
          incident_timestamp: '2023-01-01T12:00:00Z',
          location: 'Area 51',
          type: 'Falla mecánica',
          cause: 'Sobrecalentamiento',
          assigned_technician_id: 'TEC-001',
          gravity: 5
        });

      expect(res).to.have.status(500);
    });
  });

  describe('GET /api/incidentes', () => {
    it('debería obtener todos los incidentes', async () => {
      const mockIncidentes = [
        { id: '1', company_report_id: 'INC-001', status: 'Creado' },
        { id: '2', company_report_id: 'INC-002', status: 'En progreso' }
      ];

      pool.query.resolves({ rows: mockIncidentes });

      const res = await chai.request(app).get('/api/incidentes');

      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal(mockIncidentes);
      expect(pool.query).to.have.been.calledOnce;
    });
  });

  describe('GET /api/incidentes/:id', () => {
    it('debería obtener un incidente específico', async () => {
      const mockIncidente = { id: '1', company_report_id: 'INC-001' };
      pool.query.resolves({ rows: [mockIncidente], rowCount: 1 });

      const res = await chai.request(app).get('/api/incidentes/1');

      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal(mockIncidente);
    });

    it('debería devolver 404 si el incidente no existe', async () => {
      pool.query.resolves({ rows: [], rowCount: 0 });

      const res = await chai.request(app).get('/api/incidentes/999');

      expect(res).to.have.status(404);
    });
  });

  describe('PUT /api/incidentes/:id', () => {
    it('debería actualizar un incidente existente', async () => {
      const updatedIncidente = {
        id: '1',
        robot_id: 'ROB-001',
        status: 'Resuelto',
        gravity: null,
        technician_comment: 'Reparado'
      };

      pool.query.resolves({ rows: [updatedIncidente], rowCount: 1 });

      const res = await chai.request(app)
        .put('/api/incidentes/1')
        .send(updatedIncidente);

      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal(updatedIncidente);
    });

    it('debería validar que la gravedad sea entre 1 y 10', async () => {
      const res = await chai.request(app)
        .put('/api/incidentes/1')
        .send({ status: 'En progreso', gravity: 11 });

      expect(res).to.have.status(400);
      expect(res.body.error).to.include('La gravedad');
    });
  });

  describe('DELETE /api/incidentes/:id', () => {
    it('debería eliminar un incidente existente', async () => {
      pool.query.resolves({ rows: [{ id: '1' }], rowCount: 1 });

      const res = await chai.request(app).delete('/api/incidentes/1');

      expect(res).to.have.status(200);
      expect(res.body.message).to.include('eliminado');
    });

    it('debería manejar conflictos de FK al eliminar', async () => {
      const fkError = new Error('FK violation');
      fkError.code = '23503';
      pool.query.rejects(fkError);

      const res = await chai.request(app).delete('/api/incidentes/1');

      expect(res).to.have.status(409);
    });
  });
});