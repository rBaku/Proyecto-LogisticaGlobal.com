const { expect, sinon } = require('./helpers/testSetup');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const app = require('../app');
const pool = require('../db');

describe('Técnicos API', () => {
  beforeEach(() => {
    sinon.stub(pool, 'query');
  });

  describe('POST /api/tecnicos', () => {
    it('debería crear un nuevo técnico', async () => {
      const mockTecnico = {
        id: 'TEC-001',
        full_name: 'Juan Pérez'
      };

      pool.query.resolves({ rows: [mockTecnico], rowCount: 1 });

      const res = await chai.request(app)
        .post('/api/tecnicos')
        .send(mockTecnico);

      expect(res).to.have.status(201);
      expect(res.body).to.deep.equal(mockTecnico);
    });
  });

  describe('GET /api/tecnicos/:id', () => {
    it('debería obtener un técnico por ID', async () => {
      const mockTecnico = { id: 'TEC-001', full_name: 'Juan Pérez' };
      pool.query.resolves({ rows: [mockTecnico], rowCount: 1 });

      const res = await chai.request(app).get('/api/tecnicos/TEC-001');

      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal(mockTecnico);
    });
  });

  describe('PUT /api/tecnicos/:id', () => {
    it('debería actualizar el nombre del técnico', async () => {
      const updatedTecnico = {
        id: 'TEC-001',
        full_name: 'Juan Pérez Actualizado'
      };

      pool.query.resolves({ rows: [updatedTecnico], rowCount: 1 });

      const res = await chai.request(app)
        .put('/api/tecnicos/TEC-001')
        .send({ full_name: 'Juan Pérez Actualizado' });

      expect(res).to.have.status(200);
      expect(res.body.full_name).to.equal('Juan Pérez Actualizado');
    });

    it('debería fallar si el nombre ya existe', async () => {
      const duplicateError = new Error('Duplicate');
      duplicateError.code = '23505';
      pool.query.rejects(duplicateError);

      const res = await chai.request(app)
        .put('/api/tecnicos/TEC-001')
        .send({ full_name: 'Nombre Duplicado' });

      expect(res).to.have.status(409);
    });
  });

  describe('DELETE /api/tecnicos/:id', () => {
    it('debería eliminar un técnico sin incidentes', async () => {
      pool.query.resolves({ rows: [{ id: 'TEC-001' }], rowCount: 1 });

      const res = await chai.request(app).delete('/api/tecnicos/TEC-001');

      expect(res).to.have.status(200);
      expect(res.body.message).to.include('eliminado');
    });
  });
});