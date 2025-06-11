// src/pages/TechnicianViewPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import EditNoteIcon from '@mui/icons-material/EditNote';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import TechnicianIncidentEditForm from '../components/TechnicianIncidentEditForm';

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleString('es-CL');
  } catch (error) {
    return 'Fecha inválida';
  }
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />;
});

function TechnicianViewPage() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const editFormRef = useRef();
  const [techniciansMap, setTechniciansMap] = useState({});
  const [currentTechnicianId, setCurrentTechnicianId] = useState(null);

  const user = JSON.parse(localStorage.getItem('user')); // ⚠️ Asegúrate de guardar el user en login
  useEffect(() => {//obtener id
    console.log("1")
    const fetchTechnicianId = async () => {
      try {
        const username = localStorage.getItem('username');
        if (!username) return;

        const res = await fetch(`http://localhost:3001/api/users/username/${username}`);
        if (!res.ok) throw new Error('No se pudo obtener el técnico');
        const userData = await res.json();
        console.log("SJDHSJHDJSHDSJHD")
        console.log(userData.id)

        setCurrentTechnicianId(userData.id);
      } catch (error) {
        console.error('Error obteniendo el ID del técnico:', error);
      }
    };

    fetchTechnicianId();
  }, []);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const fetchIncidentsFromAPI = useCallback(async () => {
    console.log("✅ Llamando a fetchIncidentsFromAPI con id:", currentTechnicianId);
    setIsLoadingData(true);
    try {
      const response = await fetch('http://localhost:3001/api/incidentes');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al obtener los incidentes: ${response.statusText}`);
      }
      const data = await response.json();
      // ✅ Filtrar por técnico asignado
      const filtered = data.filter((incident) => {
        const techs = incident.assigned_technicians;
        if (Array.isArray(techs)) {
          return techs.some(t => t.id === currentTechnicianId);
        }
        return techs?.id === currentTechnicianId;
      });

      setIncidents(filtered);
    } catch (error) {
      console.error('Error al cargar incidentes:', error);
      showSnackbar(`No se pudieron cargar los incidentes: ${error.message}`, 'error');
      setIncidents([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [showSnackbar, currentTechnicianId]);
  
  useEffect(() => {
    console.log("2")
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
      }
    };
    fetchTechnicians();
  }, []);

  useEffect(() => {
    console.log("3")
    if (currentTechnicianId !== null) {
      fetchIncidentsFromAPI();
    }
  }, [fetchIncidentsFromAPI, currentTechnicianId]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleOpenEditModal = useCallback((incidentData) => {
    setSelectedIncident({ ...incidentData });
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
        body: JSON.stringify(dataToUpdate),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al actualizar el incidente: ${response.statusText}`);
      }
      showSnackbar('Incidente actualizado por técnico.', 'success');
      handleCloseEditModal();
      fetchIncidentsFromAPI();
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
      if (formElement?.requestSubmit) {
        formElement.requestSubmit();
      } else if (formElement?.submit) {
        formElement.submit();
      } else {
        editFormRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  };

  const getTechnicianName = (techId) => techniciansMap[techId] || techId || 'N/A';
  const displayGravity = (gravityValue) => gravityValue == null ? 'Sin asignar' : gravityValue;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Mis Incidentes Asignados
      </Typography>

      {isLoadingData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 650 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID Reporte Emp.</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID Robot</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fecha y Hora</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ubicación</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Gravedad</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Técnico</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Comentario</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incidents.length > 0 ? (
                  incidents.map((incident) => (
                    <TableRow hover key={incident.id}>
                      <TableCell>{incident.company_report_id}</TableCell>
                      <TableCell>{incident.robot_id}</TableCell>
                      <TableCell>{formatDateTime(incident.incident_timestamp)}</TableCell>
                      <TableCell>{incident.location}</TableCell>
                      <TableCell>{incident.type}</TableCell>
                      <TableCell>{incident.status}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{displayGravity(incident.gravity)}</TableCell>
                      <TableCell>
                        {Array.isArray(incident.assigned_technicians)
                          ? incident.assigned_technicians.map(t => t.full_name).join(', ')
                          : incident.assigned_technicians?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={incident.technician_comment || "Sin comentario"}>
                          <Typography variant="caption" noWrap sx={{ maxWidth: '150px', display: 'inline-block' }}>
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
                      No hay incidentes asignados a ti.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Modal para editar incidente */}
      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        TransitionComponent={Transition}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Actualizar Incidente (ID: {selectedIncident?.id})</DialogTitle>
        <DialogContent dividers>
          {selectedIncident ? (
            <Box ref={editFormRef}>
              <TechnicianIncidentEditForm
                initialData={selectedIncident}
                onSubmit={handleSaveChanges}
                isLoading={isSaving}
              />
            </Box>
          ) : (
            <CircularProgress sx={{ display: 'block', margin: 'auto' }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal} disabled={isSaving}>Cancelar</Button>
          <Button
            onClick={handleTriggerEditFormSubmit}
            variant="contained"
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default TechnicianViewPage;