// src/pages/CreateIncidentPage.js
import React from 'react';
import IncidentForm from '../components/IncidentForm';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
// Importa Snackbar para notificaciones (opcional, más elegante que alert)
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

function CreateIncidentPage() {
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState('success'); // 'success' or 'error'

  const handleShowSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };


  // Esta función se pasará al formulario para manejar el éxito o error
  const handleResult = (success, data) => {
    if (success) {
      console.log('Incidente creado:', data);
      handleShowSnackbar('Incidente registrado exitosamente!', 'success');
      // Espera un poco antes de redirigir para que el usuario vea el mensaje
      setTimeout(() => {
         navigate('/'); // O a la lista de incidentes
      }, 1500); // 1.5 segundos
    } else {
       console.error('Error al crear incidente:', data);
       handleShowSnackbar(data || 'Ocurrió un error al registrar el incidente.', 'error');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}> {/* Contenedor centrado */}
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}> {/* Sombra y padding */}
        <Typography variant="h5" component="h2" gutterBottom>
          Registro Inicial de Incidente
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Completa la información basada en la hoja física llenada por el jefe de turno.
        </Typography>
        {/* Pasamos la función de callback al formulario */}
        <IncidentForm onResult={handleResult} />
      </Paper>

       {/* Snackbar para notificaciones */}
       <Snackbar
         open={snackbarOpen}
         autoHideDuration={6000} // 6 segundos
         onClose={handleCloseSnackbar}
         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Posición
       >
         {/* Usamos Alert dentro de Snackbar para estilos de severidad */}
         <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
           {snackbarMessage}
         </Alert>
       </Snackbar>
    </Container>
  );
}

export default CreateIncidentPage;