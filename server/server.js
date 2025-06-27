const express = require('express');
const pool = require('./db');
const cookiePaser = require('cookie-parser');
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();

const cors = require('cors');
const incidentesRoutes = require('./routes/incidentes');
const robotsRoutes = require('./routes/robots');
const loginRoutes = require('./routes/login');
const usersRoutes = require('./routes/users');

const corsOptions = {
  origin: 'http://localhost:3000', // URL de tu frontend React
  credentials: true, // ← necesario para permitir cookies
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookiePaser());

app.use('/api/incidentes', incidentesRoutes);
app.use('/api/robots', robotsRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/users', usersRoutes);

app.listen(3001, () => {
  console.log('Servidor corriendo en el puerto 3001');
});

/*app.use((req,res,next)=>{
  const token=req.cookies.access_token
  req.session = {user: null}
  try{
    const data = jwt.verify(token, JWT_SECRET)
    req.session.user=data
  } catch{}
  next()
})*/