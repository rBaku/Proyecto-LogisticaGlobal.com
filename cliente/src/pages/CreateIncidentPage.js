import React from 'react';
import IncidentForm from '../components/IncidentForm';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

function CreateIncidentPage() {
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState('success');

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

  const handleResult = (success, resultData) => {
    if (success) {
      const createdCount = resultData.length; // Array de incidentes creados
      const message = createdCount > 1
        ? `${createdCount} incidentes registrados exitosamente.`
        : `Incidente registrado exitosamente.`;
      console.log('Incidentes creados:', resultData);
      handleShowSnackbar(message, 'success');
      setTimeout(() => {
         navigate('/incidentes');
      }, 2000);
    } else {
      console.error('Error al crear incidentes:', resultData);
      handleShowSnackbar(resultData.message || 'Ocurrió un error al registrar.', 'error');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Registro Inicial de Incidente(s)
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Complete la información. Si selecciona múltiples robots, se creará un incidente individual para cada uno con el mismo ID de Reporte Empresa.
        </Typography>
        <IncidentForm onResult={handleResult} />
      </Paper>

       <Snackbar
         open={snackbarOpen}
         autoHideDuration={8000}
         onClose={handleCloseSnackbar}
         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
       >
         <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%', whiteSpace: 'pre-line' }} variant="filled">
           {snackbarMessage}
         </Alert>
       </Snackbar>
    </Container>
  );
}

export default CreateIncidentPage;