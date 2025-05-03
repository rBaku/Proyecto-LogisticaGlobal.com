// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CreateIncidentPage from './pages/CreateIncidentPage';
import IncidentListPage from './pages/IncidentListPage'; // <-- Importar la nueva página
import Navbar from './components/Navbar';
import Box from '@mui/material/Box';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ p: 3, flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/crear-incidente" element={<CreateIncidentPage />} />
          <Route path="/incidentes" element={<IncidentListPage />} /> {/* <-- Añadir la ruta */}
          {/* Agrega más rutas aquí */}
        </Routes>
      </Box>
       {/* Footer Opcional */}
    </Box>
  );
}

export default App;