// src/pages/LandingPage.js
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

function LandingPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}> {/* Añade márgenes */}
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Bienvenido a Gestión de Incidentes Robóticos
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
        Una herramienta para registrar y gestionar incidentes de robots de inventario de forma centralizada.
      </Typography>

      {/* Usamos Grid para colocar las cards */}
      <Grid container spacing={3} justifyContent="center" sx={{ mt: 3 }}>

        {/* Card para Crear Incidente */}
        <Grid item xs={12} sm={6} md={4}> {/* Controla tamaño en diferentes pantallas */}
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}> {/* Ocupa toda la altura */}
            <CardContent sx={{ flexGrow: 1 }}> {/* Contenido crece para empujar acciones abajo */}
              <Typography gutterBottom variant="h5" component="h2">
                Registrar Nuevo Incidente
              </Typography>
              <Typography>
                Ingresa los detalles de un nuevo incidente ocurrido basado en la hoja física.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                variant="contained" // Estilo de botón principal
                component={RouterLink} // Navegación con React Router
                to="/crear-incidente"
              >
                Registrar
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Placeholder Card: Ver Incidentes */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography gutterBottom variant="h5" component="h2">
                Ver Incidentes
              </Typography>
              <Typography>
                Consulta, filtra y gestiona la lista de incidentes registrados.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                variant="contained" // Estilo de botón principal
                component={RouterLink} // Navegación con React Router
                to="/incidentes"
              >
                Consultar
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Placeholder Card: Generar Reportes */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography gutterBottom variant="h5" component="h2">
                Generar Reportes
              </Typography>
              <Typography>
                Crea reportes mensuales o anuales con estadísticas clave. (Próximamente)
              </Typography>
            </CardContent>
             {/* <CardActions> <Button size="small" disabled>Generar</Button> </CardActions> */}
          </Card>
        </Grid>

      </Grid>
    </Container>
  );
}

export default LandingPage;