const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(chaiHttp);
chai.use(sinonChai);

const { expect } = chai;

// Configuración común para todos los tests
process.env.NODE_ENV = 'test';

// Limpiar mocks después de cada test
afterEach(() => {
  sinon.restore();
});

module.exports = {
  chai,
  expect,
  sinon,
};