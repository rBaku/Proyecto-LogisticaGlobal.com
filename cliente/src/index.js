// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles'; // Importa ThemeProvider
import CssBaseline from '@mui/material/CssBaseline'; // Asegura consistencia

// Crea un tema básico (puedes personalizarlo mucho más)
const theme = createTheme({
  palette: {
    // Puedes definir tus colores primarios, secundarios, etc.
    primary: {
      main: '#1976d2', // Ejemplo: Azul por defecto de MUI
    },
    secondary: {
      main: '#dc004e', // Ejemplo: Rosa por defecto
    },
  },
  // Puedes configurar tipografía, breakpoints, etc.
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}> {/* Envuelve la app con el proveedor de tema */}
      <CssBaseline /> {/* Aplica estilos base de MUI */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);