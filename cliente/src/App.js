// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CreateIncidentPage from './pages/CreateIncidentPage';
import IncidentListPage from './pages/IncidentListPage';
import RobotStatusPage from './pages/RobotStatusPage';
import TechnicianViewPage from './pages/TechnicianViewPage';
import Navbar from './components/Navbar';
import Box from '@mui/material/Box';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ p: 3, flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/crear-incidente" element={<CreateIncidentPage />} />
          <Route path="/incidentes" element={<IncidentListPage />} />
          <Route path="/robots-estado" element={<RobotStatusPage />} />
          <Route path="/tecnico/incidentes" element={<TechnicianViewPage />} />
        </Routes>
      </Box>
       {/* Footer Opcional */}
    </Box>
  );
}

export default App;