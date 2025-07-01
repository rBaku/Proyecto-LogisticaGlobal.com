// src/pages/RobotStatusPage.js
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
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';

import RobotForm from '../components/RobotForm'; // Importar el nuevo formulario

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Fade ref={ref} {...props} />;
});

function RobotStatusPage() {
  const userRole = localStorage.getItem('role');
  const [robots, setRobots] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Para el modal de creación

  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const createFormRef = useRef();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [robotToEdit, setRobotToEdit] = useState(null);
  const editFormRef = useRef();


  const handleOpenEditModal = (robot) => {
    setRobotToEdit(robot);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    if (isSubmitting) return;
    setEditModalOpen(false);
    setRobotToEdit(null);
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

  const handleUpdateRobot = async (formData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3001/api/robots/${robotToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al actualizar el robot: ${response.statusText}`);
      }
      showSnackbar(`Robot "${formData.name}" actualizado correctamente.`, 'success');
      handleCloseEditModal();
      fetchRobotsFromAPI(); // Recargar robots
    } catch (error) {
      console.error("Error al actualizar robot:", error);
      showSnackbar(error.message || 'No se pudo actualizar el robot.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const fetchRobotsFromAPI = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch('http://localhost:3001/api/robots', {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al obtener los robots: ${response.statusText}`);
      }
      const data = await response.json();
      setRobots(data);
    } catch (error) {
      console.error('Error al cargar robots desde la API:', error);
      showSnackbar(`No se pudieron cargar los robots: ${error.message}`, 'error');
      setRobots([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchRobotsFromAPI();
  }, [fetchRobotsFromAPI]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // --- Manejadores para Modal de Creación ---
  const handleOpenCreateModal = () => {
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    if (isSubmitting) return;
    setCreateModalOpen(false);
  };

  const handleCreateRobot = async (formData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/robots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al crear el robot: ${response.statusText}`);
      }
      showSnackbar(`Robot ${formData.name} creado exitosamente.`, 'success');
      handleCloseCreateModal();
      fetchRobotsFromAPI(); // Recargar lista de robots
    } catch (error) {
      console.error("Error al crear robot:", error);
      // El error se mostrará en el formulario a través de su propio estado de error
      // o puedes mostrarlo en el snackbar si el RobotForm no maneja errores de API.
      // Por ahora, asumimos que RobotForm podría manejar su propio error,
      // pero también mostramos un snackbar general.
      showSnackbar(error.message || 'No se pudo crear el robot.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleTriggerCreateFormSubmit = () => {
      if (createFormRef.current) {
           const formElement = createFormRef.current.querySelector('form') || createFormRef.current;
            if (formElement && typeof formElement.requestSubmit === 'function') {
                 formElement.requestSubmit();
            } else if (formElement && typeof formElement.submit === 'function'){
                 formElement.submit();
            } else {
                 createFormRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
      }
  };

  // --- Manejador para Eliminar Robot ---
  const handleDeleteRobot = async (robotId, robotName) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar el robot "${robotName}" (ID: ${robotId})? Esta acción no se puede deshacer.`)) return;
    try {
      const response = await fetch(`http://localhost:3001/api/robots/${robotId}`, { 
        method: 'DELETE',
        credentials: 'include'
       });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al eliminar el robot: ${response.statusText}`);
      }
      showSnackbar(`Robot "${robotName}" eliminado correctamente.`, 'warning');
      fetchRobotsFromAPI(); // Recargar lista
    } catch (error) {
      console.error('Error al eliminar robot:', error);
      showSnackbar(error.message || 'No se pudo eliminar el robot.', 'error');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Estado de Robots
        </Typography>
        {userRole === 'admin' && (
          <Tooltip title="Añadir Nuevo Robot">
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleOpenCreateModal}
            >
              Crear Robot
            </Button>
          </Tooltip>
        )}
      </Box>

      {isLoadingData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 650 }}>
            <Table stickyHeader aria-label="tabla de estado de robots">
                <TableHead>
                <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>ID Robot</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Estado Operativo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Incidentes Pendientes</TableCell>
                    {userRole === 'admin' && (
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                    )}
                </TableRow>
                </TableHead>
                <TableBody>
                {robots.length > 0 ? (
                    robots.map((robot) => (
                    <TableRow hover key={robot.id}>
                        <TableCell>{robot.id}</TableCell>
                        <TableCell>{robot.name}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {robot.state.toLowerCase() === 'operativo' && (
                              <CheckCircleIcon color="success" />
                            )}
                            {robot.state.toLowerCase() === 'fuera de servicio' && (
                              <CancelIcon color="error" />
                            )}
                            {robot.state.toLowerCase() === 'en reparación' && (
                              <CancelIcon sx={{ color: 'goldenrod' }} />
                            )}
                            <Typography variant="caption" sx={{ ml: 1, display: { xs: 'none', sm: 'inline' } }}>
                              {robot.state}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {robot.unresolved_incidents ?? 0}
                        </TableCell>
                        {userRole === 'admin' && (
                          <TableCell align="center">
                            <Tooltip title="Editar Robot">
                              <IconButton size="small" color="primary" onClick={() => handleOpenEditModal(robot)}>
                                <EditIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar Robot">
                              <IconButton size="small" color="error" onClick={() => handleDeleteRobot(robot.id, robot.name)}>
                                <DeleteIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} align="center">
                            {isLoadingData ? "Cargando robots..." : "No hay robots registrados."}
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </TableContainer>
        </Paper>
      )}

      {/* --- MODAL CREAR ROBOT --- */}
      <Dialog
            open={createModalOpen}
            onClose={handleCloseCreateModal}
            TransitionComponent={Transition}
            fullWidth
            maxWidth="sm"
            aria-labelledby="create-robot-dialog-title"
        >
            <DialogTitle id="create-robot-dialog-title">
                Registrar Nuevo Robot
            </DialogTitle>
            <DialogContent dividers>
                <Box ref={createFormRef}> {/* Aplicar la ref al Box contenedor */}
                    <RobotForm
                        onSubmit={handleCreateRobot}
                        onCancel={handleCloseCreateModal} // Aunque el botón esté fuera
                        isLoading={isSubmitting}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseCreateModal} disabled={isSubmitting}>Cancelar</Button>
                <Button
                    onClick={handleTriggerCreateFormSubmit}
                    variant="contained"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit"/> : null}
                >
                    {isSubmitting ? 'Creando...' : 'Crear Robot'}
                </Button>
            </DialogActions>
        </Dialog>
        <Dialog
          open={editModalOpen}
          onClose={handleCloseEditModal}
          TransitionComponent={Transition}
          fullWidth
          maxWidth="sm"
          aria-labelledby="edit-robot-dialog-title"
        >
          <DialogTitle id="edit-robot-dialog-title">Editar Robot</DialogTitle>
          <DialogContent dividers>
            <Box ref={editFormRef}>
              {editModalOpen && robotToEdit && (
              <RobotForm
                onSubmit={handleUpdateRobot}
                onCancel={handleCloseEditModal}
                isLoading={isSubmitting}
                initialData={robotToEdit}
              />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditModal} disabled={isSubmitting}>Cancelar</Button>
            <Button
              onClick={() => {
                const form = editFormRef.current.querySelector('form') || editFormRef.current;
                form?.requestSubmit?.();
              }}
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSubmitting ? 'Actualizando...' : 'Guardar Cambios'}
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

export default RobotStatusPage;