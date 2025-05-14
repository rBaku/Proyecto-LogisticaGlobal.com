// src/pages/TechnicianViewPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
// Quitar Link as RouterLink si no se usa para navegación directa desde aquí
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditNoteIcon from '@mui/icons-material/EditNote'; // Icono para actualizar estado/comentario
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
// import DialogContentText from '@mui/material/DialogContentText'; // No se usa aquí
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
// import Grid from '@mui/material/Grid'; // No se usa directamente aquí
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import TechnicianIncidentEditForm from '../components/TechnicianIncidentEditForm'; // Importar el nuevo formulario

// (Puedes reusar formatDateTime y Transition si los tienes en un utils o aquí)
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleString('es-CL');
  } catch (error) { return 'Fecha inválida'; }
};

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Fade ref={ref} {...props} />;
});

function TechnicianViewPage() {
  const [incidents, setIncidents] = useState([]);
  // const [filteredIncidents, setFilteredIncidents] = useState([]); // Si añades filtros
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const editFormRef = useRef();
  const [techniciansMap, setTechniciansMap] = useState({}); // Para mostrar nombres de técnicos

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const fetchIncidentsFromAPI = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch('http://localhost:3001/api/incidentes');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al obtener los incidentes: ${response.statusText}`);
      }
      const data = await response.json();
      // TODO: Filtrar por técnico asignado si es necesario, o mostrar todos.
      // Por ahora, muestra todos.
      setIncidents(data);
      // setFilteredIncidents(data); // Si usas filtro
    } catch (error) {
      console.error('Error al cargar incidentes:', error);
      showSnackbar(`No se pudieron cargar los incidentes: ${error.message}`, 'error');
      setIncidents([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [showSnackbar]);

  // Cargar mapa de técnicos para mostrar nombres (opcional)
  useEffect(() => {
    const fetchTechnicians = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/tecnicos');
            if (!response.ok) throw new Error('No se pudieron cargar los técnicos');
            const data = await response.json();
            const map = data.reduce((acc, tech) => {
                acc[tech.id] = tech.full_name;
                return acc;
            }, {});
            setTechniciansMap(map);
        } catch (error) {
            console.error("Error cargando técnicos:", error);
            // No crítico, se mostrarán IDs si falla
        }
    };
    fetchTechnicians();
  }, []);


  useEffect(() => {
    fetchIncidentsFromAPI();
  }, [fetchIncidentsFromAPI]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleOpenEditModal = useCallback((incidentData) => {
    setSelectedIncident({ ...incidentData }); // Pasa una copia
    setEditModalOpen(true);
  }, []);

  const handleCloseEditModal = () => {
    if (isSaving) return;
    setEditModalOpen(false);
    setTimeout(() => setSelectedIncident(null), 150);
  };

  const handleSaveChanges = async (incidentId, dataToUpdate) => {
    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/incidentes/${incidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpdate), // Enviar solo status y technician_comment
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al actualizar el incidente: ${response.statusText}`);
      }
      showSnackbar('Incidente actualizado por técnico.', 'success');
      handleCloseEditModal();
      fetchIncidentsFromAPI(); // Re-cargar incidentes
    } catch (error) {
      console.error("Error al guardar cambios (técnico):", error);
      showSnackbar(error.message || 'No se pudo actualizar el incidente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerEditFormSubmit = () => {
      if (editFormRef.current) {
           const formElement = editFormRef.current.querySelector('form') || editFormRef.current;
            if (formElement && typeof formElement.requestSubmit === 'function') {
                 formElement.requestSubmit();
            } else if (formElement && typeof formElement.submit === 'function'){
                 formElement.submit();
            } else { // Fallback
                 editFormRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
      }
  };
  
  const getTechnicianName = (techId) => techniciansMap[techId] || techId || 'N/A';
  const displayGravity = (gravityValue) => gravityValue === null || gravityValue === undefined ? 'Sin asignar' : gravityValue;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Mis Incidentes Asignados (Vista Técnico)
      </Typography>
      {/* Aquí podrías añadir filtros específicos para el técnico si es necesario */}

      {isLoadingData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 650 }}>
            <Table stickyHeader aria-label="tabla de incidentes del técnico">
                <TableHead>
                <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>ID Reporte Emp.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>ID Robot</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Fecha y Hora</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Ubicación</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Estado Actual</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Gravedad</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Técnico Asignado</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Comentario Técnico</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {incidents.length > 0 ? ( // O filteredIncidents si usas filtro
                    incidents.map((incident) => ( // O filteredIncidents
                    <TableRow hover key={incident.id}>
                        <TableCell>{incident.company_report_id}</TableCell>
                        <TableCell>{incident.robot_id}</TableCell>
                        <TableCell>{formatDateTime(incident.incident_timestamp)}</TableCell>
                        <TableCell>{incident.location}</TableCell>
                        <TableCell>{incident.type}</TableCell>
                        <TableCell>{incident.status}</TableCell>
                        <TableCell sx={{textAlign: 'center'}}>{displayGravity(incident.gravity)}</TableCell>
                        <TableCell>{getTechnicianName(incident.assigned_technician_id)}</TableCell>
                        <TableCell>
                            <Tooltip title={incident.technician_comment || "Sin comentario"}>
                                <Typography variant="caption" noWrap sx={{maxWidth: '150px', display: 'inline-block'}}>
                                    {incident.technician_comment || "-"}
                                </Typography>
                            </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                            <Tooltip title="Actualizar Estado/Comentario">
                                <IconButton size="small" onClick={() => handleOpenEditModal(incident)}>
                                    <EditNoteIcon fontSize="inherit" />
                                </IconButton>
                            </Tooltip>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={10} align="center">
                            {isLoadingData ? "Cargando..." : "No hay incidentes para mostrar."}
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </TableContainer>
        </Paper>
      )}

      {/* --- MODAL EDITAR INCIDENTE (VISTA TÉCNICO) --- */}
      <Dialog
            open={editModalOpen}
            onClose={handleCloseEditModal}
            TransitionComponent={Transition}
            fullWidth
            maxWidth="md" // Ajustar según necesidad del formulario
            aria-labelledby="technician-edit-dialog-title"
        >
            <DialogTitle id="technician-edit-dialog-title">
                Actualizar Incidente (ID: {selectedIncident?.id})
            </DialogTitle>
            <DialogContent dividers>
                {selectedIncident ? (
                   <Box ref={editFormRef}>
                      <TechnicianIncidentEditForm
                          initialData={selectedIncident}
                          onSubmit={handleSaveChanges} // Pasa el ID y los datos
                          isLoading={isSaving}
                       />
                   </Box>
              ) : ( <CircularProgress sx={{display: 'block', margin: 'auto'}} /> )}
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCloseEditModal} disabled={isSaving}>Cancelar</Button>
              <Button
                  onClick={handleTriggerEditFormSubmit}
                  variant="contained"
                  disabled={isSaving}
                  startIcon={isSaving ? <CircularProgress size={20} color="inherit"/> : null}
              >
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
          </DialogActions>
      </Dialog>

      {/* --- Snackbar para Notificaciones --- */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }} variant="filled">
              {snackbarMessage}
          </Alert>
      </Snackbar>
    </Container>
  );
}

export default TechnicianViewPage;