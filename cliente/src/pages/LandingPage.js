import React from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';


function LandingPage() {
  /*const token = localStorage.getItem('token');

  // 3. Si no hay token, redirige a la página de login
  if (!token) {
    return <Navigate to="/login" replace />;
  }*/
  const role = localStorage.getItem('role'); // <- Obtener el rol
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Bienvenido a Gestión de Incidentes Robóticos
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
        Una herramienta para registrar y gestionar incidentes de robots de inventario de forma centralizada.
      </Typography>

      <Grid container spacing={3} justifyContent="center" sx={{ mt: 3 }}>
        {/* Registrar Incidente: supervisor y admin y jefe turno */}
        {(role === 'supervisor' || role === 'admin' || role === 'jefe_turno') && (
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
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
                  variant="contained"
                  component={RouterLink}
                  to="/crear-incidente"
                >
                  Registrar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        )}

        {/* Ver Incidentes: supervisor y admin */}
        {(role === 'supervisor' || role === 'admin'|| role === 'jefe_turno') && (
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
                  variant="contained"
                  component={RouterLink}
                  to="/incidentes"
                >
                  Consultar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        )}

        {/* Estado Robots: todos los roles */}
        {(role === 'supervisor' || role === 'admin' || role === 'tecnico'|| role === 'jefe_turno') && (
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography gutterBottom variant="h5" component="h2">
                  Estado de Robots
                </Typography>
                <Typography>
                  Ve el estado de operación actual de los robots.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  component={RouterLink}
                  to="/robots-estado"
                >
                  Consultar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        )}
        {/* Generar Reporte: admin y supervisor */}
        {(role === 'admin' || role === 'supervisor') && (
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography gutterBottom variant="h5" component="h2">
                  Generar Reporte
                </Typography>
                <Typography>
                  Genera un reporte PDF con los incidentes registrados para análisis y respaldo.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  component={RouterLink}
                  to="/report"
                >
                  Generar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        )}

        {/* Ver Usuarios: solo admin */}
        {role === 'admin' && (
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography gutterBottom variant="h5" component="h2">
                  Ver Usuarios
                </Typography>
                <Typography>
                  Consulta la lista de usuarios del sistema y gestiona sus permisos.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  component={RouterLink}
                  to="/admin"
                >
                  Ver Usuarios
                </Button>
              </CardActions>
            </Card>
          </Grid>
        )}

        {/* Vista Técnico: solo técnico */}
        {role === 'tecnico' && (
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography gutterBottom variant="h5" component="h2">
                  Vista Técnico
                </Typography>
                <Typography>
                  Visualiza y resuelve incidentes asignados como técnico.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  component={RouterLink}
                  to="/tecnico/incidentes"
                >
                  Ver Incidentes
                </Button>
              </CardActions>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default LandingPage;