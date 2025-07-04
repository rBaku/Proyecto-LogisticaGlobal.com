const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { initializePool } = require('./db'); // 👈 Asegúrate de importar esto
const incidentesRoutes = require('./routes/incidentes');
const robotsRoutes = require('./routes/robots');
const loginRoutes = require('./routes/login');
const usersRoutes = require('./routes/users');
const reportRoutes = require('./routes/report');

const app = express();
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

initializePool()
  .then(() => {
    // ✅ Registrar rutas después de inicializar la conexión
    app.use('/api/incidentes', incidentesRoutes);
    app.use('/api/robots', robotsRoutes);
    app.use('/api/login', loginRoutes);
    app.use('/api/users', usersRoutes);
    app.use('/api/report', reportRoutes);

    // ✅ Iniciar servidor solo si la conexión fue exitosa
    app.listen(3001, () => {
      console.log('🚀 Servidor corriendo en el puerto 3001');
    });
  })
  .catch((err) => {
    console.error('❌ Error al inicializar pool de base de datos:', err.message);
    process.exit(1); // Sale si la conexión falla
  });