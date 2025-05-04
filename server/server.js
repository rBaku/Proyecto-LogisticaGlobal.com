const express = require('express');
const pool = require('./db');

const app = express();

const cors = require('cors');
const incidentesRoutes = require('./routes/incidentes');


app.use(cors());
app.use(express.json());

app.use('/api/incidentes', incidentesRoutes);


app.listen(3001, () => {
  console.log('Servidor corriendo en el puerto 3001');
});