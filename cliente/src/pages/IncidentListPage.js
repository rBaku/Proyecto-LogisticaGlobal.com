  import React, { useState, useEffect, useCallback, useRef } from 'react';
  import { Link as RouterLink } from 'react-router-dom';
  import Container from '@mui/material/Container';
  import Typography from '@mui/material/Typography';
  import Paper from '@mui/material/Paper';
  import Box from '@mui/material/Box';
  import TextField from '@mui/material/TextField';
  import Table from '@mui/material/Table';
  import TableBody from '@mui/material/TableBody';
  import TableCell from '@mui/material/TableCell';
  import TableContainer from '@mui/material/TableContainer';
  import TableHead from '@mui/material/TableHead';
  import TableRow from '@mui/material/TableRow';
  import IconButton from '@mui/material/IconButton';
  import Tooltip from '@mui/material/Tooltip';
  import VisibilityIcon from '@mui/icons-material/Visibility';
  import EditIcon from '@mui/icons-material/Edit';
  import DeleteIcon from '@mui/icons-material/Delete';
  import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
  import Select from '@mui/material/Select';
  import MenuItem from '@mui/material/MenuItem';
  import FormControl from '@mui/material/FormControl';
  import InputLabel from '@mui/material/InputLabel';
  import Dialog from '@mui/material/Dialog';
  import DialogActions from '@mui/material/DialogActions';
  import DialogContent from '@mui/material/DialogContent';
  import DialogContentText from '@mui/material/DialogContentText';
  import DialogTitle from '@mui/material/DialogTitle';
  import Button from '@mui/material/Button';
  import Fade from '@mui/material/Fade';
  import Grid from '@mui/material/Grid';
  import Snackbar from '@mui/material/Snackbar';
  import Alert from '@mui/material/Alert';
  import CircularProgress from '@mui/material/CircularProgress';
  import CheckIcon from '@mui/icons-material/Check';

  import EditIncidentForm from '../components/EditIncidentForm';

  const filterableColumns = [
    { key: 'all', label: 'Todas las Columnas' },
    { key: 'id', label: 'ID Incidente (BD)' },
    { key: 'company_report_id', label: 'ID Reporte Empresa' },
    { key: 'robot_id', label: 'ID Robot Afectado' },
    { key: 'location', label: 'Ubicación' },
    { key: 'type', label: 'Tipo' },
    { key: 'status', label: 'Estado' },
    { key: 'gravity', label: 'Gravedad' },
    { key: 'incident_timestamp', label: 'Fecha y Hora' },
    { key: 'cause', label: 'Causa' },
    { key: 'assigned_technicians', label: 'ID Técnico Asignado' },
    { key: 'technician_comment', label: 'Comentario Técnico' },
  ];

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return ''; //"N/A"
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleString('es-CL');
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Fecha inválida';
    }
  };

  const Transition = React.forwardRef(function Transition(props, ref) {
      return <Fade ref={ref} {...props} />;
  });

  function IncidentListPage() {
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [filterColumn, setFilterColumn] = useState('all');
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const editFormRef = useRef();

    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [incidentHistory, setIncidentHistory] = useState([]);
    const [signingIncident, setSigningIncident] = useState(null);
    const [signModalOpen, setSignModalOpen] = useState(false);

    const userRole = localStorage.getItem('role');
    
    const canEditOrDelete = userRole === 'admin' || userRole === 'supervisor';

    const handleOpenSignModal = (incident) => {
      setSigningIncident(incident);
      setSignModalOpen(true);
    };

    const handleCloseSignModal = () => {
      setSignModalOpen(false);
      setTimeout(() => setSigningIncident(null), 150);
    };

    const handleConfirmSignature = async () => {
      if (!signingIncident) return;
      try {
        const { id, robot_id, fall_back_type } = signingIncident;

        // Cambiar estado del incidente a 'Firmado'
        await fetch(`http://localhost:3001/api/incidentes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Firmado' }),
          credentials: 'include',
        });

        // Si el estado del robot debe cambiar
        if (fall_back_type && fall_back_type !== 'No cambiar') {
          await fetch(`http://localhost:3001/api/robots/${robot_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: fall_back_type }),
            credentials: 'include',
          });
        }

        showSnackbar('Incidente firmado exitosamente.', 'success');
        handleCloseSignModal();
        fetchIncidentsFromAPI();
      } catch (error) {
        console.error('Error al firmar incidente:', error);
        showSnackbar('No se pudo firmar el incidente.', 'error');
      }
    };

    const showSnackbar = useCallback((message, severity = 'success') => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
    }, []);


    const fetchIncidentsFromAPI = useCallback(async () => {
      setIsLoadingData(true);
      try {
        const response = await fetch('http://localhost:3001/api/incidentes', {
          credentials: 'include'
        }); // <-- URL actualizada
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error al obtener los incidentes');
        }
        const data = await response.json();
        setIncidents(data);
      } catch (error) {
        console.error('Error al cargar incidentes desde la API:', error);
        showSnackbar(`No se pudieron cargar los incidentes: ${error.message}`, 'error');
        setIncidents([]);
      } finally {
        setIsLoadingData(false);
      }
    }, [showSnackbar]);
    const handleViewHistory = async (incidentId) => {
      try {
        const response = await fetch(`http://localhost:3001/api/incidentes/${incidentId}/history`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener el historial');
        const data = await response.json();
        setIncidentHistory(data);
        setHistoryModalOpen(true);
      } catch (error) {
        console.error('Error al cargar historial:', error);
        showSnackbar('No se pudo cargar el historial del incidente.', 'error');
      }
    };

    const handleCloseHistoryModal = () => {
      setHistoryModalOpen(false);
      setIncidentHistory([]);
    };

    useEffect(() => {
      fetchIncidentsFromAPI();
    }, [fetchIncidentsFromAPI]);

    useEffect(() => {
      const lowerCaseFilter = filterText.toLowerCase().trim();
      if (lowerCaseFilter === '') {
          setFilteredIncidents(incidents);
          return;
      }
      const filtered = incidents.filter((incident) => {
          if (filterColumn === 'all') {
              return filterableColumns.some(col => {
                  if (col.key === 'all') return false;
                  const value = incident[col.key];
                  if (col.key === 'incident_timestamp') {
                      return formatDateTime(value).toLowerCase().includes(lowerCaseFilter);
                  }
                  if (col.key === 'gravity' && value === null) {
                      return "sin asignar".includes(lowerCaseFilter);
                  }
                  return value != null && String(value).toLowerCase().includes(lowerCaseFilter);
              });
          } else {
              const value = incident[filterColumn];
              if (filterColumn === 'incident_timestamp') {
                  return formatDateTime(value).toLowerCase().includes(lowerCaseFilter);
              }
              if (filterColumn === 'gravity' && value === null) {
                  return "sin asignar".includes(lowerCaseFilter);
              }
              return value != null && String(value).toLowerCase().includes(lowerCaseFilter);
          }
      });
      setFilteredIncidents(filtered);
    }, [filterText, filterColumn, incidents]);

    const handleCloseSnackbar = (event, reason) => {
      if (reason === 'clickaway') return;
      setSnackbarOpen(false);
    };

    const handleFilterTextChange = (event) => setFilterText(event.target.value);
    const handleFilterColumnChange = (event) => setFilterColumn(event.target.value);

    const handleViewDetails = useCallback((id) => {
      const incident = incidents.find(inc => String(inc.id) === String(id));
      if (incident) {
        setSelectedIncident(incident);
        setDetailsModalOpen(true);
      }
    }, [incidents]);

    const handleEdit = useCallback((id) => {
      const incident = incidents.find(inc => String(inc.id) === String(id));
      if (incident) {
        setSelectedIncident({ ...incident });
        setEditModalOpen(true);
      }
    }, [incidents]);

    const handleCloseDetailsModal = () => {
      setDetailsModalOpen(false);
      setTimeout(() => setSelectedIncident(null), 150);
    };
    const handleCloseEditModal = () => {
      if (isSaving) return;
      setEditModalOpen(false);
      setTimeout(() => setSelectedIncident(null), 150);
    };

    const handleSaveChanges = async (editedData) => {
      setIsSaving(true);
      try {
        const dataToSend = { ...editedData };
        if (dataToSend.gravity === "" || dataToSend.gravity === "Sin asignar") {
            dataToSend.gravity = null;
        }

        const response = await fetch(`http://localhost:3001/api/incidentes/${editedData.id}`, { // <-- URL actualizada
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error al actualizar el incidente');
        }
        showSnackbar('Incidente actualizado correctamente.', 'success');
        handleCloseEditModal();
        fetchIncidentsFromAPI();
      } catch (error) {
        console.error("Error al guardar:", error);
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
              } else {
                  editFormRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
        }
    };

    const handleDelete = async (id) => {
      if (!window.confirm(`¿Está seguro de que desea eliminar la ficha de incidente ${id}?`)) return;
      try {
        const response = await fetch(`http://localhost:3001/api/incidentes/${id}`, { 
          method: 'DELETE',
          credentials: 'include', 
        }); // <-- URL actualizada
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error al eliminar el incidente');
        }
        showSnackbar('Incidente eliminado correctamente.', 'warning');
        fetchIncidentsFromAPI();
      } catch (error) {
        console.error('Error al eliminar incidente:', error);
        showSnackbar(error.message || 'No se pudo eliminar el incidente.', 'error');
      }
    };

    const displayGravity = (gravityValue) => gravityValue === null || gravityValue === undefined ? 'Sin asignar' : gravityValue;

    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>Lista de Incidentes</Typography>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <FormControl sx={{ minWidth: 220 }} size="small">
                  <InputLabel id="filter-column-select-label">Filtrar por Columna</InputLabel>
                  <Select labelId="filter-column-select-label" value={filterColumn} label="Filtrar por Columna" onChange={handleFilterColumnChange}>
                      {filterableColumns.map((col) => (<MenuItem key={col.key} value={col.key}>{col.label}</MenuItem>))}
                  </Select>
              </FormControl>
              <TextField label="Texto a Buscar..." variant="outlined" size="small" value={filterText} onChange={handleFilterTextChange} sx={{ flexGrow: 1, minWidth: '250px' }}/>
              <Tooltip title="Registrar Nuevo Incidente"><IconButton color="primary" component={RouterLink} to="/crear-incidente" sx={{ ml: 'auto' }}><AddCircleOutlineIcon fontSize="large" /></IconButton></Tooltip>
          </Box>
        </Paper>

        {isLoadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
        ) : (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              <TableContainer sx={{ maxHeight: 650 }}>
              <Table stickyHeader aria-label="tabla de incidentes">
                  <TableHead>
                  <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>ID Reporte Emp.</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>ID Robot</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Fecha y Hora</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Ubicación</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Gravedad</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Técnico Asignado</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>ID Incidente (BD)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                  </TableRow>
                  </TableHead>
                  <TableBody>
                  {filteredIncidents.length > 0 ? (
                      filteredIncidents.map((incident) => (
                      <TableRow hover key={incident.id}>
                          <TableCell>{incident.company_report_id}</TableCell>
                          <TableCell>{incident.robot_id}</TableCell>
                          <TableCell>{formatDateTime(incident.incident_timestamp)}</TableCell>
                          <TableCell>{incident.location}</TableCell>
                          <TableCell>{incident.type}</TableCell>
                          <TableCell>{incident.status}</TableCell>
                          <TableCell sx={{textAlign: 'center'}}>{displayGravity(incident.gravity)}</TableCell>
                          <TableCell>
                            {(incident.assigned_technicians || [])
                              .map(tech => tech.full_name)
                              .join(', ') || ''}{/* N/A*/}
                          </TableCell>
                          <TableCell><Tooltip title={incident.id}><Typography variant="caption" noWrap>{incident.id.substring(0,8)}...</Typography></Tooltip></TableCell>
                          <TableCell align="center">
                              <Tooltip title="Ver Detalles"><IconButton size="small" onClick={() => handleViewDetails(incident.id)}><VisibilityIcon fontSize="inherit" /></IconButton></Tooltip>
                              {canEditOrDelete && (
                                <>
                                  <Tooltip title="Editar"><IconButton size="small" onClick={() => handleEdit(incident.id)}><EditIcon fontSize="inherit" /></IconButton></Tooltip>
                                  <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDelete(incident.id)}><DeleteIcon fontSize="inherit" /></IconButton></Tooltip>
                                </>
                              )}
                              <Tooltip title="Ver Historial">
                                <IconButton size="small" onClick={() => handleViewHistory(incident.id)}>
                                  🕘
                                </IconButton>
                              </Tooltip>
                              {incident.status === 'Resuelto' && (
                                <Tooltip title="Firmar Incidente">
                                  <IconButton size="small" color="success" onClick={() => handleOpenSignModal(incident)}>
                                    <CheckIcon fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                              )}
                          </TableCell>
                      </TableRow>
                      ))
                  ) : (
                      <TableRow><TableCell colSpan={10} align="center">{incidents.length === 0 && !isLoadingData ? "No hay incidentes registrados." : "No se encontraron incidentes que coincidan con los filtros."}</TableCell></TableRow>
                  )}
                  </TableBody>
              </Table>
              </TableContainer>
          </Paper>
        )}

        <Dialog open={detailsModalOpen} onClose={handleCloseDetailsModal} TransitionComponent={Transition} fullWidth maxWidth="md">
          <DialogTitle>Detalles del Incidente (BD ID: {selectedIncident?.id})</DialogTitle>
          <DialogContent dividers>
              {selectedIncident ? (
                  <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">ID Reporte Empresa:</Typography><Typography>{selectedIncident.company_report_id}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">ID Robot:</Typography><Typography>{selectedIncident.robot_id}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">Fecha/Hora Incidente:</Typography><Typography>{formatDateTime(selectedIncident.incident_timestamp)}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">Ubicación:</Typography><Typography>{selectedIncident.location}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">Tipo:</Typography><Typography>{selectedIncident.type}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">Estado:</Typography><Typography>{selectedIncident.status}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">Gravedad:</Typography><Typography>{displayGravity(selectedIncident.gravity)}</Typography></Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Técnicos Asignados:</Typography>
                        <Typography>
                          {(selectedIncident.assigned_technicians || [])
                            .map(tech => tech.full_name)
                            .join(', ') || ''}{/* N/A */}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}><Typography variant="subtitle2">Causa Inicial:</Typography><Typography sx={{ whiteSpace: 'pre-wrap' }}>{selectedIncident.cause || ''}</Typography></Grid>{ /* N/A */}
                      <Grid item xs={12}><Typography variant="subtitle2">Comentario del Técnico:</Typography><Typography sx={{ whiteSpace: 'pre-wrap' }}>{selectedIncident.technician_comment || ''}</Typography></Grid>{ /* N/A */}
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">Creado por:</Typography><Typography>{selectedIncident.created_by_name}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">Actualizado por:</Typography><Typography>{selectedIncident.updated_by_name}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">Firmado por:</Typography><Typography>{selectedIncident.signed_by_name}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">Fecha de Firma:</Typography><Typography>{formatDateTime(selectedIncident.signed_at)}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">Finalizado por:</Typography><Typography>{selectedIncident.finished_by_name}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">Fecha de Finalización:</Typography><Typography>{formatDateTime(selectedIncident.finished_at)}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">Fecha de Creación:</Typography><Typography>{formatDateTime(selectedIncident.created_at)}</Typography></Grid>
                      <Grid item xs={12} sm={6}><Typography variant="subtitle2">Última Actualización:</Typography><Typography>{formatDateTime(selectedIncident.updated_at)}</Typography></Grid>
                  </Grid>
              ) : ( <DialogContentText>Cargando detalles...</DialogContentText> )}
          </DialogContent>
          <DialogActions> <Button onClick={handleCloseDetailsModal}>Cerrar</Button> </DialogActions>
        </Dialog>

        <Dialog open={editModalOpen} onClose={handleCloseEditModal} TransitionComponent={Transition} fullWidth maxWidth="md">
            <DialogTitle>Editar Incidente (BD ID: {selectedIncident?.id})</DialogTitle>
            <DialogContent dividers>
                {selectedIncident ? (
                    <Box ref={editFormRef}>
                        <EditIncidentForm initialData={selectedIncident} onSubmit={handleSaveChanges} isLoading={isSaving}/>
                    </Box>
                ) : ( <DialogContentText>Cargando formulario...</DialogContentText> )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseEditModal} disabled={isSaving}>Cancelar</Button>
                <Button onClick={handleTriggerEditFormSubmit} variant="contained" disabled={isSaving} startIcon={isSaving ? <CircularProgress size={20} color="inherit"/> : null}>
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </DialogActions>
        </Dialog>
        <Dialog open={historyModalOpen} onClose={handleCloseHistoryModal} TransitionComponent={Transition} fullWidth maxWidth="md">
          <DialogTitle>Historial del Incidente</DialogTitle>
          <DialogContent dividers>
            {incidentHistory.length > 0 ? (
              incidentHistory.map((entry) => (
                <Box key={entry.id} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">{entry.change_type} — {new Date(entry.change_date).toLocaleString('es-CL')}</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{entry.changes || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">Hecho por: {entry.changed_by_name || 'Desconocido'}</Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2">No hay historial para este incidente.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseHistoryModal}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={signModalOpen} onClose={handleCloseSignModal} TransitionComponent={Transition} fullWidth maxWidth="sm">
          <DialogTitle>¿Firmar Incidente?</DialogTitle>
          <DialogContent dividers>
            <Typography gutterBottom>¿Estás seguro de que quieres firmar este incidente? Solo un administrador podrá volver a editarlo.</Typography>
            {signingIncident && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Comentario Técnico:</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{signingIncident.technician_comment || 'Sin comentario'}</Typography>
                <Typography variant="subtitle2">Nuevo estado del robot:</Typography>
                <Typography>{signingIncident.fall_back_type || 'No especificado'}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSignModal}>Cancelar</Button>
            <Button onClick={handleConfirmSignature} variant="contained" color="success">Confirmar Firma</Button>
          </DialogActions>
        </Dialog>


        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }} variant="filled">
                {snackbarMessage}
            </Alert>
        </Snackbar>
      </Container>
    );
  }

  export default IncidentListPage;
